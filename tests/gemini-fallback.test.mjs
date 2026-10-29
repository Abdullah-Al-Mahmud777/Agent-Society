import test from "node:test";
import assert from "node:assert/strict";

process.env.AI_MAX_RETRIES = "0";
process.env.GEMINI_FALLBACK_MODELS = "fallback-model";

const { generateGeminiContent } = await import("../src/providers/geminiProvider.js");

test("falls back to the next model when the primary is unavailable", async () => {
  const calls = [];
  const ai = {
    models: {
      async generateContent({ model }) {
        calls.push(model);
        if (model === "primary-model") {
          throw Object.assign(new Error("503 UNAVAILABLE"), { status: 503 });
        }
        return { text: `response from ${model}` };
      },
    },
  };

  const text = await generateGeminiContent({
    ai,
    contents: "hello",
    model: "primary-model",
  });

  assert.equal(text, "response from fallback-model");
  assert.deepEqual(calls, ["primary-model", "fallback-model"]);
});

test("returns a friendly error without falling back for auth failures", async () => {
  const calls = [];
  const ai = {
    models: {
      async generateContent({ model }) {
        calls.push(model);
        throw Object.assign(new Error("401 invalid api key"), { status: 401 });
      },
    },
  };

  await assert.rejects(
    () => generateGeminiContent({ ai, contents: "hello", model: "primary-model" }),
    (error) => {
      assert.equal(error.userFacing, true);
      assert.match(error.message, /Gemini rejected the API key/);
      return true;
    }
  );

  assert.deepEqual(calls, ["primary-model"]);
});
