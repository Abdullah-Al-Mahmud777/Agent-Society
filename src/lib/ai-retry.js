const RETRYABLE_HTTP_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const RETRYABLE_ERROR_CODES = new Set([
  "408",
  "425",
  "429",
  "500",
  "502",
  "503",
  "504",
  "UNAVAILABLE",
  "RESOURCE_EXHAUSTED",
  "DEADLINE_EXCEEDED",
  "INTERNAL",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EAI_AGAIN",
  "ENOTFOUND",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
]);

const NON_RETRYABLE_PATTERNS = [
  /invalid api key/i,
  /api key not valid/i,
  /incorrect api key/i,
  /permission denied/i,
  /unauthorized/i,
  /payment required/i,
  /credits? (?:are|is) (?:exhausted|depleted)/i,
  /insufficient (?:credits|balance|quota)/i,
  /invalid argument/i,
  /unsupported/i,
];

const TRANSIENT_MESSAGE_PATTERNS = [
  /UNAVAILABLE/i,
  /RESOURCE_EXHAUSTED/i,
  /DEADLINE_EXCEEDED/i,
  /temporarily unavailable/i,
  /service unavailable/i,
  /overloaded/i,
  /fetch failed/i,
  /network error/i,
  /socket hang up/i,
  /connection reset/i,
  /timed? ?out/i,
];

function envInt(name, fallback, min, max) {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export const AI_RETRY_CONFIG = Object.freeze({
  maxRetries: envInt("AI_MAX_RETRIES", 3, 0, 8),
  baseDelayMs: envInt("AI_RETRY_BASE_DELAY_MS", 1000, 100, 30000),
  maxDelayMs: envInt("AI_RETRY_MAX_DELAY_MS", 12000, 500, 120000),
  requestTimeoutMs: envInt("AI_REQUEST_TIMEOUT_MS", 45000, 5000, 120000),
  totalTimeoutMs: envInt("AI_TOTAL_TIMEOUT_MS", 60000, 5000, 300000),
  jitterRatio: 0.2,
});

function coerceStatus(value) {
  const status = typeof value === "number" ? value : Number.parseInt(String(value || ""), 10);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : null;
}

export function getAIErrorStatus(error) {
  if (!error) return null;

  const candidates = [
    error.status,
    error.statusCode,
    error.response?.status,
    error.cause?.status,
    error.cause?.statusCode,
  ];

  for (const candidate of candidates) {
    const status = coerceStatus(candidate);
    if (status) return status;
  }

  const match = String(error.message || "").match(/\b([45]\d{2})\b/);
  return match ? Number(match[1]) : null;
}

export function getAIErrorCode(error) {
  if (!error) return "";

  const values = [
    error.code,
    error.cause?.code,
    error.error?.code,
    error.status,
    error.statusCode,
  ];

  return values
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value).toUpperCase())
    .join(" ");
}

export function isRetryableAIError(error) {
  if (!error || error.name === "AbortError") return false;

  const message = String(error.message || error.toString() || "");
  if (NON_RETRYABLE_PATTERNS.some((pattern) => pattern.test(message))) return false;

  const status = getAIErrorStatus(error);
  if (status) return RETRYABLE_HTTP_STATUS.has(status);

  const code = getAIErrorCode(error);
  if (code && code.split(" ").some((part) => RETRYABLE_ERROR_CODES.has(part))) return true;

  return TRANSIENT_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

export function shouldFallbackAIError(error) {
  const status = getAIErrorStatus(error);
  if (status === 404) return true;

  const message = String(error?.message || "");
  if (/model.*(?:not found|not available|not supported)|no such model/i.test(message)) {
    return true;
  }

  return isRetryableAIError(error);
}

export function calculateRetryDelayMs(attempt, options = {}) {
  const baseDelayMs = options.baseDelayMs ?? AI_RETRY_CONFIG.baseDelayMs;
  const maxDelayMs = options.maxDelayMs ?? AI_RETRY_CONFIG.maxDelayMs;
  const jitterRatio = options.jitterRatio ?? AI_RETRY_CONFIG.jitterRatio;

  const exponential = baseDelayMs * 2 ** attempt;
  const jitter = exponential * jitterRatio * Math.random();
  return Math.round(Math.min(maxDelayMs, exponential + jitter));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deadlineError(cause) {
  const error = new Error("AI request deadline exceeded", {
    cause: cause || undefined,
  });
  error.name = "AIRequestTimeoutError";
  error.status = 504;
  error.code = "DEADLINE_EXCEEDED";
  return error;
}

export async function withRetry(operation, options = {}) {
  const maxRetries = options.maxRetries ?? AI_RETRY_CONFIG.maxRetries;
  const retryIf = options.retryIf ?? isRetryableAIError;
  const onRetry = options.onRetry;
  const deadlineAt = options.deadlineAt;

  for (let attempt = 0; ; attempt += 1) {
    if (deadlineAt && Date.now() >= deadlineAt) throw deadlineError();

    const controller = deadlineAt ? new AbortController() : null;
    const timer = deadlineAt
      ? setTimeout(
          () => controller.abort(deadlineError()),
          Math.max(1, deadlineAt - Date.now())
        )
      : null;

    try {
      return await operation({
        attempt,
        signal: controller?.signal,
      });
    } catch (error) {
      if (deadlineAt && Date.now() >= deadlineAt) throw deadlineError(error);

      const canRetry = attempt < maxRetries && retryIf(error);
      if (!canRetry) throw error;

      const remainingMs = deadlineAt ? deadlineAt - Date.now() : Infinity;
      const delayMs = Math.min(
        calculateRetryDelayMs(attempt, options),
        Math.max(1, remainingMs)
      );

      onRetry?.({
        attempt: attempt + 1,
        maxAttempts: maxRetries + 1,
        delayMs,
        error,
      });
      await sleep(delayMs);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
