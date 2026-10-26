import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export { validateApiKeyFormat } from "./api-key-format";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";
const LEGACY_KEY =
  process.env.NEXT_PUBLIC_ENCRYPTION_KEY ||
  "default-encryption-key-change-in-production";

let warnedAboutFallback = false;

function getSecret() {
  const secret =
    process.env.API_KEY_ENCRYPTION_SECRET ||
    process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

  if (secret) return secret;

  if (!warnedAboutFallback) {
    warnedAboutFallback = true;
    console.warn(
      "[encryption] API_KEY_ENCRYPTION_SECRET is not set. Using a development fallback."
    );
  }

  return LEGACY_KEY;
}

function deriveKey(secret) {
  return createHash("sha256").update(secret).digest();
}

function decode(value) {
  return Buffer.from(value, "base64url");
}

export function encryptApiKey(apiKey) {
  if (!apiKey) return "";

  try {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, deriveKey(getSecret()), iv);
    const encrypted = Buffer.concat([
      cipher.update(String(apiKey), "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [
      VERSION,
      iv.toString("base64url"),
      tag.toString("base64url"),
      encrypted.toString("base64url"),
    ].join(".");
  } catch {
    throw new Error("Failed to encrypt API key");
  }
}

export function decryptApiKey(encryptedKey) {
  if (!encryptedKey) return "";

  if (encryptedKey.startsWith(`${VERSION}.`)) {
    const parts = encryptedKey.split(".");
    if (parts.length !== 4) throw new Error("Invalid encrypted API key");

    try {
      const iv = decode(parts[1]);
      const tag = decode(parts[2]);
      const encrypted = decode(parts[3]);
      const decipher = createDecipheriv(
        ALGORITHM,
        deriveKey(getSecret()),
        iv
      );
      decipher.setAuthTag(tag);
      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      throw new Error("Failed to decrypt API key");
    }
  }

  // Legacy format from the original local-only implementation.
  try {
    const decoded = Buffer.from(encryptedKey, "base64").toString("utf-8");
    if (decoded.includes(":")) {
      const separator = decoded.indexOf(":");
      const prefix = decoded.slice(0, separator);
      const apiKey = decoded.slice(separator + 1);
      if (prefix === LEGACY_KEY && apiKey) return apiKey;
      return decoded;
    }
    return decoded;
  } catch {
    throw new Error("Failed to decrypt API key");
  }
}

export function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 8) return "••••••••";
  const first = apiKey.substring(0, 4);
  const last = apiKey.substring(apiKey.length - 4);
  return `${first}••••${last}`;
}
