import test from "node:test";
import assert from "node:assert/strict";

import {
  PROVIDER_REGISTRY,
  ProviderConnectionError,
  assertApiKeyFormat,
  getProviderConnector,
  listProviderModels,
  testProviderConnection,
} from "../src/lib/provider-registry.js";
import { validateApiKeyFormat } from "../src/lib/api-key-format.js";
import { PROVIDER_INFO, getDefaultModel } from "../src/lib/provider-catalog.js";

const CONNECTORS = ["gemini", "openai", "anthropic", "openrouter", "qwen"];

test("registry exposes a connector for every supported provider", () => {
  for (const provider of CONNECTORS) {
    const connector = getProviderConnector(provider);
    assert.ok(connector, `${provider} connector is missing`);
    assert.equal(connector.id, provider);
    assert.equal(typeof connector.testConnection, "function");
    assert.equal(typeof connector.listModels, "function");
    assert.ok(connector.defaultModel, `${provider} has no default model`);
    assert.ok(connector.label, `${provider} has no label`);
  }

  assert.equal(getProviderConnector("not-a-provider"), null);
  assert.deepEqual(Object.keys(PROVIDER_REGISTRY).sort(), [...CONNECTORS].sort());
});

test("assertApiKeyFormat rejects empty and malformed keys", () => {
  assert.throws(
    () => assertApiKeyFormat("gemini", ""),
    (error) =>
      error instanceof ProviderConnectionError &&
      error.status === 400 &&
      error.code === "PROVIDER_CONNECTION_FAILED" &&
      /required/i.test(error.message)
  );

  assert.throws(
    () => assertApiKeyFormat("gemini", "not-a-real-key"),
    (error) =>
      error instanceof ProviderConnectionError &&
      /valid Google Gemini API key/.test(error.message) &&
      /expected format/.test(error.message)
  );

  assert.throws(
    () => assertApiKeyFormat("openai", "hello-world"),
    (error) => error instanceof ProviderConnectionError && error.status === 400
  );
});

test("assertApiKeyFormat accepts well-formed keys and trims them", () => {
  const gemini = "AIzaSyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  assert.equal(assertApiKeyFormat("gemini", `  ${gemini}  `), gemini);

  const openai = "sk-proj-abcdefghij1234567890";
  assert.equal(assertApiKeyFormat("openai", openai), openai);

  const anthropic = "sk-ant-abcdefghij1234567890";
  assert.equal(assertApiKeyFormat("anthropic", anthropic), anthropic);

  assert.equal(
    validateApiKeyFormat("gemini", `AQ.${"a".repeat(40)}`),
    true
  );
  assert.equal(validateApiKeyFormat("unknown-provider", "abcdefghijkl"), true);
});

test("provider catalog keeps metadata only — no hardcoded model lists", () => {
  for (const [id, info] of Object.entries(PROVIDER_INFO)) {
    assert.equal("models" in info, false, `${id} still carries a models array`);
    assert.ok(info.name);
    assert.ok(info.keyFormat);
  }

  assert.ok(getDefaultModel("openai"));
  assert.ok(getDefaultModel("anthropic"));
  assert.equal(getDefaultModel("unknown-provider"), "");
});

test("unsupported providers fail with a user-facing connection error", async () => {
  await assert.rejects(
    testProviderConnection("made-up-provider", "key-value-1234"),
    (error) =>
      error instanceof ProviderConnectionError &&
      /Unsupported provider/.test(error.message) &&
      error.userFacing === true &&
      error.status === 400
  );

  await assert.rejects(
    listProviderModels("made-up-provider", "key-value-1234"),
    (error) => error instanceof ProviderConnectionError && error.status === 400
  );
});
