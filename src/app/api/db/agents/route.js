import { NextResponse } from "next/server";
import {
  deleteAgent,
  deleteAllAgents,
  listAgents,
  upsertAgent,
  upsertAgents,
} from "@/lib/db/repositories";
import { getUserId, handleRouteError } from "@/lib/db/http";
import {
  agentSchema,
  createAgentDefaults,
} from "@/lib/agent-builder-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeAgent(input) {
  if (!input || typeof input !== "object" || !input.name) return null;

  const timestamp = new Date().toISOString();
  const candidate = {
    ...createAgentDefaults(),
    ...input,
    id: input.id || crypto.randomUUID(),
    createdAt: input.createdAt || timestamp,
    updatedAt: input.updatedAt || timestamp,
  };

  const parsed = agentSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export async function GET(request) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const agents = await listAgents(userId);
      const agent = agents.find((item) => item.id === id) || null;
      return NextResponse.json({ success: true, agent });
    }

    const agents = await listAgents(userId);
    return NextResponse.json({ success: true, agents });
  } catch (error) {
    return handleRouteError(error, "Failed to load agents");
  }
}

export async function POST(request) {
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    const rawAgents = Array.isArray(body?.agents)
      ? body.agents
      : body?.agent
        ? [body.agent]
        : [body];

    const agents = rawAgents.map(normalizeAgent).filter(Boolean);
    const skipped = rawAgents.length - agents.length;

    if (agents.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid agents were provided" },
        { status: 400 }
      );
    }

    if (agents.length === 1) {
      const agent = await upsertAgent(agents[0], userId);
      return NextResponse.json({ success: true, agent, skipped });
    }

    const result = await upsertAgents(agents, userId);
    return NextResponse.json({ success: true, ...result, skipped });
  } catch (error) {
    return handleRouteError(error, "Failed to save agents");
  }
}

export async function PUT(request) {
  return POST(request);
}

export async function DELETE(request) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all") === "true";

    if (all) {
      const deleted = await deleteAllAgents(userId);
      return NextResponse.json({ success: true, deleted });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Agent id is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteAgent(id, userId);
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    return handleRouteError(error, "Failed to delete agent");
  }
}
