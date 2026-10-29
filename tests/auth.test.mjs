import test from "node:test";
import assert from "node:assert/strict";

import {
  hashPassword,
  verifyDummyPassword,
  verifyPassword,
} from "../src/lib/auth/password.js";
import {
  loginSchema,
  registerSchema,
  settingsSchema,
} from "../src/lib/auth/validation.js";
import {
  checkRateLimit,
  getClientIp,
  resetRateLimit,
} from "../src/lib/auth/rate-limit.js";

test("hashes and verifies passwords with scrypt", async () => {
  const hash = await hashPassword("CorrectHorse123!");
  assert.match(hash, /^scrypt\$16384\$8\$1\$/);
  assert.equal(await verifyPassword("CorrectHorse123!", hash), true);
  assert.equal(await verifyPassword("WrongHorse123!", hash), false);
});

test("rejects malformed and mismatched password hashes", async () => {
  assert.equal(await verifyPassword("anything", "plaintext"), false);
  assert.equal(await verifyPassword("anything", null), false);
  assert.equal(await verifyPassword(null, "scrypt$16384$8$1$x$y"), false);

  const hash = await hashPassword("CorrectHorse123!");
  const replacement = hash.endsWith("A") ? "B" : "A";
  const tampered = `${hash.slice(0, -1)}${replacement}`;
  assert.equal(await verifyPassword("CorrectHorse123!", tampered), false);
});

test("dummy verification never authenticates an unknown account", async () => {
  assert.equal(await verifyDummyPassword("CorrectHorse123!"), false);
  assert.equal(await verifyDummyPassword(""), false);
});

test("registration validation trims names and normalizes email", () => {
  const parsed = registerSchema.safeParse({
    displayName: "  Ada Lovelace  ",
    email: "  ADA@Example.COM ",
    password: "Analytical1",
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.displayName, "Ada Lovelace");
  assert.equal(parsed.data.email, "ada@example.com");
});

test("registration validation rejects weak or malformed input", () => {
  const weakPassword = registerSchema.safeParse({
    displayName: "Ada",
    email: "ada@example.com",
    password: "onlyletters",
  });
  assert.equal(weakPassword.success, false);

  const badEmail = registerSchema.safeParse({
    displayName: "Ada",
    email: "not-an-email",
    password: "Analytical1",
  });
  assert.equal(badEmail.success, false);

  const shortName = registerSchema.safeParse({
    displayName: "A",
    email: "ada@example.com",
    password: "Analytical1",
  });
  assert.equal(shortName.success, false);
});

test("login and settings validation enforce allowed values", () => {
  assert.equal(
    loginSchema.safeParse({
      email: "ADA@Example.com",
      password: "x",
    }).success,
    true
  );

  assert.equal(
    loginSchema.safeParse({ email: "bad", password: "x" }).success,
    false
  );

  assert.equal(settingsSchema.safeParse({ theme: "light" }).success, true);
  assert.equal(settingsSchema.safeParse({ theme: "neon" }).success, false);
});

test("rate limiting blocks after the configured limit and can reset", () => {
  const key = `auth-test-${Date.now()}-${Math.random()}`;
  const options = { limit: 2, windowMs: 60_000 };

  assert.equal(checkRateLimit(key, options).allowed, true);
  assert.equal(checkRateLimit(key, options).allowed, true);

  const blocked = checkRateLimit(key, options);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.retryAfterSeconds > 0);

  resetRateLimit(key);
  assert.equal(checkRateLimit(key, options).allowed, true);
});

test("client IP resolution honors trusted forwarding headers", () => {
  const request = {
    headers: new Headers({
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      "x-real-ip": "10.0.0.2",
    }),
  };

  assert.equal(getClientIp(request), "203.0.113.7");
  assert.equal(
    getClientIp({
      headers: new Headers({ "cf-connecting-ip": "198.51.100.9" }),
    }),
    "198.51.100.9"
  );
});
