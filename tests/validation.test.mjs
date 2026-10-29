import test from "node:test";
import assert from "node:assert/strict";

import {
  agentInputSchema,
  agentSchema,
  createAgentDefaults,
  createAgentFromInput,
} from "../src/lib/agent-builder-schema.js";
import { createUserProvider, userProviderSchema } from "../src/lib/db-schema.js";

test("agent input validation trims text and applies defaults", () => {
  const parsed = agentInputSchema.safeParse({
    ...createAgentDefaults(),
    name: "  Maya Chen  ",
    role: "  Product strategist ",
    capabilities: ["  planning  "],
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.name, "Maya Chen");
  assert.equal(parsed.data.role, "Product strategist");
  assert.deepEqual(parsed.data.capabilities, ["planning"]);
  assert.equal(parsed.data.expertise, "General knowledge");
});

test("agent validation rejects malformed values", () => {
  assert.equal(
    agentInputSchema.safeParse({ ...createAgentDefaults(), name: "" }).success,
    false
  );
  assert.equal(
    agentInputSchema.safeParse({ ...createAgentDefaults(), color: "green" }).success,
    false
  );
  assert.equal(
    agentInputSchema.safeParse({ ...createAgentDefaults(), aiProvider: "unknown" })
      .success,
    false
  );
  assert.equal(
    agentInputSchema.safeParse({ ...createAgentDefaults(), maxTokens: 1.5 }).success,
    false
  );
});

test("persisted agents require metadata and receive an id", () => {
  assert.equal(agentSchema.safeParse(createAgentDefaults()).success, false);

  const agent = createAgentFromInput({ name: "Researcher" });
  assert.match(agent.id, /^[a-f0-9-]{36}$|^agent-[a-f0-9]{32}$/);
  assert.equal(agent.name, "Researcher");
  assert.equal(agentSchema.safeParse(agent).success, true);
});

test("provider schema validates supported providers and defaults active state", () => {
  const parsed = userProviderSchema.safeParse({
    id: "06f39056-dffc-41fc-81ac-317a2438904f",
    userId: "user-1",
    providerName: "gemini",
    encryptedApiKey: "encrypted",
    selectedModel: "gemini-2.5-flash",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.isActive, true);

  const provider = createUserProvider({
    userId: "user-1",
    providerName: "openai",
    encryptedApiKey: "encrypted",
    selectedModel: "gpt-4o-mini",
  });
  assert.equal(provider.providerName, "openai");
  assert.equal(provider.isActive, true);

  assert.equal(
    userProviderSchema.safeParse({ ...provider, providerName: "unknown" }).success,
    false
  );
});
