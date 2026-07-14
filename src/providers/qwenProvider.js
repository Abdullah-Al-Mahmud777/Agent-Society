import OpenAI from "openai";

// Initialize OpenAI SDK for Qwen via OpenRouter
const QWEN_BASE_URL = "https://openrouter.ai/api/v1";
const QWEN_DEFAULT_MODEL = "qwen/qwen3.7-plus";

// Create a reusable Qwen client instance
const createQwenClient = (apiKey) => {
  return new OpenAI({
    apiKey,
    baseURL: QWEN_BASE_URL,
  });
};

/**
 * Ask Qwen a question or generate text via OpenRouter
 * @param {string | Array<{ role: string, content: string }>} messages - String prompt or array of chat messages
 * @param {string} model - Optional model name, defaults to qwen/qwen3.7-plus
 * @returns {Promise<string>} - Generated text response
 */
export async function askQwen(messages, model = QWEN_DEFAULT_MODEL) {
  try {
    // Normalize input to messages array
    const normalizedMessages =
      typeof messages === "string"
        ? [{ role: "user", content: messages }]
        : messages;

    // Initialize client with OpenRouter API key from environment
    const qwenClient = createQwenClient(process.env.OPENROUTER_API_KEY || process.env.QWEN_API_KEY);

    // Call the API
    const response = await qwenClient.chat.completions.create({
      model,
      messages: normalizedMessages,
      temperature: 0.7,
      max_tokens: 2048,
    });

    // Return clean text output
    return response.choices[0].message.content;
  } catch (error) {
    console.error("❌ Qwen API Error:", error);
    throw new Error(`Failed to generate text with Qwen: ${error.message}`);
  }
}

// Export everything we need for provider factory
export { QWEN_BASE_URL, QWEN_DEFAULT_MODEL, createQwenClient };
