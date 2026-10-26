/**
 * Provider storage client.
 *
 * Provider configurations are stored in Turso through the authenticated
 * /api/providers endpoints. Browser storage is not read and cannot leak one
 * account's providers or encrypted keys into another account.
 */

import { clearUserCaches } from "@/lib/client-cache";

function assertBrowser() {
  if (typeof window === "undefined") {
    throw new Error("Provider storage is only available in the browser");
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401) {
    clearUserCaches();
    window.location.assign("/login");
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || data?.message || "Provider request failed");
  }

  return data;
}

export async function getAllProviders() {
  assertBrowser();
  const data = await requestJson("/api/providers");
  return data.providers || [];
}

export async function getProviderById(id) {
  assertBrowser();
  const providers = await getAllProviders();
  return providers.find((provider) => provider.id === id) || null;
}

export async function getActiveProvider() {
  assertBrowser();
  const data = await requestJson("/api/providers?active=1");
  return data.provider || null;
}

export async function saveProvider(providerData) {
  assertBrowser();

  const payload = {
    action: "save",
    providerName: providerData.providerName,
    selectedModel: providerData.selectedModel,
    isActive: providerData.isActive !== false,
    metadata: providerData.metadata,
  };

  if (providerData.apiKey) {
    payload.apiKey = providerData.apiKey;
  } else if (providerData.encryptedApiKey) {
    payload.encryptedApiKey = providerData.encryptedApiKey;
  }

  const data = await requestJson("/api/providers", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data.provider;
}

export async function updateProvider(id, updates) {
  assertBrowser();
  const { apiKey, ...safeUpdates } = updates || {};
  const data = await requestJson("/api/providers", {
    method: "POST",
    body: JSON.stringify({
      action: "update",
      id,
      updates: safeUpdates,
      apiKey,
    }),
  });
  return data.provider;
}

export async function testProviderConnection({
  id,
  providerName,
  apiKey,
  selectedModel,
} = {}) {
  assertBrowser();
  return requestJson("/api/providers", {
    method: "POST",
    body: JSON.stringify({
      action: "test",
      id,
      providerName,
      apiKey,
      selectedModel,
    }),
  });
}

export async function deleteProvider(id) {
  assertBrowser();
  await requestJson("/api/providers", {
    method: "POST",
    body: JSON.stringify({ action: "delete", id }),
  });
  return true;
}

export async function setActiveProvider(id) {
  assertBrowser();
  const data = await requestJson("/api/providers", {
    method: "POST",
    body: JSON.stringify({ action: "activate", id }),
  });
  return data.provider;
}

export async function clearAllProviders() {
  assertBrowser();
  await requestJson("/api/providers?all=true", { method: "DELETE" });
}
