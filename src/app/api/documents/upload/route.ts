import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { saveFile } from "@/lib/upload";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as string) ?? "OTHER";
  const description = formData.get("description") as string | null;
  const visibleToMembers = formData.get("visibleToMembers") === "true";
  const visibleToAll = formData.get("visibleToAll") === "true";

  if (!file) {
    return NextResponse.json({ error: "Ingen fil bifogad" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { storedName } = await saveFile(buffer, file.name, category);

  const document = await db.document.create({
    data: {
      fileName: file.name,
      storedName,
      fileUrl: "", // Set after we have the ID
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      category: category as Parameters<typeof db.document.create>[0]["data"]["category"],
      description,
      uploadedById: session.user.id,
      visibleToMembers,
      visibleToAll,
    },
  });

  // Update fileUrl with the document ID
  await db.document.update({
    where: { id: document.id },
    data: { fileUrl: `/api/documents/${document.id}/download` },
  });

  return NextResponse.json({ id: document.id, fileName: document.fileName }, { status: 201 });
}
