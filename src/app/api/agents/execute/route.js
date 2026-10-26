import { NextResponse } from "next/server";
import { executeAgentTask } from "@/lib/provider-factory";
import { ensureSchema } from "@/lib/db/client";
import { getUserId } from "@/lib/db/http";
import { AuthenticationError, unauthorizedResponse } from "@/lib/auth/session";
import {
  addAgentMemoryEntries,
  listExecutions,
  recordExecution,
} from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST - Execute agent task with dynamic provider
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { providerConfig, prompt, agentConfig } = body;
    const userId = await getUserId(request);

    if (!providerConfig || !prompt) {
      return NextResponse.json(
        { success: false, error: "Provider config and prompt are required" },
        { status: 400 }
      );
    }

    const options = {
      temperature: agentConfig?.temperature ?? 0.7,
      maxTokens: agentConfig?.maxTokens ?? 2048,
      systemPrompt: agentConfig?.systemPrompt,
    };

    const response = await executeAgentTask(providerConfig, prompt, options);
    const timestamp = new Date().toISOString();

    let persistence = { ok: false, error: "Database is not configured" };
    try {
      await ensureSchema();

      if (agentConfig?.id) {
        const executionId = await recordExecution(
          {
            agentId: agentConfig.id,
            conversationId: body.conversationId || null,
            userRequest: prompt,
            globalContext: body.globalContext || "",
            success: true,
            output: response,
            executionStrategy: "single-agent",
            createdAt: timestamp,
          },
          userId
        );

        await addAgentMemoryEntries(
          agentConfig.id,
          [
            {
              entryType: "execution",
              role: "system",
              content: response,
              metadata: {
                executionId,
                conversationId: body.conversationId || null,
                userRequest: prompt,
                success: true,
                executionStrategy: "single-agent",
                timestamp,
              },
              createdAt: timestamp,
            },
          ],
          userId
        );
      }

      persistence = { ok: true };
    } catch (dbError) {
      console.error("Failed to persist agent execution:", dbError);
      persistence = { ok: false, error: "Failed to persist execution" };
    }

    return NextResponse.json({
      success: true,
      response,
      provider: providerConfig.providerName,
      model: providerConfig.selectedModel,
      timestamp,
      persistence,
    });
  } catch (error) {
    if (error instanceof AuthenticationError || error?.code === "UNAUTHENTICATED") {
      return unauthorizedResponse();
    }

    console.error("Agent execution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get execution history from Turso
 */
export async function GET(request) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const limit = Number(searchParams.get("limit")) || 50;

    const executions = await listExecutions(userId, { agentId, limit });

    return NextResponse.json({
      success: true,
      executions,
    });
  } catch (error) {
    if (error instanceof AuthenticationError || error?.code === "UNAUTHENTICATED") {
      return unauthorizedResponse();
    }

    console.error("Failed to load execution history:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Failed to load execution history",
      },
      { status: 500 }
    );
  }
}
