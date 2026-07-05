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
    // Simple obfuscation for demo purposes
    // In production, use proper encryption algorithm
    const combined = `${ENCRYPTION_KEY}:${apiKey}`;
    return Buffer.from(combined).toString("base64");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt API key");
  }
}

/**
 * Decrypt API key
 */
export function decryptApiKey(encryptedKey) {
  if (!encryptedKey) return "";
  
  try {
    const decoded = Buffer.from(encryptedKey, "base64").toString("utf-8");
    const [key, apiKey] = decoded.split(":");
    
    if (key !== ENCRYPTION_KEY) {
      throw new Error("Invalid encryption key");
    }
    
    return apiKey;
  } catch (error) {
    console.error("Decryption error:", error);
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
  
  const formats = {
    openai: /^sk-[a-zA-Z0-9]{20,}$/,
    gemini: /^AIza[a-zA-Z0-9_-]{35}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-]{95,}$/,
  };
  
  const regex = formats[providerName];
  if (!regex) return true; // Unknown provider, allow any format
  
  return regex.test(apiKey);
}
