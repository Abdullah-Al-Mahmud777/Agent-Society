import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function decode(value) {
  return Buffer.from(value, "base64url");
}

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Password is required");
  }

  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: MAX_MEMORY,
  });

  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    encode(salt),
    encode(derived),
  ].join("$");
}

export async function verifyPassword(password, storedHash) {
  if (typeof password !== "string" || typeof storedHash !== "string") {
    return false;
  }

  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }

  let salt;
  let expected;
  try {
    salt = decode(parts[4]);
    expected = decode(parts[5]);
  } catch {
    return false;
  }

  // Reject non-canonical base64url (e.g. mangled trailing characters that would
  // otherwise decode to the same bytes and still verify).
  if (encode(salt) !== parts[4] || encode(expected) !== parts[5]) return false;

  if (expected.length !== KEY_LENGTH) return false;

  try {
    const actual = await scrypt(password, salt, expected.length, {
      N,
      r,
      p,
      maxmem: MAX_MEMORY,
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// A valid scrypt hash for a throwaway value. Used to equalize login timing for
// unknown email addresses without ever accepting it as a real password.
const DUMMY_HASH =
  "scrypt$16384$8$1$6AaVW0YsFAmd0AlPph0k2A$" +
  "I__6j4reekBk3R5g6nd4KXckI13EEegX1NuIv4J_8E1-BWn7axcmR9QLYP4rQxruG1OZIz2WzDsP9K2kLlphwQ";

/**
 * Runs a lightweight verification for a missing account so the response time
 * does not reveal whether an email exists.
 */
export async function verifyDummyPassword(password) {
  await verifyPassword(password, DUMMY_HASH).catch(() => false);
  return false;
}
