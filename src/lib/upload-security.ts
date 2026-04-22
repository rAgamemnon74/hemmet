/**
 * Säkerhetskontroller för filuppladdning.
 *
 * Blockerar:
 *   - Exekverbara/skriptfiler (HTML, SVG, JS, shell-skript, etc) som skulle kunna
 *     köras som XSS om browsern renderar dem inline
 *   - MIME-spoofing (klienten kan ljuga om file.type) — vi sniffar verklig MIME
 *     från filens magic-bytes och använder den istället
 *   - Fel kategori (t.ex. en .exe laddad upp som "DAMAGE_REPORT_PHOTO")
 *
 * Säkerställer:
 *   - Content-Disposition: attachment (tvingar nedladdning) för allt som INTE
 *     är en säker inline-typ (PDF/bild/plain-text)
 *   - X-Content-Type-Options: nosniff på alla download-svar
 *   - Kategori-specifik MIME-whitelist per dokumenttyp
 */

import type { Role } from "@prisma/client";
import type { Permission } from "./permissions";

// ─── Extensions som ALDRIG får laddas upp (server kör inte dem, men browser
// kan rendera dem inline) ──────────────────────────────────────────────────
const DENIED_EXTENSIONS = new Set([
  // Markup/skript som browsern kan köra inline
  "html", "htm", "xhtml", "xht", "svg", "svgz",
  "xml", "xsl", "xslt", "mhtml", "mht",
  // JavaScript
  "js", "mjs", "cjs", "jsx", "ts", "tsx",
  // CSS (kan användas till UI-redressing)
  "css",
  // Server-side skript (vi kör dem inte, men andra kanske gör det vid feldistribution)
  "sh", "bash", "zsh", "ksh", "csh",
  "py", "rb", "pl", "php", "phtml", "php3", "php4", "php5",
  "asp", "aspx", "ashx", "jsp", "cgi",
  "exe", "bat", "cmd", "com", "vbs", "vbe", "js", "jse",
  "ps1", "psm1", "dll", "scr",
  // Arkiv (kan innehålla vad som helst, och vi distribuerar inte som inline)
  // ZIP tillåts för kategorier som explicit behöver det (MOTION_ATTACHMENT)
]);

// ─── MIME-typer som är säkra att rendera inline (Content-Disposition: inline) ──
// Allt annat tvingas till "attachment" (nedladdning) i download-routet.
const SAFE_INLINE_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "text/plain",
]);

// ─── MIME-whitelist per kategori ───────────────────────────────────────────
// "*" betyder "alla säkra typer"
const CATEGORY_WHITELIST: Record<string, string[]> = {
  MEETING_PROTOCOL: [
    "application/pdf",
  ],
  MEETING_ATTACHMENT: [
    "application/pdf",
    "image/jpeg", "image/png", "image/webp", "image/heic",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain", "text/csv",
  ],
  EXPENSE_RECEIPT: [
    "application/pdf",
    "image/jpeg", "image/png", "image/heic", "image/webp",
  ],
  MOTION_ATTACHMENT: [
    "application/pdf",
    "image/jpeg", "image/png", "image/webp",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  DAMAGE_REPORT_PHOTO: [
    "image/jpeg", "image/png", "image/heic", "image/webp",
  ],
  ANNUAL_REPORT: [
    "application/pdf",
  ],
  FINANCIAL_STATEMENT: [
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  AUDIT_REPORT: [
    "application/pdf",
  ],
  ORGANIZATION_MANDATE: [
    "application/pdf",
    "image/jpeg", "image/png",
  ],
  RULES: [
    "application/pdf",
  ],
  OTHER: [
    "application/pdf",
    "image/jpeg", "image/png", "image/webp",
    "text/plain", "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip", // allowed som "ett valfritt bundlat material"
  ],
};

// ─── Vilken permission krävs för att ladda upp respektive kategori ──────────
export const CATEGORY_UPLOAD_PERMISSION: Record<string, Permission> = {
  MEETING_PROTOCOL: "meeting:protocol",
  MEETING_ATTACHMENT: "meeting:edit",
  EXPENSE_RECEIPT: "expense:submit",
  MOTION_ATTACHMENT: "motion:submit",
  DAMAGE_REPORT_PHOTO: "report:submit",
  ANNUAL_REPORT: "annual_report:edit",
  FINANCIAL_STATEMENT: "annual_report:edit",
  AUDIT_REPORT: "audit:perform",
  ORGANIZATION_MANDATE: "member:edit",
  RULES: "admin:settings",
  OTHER: "document:upload",
};

// ─── File size-limiter per kategori (bytes) ────────────────────────────────
const SIZE_LIMIT_DEFAULT = 50 * 1024 * 1024;      // 50 MB
const SIZE_LIMITS: Record<string, number> = {
  MEETING_PROTOCOL: 20 * 1024 * 1024,              // PDF:er, lagom
  EXPENSE_RECEIPT: 10 * 1024 * 1024,               // Bildmässiga mestadels
  DAMAGE_REPORT_PHOTO: 20 * 1024 * 1024,           // Bilder från mobil
  ANNUAL_REPORT: 50 * 1024 * 1024,                 // Kan vara stor PDF
  MEETING_ATTACHMENT: 50 * 1024 * 1024,            // Kan vara tunga rapporter
  OTHER: 30 * 1024 * 1024,
};

export function getSizeLimit(category: string): number {
  return SIZE_LIMITS[category] ?? SIZE_LIMIT_DEFAULT;
}

// ─── Extension-utdrag ──────────────────────────────────────────────────────
export function extractExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot < 0 || lastDot === filename.length - 1) return "";
  return filename.slice(lastDot + 1).toLowerCase();
}

