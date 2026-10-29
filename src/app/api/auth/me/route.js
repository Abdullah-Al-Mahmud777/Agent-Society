import { NextResponse } from "next/server";
import { getRequestUser, unauthorizedResponse } from "@/lib/auth/session";
import { publicUser } from "@/lib/db/auth-repositories";
import { handleRouteError } from "@/lib/db/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthorizedResponse();

    return NextResponse.json(
      { success: true, user: publicUser(user) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return handleRouteError(error, "Failed to load session");
  }
}
