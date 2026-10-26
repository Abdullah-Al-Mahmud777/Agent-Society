import { NextResponse } from "next/server";
import { DatabaseConfigurationError } from "./client.js";
import {
  AuthenticationError,
  getRequestUser,
  unauthorizedResponse,
} from "@/lib/auth/session";

export async function getUserId(request) {
  const user = await getRequestUser(request);
  if (!user) throw new AuthenticationError();
  return user.id;
}

export function databaseUnavailableResponse() {
  return NextResponse.json(
    {
      success: false,
      code: "DATABASE_NOT_CONFIGURED",
      error:
        "Turso database is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local.",
    },
    { status: 503 }
  );
}

export function handleRouteError(error, fallbackMessage = "Database operation failed") {
  if (error instanceof AuthenticationError || error?.code === "UNAUTHENTICATED") {
    return unauthorizedResponse();
  }

  console.error("[db/api]", error);

  if (error instanceof DatabaseConfigurationError || error?.code === "DATABASE_NOT_CONFIGURED") {
    return databaseUnavailableResponse();
  }

  return NextResponse.json(
    {
      success: false,
      error:
        process.env.NODE_ENV === "development"
          ? error?.message || fallbackMessage
          : fallbackMessage,
    },
    { status: 500 }
  );
}
