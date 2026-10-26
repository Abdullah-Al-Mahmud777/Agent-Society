"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Users,
} from "lucide-react";
import { loginSchema, registerSchema } from "@/lib/auth/validation";
import { clearUserCaches } from "@/lib/client-cache";
import { useTheme } from "@/components/theme/ThemeProvider";

const FEATURES = [
  {
    icon: Users,
    title: "A society, not a single bot",
    body: "Bring together agents with distinct expertise and personalities.",
  },
  {
    icon: Brain,
    title: "Long-term memory",
    body: "Agents keep context across conversations and build on past work.",
  },
  {
    icon: MessageSquare,
    title: "One private workspace",
    body: "Your conversations, agents, and provider settings stay yours.",
  },
];

function inputClass() {
  return "w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-input)] px-3.5 py-3 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/20";
}

function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs text-[var(--app-danger)]">{children}</p>;
}

export default function AuthPage({ mode = "login" }) {
  const isRegister = mode === "register";
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const headline = useMemo(
    () =>
      isRegister
        ? "Create your account"
        : "Welcome back",
    [isRegister]
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    setErrors({});
    setFormError("");

    if (isRegister) {
      if (form.password !== form.confirmPassword) {
        setErrors({ confirmPassword: "Passwords do not match" });
        return;
      }

      const parsed = registerSchema.safeParse({
        displayName: form.displayName,
        email: form.email,
        password: form.password,
      });

      if (!parsed.success) {
        const nextErrors = {};
        for (const issue of parsed.error.issues) {
          const field = issue.path[0];
          if (field && !nextErrors[field]) nextErrors[field] = issue.message;
        }
        setErrors(nextErrors);
        return;
      }
    } else {
      const parsed = loginSchema.safeParse({
        email: form.email,
        password: form.password,
      });

      if (!parsed.success) {
        const nextErrors = {};
        for (const issue of parsed.error.issues) {
          const field = issue.path[0];
          if (field && !nextErrors[field]) nextErrors[field] = issue.message;
        }
        setErrors(nextErrors);
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? {
                displayName: form.displayName,
                email: form.email,
                password: form.password,
              }
            : { email: form.email, password: form.password }
        ),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setFormError(data.error || "Something went wrong. Please try again.");
        return;
      }

      clearUserCaches();
      window.location.assign("/society");
    } catch {
      setFormError("Unable to reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-dvh overflow-y-auto bg-[var(--app-bg)] text-[var(--app-text)] transition-colors">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,163,127,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.1),transparent_40%)]" />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between border-r border-[var(--app-border)] px-12 py-10 lg:flex xl:px-16">
          <Link href="/login" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-accent)] text-white shadow-lg shadow-emerald-500/10">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight">Agent Society</span>
              <span className="block text-[11px] uppercase tracking-[0.22em] text-[var(--app-faint)]">
                Multi-agent workspace
              </span>
            </span>
          </Link>

          <div className="max-w-xl py-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs text-[var(--app-muted)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--app-accent)]" />
              Private, session-protected workspace
            </div>
            <h1 className="mt-7 text-5xl font-semibold leading-[1.08] tracking-tight">
              A society of AI agents that{" "}
              <span className="text-[var(--app-accent)]">debate and decide.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--app-muted)]">
              {isRegister
                ? "Create a private workspace where your agents can collaborate, remember context, and keep every result connected to your account."
                : "Sign in to chat with your agents, manage conversations, and keep every result connected to your own account."}
            </p>

            <div className="mt-10 space-y-4">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-3.5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]/60 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-bg)] text-[var(--app-accent)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-0.5 text-sm leading-6 text-[var(--app-muted)]">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-[var(--app-faint)]">
            Agent Society · Secure account and conversation storage
          </p>
        </section>

        <section className="flex min-h-dvh flex-col px-5 py-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between lg:justify-end">
            <Link href="/login" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--app-accent)] text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold">Agent Society</span>
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] text-[var(--app-muted)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--app-surface)] text-[var(--app-accent)]">
                  {isRegister ? <User className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                </div>
                <h2 className="text-3xl font-semibold tracking-tight">{headline}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                  {isRegister
                    ? "Create a private workspace for your agents and conversations."
                    : "Sign in to continue to your Agent Society workspace."}
                </p>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-[var(--app-danger)]/30 bg-[var(--app-danger)]/10 px-4 py-3 text-sm text-[var(--app-danger)]"
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} method="post" className="space-y-4" noValidate>
                {isRegister && (
                  <div>
                    <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium">
                      Name
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-faint)]" />
                      <input
                        id="displayName"
                        name="displayName"
                        autoComplete="name"
                        value={form.displayName}
                        onChange={(event) => updateField("displayName", event.target.value)}
                        className={`${inputClass()} pl-10`}
                        placeholder="Your name"
                        aria-invalid={Boolean(errors.displayName)}
                      />
                    </div>
                    <FieldError>{errors.displayName}</FieldError>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-faint)]" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      className={`${inputClass()} pl-10`}
                      placeholder="you@example.com"
                      aria-invalid={Boolean(errors.email)}
                    />
                  </div>
                  <FieldError>{errors.email}</FieldError>
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-faint)]" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isRegister ? "new-password" : "current-password"}
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      className={`${inputClass()} pl-10 pr-11`}
                      placeholder={isRegister ? "At least 8 characters" : "Your password"}
                      aria-invalid={Boolean(errors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--app-faint)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FieldError>{errors.password}</FieldError>
                  {isRegister && !errors.password && (
                    <p className="mt-1.5 text-xs text-[var(--app-faint)]">
                      Use at least 8 characters with a letter and a number.
                    </p>
                  )}
                </div>

                {isRegister && (
                  <div>
                    <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium">
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={(event) => updateField("confirmPassword", event.target.value)}
                      className={inputClass()}
                      placeholder="Repeat your password"
                      aria-invalid={Boolean(errors.confirmPassword)}
                    />
                    <FieldError>{errors.confirmPassword}</FieldError>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isRegister ? "Creating account..." : "Signing in..."}
                    </>
                  ) : (
                    <>
                      {isRegister ? "Create account" : "Sign in"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[var(--app-muted)]">
                {isRegister ? "Already have an account?" : "New to Agent Society?"}{" "}
                <Link
                  href={isRegister ? "/login" : "/register"}
                  className="font-medium text-[var(--app-accent)] hover:underline"
                >
                  {isRegister ? "Sign in" : "Create an account"}
                </Link>
              </p>

              <p className="mt-6 text-center text-xs leading-5 text-[var(--app-faint)]">
                By continuing, you agree to keep your account credentials private.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
