import { GoogleGenAI } from "@google/genai";

// Default fast model — cheap + fast, same slot as Qwen
const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";

const createGeminiClient = (apiKey) => {
  return new GoogleGenAI({ apiKey });
};

/**
 * Ask Gemini — unified signature, same as askQwen().
 * Accepts string prompt OR OpenAI-style messages array,
 * so you can swap Qwen <-> Gemini without changing app logic.
 *
 * @param {string | Array<{ role: string, content: string }>} messages
 * @param {string} model
 * @param {object} opts - { apiKey, systemPrompt, temperature, maxTokens }
 * @returns {Promise<string>}
 */
export async function askGemini(messages, model = GEMINI_DEFAULT_MODEL, opts = {}) {
  try {
    const apiKey = opts.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing. Set it in .env or provider config.");

    const ai = createGeminiClient(apiKey);

    // Normalize to Gemini contents + systemInstruction
    let contents;
    let systemInstruction;

    if (typeof messages === "string") {
      contents = messages;
      systemInstruction = opts.systemPrompt;
    } else if (Array.isArray(messages)) {
      const systemMsgs = messages.filter((m) => m.role === "system");
      const chatMsgs = messages.filter((m) => m.role !== "system");
      if (systemMsgs.length > 0 || opts.systemPrompt) {
        const sysText = [
          ...systemMsgs.map((m) => m.content),
          ...(opts.systemPrompt ? [opts.systemPrompt] : []),
        ].join("\n\n");
        systemInstruction = sysText;
      }
      // Map user/assistant/model roles to Gemini roles
      contents = chatMsgs.map((m) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      // If single user message, simplify to string (SDK accepts both)
      if (contents.length === 1 && contents[0].role === "user") {
        contents = contents[0].parts[0].text;
      }
    } else {
      throw new Error("messages must be a string or array");
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      ...(systemInstruction ? { config: { systemInstruction } } : {}),
      ...(opts.temperature !== undefined || opts.maxTokens !== undefined
        ? {
            config: {
              ...(systemInstruction ? { systemInstruction } : {}),
              ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
              ...(opts.maxTokens !== undefined ? { maxOutputTokens: opts.maxTokens } : {}),
            },
          }
        : {}),
    });

    return response.text;
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    throw new Error(`Failed to generate text with Gemini: ${error.message}`);
  }
}

export { GEMINI_DEFAULT_MODEL, createGeminiClient };
