import { NextResponse } from "next/server";
import { getUserId, handleRouteError } from "@/lib/db/http";
import { getUserSettings, saveUserSettings } from "@/lib/db/auth-repositories";
import { settingsSchema, firstValidationError } from "@/lib/auth/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const userId = await getUserId(request);
    const settings = await getUserSettings(userId);
    return NextResponse.json(
      { success: true, settings },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return handleRouteError(error, "Failed to load settings");
  }
}

export async function PUT(request) {
  try {
    const userId = await getUserId(request);
    const body = await request.json().catch(() => ({}));
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: firstValidationError(parsed.error) },
        { status: 400 }
      );
    }

    const settings = await saveUserSettings(userId, parsed.data);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return handleRouteError(error, "Failed to save settings");
  }
}
