import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { getStoredFilePath } from "@/lib/upload";
import { isBoardMember } from "@/lib/permissions";
import { getDisposition } from "@/lib/upload-security";
import { logPersonalDataAccess } from "@/lib/gdpr";
import type { Role } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const document = await db.document.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "Dokumentet hittades inte" }, { status: 404 });
  }

  // ─── Behörighetskontroll ────────────────────────────────────────────────
  const userRoles = (session.user.roles ?? []) as Role[];
  const isBoard = isBoardMember(userRoles);

  if (!isBoard) {
    const isMember = userRoles.includes("MEMBER" as Role);
    if (isMember && !document.visibleToMembers && !document.visibleToAll) {
      return NextResponse.json({ error: "Åtkomst nekad" }, { status: 403 });
    }
    if (!isMember && !document.visibleToAll) {
      return NextResponse.json({ error: "Åtkomst nekad" }, { status: 403 });
    }
  }

  try {
    const filePath = getStoredFilePath(document.category, document.storedName);
    const buffer = await readFile(filePath);

    // Audit: logga åtkomst till dokument (fire-and-forget)
    logPersonalDataAccess(
      session.user.id as string,
      "DOWNLOAD_DOCUMENT",
      document.uploadedById,
      `doc=${document.id} cat=${document.category} file=${document.fileName}`,
    );

    // ─── Säkra headers ──────────────────────────────────────────────────────
    // SAFE inline-typer (PDF, bild, text) renderas i browsern.
    // Allt annat tvingas till "attachment" → användaren får ladda ner filen.
    // nosniff stoppar browsers MIME-sniffing (skydd mot typ-förvirring).
    // CSP + sandbox är extra lager om innehållet ändå körs — blockerar JS/XHR.
    const disposition = getDisposition(document.mimeType);
    const filenameEncoded = encodeURIComponent(document.fileName);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `${disposition}; filename*=UTF-8''${filenameEncoded}`,
        "Content-Length": buffer.length.toString(),
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Filen kunde inte läsas" }, { status: 500 });
  }
}
