"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { buttonStyles } from "@/components/ui/buttonStyles";

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
    <main className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm min-w-0 rounded-xl border border-ink-line bg-ink-panel p-6 sm:p-8">
        <span className="text-sm text-paper-muted">Bentornato</span>
        <h1 className="mt-1 font-display text-2xl font-semibold text-paper">Accedi a FitQuest</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm text-paper-muted">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-paper outline-none focus:border-growth"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm text-paper-muted">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-paper outline-none focus:border-growth"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-caution/40 bg-caution/10 px-3 py-2 text-sm text-caution">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className={`w-full ${buttonStyles.primary}`}>
            {isSubmitting ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-paper-muted">
          Non hai un account?{" "}
          <a href="/register" className="text-growth hover:underline">
            Registrati
          </a>
        </p>
      </div>
    </main>
  );
}
