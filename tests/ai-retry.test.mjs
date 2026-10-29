import test from "node:test";
import assert from "node:assert/strict";
import {
  isRetryableAIError,
  shouldFallbackAIError,
  withRetry,
} from "../src/lib/ai-retry.js";

function transientError() {
  return Object.assign(new Error("503 UNAVAILABLE"), { status: 503 });
}

test("retries transient failures and returns the successful result", async () => {
  let attempts = 0;

  const result = await withRetry(
    async () => {
      attempts += 1;
      if (attempts < 3) throw transientError();
      return "ok";
    },
    { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 2, jitterRatio: 0 }
  );

  assert.equal(result, "ok");
  assert.equal(attempts, 3);
});

test("does not retry authentication errors", async () => {
  let attempts = 0;

  await assert.rejects(
    () =>
      withRetry(
        async () => {
          attempts += 1;
          throw Object.assign(new Error("401 invalid api key"), { status: 401 });
        },
        { maxRetries: 3, baseDelayMs: 1 }
      ),
    /401/
  );

  assert.equal(attempts, 1);
});

test("stops after the maximum retry limit", async () => {
  let attempts = 0;

  await assert.rejects(
    () =>
      withRetry(
        async () => {
          attempts += 1;
          throw transientError();
        },
        { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 2, jitterRatio: 0 }
      ),
    /503/
  );

  assert.equal(attempts, 3);
});

test("stops immediately when the overall deadline has passed", async () => {
  let attempts = 0;

  await assert.rejects(
    () =>
      withRetry(
        async () => {
          attempts += 1;
          return "unexpected";
        },
        { maxRetries: 3, deadlineAt: Date.now() - 1 }
      ),
    /deadline exceeded/
  );

  assert.equal(attempts, 0);
});

test("classifies transient, auth, and model errors correctly", () => {
  assert.equal(isRetryableAIError(transientError()), true);
  assert.equal(isRetryableAIError(Object.assign(new Error("fetch failed"), { code: "ECONNRESET" })), true);
  assert.equal(isRetryableAIError(Object.assign(new Error("401 invalid api key"), { status: 401 })), false);
  assert.equal(isRetryableAIError(Object.assign(new Error("402 credits depleted"), { status: 402 })), false);
  assert.equal(shouldFallbackAIError(Object.assign(new Error("model not found"), { status: 404 })), true);
  assert.equal(shouldFallbackAIError(transientError()), true);
  assert.equal(shouldFallbackAIError(Object.assign(new Error("401 invalid api key"), { status: 401 })), false);
});
