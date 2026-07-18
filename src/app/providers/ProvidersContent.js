"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select } from "@/components/ui/Input";
import { 
  Settings, 
  Check, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Eye, 
  EyeOff,
  Trash2,
  TestTube,
} from "lucide-react";
import { PROVIDERS, PROVIDER_INFO, DEFAULT_MODELS } from "@/lib/db-schema";
import { encryptApiKey, maskApiKey, validateApiKeyFormat } from "@/lib/encryption";
import { 
  getAllProviders, 
  saveProvider, 
  deleteProvider, 
  setActiveProvider 
} from "@/lib/provider-storage";

// Scalable provider configuration - easily add new providers here
const AGENT_PROVIDER_CONFIG = [
  {
    id: 'qwen',
    key: PROVIDERS.QWEN,
    name: 'Qwen',
    icon: '🤖',
    keyFormat: 'sk-xxxxxxxxxxxxxxxx',
    docsUrl: 'https://help.aliyun.com/zh/dashscope/developer-reference/activate-dashscope',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
    description: 'Alibaba Cloud AI model'
  },
  {
    id: 'openai',
    key: PROVIDERS.OPENAI,
    name: 'OpenAI',
    icon: '🧠',
    keyFormat: 'sk-xxxxxxxxxxxxxxxx',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    description: 'OpenAI GPT models'
  },
  {
    id: 'gemini',
    key: PROVIDERS.GEMINI,
    name: 'Gemini',
    icon: '✨',
    keyFormat: 'AIzaxxxxxxxxxxxxxxxx',
    docsUrl: 'https://makersuite.google.com/app/apikey',
    models: ['gemini-pro', 'gemini-pro-vision'],
    description: 'Google AI model'
  },
  {
    id: 'claude',
    key: 'claude',
    name: 'Claude',
    icon: '🎭',
    keyFormat: 'sk-ant-xxxxxxxxxxxxxxxx',
    docsUrl: 'https://console.anthropic.com/',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    description: 'Anthropic AI model'
  },
  {
    id: 'mistral',
    key: 'mistral',
    name: 'Mistral',
    icon: '🌊',
    keyFormat: 'xxxxxxxxxxxxxxxx',
    docsUrl: 'https://console.mistral.ai/',
    models: ['mistral-large', 'mistral-medium', 'mistral-small'],
    description: 'Mistral AI model'
  }
];

