import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { getStoredFilePath } from "@/lib/upload";
import { isBoardMember } from "@/lib/permissions";
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

  // Check access
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

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(document.fileName)}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Filen kunde inte läsas" }, { status: 500 });
  }
}
