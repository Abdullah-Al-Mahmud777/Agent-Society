import { NextResponse } from "next/server";
import {
  getActiveProvider,
  listAgents,
  listConversations,
  publicProvider,
} from "@/lib/db/repositories";
import { getUserId, handleRouteError } from "@/lib/db/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_CONVERSATION_LIMIT = 100;

export async function GET(request) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("conversationLimit")) || DEFAULT_CONVERSATION_LIMIT;

    const [agents, conversations, provider] = await Promise.all([
      listAgents(userId),
      listConversations(userId, limit),
      getActiveProvider(userId),
    ]);

    return NextResponse.json(
      {
        success: true,
        agents,
        conversations,
        provider: publicProvider(provider),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return handleRouteError(error, "Failed to load workspace");
  }
}
