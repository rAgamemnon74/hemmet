/**
 * AES-256-GCM encryption for sensitive fields (personnummer etc.)
 * Key from ENCRYPTION_KEY env variable (32 bytes hex = 64 chars).
 * Falls back to plaintext if no key configured (dev mode).
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer | null {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length < 64) return null;
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plaintext string. Returns "enc:<iv>:<tag>:<ciphertext>" in hex.
 * If no encryption key is configured, returns plaintext unchanged.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt a previously encrypted string. Handles both encrypted ("enc:...")
 * and plaintext (legacy/dev) values gracefully.
 */
export function decrypt(value: string): string {
  if (!value.startsWith("enc:")) return value; // Plaintext fallback

  const key = getKey();
  if (!key) return value; // No key = can't decrypt, return as-is

  const parts = value.split(":");
  if (parts.length !== 4) return value;

  const iv = Buffer.from(parts[1], "hex");
  const tag = Buffer.from(parts[2], "hex");
  const encrypted = Buffer.from(parts[3], "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
