"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Star,
  Trash2,
  Wifi,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/components/ui/cn";
import { validateApiKeyFormat } from "@/lib/api-key-format";
import { PROVIDER_INFO, PROVIDERS, getDefaultModel } from "@/lib/provider-catalog";
import {
  deleteProvider,
  getAllProviders,
  saveProvider,
  setActiveProvider,
  testProviderConnection,
  updateProvider,
} from "@/lib/provider-storage";

const PROVIDER_OPTIONS = Object.entries(PROVIDER_INFO).map(([id, info]) => ({
  id,
  ...info,
}));

let providersRequest = null;

function requestProviders() {
  if (!providersRequest) {
    providersRequest = getAllProviders().finally(() => {
      providersRequest = null;
    });
  }
  return providersRequest;
}

function emptyForm() {
  return {
    providerName: PROVIDERS.OPENAI,
    apiKey: "",
    selectedModel: getDefaultModel(PROVIDERS.OPENAI),
  };
}

function formatDate(value) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function providerStatus(provider) {
  if (provider.metadata?.testStatus === "success") {
    return { label: "Verified", tone: "emerald" };
  }
  if (provider.metadata?.testStatus === "failed") {
    return { label: "Check failed", tone: "rose" };
  }
  return { label: "Saved", tone: "neutral" };
}

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/7 bg-white/[0.025] px-4 py-3.5">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-xl font-semibold tabular-nums text-white">{value}</span>
        {hint ? <span className="truncate text-[11px] text-neutral-600">{hint}</span> : null}
      </div>
    </div>
  );
}

function ProviderIcon({ providerName, className }) {
  const info = PROVIDER_INFO[providerName];
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl",
        className
      )}
      aria-hidden
    >
      {info?.icon || "🤖"}
    </span>
  );
}

function TestResult({ result }) {
  if (!result) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs leading-5",
        result.success
          ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-100"
          : "border-rose-400/20 bg-rose-400/[0.07] text-rose-100"
      )}
      role="status"
    >
      {result.success ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span className="min-w-0 break-words">
        {result.message}
        {result.success && typeof result.latencyMs === "number"
          ? ` · ${result.latencyMs} ms`
          : ""}
      </span>
    </div>
  );
}

