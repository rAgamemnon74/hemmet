import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { saveFile } from "@/lib/upload";
import {
  validateExtension, validateSize, validateCategoryMime,
  detectMimeFromBytes, canPublishPublicly,
  CATEGORY_UPLOAD_PERMISSION, extractExtension,
} from "@/lib/upload-security";
import { checkRateLimit, checkUserQuota, checkDiskSpace } from "@/lib/upload-quota";
import { hasPermission } from "@/lib/permissions";
import { logActivity } from "@/lib/audit";
import type { Role, DocumentCategory } from "@prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const userRoles = (session.user.roles ?? []) as Role[];
  const userId = session.user.id as string;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const rawCategory = (formData.get("category") as string) ?? "OTHER";
  const description = formData.get("description") as string | null;
  const visibleToMembers = formData.get("visibleToMembers") === "true";
  const visibleToAll = formData.get("visibleToAll") === "true";

  if (!file) {
    return NextResponse.json({ error: "Ingen fil bifogad" }, { status: 400 });
  }

  // ─── 0a. Rate-limit (20 uploads/minut per användare) ────────────────────
  const rate = checkRateLimit(userId);
  if (!rate.ok) {
    return NextResponse.json(
      { error: `För många uppladdningar på kort tid. Försök igen om ${rate.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  // ─── 0b. Per-användare kvot (500 MB totalt) ────────────────────────────
  const quota = await checkUserQuota(db, userId, file.size);
  if (!quota.ok) {
    return NextResponse.json(
      {
        error: `Kvoten är full (${Math.round(quota.used / 1024 / 1024)} MB av ${Math.round(quota.limit / 1024 / 1024)} MB använda). Ta bort gamla dokument.`,
      },
      { status: 413 }
    );
  }

  // ─── 0c. Disk-space check (>= 1 GB fritt) ───────────────────────────────
  const disk = await checkDiskSpace(rawCategory, file.size);
  if (!disk.ok) {
    return NextResponse.json(
      { error: `Servern har slut på utrymme (${Math.round(disk.freeBytes / 1024 / 1024)} MB kvar). Kontakta administratören.` },
      { status: 507 }
    );
  }

  // ─── 1. Kategori-validering + permission-check ──────────────────────────
  const category = rawCategory as DocumentCategory;
  const requiredPerm = CATEGORY_UPLOAD_PERMISSION[rawCategory];
  if (!requiredPerm) {
    return NextResponse.json(
      { error: `Okänd kategori: ${rawCategory}` },
      { status: 400 }
    );
  }
  if (!hasPermission(userRoles, requiredPerm)) {
    return NextResponse.json(
      { error: `Saknar behörighet att ladda upp i kategorin "${rawCategory}"` },
      { status: 403 }
    );
  }

  // Publikt synliga dokument kräver extra permission
  if (visibleToAll && !canPublishPublicly(userRoles)) {
    return NextResponse.json(
      { error: "Endast ordförande/sekreterare/admin kan markera dokument som publikt synliga" },
      { status: 403 }
    );
  }

  // ─── 2. Extension-blocklist ─────────────────────────────────────────────
  const extErr = validateExtension(file.name);
  if (extErr) {
    return NextResponse.json({ error: extErr.message }, { status: 415 });
  }

  // ─── 3. Storleks-check ──────────────────────────────────────────────────
  const sizeErr = validateSize(file.size, rawCategory);
  if (sizeErr) {
    return NextResponse.json({ error: sizeErr.message }, { status: 413 });
  }

  // ─── 4. Magic-byte-sniff för faktisk MIME (klientens file.type är ej trovärdig) ─
  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffedMime = await detectMimeFromBytes(buffer);

  // Text-filer (text/plain, text/csv) detekteras inte av file-type (inget magic
  // byte-mönster), så lita på extension i det fallet
  const ext = extractExtension(file.name);
  let effectiveMime: string;
  if (sniffedMime) {
    effectiveMime = sniffedMime;
  } else if (ext === "txt") {
    effectiveMime = "text/plain";
  } else if (ext === "csv") {
    effectiveMime = "text/csv";
  } else {
    return NextResponse.json(
      { error: "Kunde inte identifiera filtypen. Endast kända filformat tillåts." },
      { status: 415 }
    );
  }

  // ─── 5. Kategori-whitelist mot SNIFFAD mime ────────────────────────────
  const mimeErr = validateCategoryMime(effectiveMime, rawCategory);
  if (mimeErr) {
    return NextResponse.json({ error: mimeErr.message }, { status: 415 });
  }

  // ─── 6. Spara och registrera ────────────────────────────────────────────
  const { storedName } = await saveFile(buffer, file.name, rawCategory);

  const document = await db.document.create({
    data: {
      fileName: file.name,
      storedName,
      fileUrl: "",
      fileSize: file.size,
      mimeType: effectiveMime, // Använder SNIFFAD mime, inte klient-angiven
      category,
      description,
      uploadedById: userId,
      visibleToMembers,
      visibleToAll,
    },
  });

  await db.document.update({
    where: { id: document.id },
    data: { fileUrl: `/api/documents/${document.id}/download` },
  });

  logActivity({
    userId,
    action: "document.upload",
    entityType: "Document",
    entityId: document.id,
    description: `Laddade upp ${file.name} (${rawCategory}, ${Math.round(file.size / 1024)} KB)`,
    after: {
      fileName: file.name,
      category: rawCategory,
      mimeType: effectiveMime,
      size: file.size,
      visibleToMembers,
      visibleToAll,
    },
  });

  return NextResponse.json(
    { id: document.id, fileName: document.fileName },
    { status: 201 }
  );
}