// ─── Kontroller ────────────────────────────────────────────────────────────

export type UploadValidationError = {
  code:
    | "extension_denied"
    | "mime_not_allowed_for_category"
    | "mime_spoofed"
    | "size_too_large"
    | "unknown_category"
    | "permission_denied"
    | "publish_permission_denied";
  message: string;
};

export function validateExtension(filename: string): UploadValidationError | null {
  const ext = extractExtension(filename);
  if (ext && DENIED_EXTENSIONS.has(ext)) {
    return {
      code: "extension_denied",
      message: `Filändelsen .${ext} är inte tillåten för uppladdning.`,
    };
  }
  return null;
}

export function validateSize(size: number, category: string): UploadValidationError | null {
  const limit = getSizeLimit(category);
  if (size > limit) {
    return {
      code: "size_too_large",
      message: `Filen är för stor (${Math.round(size / 1024 / 1024)} MB). Max för kategorin "${category}" är ${Math.round(limit / 1024 / 1024)} MB.`,
    };
  }
  return null;
}

export function validateCategoryMime(mime: string, category: string): UploadValidationError | null {
  const allowed = CATEGORY_WHITELIST[category];
  if (!allowed) {
    return {
      code: "unknown_category",
      message: `Okänd kategori: ${category}`,
    };
  }
  if (!allowed.includes(mime)) {
    return {
      code: "mime_not_allowed_for_category",
      message: `MIME-typen "${mime}" är inte tillåten för kategorin "${category}". Tillåtna: ${allowed.join(", ")}`,
    };
  }
  return null;
}

export function isSafeInlineMime(mime: string): boolean {
  return SAFE_INLINE_MIMES.has(mime);
}

/** Content-Disposition för download-routet. SAFE_INLINE_MIMES får inline, allt annat attachment. */
export function getDisposition(mime: string): "inline" | "attachment" {
  return isSafeInlineMime(mime) ? "inline" : "attachment";
}

/** Sniff riktig MIME från filens magic-bytes (inte klient-angivna headers). */
export async function detectMimeFromBytes(buffer: Buffer): Promise<string | null> {
  // file-type är ESM; använd dynamic import för CJS-kompatibilitet
  const { fileTypeFromBuffer } = await import("file-type");
  const result = await fileTypeFromBuffer(buffer);
  return result?.mime ?? null;
}

/** Avgör om användaren får sätta visibleToAll. */
export function canPublishPublicly(userRoles: Role[]): boolean {
  // Dynamisk import för att undvika cirkel vid tRPC-middleware
  // Enkel inline-check istället:
  const roleSet = new Set(userRoles);
  return roleSet.has("ADMIN") ||
         roleSet.has("BOARD_CHAIRPERSON") ||
         roleSet.has("BOARD_SECRETARY");
}
