import { GoogleGenAI } from "@google/genai";
import {
  AI_RETRY_CONFIG,
  getAIErrorCode,
  getAIErrorStatus,
  shouldFallbackAIError,
  withRetry,
} from "../lib/ai-retry.js";

const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_GEMINI_FALLBACKS = ["gemini-3.5-flash-lite", "gemini-3.6-flash"];

const createGeminiClient = (apiKey) => {
  if (!apiKey) throw new Error("Gemini API key is missing");
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: AI_RETRY_CONFIG.requestTimeoutMs,
      retryOptions: { attempts: 1 },
    },
  });
};

export function normalizeGeminiModel(model) {
  const normalized = String(model || "")
    .trim()
    .replace(/^models\//, "");
  return normalized || process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
}

export function getGeminiModelCandidates(model) {
  const primary = normalizeGeminiModel(model);
  const envFallbacks = String(process.env.GEMINI_FALLBACK_MODELS || "")
    .split(",")
    .map((value) => value.trim().replace(/^models\//, ""))
    .filter(Boolean);
  const fallbacks = envFallbacks.length > 0 ? envFallbacks : DEFAULT_GEMINI_FALLBACKS;

  return [...new Set([primary, ...fallbacks])];
}

function errorSummary(error) {
  const status = getAIErrorStatus(error);
  const codeParts = getAIErrorCode(error).split(/\s+/).filter(Boolean);
  const label = [
    ...new Set([...(status ? [String(status)] : []), ...codeParts]),
  ]
    .join(" ")
    .trim();
  if (label) return label;
  return String(error?.message || "unknown error").slice(0, 160);
}

export function formatGeminiError(error, { model, attemptedModels = [] } = {}) {
  const status = getAIErrorStatus(error);
  const rawMessage = String(error?.message || "");
  const tried =
    attemptedModels.length > 1
      ? ` Tried models: ${attemptedModels.join(", ")}.`
      : "";

  let friendlyMessage;

  if (status === 401 || /invalid api key|api key not valid|unauthorized/i.test(rawMessage)) {
    friendlyMessage = "Gemini rejected the API key. Update it on the Providers page.";
  } else if (
    status === 402 ||
    /credits? (?:are|is) (?:exhausted|depleted)|insufficient (?:credits|balance)/i.test(rawMessage)
  ) {
    friendlyMessage = "Gemini API credits are exhausted. Add credits or switch to another provider.";
  } else if (status === 403 || /permission denied/i.test(rawMessage)) {
    friendlyMessage =
      "Gemini access was denied. Check the API key permissions and billing status for its project.";
  } else if (
    status === 404 ||
    /model.*(?:not found|not available|not supported)|no such model/i.test(rawMessage)
  ) {
    friendlyMessage = `The selected Gemini model "${model}" is not available. Choose another model on the Providers page.`;
  } else if (status === 429 || /RESOURCE_EXHAUSTED/i.test(rawMessage)) {
    friendlyMessage = "Gemini rate limit reached. Please wait a moment and try again.";
  } else if (status === 503 || /UNAVAILABLE|temporarily unavailable|overloaded/i.test(rawMessage)) {
    friendlyMessage = `Gemini is temporarily unavailable.${tried} Please try again in a few minutes.`;
  } else if (status === 504 || /DEADLINE_EXCEEDED|deadline exceeded/i.test(`${rawMessage} ${getAIErrorCode(error)}`)) {
    friendlyMessage = `Gemini took too long to respond.${tried} Please try again.`;
  } else if (
    status === 408 ||
    /fetch failed|network error|ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT|timed? ?out/i.test(
      `${rawMessage} ${getAIErrorCode(error)}`
    )
  ) {
    friendlyMessage = "Could not reach Gemini. Check your internet connection and try again.";
  } else if (status === 400 || /invalid argument/i.test(rawMessage)) {
    friendlyMessage =
      "Gemini rejected the request configuration. Check the selected model and provider settings.";
  } else {
    friendlyMessage = `Gemini request failed${status ? ` (${status})` : ""}. Please try again.`;
  }

  const friendlyError = new Error(friendlyMessage, { cause: error || undefined });
  friendlyError.name = "GeminiServiceError";
  friendlyError.userFacing = true;
  friendlyError.attemptedModels = attemptedModels;
  if (status) friendlyError.status = status;

  return friendlyError;
}

export async function generateGeminiContent({ ai, contents, config = {}, model } = {}) {
  if (!ai) throw new Error("Gemini client is not configured");

  const primaryModel = normalizeGeminiModel(model);
  const candidates = getGeminiModelCandidates(primaryModel);
  const attemptedModels = [];
  const deadlineAt = Date.now() + AI_RETRY_CONFIG.totalTimeoutMs;
  let lastError = null;

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    attemptedModels.push(candidate);

    try {
      const response = await withRetry(
        ({ signal }) =>
          ai.models.generateContent({
            model: candidate,
            contents,
            config: signal ? { ...config, abortSignal: signal } : config,
          }),
        {
          deadlineAt,
          onRetry: ({ attempt, maxAttempts, delayMs, error }) => {
            console.warn(
              `[gemini] ${candidate} attempt ${attempt}/${maxAttempts} failed (${errorSummary(error)}); retrying in ${delayMs}ms`
            );
          },
        }
      );

      if (index > 0) {
        console.warn(
          `[gemini] using fallback model ${candidate} after ${primaryModel} was unavailable`
        );
      }

      return response?.text || "";
    } catch (error) {
      lastError = error;
      const hasNextModel = index < candidates.length - 1;
      if (
        !hasNextModel ||
        Date.now() >= deadlineAt ||
        !shouldFallbackAIError(error)
      ) {
        break;
      }

      console.warn(
        `[gemini] ${candidate} unavailable (${errorSummary(error)}); trying fallback ${candidates[index + 1]}`
      );
    }
  }

  throw formatGeminiError(lastError, {
    model: primaryModel,
    attemptedModels,
  });
}

export async function askGemini(messages, model = GEMINI_DEFAULT_MODEL, opts = {}) {
  const apiKey = opts.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing. Set it in .env or provider config.");

  const ai = createGeminiClient(apiKey);

  let contents;
  let systemInstruction;

  if (typeof messages === "string") {
    contents = messages;
    systemInstruction = opts.systemPrompt;
  } else if (Array.isArray(messages)) {
    const systemMessages = messages.filter((message) => message.role === "system");
    const chatMessages = messages.filter((message) => message.role !== "system");

    if (systemMessages.length > 0 || opts.systemPrompt) {
      systemInstruction = [
        ...systemMessages.map((message) => message.content),
        ...(opts.systemPrompt ? [opts.systemPrompt] : []),
      ].join("\n\n");
    }

    contents = chatMessages.map((message) => ({
      role: message.role === "assistant" || message.role === "model" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

    if (contents.length === 1 && contents[0].role === "user") {
      contents = contents[0].parts[0].text;
    }
  } else {
    throw new Error("messages must be a string or array");
  }

  const config = {};
  if (systemInstruction) config.systemInstruction = systemInstruction;
  if (opts.temperature !== undefined) config.temperature = opts.temperature;
  if (opts.maxTokens !== undefined) config.maxOutputTokens = opts.maxTokens;

  return generateGeminiContent({ ai, contents, config, model });
}

export { GEMINI_DEFAULT_MODEL, createGeminiClient };
