import { NextResponse } from "next/server";
import { createProvider } from "@/lib/provider-factory";
import { encryptApiKey, decryptApiKey } from "@/lib/encryption";
import { createUserProvider } from "@/lib/db-schema";

/**
 * GET - Get all providers for a user
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default-user";
    
    // In production, get from database
    // For now, return empty array as we're using client-side storage
    return NextResponse.json({
      success: true,
      providers: [],
      message: "Use client-side storage for demo",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Test provider connection
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, providerName, apiKey, selectedModel, userId } = body;
    
    if (action === "test") {
      // Test connection without saving
      const testConfig = {
        userId: userId || "test-user",
        providerName,
        encryptedApiKey: encryptApiKey(apiKey),
        selectedModel,
        isActive: false,
      };
      
      const provider = createProvider(testConfig);
      const result = await provider.testConnection();
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        response: result.response,
      });
    }
    
    if (action === "save") {
      // Save provider configuration
      const providerConfig = createUserProvider({
        userId: userId || "default-user",
        providerName,
        encryptedApiKey: encryptApiKey(apiKey),
        selectedModel,
        isActive: true,
        metadata: {
          lastTested: new Date().toISOString(),
          testStatus: "pending",
          displayName: `${providerName} - ${selectedModel}`,
        },
      });
      
      // In production, save to database
      // For now, return the config for client-side storage
      return NextResponse.json({
        success: true,
        provider: {
          ...providerConfig,
          // Don't send the encrypted key back for security
          encryptedApiKey: "***",
        },
        message: "Provider configuration created successfully",
      });
    }
    
    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Provider API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