export default function ProvidersContent() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formError, setFormError] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const mountedRef = useRef(true);

  const editingProvider = useMemo(
    () => providers.find((provider) => provider.id === editingId) || null,
    [editingId, providers]
  );

  const currentInfo = PROVIDER_INFO[form.providerName] || null;
  const activeProvider = providers.find((provider) => provider.isActive) || null;
  const verifiedCount = providers.filter(
    (provider) => provider.metadata?.testStatus === "success"
  ).length;
  const providerChanged = Boolean(
    editingProvider && editingProvider.providerName !== form.providerName
  );
  const needsNewKey = !editingProvider || providerChanged;
  const canSave = needsNewKey ? Boolean(form.apiKey.trim()) : true;

  const loadProviders = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const stored = await requestProviders();
      if (mountedRef.current) setProviders(stored);
    } catch (error) {
      if (mountedRef.current) setLoadError(error.message || "Providers could not be loaded.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    requestProviders()
      .then((stored) => {
        if (mountedRef.current) setProviders(stored);
      })
      .catch((error) => {
        if (mountedRef.current) {
          setLoadError(error.message || "Providers could not be loaded.");
        }
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const updateForm = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setFormError("");
    setTestResult(null);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowApiKey(false);
    setFormError("");
    setTestResult(null);
    setFormOpen(true);
  };

  const openEdit = (provider) => {
    setEditingId(provider.id);
    setForm({
      providerName: provider.providerName,
      apiKey: "",
      selectedModel: provider.selectedModel,
    });
    setShowApiKey(false);
    setFormError("");
    setTestResult(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving || testing) return;
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setShowApiKey(false);
    setFormError("");
    setTestResult(null);
  };

  const handleProviderChange = (providerName) => {
    setForm((current) => ({
      ...current,
      providerName,
      selectedModel: getDefaultModel(providerName),
      apiKey: providerName === editingProvider?.providerName ? current.apiKey : "",
    }));
    setTestResult(null);
    setFormError("");
  };

  const validateForm = () => {
    if (!form.providerName || !form.selectedModel.trim()) {
      return "Choose a provider and model.";
    }
    if (needsNewKey && !form.apiKey.trim()) {
      return providerChanged
        ? "Enter a new API key for the selected provider."
        : "Enter an API key to add this provider.";
    }
    if (form.apiKey.trim() && !validateApiKeyFormat(form.providerName, form.apiKey)) {
      return "That API key does not match the expected format. Check for missing characters or extra spaces.";
    }
    return "";
  };

  const handleTestConnection = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setTesting(true);
    setFormError("");
    setTestResult(null);

    try {
      const result = await testProviderConnection({
        id: editingId,
        providerName: form.providerName,
        apiKey: form.apiKey.trim() || undefined,
        selectedModel: form.selectedModel.trim(),
      });
      setTestResult({
        success: result.success,
        message: result.success ? "Connection successful." : result.message || "Connection failed.",
        latencyMs: result.latencyMs,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || "Connection failed.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const tested = testResult?.success;
      const metadata = {
        lastTested: tested
          ? new Date().toISOString()
          : editingProvider?.metadata?.lastTested,
        testStatus: tested
          ? "success"
          : testResult
            ? "failed"
            : editingProvider?.metadata?.testStatus || "pending",
        displayName: `${currentInfo?.name || form.providerName} - ${form.selectedModel.trim()}`,
      };

      if (editingId) {
        const updates = {
          providerName: form.providerName,
          selectedModel: form.selectedModel.trim(),
          metadata,
        };
        if (form.apiKey.trim()) updates.apiKey = form.apiKey.trim();

        const saved = await updateProvider(editingId, updates);
        setProviders((current) =>
          current.map((provider) => (provider.id === saved.id ? saved : provider))
        );
        setNotice({ tone: "success", message: `${currentInfo?.name || "Provider"} settings saved.` });
      } else {
        const saved = await saveProvider({
          providerName: form.providerName,
          apiKey: form.apiKey.trim(),
          selectedModel: form.selectedModel.trim(),
          isActive: true,
          metadata,
        });
        setProviders((current) => [
          saved,
          ...current.map((provider) => ({ ...provider, isActive: false })),
        ]);
        setNotice({ tone: "success", message: `${currentInfo?.name || "Provider"} added and activated.` });
      }

      setFormOpen(false);
      setEditingId(null);
      setShowApiKey(false);
      setTestResult(null);
    } catch (error) {
      setFormError(error.message || "The provider could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSaved = async (provider) => {
    setTestingId(provider.id);
    try {
      const result = await testProviderConnection({ id: provider.id });
      if (result.success) {
        setProviders((current) =>
          current.map((item) =>
            item.id === provider.id
              ? {
                  ...item,
                  metadata: {
                    ...item.metadata,
                    testStatus: "success",
                    lastTested: new Date().toISOString(),
                  },
                }
              : item
          )
        );
        setNotice({
          tone: "success",
          message: `${PROVIDER_INFO[provider.providerName]?.name || provider.providerName} is reachable${
            result.latencyMs ? ` in ${result.latencyMs} ms` : ""
          }.`,
        });
      } else {
        setNotice({ tone: "error", message: result.message || "Connection failed." });
      }
    } catch (error) {
      setNotice({ tone: "error", message: error.message || "Connection failed." });
    } finally {
      setTestingId(null);
    }
  };

  const handleActivate = async (provider) => {
    setBusyId(provider.id);
    try {
      const updated = await setActiveProvider(provider.id);
      setProviders((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : { ...item, isActive: false }
        )
      );
      setNotice({
        tone: "success",
        message: `${PROVIDER_INFO[updated.providerName]?.name || updated.providerName} is now active.`,
      });
    } catch (error) {
      setNotice({ tone: "error", message: error.message || "The active provider could not be changed." });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteProvider(deleteTarget.id);
      setProviders((current) => current.filter((provider) => provider.id !== deleteTarget.id));
      setNotice({
        tone: "success",
        message: `${PROVIDER_INFO[deleteTarget.providerName]?.name || deleteTarget.providerName} was removed.`,
      });
      setDeleteTarget(null);
    } catch (error) {
      setNotice({ tone: "error", message: error.message || "The provider could not be deleted." });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_0%,rgba(16,185,129,0.12),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(56,189,248,0.1),transparent_30%),linear-gradient(180deg,#080b12_0%,#09090b_58%,#070709_100%)]" />

      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="overflow-hidden rounded-panel border border-white/8 bg-white/[0.025] p-5 shadow-glass-lg sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="cyan" uppercase>
                  <Server className="h-3 w-3" />
                  Provider settings
                </Badge>
                <Badge tone="emerald" uppercase>
                  <ShieldCheck className="h-3 w-3" />
                  Encrypted keys
                </Badge>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                Connect the models behind your agents.
              </h1>
              <p className="mt-3 text-sm leading-6 text-neutral-400 sm:text-base sm:leading-7">
                API keys are encrypted on the server, never returned to the browser, and only
                used for the account that saved them.
              </p>
            </div>
            <Button variant="primary" onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add provider
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat icon={Server} label="Configured" value={providers.length} hint="providers" />
            <Stat
              icon={Star}
              label="Active model"
              value={activeProvider ? activeProvider.selectedModel : "None"}
              hint={activeProvider ? "routing here" : "add a provider"}
            />
            <Stat icon={CheckCircle2} label="Verified" value={verifiedCount} hint="tested keys" />
          </div>
        </header>

        {notice ? (
          <div
            role="status"
            className={cn(
              "mt-4 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm",
              notice.tone === "error"
                ? "border-rose-400/20 bg-rose-400/[0.07] text-rose-100"
                : "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100"
            )}
          >
            <div className="flex items-center gap-2">
              {notice.tone === "error" ? (
                <AlertCircle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              )}
              <span className="min-w-0 break-words">{notice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="rounded-lg p-1 opacity-60 transition hover:bg-white/10 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {loadError ? (
          <Card variant="default" className="mt-5 p-8 text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-amber-200" />
            <h2 className="mt-3 text-base font-semibold text-white">Providers could not be loaded</h2>
            <p className="mt-2 text-sm text-neutral-500">{loadError}</p>
            <Button variant="secondary" onClick={() => void loadProviders()} className="mt-5">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </Card>
        ) : loading ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[0, 1].map((item) => (
              <Card variant="default" key={item} className="p-5">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/[0.05]" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded bg-white/[0.06]" />
                      <div className="h-3 w-44 rounded bg-white/[0.035]" />
                    </div>
                  </div>
                  <div className="h-9 rounded-xl bg-white/[0.035]" />
                  <div className="h-8 w-48 rounded-lg bg-white/[0.035]" />
                </div>
              </Card>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <Card variant="default" className="mt-5 p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <KeyRound className="h-5 w-5 text-neutral-400" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">No providers configured</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
              Add one API key to start running agents. You can test the connection before or
              after saving.
            </p>
            <Button variant="primary" onClick={openCreate} className="mt-5">
              <Plus className="h-4 w-4" />
              Add your first provider
            </Button>
          </Card>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {providers.map((provider) => {
              const info = PROVIDER_INFO[provider.providerName];
              const status = providerStatus(provider);
              const isBusy = busyId === provider.id;
              const isTesting = testingId === provider.id;

              return (
                <Card
                  key={provider.id}
                  variant="default"
                  className={cn(
                    "p-5 transition-colors",
                    provider.isActive && "border-emerald-400/25"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <ProviderIcon providerName={provider.providerName} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-base font-semibold text-white">
                            {info?.name || provider.providerName}
                          </h2>
                          {provider.isActive ? (
                            <Badge tone="emerald" uppercase>
                              Active
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
                          {info?.description || "Custom provider"}
                        </p>
                      </div>
                    </div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>

                  <div className="mt-4 rounded-xl border border-white/7 bg-white/[0.025] px-3.5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
                          Model
                        </p>
                        <p className="mt-1 truncate font-mono text-xs text-neutral-300">
                          {provider.selectedModel}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
                          Last checked
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          {formatDate(provider.metadata?.lastTested)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-neutral-600">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/70" />
                      Key stored securely
                    </span>
                    <span className="text-neutral-800">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      Added {formatDate(provider.createdAt)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/7 pt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEdit(provider)}
                      disabled={isBusy || isTesting}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleTestSaved(provider)}
                      loading={isTesting}
                      disabled={isBusy}
                    >
                      {isTesting ? null : <Wifi className="h-3.5 w-3.5" />}
                      Test
                    </Button>
                    {!provider.isActive ? (
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => void handleActivate(provider)}
                        loading={isBusy}
                        disabled={isTesting}
                      >
                        {isBusy ? null : <Star className="h-3.5 w-3.5" />}
                        Set active
                      </Button>
                    ) : null}
                    <Button
                      variant="danger"
                      size="sm"
                      className="ml-auto"
                      onClick={() => setDeleteTarget(provider)}
                      disabled={isBusy || isTesting}
                      aria-label={`Delete ${info?.name || provider.providerName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <p className="mt-5 flex items-center gap-2 text-xs leading-5 text-neutral-600">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          Keys are encrypted with AES-256-GCM before storage. The API only returns whether a key
          exists, never the key itself.
        </p>
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingId ? "Edit provider" : "Add provider"}
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="secondary"
              onClick={handleTestConnection}
              loading={testing}
              disabled={saving}
            >
              {testing ? null : <Wifi className="h-4 w-4" />}
              Test connection
            </Button>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeForm} disabled={saving || testing}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={saving}
                disabled={testing || !canSave}
              >
                Save provider
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral" uppercase>
              {editingId ? "Editing saved key" : "New connection"}
            </Badge>
            {editingProvider?.isActive ? (
              <Badge tone="emerald" uppercase>
                Active provider
              </Badge>
            ) : null}
          </div>

          <Field label="Provider">
            <Select
              value={form.providerName}
              onChange={(event) => handleProviderChange(event.target.value)}
              disabled={saving || testing}
            >
              {PROVIDER_OPTIONS.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.icon} {provider.name}
                </option>
              ))}
            </Select>
          </Field>

          {currentInfo ? (
            <div className="flex flex-col gap-3 rounded-xl border border-white/7 bg-white/[0.025] p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {currentInfo.icon} {currentInfo.name}
                </p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Key format: <code className="text-neutral-400">{currentInfo.keyFormat}</code>
                </p>
              </div>
              <a
                href={currentInfo.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-cyan-200 transition hover:text-cyan-100"
              >
                Get a key
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : null}

          <Field
            label="API key"
            hint={editingId && !providerChanged ? "Leave blank to keep the saved key" : undefined}
          >
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={form.apiKey}
                onChange={(event) => updateForm({ apiKey: event.target.value })}
                placeholder={
                  editingId && !providerChanged
                    ? "Saved key is hidden"
                    : `Enter your ${currentInfo?.name || "provider"} API key`
                }
                autoComplete="off"
                spellCheck={false}
                disabled={saving || testing}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-neutral-600 transition hover:text-white"
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
                disabled={saving || testing}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Field label="Model">
            <Input
              list="provider-model-options"
              value={form.selectedModel}
              onChange={(event) => updateForm({ selectedModel: event.target.value })}
              placeholder="Type or choose a model"
              autoComplete="off"
              spellCheck={false}
              disabled={saving || testing}
            />
            <datalist id="provider-model-options">
              {(currentInfo?.models || []).map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
          </Field>

          <TestResult result={testResult} />

          {formError ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-3.5 py-3 text-xs leading-5 text-rose-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">{formError}</span>
            </div>
          ) : null}

          <p className="text-xs leading-5 text-neutral-600">
            Testing sends one short prompt to the selected model. Saving without testing keeps
            the provider marked as pending.
          </p>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!busyId) setDeleteTarget(null);
        }}
        title="Delete provider?"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={Boolean(busyId)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={Boolean(busyId)}
            >
              Delete provider
            </Button>
          </div>
        }
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <ProviderIcon providerName={deleteTarget?.providerName} />
            <div className="min-w-0">
              <p className="text-sm leading-6 text-neutral-300">
                <strong className="text-white">
                  {PROVIDER_INFO[deleteTarget?.providerName]?.name || deleteTarget?.providerName}
                </strong>{" "}
                and its encrypted API key will be removed.
              </p>
              <p className="mt-2 text-xs leading-5 text-neutral-600">
                Agents using this provider will stop generating replies until another provider is
                activated.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
}
