"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Email o password non corrette.");
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-grid bg-grid px-4">
      <div className="w-full max-w-sm rounded-lg border border-ink-line bg-ink-panel p-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-paper-muted">
          Bentornato
        </span>
        <h1 className="mt-2 font-display text-2xl font-semibold text-paper">
          Accedi a FitQuest
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-paper-muted">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-ink-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-growth"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-paper-muted">
              Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-ink-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-growth"
            />
          </label>

          {error && (
            <p className="rounded-md border border-caution/40 bg-caution/10 px-3 py-2 text-sm text-caution">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-growth py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-paper-muted">
          Non hai un account?{" "}
          <a href="/register" className="text-growth hover:underline">
            Registrati
          </a>
        </p>
      </div>
    </main>
  );
}
