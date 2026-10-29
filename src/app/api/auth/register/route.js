import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema, firstValidationError } from "@/lib/auth/validation";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/auth/rate-limit";
import {
  claimLegacyData,
  countUsers,
  createUser,
  getUserByEmail,
  publicUser,
  saveUserSettings,
} from "@/lib/db/auth-repositories";
import { handleRouteError } from "@/lib/db/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = checkRateLimit(`register:ip:${ip}`, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many registration attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: firstValidationError(parsed.error) },
        { status: 400 }
      );
    }

    const { displayName, email, password } = parsed.data;
    const emailLimit = checkRateLimit(`register:email:${email}`, {
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many registration attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(emailLimit.retryAfterSeconds) },
        }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      displayName,
      passwordHash,
    });

    if ((await countUsers()) === 1) {
      await claimLegacyData(user.id);
      await saveUserSettings(user.id, { theme: "dark", preferences: {} });
    }

    const token = await createSession(user.id, request);
    resetRateLimit(`register:email:${email}`);
    resetRateLimit(`register:ip:${ip}`);

    const response = NextResponse.json(
      { success: true, user: publicUser(user) },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      }
    );
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return handleRouteError(error, "Registration failed");
  }
}
