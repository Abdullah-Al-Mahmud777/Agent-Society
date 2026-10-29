const USER_CACHE_KEYS = [
  "agent-society-builder",
  "agent-society-agent-memory",
  "user_providers",
];

export function clearUserCaches() {
  if (typeof window === "undefined") return;

  for (const key of USER_CACHE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage can be unavailable in private browsing modes.
    }
  }

  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith("agent-society-")) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage failures.
  }
}
