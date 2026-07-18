import { NextResponse } from "next/server";
import { buildPersonalityContext } from "@/lib/personality";
import { createProvider } from "@/lib/provider-factory";
import { encryptApiKey } from "@/lib/encryption";

// HARDCODED API KEY - Replace with your actual OpenRouter API key
const HARDCODED_QWEN_API_KEY = "YOUR_OPENROUTER_API_KEY_HERE";

export const runtime = "nodejs";

/**
 * Agent-specific chat endpoint
 * POST /api/agent-chat
 * Body: { prompt: string, agent: object, providerConfig: object (optional) }
 * 
 * VERCEL PRODUCTION NOTES:
 * - This runs server-side only (Next.js API Route)
 * - process.env.QWEN_API_KEY is available on server
 * - Falls back to environment variables if providerConfig is not provided
 */
export async function POST(request) {
    // ============================================
    // DIAGNOSTIC LOGGING FOR VERCEL
    // ============================================
    console.log("========== API ROUTE DEBUG START ==========");
    console.log("Environment Check:");
    console.log("- Is QWEN_API_KEY present?:", !!process.env.QWEN_API_KEY);
    console.log("- QWEN_API_KEY length:", process.env.QWEN_API_KEY?.length || 0);
    console.log("- QWEN_API_KEY starts with:", process.env.QWEN_API_KEY?.substring(0, 5) || "N/A");
    console.log("- DEFAULT_PROVIDER:", process.env.DEFAULT_PROVIDER || "not set");
    console.log("- DEFAULT_MODEL:", process.env.DEFAULT_MODEL || "not set");
    console.log("- NEXT_PUBLIC_ENCRYPTION_KEY present?:", !!process.env.NEXT_PUBLIC_ENCRYPTION_KEY);
    console.log("- Runtime:", process.env.VERCEL ? "Vercel" : "Local");
    
    try {
        const { prompt, agent, providerConfig } = await request.json();
        
        console.log("Request payload:");
        console.log("- Prompt length:", prompt?.length || 0);
        console.log("- Agent name:", agent?.name || "N/A");
        console.log("- providerConfig provided from client?:", !!providerConfig);

        if (!prompt || !prompt.trim()) {
            console.log("❌ Error: Prompt is missing or empty");
            return NextResponse.json(
                { success: false, error: "Prompt is required" },
                { status: 400 }
            );
        }

        if (!agent || !agent.name) {
            console.log("❌ Error: Agent is missing or invalid");
            return NextResponse.json(
                { success: false, error: "Agent is required" },
                { status: 400 }
            );
        }

        // ============================================
        // PROVIDER CONFIGURATION HANDLING
        // ============================================
        let config = providerConfig;
        
        if (!config) {
            console.log("⚠️  No providerConfig from client - attempting environment variable fallback");
            
            // Fallback to environment variables (for Vercel production)
            const envProvider = process.env.DEFAULT_PROVIDER || "qwen";
            const envModel = process.env.DEFAULT_MODEL || "qwen/qwen3.7-plus";
            
            // Check for API key - CRITICAL: No NEXT_PUBLIC_ prefix
            const envApiKey = HARDCODED_QWEN_API_KEY || 
                             process.env.OPENROUTER_API_KEY ||
                             process.env.QWEN_API_KEY || 
                             process.env.OPENAI_API_KEY || 
                             process.env.ANTHROPIC_API_KEY;
            
            console.log("Environment fallback check:");
            console.log("- Provider:", envProvider);
            console.log("- Model:", envModel);
            console.log("- API Key found?:", !!envApiKey);
            console.log("- API Key source:", process.env.QWEN_API_KEY ? "QWEN_API_KEY" : 
                                           process.env.OPENAI_API_KEY ? "OPENAI_API_KEY" :
                                           process.env.ANTHROPIC_API_KEY ? "ANTHROPIC_API_KEY" : "NONE");
            
            if (envApiKey) {
                console.log("✅ Using environment variable fallback");
                
                // Create config object with encrypted API key
                config = {
                    providerName: envProvider,
                    selectedModel: envModel,
                    encryptedApiKey: encryptApiKey(envApiKey),
                    userId: "default-user",
                    isActive: true,
                };
                
                console.log("✅ Config created successfully");
            } else {
                console.log("❌ CRITICAL: No API key found in environment variables");
                console.log("❌ Please ensure QWEN_API_KEY is set in Vercel Environment Variables");
                console.log("❌ Available env keys:", Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY')));
                
                return NextResponse.json(
                    { 
                        success: false, 
                        error: "No LLM provider configured. API key not found in environment variables. Please check Vercel settings." 
                    },
                    { status: 500 }
                );
            }
        } else {
            console.log("✅ Using providerConfig from client (localStorage)");
        }

        // ============================================
        // BUILD SYSTEM PROMPT
        // ============================================
        console.log("Building system prompt...");
        const personalityContext = buildPersonalityContext(agent);
        const systemPrompt = [
            personalityContext,
            agent.systemPrompt,
            `\nYour goal: ${agent.goal}`,
        ]
            .filter(Boolean)
            .join("\n\n");
        
        console.log("✅ System prompt built, length:", systemPrompt.length);

        // ============================================
        // CREATE PROVIDER CLIENT
        // ============================================
        console.log("Creating provider client...");
        console.log("- Provider:", config.providerName);
        console.log("- Model:", config.selectedModel);
        
        const providerFactory = createProvider(config);
        const client = providerFactory.getClient();
        
        console.log("✅ Provider client created successfully");

        // ============================================
        // GENERATE RESPONSE
        // ============================================
        console.log("Generating response from LLM...");
        const responseText = await client.generateContent(prompt.trim(), {
            temperature: agent.temperature ?? 0.7,
            maxTokens: agent.maxTokens ?? 2048,
            systemPrompt: systemPrompt,
        });
        
        console.log("✅ Response received, length:", responseText?.length || 0);
        console.log("========== API ROUTE DEBUG END ==========");

        return NextResponse.json({
            success: true,
            agentName: agent.name,
            agentRole: agent.role,
            prompt: prompt.trim(),
            response: responseText,
            provider: config.providerName,
            model: config.selectedModel,
            timestamp: new Date().toISOString(),
        });
        
    } catch (error) {
        console.error("========== API ROUTE ERROR ==========");
        console.error("Error type:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("======================================");
        
        // Handle rate limiting
        if (error.message?.includes("429") || error.message?.includes("quota")) {
            return NextResponse.json(
                {
                    success: false,
                    error: "API rate limit exceeded. Please wait a moment and try again.",
                },
                { status: 429 }
            );
        }

        // Return detailed error for debugging
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to generate response",
                details: process.env.NODE_ENV === "development" ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}
