import { mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_BASE = process.env.UPLOAD_DIR ?? "./uploads";

// Category to subdirectory mapping
const CATEGORY_DIRS: Record<string, string> = {
  MEETING_PROTOCOL: "protokoll",
  MEETING_ATTACHMENT: "motesbilagor",
  EXPENSE_RECEIPT: "kvitton",
  MOTION_ATTACHMENT: "motionsbilagor",
  DAMAGE_REPORT_PHOTO: "felanmalan",
  ANNUAL_REPORT: "arsredovisning",
  FINANCIAL_STATEMENT: "bokslut",
  AUDIT_REPORT: "revisionsberattelse",
  ORGANIZATION_MANDATE: "mandatdokument",
  RULES: "stadgar",
  OTHER: "ovrigt",
};

export function getCategoryDir(category: string): string {
  return CATEGORY_DIRS[category] ?? "ovrigt";
}

export function getUploadDir(category: string): string {
  return path.join(UPLOAD_BASE, getCategoryDir(category));
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  category: string
): Promise<{ storedName: string; filePath: string }> {
  const dir = getUploadDir(category);
  await mkdir(dir, { recursive: true });

  const ext = path.extname(originalName);
  const storedName = `${randomUUID()}${ext}`;
  const filePath = path.join(dir, storedName);

  const { writeFile } = await import("fs/promises");
  await writeFile(filePath, buffer);

  return { storedName, filePath };
}

export function getStoredFilePath(category: string, storedName: string): string {
  return path.join(getUploadDir(category), storedName);
}
