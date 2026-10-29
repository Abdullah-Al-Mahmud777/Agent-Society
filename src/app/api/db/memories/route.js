import { NextResponse } from "next/server";
import {
  addAgentMemoryEntries,
  clearAgentMemory,
  clearAllAgentMemory,
  getAgentMemory,
  getAgentMemories,
  listAgents,
  saveAgentNotes,
} from "@/lib/db/repositories";
import { getUserId, handleRouteError } from "@/lib/db/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function memoryEntriesFromMemory(memory) {
  const entries = [];

  for (const entry of memory?.conversationHistory || []) {
    entries.push({
      entryType: "conversation",
      role: entry.role || "user",
      content: entry.content || "",
      metadata: {},
      createdAt: entry.timestamp,
    });
  }

  for (const entry of memory?.executionHistory || []) {
    const { timestamp, ...metadata } = entry || {};
    entries.push({
      entryType: "execution",
      role: "system",
      content: JSON.stringify(metadata),
      metadata,
      createdAt: timestamp,
    });
  }

  return entries.filter((entry) => entry.content);
}

export async function GET(request) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (agentId) {
      const memory = await getAgentMemory(agentId, userId);
      return NextResponse.json({ success: true, agentId, memory });
    }

    if (searchParams.get("all") === "true") {
      const agents = await listAgents(userId);
      const memories = await getAgentMemories(
        agents.map((agent) => agent.id),
        userId
      );
      return NextResponse.json({ success: true, memories });
    }

    return NextResponse.json(
      { success: false, error: "agentId is required" },
      { status: 400 }
    );
  } catch (error) {
    return handleRouteError(error, "Failed to load agent memory");
  }
}

export async function POST(request) {
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    const agentId = body.agentId;
    if (!agentId) {
      return NextResponse.json(
        { success: false, error: "agentId is required" },
        { status: 400 }
      );
    }

    if (body.memory) {
      if (body.replace === true) {
        await clearAgentMemory(agentId, userId);
      }

      const entries = memoryEntriesFromMemory(body.memory);
      const result = await addAgentMemoryEntries(agentId, entries, userId);
      if (body.memory.notes !== undefined) {
        await saveAgentNotes(agentId, body.memory.notes, userId);
      }

      return NextResponse.json({ success: true, ...result });
    }

    const entries = Array.isArray(body.entries)
      ? body.entries
      : body.entry
        ? [body.entry]
        : [];

    if (entries.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one memory entry is required" },
        { status: 400 }
      );
    }

    const result = await addAgentMemoryEntries(agentId, entries, userId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleRouteError(error, "Failed to save agent memory");
  }
}

export async function PUT(request) {
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    if (!body.agentId) {
      return NextResponse.json(
        { success: false, error: "agentId is required" },
        { status: 400 }
      );
    }

    const notes = body.notes ?? body.memory?.notes ?? "";
    const saved = await saveAgentNotes(body.agentId, notes, userId);
    return NextResponse.json({ success: true, ...saved });
  } catch (error) {
    return handleRouteError(error, "Failed to save agent notes");
  }
}

export async function DELETE(request) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (searchParams.get("all") === "true") {
      await clearAllAgentMemory(userId);
      return NextResponse.json({ success: true });
    }

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: "agentId is required" },
        { status: 400 }
      );
    }

    await clearAgentMemory(agentId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "Failed to clear agent memory");
  }
}
