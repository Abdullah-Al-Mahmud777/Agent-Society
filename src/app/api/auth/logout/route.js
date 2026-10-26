import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  destroyRequestSession,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    await destroyRequestSession(request);
  } catch (error) {
    console.warn("[auth] Failed to delete session:", error.message);
  }

  const response = NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } }
  );
  clearSessionCookie(response);
  return response;
}
