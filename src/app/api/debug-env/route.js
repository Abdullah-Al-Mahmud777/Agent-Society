import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Debug endpoint to check environment variables
 * Only use in development/debugging - REMOVE in production
 */
export async function GET(request) {
    // Security check - only allow in non-production
    const isProduction = process.env.VERCEL_ENV === 'production';
    
    if (isProduction) {
        return NextResponse.json({
            error: "Debug endpoint disabled in production for security"
        }, { status: 403 });
    }

    const envCheck = {
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        geminiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
        geminiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 5) || "N/A",
        
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        
        defaultProvider: process.env.DEFAULT_PROVIDER || "not set",
        defaultModel: process.env.DEFAULT_MODEL || "not set",
        
        hasEncryptionKey: !!process.env.NEXT_PUBLIC_ENCRYPTION_KEY,
        encryptionKeyLength: process.env.NEXT_PUBLIC_ENCRYPTION_KEY?.length || 0,
        
        runtime: process.env.VERCEL ? "Vercel" : "Local",
        vercelEnv: process.env.VERCEL_ENV || "local",
        nodeEnv: process.env.NODE_ENV,
        
        // List all env keys (for debugging)
        allEnvKeys: Object.keys(process.env).filter(k => 
            k.includes('API') || 
            k.includes('KEY') || 
            k.includes('PROVIDER') ||
            k.includes('MODEL') ||
            k.includes('GEMINI') ||
            k.includes('OPENAI') ||
            k.includes('ANTHROPIC')
        ),
    };

    return NextResponse.json({
        success: true,
        environment: envCheck,
        timestamp: new Date().toISOString(),
    });
}
