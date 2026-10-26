export function validateApiKeyFormat(providerName, apiKey) {
  if (!apiKey) return false;

  const key = apiKey.trim();
  if (key.length < 10) return false;

  const formats = {
    openai: /^(sk-proj-|sk-)[a-zA-Z0-9-_]{10,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-_]{10,}$/,
    qwen: /^sk-or-v1-[A-Za-z0-9]+$/,
    openrouter: /^sk-or-v1-[A-Za-z0-9]+$/,
    gemini: /^(AIza[0-9A-Za-z_-]{10,}|AQ\.[A-Za-z0-9._~-]{40,})$/,
  };

  const regex = formats[providerName];
  if (!regex) return key.length >= 10;

  return regex.test(key);
}
