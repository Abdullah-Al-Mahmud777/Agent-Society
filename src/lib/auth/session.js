import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import {
  createSessionRecord,
  deleteSessionByTokenHash,
  deleteExpiredSessions,
  getSessionUserByTokenHash,
} from "@/lib/db/auth-repositories";

export const SESSION_COOKIE = "agent_society_session";
export const THEME_COOKIE = "agent_society_theme";

function sessionTtlDays() {
  const configured = Number(process.env.SESSION_TTL_DAYS);
  return Number.isFinite(configured) && configured > 0 && configured <= 365
    ? Math.floor(configured)
    : 30;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionTtlDays() * 24 * 60 * 60,
  };
}

export function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId, request) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(
    Date.now() + sessionTtlDays() * 24 * 60 * 60 * 1000
  ).toISOString();

  await deleteExpiredSessions();
  await createSessionRecord({
    id: crypto.randomUUID(),
    userId,
    tokenHash,
    userAgent: request?.headers?.get("user-agent") || null,
    expiresAt,
  });

  return token;
}

export async function getUserForSessionToken(token) {
  if (!token) return null;
  return getSessionUserByTokenHash(hashSessionToken(token));
}

export async function getTokenFromRequest(request) {
  return request?.cookies?.get?.(SESSION_COOKIE)?.value || null;
}

export async function getRequestUser(request) {
  return getUserForSessionToken(await getTokenFromRequest(request));
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return getUserForSessionToken(cookieStore.get(SESSION_COOKIE)?.value || null);
}

export async function destroyRequestSession(request) {
  const token = await getTokenFromRequest(request);
  if (token) await deleteSessionByTokenHash(hashSessionToken(token));
}

export function setSessionCookie(response, token) {
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
}

export class AuthenticationError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
    this.code = "UNAUTHENTICATED";
  }
}

export function unauthorizedResponse() {
  return Response.json(
    {
      success: false,
      code: "UNAUTHENTICATED",
      error: "Authentication required",
    },
    {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
