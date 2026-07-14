/**
 * Encryption/Decryption Utility for API Keys
 * 
 * Uses Web Crypto API for browser-side encryption
 * For production: Use server-side encryption with proper key management (AWS KMS, HashiCorp Vault)
 */

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default-encryption-key-change-in-production";

/**
 * Simple encryption using base64 encoding
 * WARNING: This is NOT secure for production. Use proper encryption in production.
 * 
 * For production, implement:
 * - Server-side encryption with crypto.createCipheriv()
 * - Store encryption keys in environment variables or key management service
 * - Use AES-256-GCM algorithm
 */
export function encryptApiKey(apiKey) {
  if (!apiKey) return "";
  
  try {
    console.log("🔒 encryptApiKey called!");
    console.log("  Input apiKey (length):", apiKey.length);
    console.log("  Input apiKey prefix:", apiKey.substring(0, Math.min(10, apiKey.length)));
    const combined = `${ENCRYPTION_KEY}:${apiKey}`;
    console.log("  Combined (prefix):", combined.substring(0, Math.min(30, combined.length)));
    const encrypted = Buffer.from(combined).toString("base64");
    console.log("  Output encrypted (length):", encrypted.length);
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt API key");
  }
}

/**
 * Decrypt API key - supports both old (with prefix) and new (without prefix) formats
 */
export function decryptApiKey(encryptedKey) {
  if (!encryptedKey) return "";
  
  try {
    console.log("🔓 decryptApiKey called!");
    console.log("  Input encryptedKey (length):", encryptedKey.length);
    const decoded = Buffer.from(encryptedKey, "base64").toString("utf-8");
    console.log("  Decoded (length):", decoded.length);
    console.log("  Decoded:", decoded);
    
    if (decoded.includes(":")) {
      console.log("  Decoded includes colon!");
      const [key, apiKey] = decoded.split(":");
      console.log("  Key part:", key);
      console.log("  ApiKey part (length):", apiKey?.length || 0);
      console.log("  ENCRYPTION_KEY:", ENCRYPTION_KEY);
      if (key === ENCRYPTION_KEY && apiKey) {
        console.log("  ✅ Returning apiKey part!");
        return apiKey;
      } else {
        console.log("  ⚠️ Key didn't match or no apiKey part! Returning entire decoded!");
        return decoded;
      }
    }
    
    console.log("  ✅ No colon! Returning decoded!");
    return decoded;
  } catch (error) {
    console.error("❌ Decryption error:", error);
    throw new Error("Failed to decrypt API key");
  }
}

/**
 * Mask API key for display (show only first/last chars)
 */
export function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 8) return "••••••••";
  
  const first = apiKey.substring(0, 4);
  const last = apiKey.substring(apiKey.length - 4);
  return `${first}••••${last}`;
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(providerName, apiKey) {
  if (!apiKey) return false;
  
  if (providerName === "qwen") {
    // For Qwen, just check that it's a non-empty string of reasonable length
    return apiKey.length >= 10;
  }
  
  const formats = {
    openai: /^sk-[a-zA-Z0-9]{20,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-]{95,}$/,
    openrouter: /^sk-or-v1-[a-f0-9]+$/, // OpenRouter key format
  };
  
  const regex = formats[providerName];
  if (!regex) return true; // Unknown provider, allow any format
  
  return regex.test(apiKey);
}
