/**
 * Server-side provider schema and helpers.
 *
 * Keep lightweight catalog constants in provider-catalog.js so client
 * components do not pull validation code into their bundle.
 */

import { DEFAULT_MODELS, PROVIDER_INFO, PROVIDERS } from "./provider-catalog.js";
import {
  addIssue,
  parseWithSchema,
  requiredString,
  validationFailure,
  validationSuccess,
} from "./validation.js";

export { DEFAULT_MODELS, PROVIDER_INFO, PROVIDERS };

const PROVIDER_NAMES = new Set(Object.values(PROVIDERS));
const TEST_STATUSES = new Set(["success", "failed", "pending"]);

export const userProviderSchema = {
  safeParse(input) {
    const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const issues = [];
    const data = {
      id: requiredString(issues, source.id, "id", "Provider id", 120),
      userId: requiredString(issues, source.userId, "userId", "User id", 120),
      providerName: requiredString(
        issues,
        source.providerName,
        "providerName",
        "Provider",
        40
      ),
      encryptedApiKey: requiredString(
        issues,
        source.encryptedApiKey,
        "encryptedApiKey",
        "Encrypted API key"
      ),
      selectedModel: requiredString(
        issues,
        source.selectedModel,
        "selectedModel",
        "Model",
        120
      ),
      createdAt: requiredString(issues, source.createdAt, "createdAt", "Created date"),
      updatedAt: requiredString(issues, source.updatedAt, "updatedAt", "Updated date"),
    };

    if (data.providerName && !PROVIDER_NAMES.has(data.providerName)) {
      addIssue(issues, ["providerName"], "Unsupported provider");
    }

    if (source.isActive === undefined) {
      data.isActive = true;
    } else if (typeof source.isActive !== "boolean") {
      addIssue(issues, ["isActive"], "Active must be true or false");
    } else {
      data.isActive = source.isActive;
    }

    if (source.metadata !== undefined) {
      if (
        !source.metadata ||
        typeof source.metadata !== "object" ||
        Array.isArray(source.metadata)
      ) {
        addIssue(issues, ["metadata"], "Metadata must be an object");
      } else {
        const metadata = {};
        if (source.metadata.lastTested !== undefined) {
          metadata.lastTested = requiredString(
            issues,
            source.metadata.lastTested,
            "metadata",
            "Last tested"
          );
        }
        if (source.metadata.testStatus !== undefined) {
          if (!TEST_STATUSES.has(source.metadata.testStatus)) {
            addIssue(issues, ["metadata"], "Invalid test status");
          } else {
            metadata.testStatus = source.metadata.testStatus;
          }
        }
        if (source.metadata.displayName !== undefined) {
          metadata.displayName = requiredString(
            issues,
            source.metadata.displayName,
            "metadata",
            "Display name",
            160
          );
        }
        data.metadata = metadata;
      }
    }

    return issues.length ? validationFailure(issues) : validationSuccess(data);
  },
  parse(input) {
    return parseWithSchema(this, input);
  },
};

export function createUserProvider(data) {
  return userProviderSchema.parse({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  });
}