export default function ProvidersContent() {
  const [providers, setProviders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    providerName: AGENT_PROVIDER_CONFIG[0].key,
    apiKey: "",
    selectedModel: AGENT_PROVIDER_CONFIG[0].models[0],
  });
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = () => {
    try {
      const stored = getAllProviders();
      setProviders(stored);
    } catch (err) {
      console.error("Error loading providers:", err);
    }
  };

  const handleProviderChange = (providerKey) => {
    const selectedConfig = AGENT_PROVIDER_CONFIG.find(p => p.key === providerKey);
    setFormData({
      providerName: providerKey,
      apiKey: "",
      selectedModel: selectedConfig?.models[0] || '',
    });
    setTestResult(null);
    setError(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const selectedConfig = AGENT_PROVIDER_CONFIG.find(p => p.key === formData.providerName);
      
      // Validate API key format
      if (!validateApiKeyFormat(formData.providerName, formData.apiKey)) {
        throw new Error(`Invalid API key format for ${selectedConfig?.name || formData.providerName}`);
      }

      const response = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          ...formData,
          userId: "default-user",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: "✓ Connection successful! API key is valid.",
        });
      } else {
        setTestResult({
          success: false,
          message: `✗ Connection failed: ${data.message}`,
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: `✗ Error: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!testResult?.success) {
      setError("Please test the connection before saving");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const selectedConfig = AGENT_PROVIDER_CONFIG.find(p => p.key === formData.providerName);
      
      const providerData = {
        userId: "default-user",
        providerName: formData.providerName,
        encryptedApiKey: encryptApiKey(formData.apiKey),
        selectedModel: formData.selectedModel,
        isActive: true,
        metadata: {
          lastTested: new Date().toISOString(),
          testStatus: "success",
          displayName: `${selectedConfig?.name || formData.providerName} - ${formData.selectedModel}`,
        },
      };

      const saved = saveProvider(providerData);
      loadProviders();
      
      // Reset form
      setFormData({
        providerName: AGENT_PROVIDER_CONFIG[0].key,
        apiKey: "",
        selectedModel: AGENT_PROVIDER_CONFIG[0].models[0],
      });
      setTestResult(null);
      setShowForm(false);
      setShowApiKey(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this provider configuration?")) {
      try {
        deleteProvider(id);
        loadProviders();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSetActive = (id) => {
    try {
      setActiveProvider(id);
      loadProviders();
    } catch (err) {
      setError(err.message);
    }
  };

  // Fallback in case provider is not in config
  const currentProvider = AGENT_PROVIDER_CONFIG.find(p => p.key === formData.providerName) || {
    icon: "🤖",
    name: "Unknown Provider",
    keyFormat: "N/A",
    docsUrl: "#",
    models: [],
  };

  return (
    <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.15),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_28%),linear-gradient(180deg,_#09090b_0%,_#0a0a0b_100%)]" />

      <div className="mx-auto w-full max-w-4xl space-y-6 overflow-x-hidden px-4 py-8 sm:px-6">
        {/* Header */}
        <Card variant="default" className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 shrink-0 text-primary-400" />
                <h1 className="break-words text-xl font-semibold text-white sm:text-2xl">
                  LLM Provider Configuration
                </h1>
              </div>
              <p className="mt-2 break-words text-sm text-neutral-400">
                Configure your own LLM API keys. All keys are encrypted and stored securely.
              </p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowForm(!showForm)}
              className="w-full shrink-0 sm:w-auto"
            >
              {showForm ? "Cancel" : "+ Add Provider"}
            </Button>
          </div>
        </Card>

        {/* Configuration Form */}
        {showForm && (
          <Card variant="default" className="p-5 sm:p-6">
            <CardHeader>
              <CardTitle>Add New Provider</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="mt-6 w-full space-y-5">
              {/* Provider Selection */}
              <Field label="Select Provider">
                <Select
                  value={formData.providerName}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full"
                >
                  {AGENT_PROVIDER_CONFIG.map((provider) => (
                    <option key={provider.id} value={provider.key}>
                      {provider.icon} {provider.name}
                    </option>
                  ))}
                </Select>
              </Field>

              {/* Provider Info */}
              <div className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-white">
                      {currentProvider.icon} {currentProvider.name}
                    </p>
                    <p className="mt-1 break-words text-xs text-neutral-400">
                      Key format: <code className="rounded bg-neutral-900 px-1">{currentProvider.keyFormat}</code>
                    </p>
                  </div>
                  <a
                    href={currentProvider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
                  >
                    Get API Key <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* API Key Input */}
              <Field label="API Key">
                <div className="flex w-full gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      placeholder={`Enter your ${currentProvider.name} API key`}
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </Field>

              {/* Model Selection */}
              <Field label="Model">
                <Select
                  value={formData.selectedModel}
                  onChange={(e) => setFormData({ ...formData, selectedModel: e.target.value })}
                  className="w-full"
                >
                  {currentProvider.models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </Select>
              </Field>

              {/* Test Result */}
              {testResult && (
                <div
                  className={`flex w-full items-start gap-2 rounded-lg border p-4 text-sm ${
                    testResult.success
                      ? "border-success-500/30 bg-success-500/10 text-success-200"
                      : "border-error-500/30 bg-error-500/10 text-error-200"
                  }`}
                >
                  {testResult.success ? (
                    <Check className="h-5 w-5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0" />
                  )}
                  <span className="break-words">{testResult.message}</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex w-full items-start gap-2 rounded-lg border border-error-500/30 bg-error-500/10 p-4 text-sm text-error-200">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span className="break-words">{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex w-full flex-col gap-3 border-t border-neutral-700 pt-5 sm:flex-row">
                <Button
                  variant="secondary"
                  onClick={handleTestConnection}
                  disabled={!formData.apiKey || testing}
                  className="w-full flex-1"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={!testResult?.success || saving}
                  className="w-full flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save Provider
                    </>
                  )}
                </Button>
              </div>
            </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Providers */}
        <Card variant="default" className="p-5 sm:p-6">
          <CardHeader>
            <CardTitle>Your Providers</CardTitle>
          </CardHeader>
          <CardContent>
          {providers.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-neutral-700 p-8 text-center">
              <p className="text-sm text-neutral-500">
                No providers configured yet. Add one to get started.
              </p>
            </div>
          ) : (
            <div className="mt-6 w-full space-y-3">
              {providers.map((provider) => {
                const providerConfig = AGENT_PROVIDER_CONFIG.find(p => p.key === provider.providerName);
                return (
                  <div
                    key={provider.id}
                    className="flex w-full flex-col gap-3 rounded-lg border border-neutral-700 bg-neutral-800/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg">
                          {providerConfig?.icon || '🤖'}
                        </span>
                        <span className="break-words font-medium text-white">
                          {providerConfig?.name || provider.providerName}
                        </span>
                        {provider.isActive && (
                          <Badge variant="success" size="sm">Active</Badge>
                        )}
                      </div>
                      <p className="mt-1 break-words text-xs text-neutral-400">
                        Model: {provider.selectedModel}
                      </p>
                      <p className="mt-1 break-words text-xs text-neutral-600">
                        Added: {new Date(provider.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {!provider.isActive && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSetActive(provider.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="error"
                        size="sm"
                        onClick={() => handleDelete(provider.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
