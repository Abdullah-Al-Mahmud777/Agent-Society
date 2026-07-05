import { NextResponse } from "next/server";
import { executeAgentTask } from "@/lib/provider-factory";
import { decryptApiKey } from "@/lib/encryption";

/**
 * POST - Execute agent task with dynamic provider
 * 
 * This endpoint demonstrates how to execute agent tasks
 * using dynamically configured LLM providers
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { providerConfig, prompt, agentConfig } = body;
    
    if (!providerConfig || !prompt) {
      return NextResponse.json(
        { success: false, error: "Provider config and prompt are required" },
        { status: 400 }
      );
    }
    
    // Build execution options
    const options = {
      temperature: agentConfig?.temperature ?? 0.7,
      maxTokens: agentConfig?.maxTokens ?? 2048,
      systemPrompt: agentConfig?.systemPrompt,
    };
    
    // Execute the agent task with dynamic provider
    const response = await executeAgentTask(providerConfig, prompt, options);
    
    return NextResponse.json({
      success: true,
      response,
      provider: providerConfig.providerName,
      model: providerConfig.selectedModel,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Agent execution error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get execution status/history
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default-user";
    
    // In production, fetch from database
    return NextResponse.json({
      success: true,
      executions: [],
      message: "Execution history feature coming soon",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
