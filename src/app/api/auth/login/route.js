import { NextResponse } from "next/server";
import { verifyDummyPassword, verifyPassword } from "@/lib/auth/password";
import { loginSchema, firstValidationError } from "@/lib/auth/validation";
import {
  createSession,
  destroyRequestSession,
  setSessionCookie,
} from "@/lib/auth/session";
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/auth/rate-limit";
import {
  getUserByEmail,
  markUserLogin,
  publicUser,
} from "@/lib/db/auth-repositories";
import { handleRouteError } from "@/lib/db/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVALID_CREDENTIALS = "Invalid email or password.";

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = checkRateLimit(`login:ip:${ip}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: firstValidationError(parsed.error) },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const accountLimit = checkRateLimit(`login:account:${email}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!accountLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(accountLimit.retryAfterSeconds) },
        }
      );
    }

    const user = await getUserByEmail(email);
    const passwordOk = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyDummyPassword(password);

    if (!user || !passwordOk) {
      return NextResponse.json(
        { success: false, error: INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    await destroyRequestSession(request);
    await markUserLogin(user.id);
    const token = await createSession(user.id, request);

    resetRateLimit(`login:ip:${ip}`);
    resetRateLimit(`login:account:${email}`);

    const response = NextResponse.json(
      { success: true, user: publicUser(user) },
      { headers: { "Cache-Control": "no-store" } }
    );
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return handleRouteError(error, "Login failed");
  }
}
