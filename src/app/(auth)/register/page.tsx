"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { buttonStyles } from "@/components/ui/buttonStyles";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Errore nella registrazione");
      }

      const signInResult = await signIn("credentials", { email, password, redirect: false });

      if (signInResult?.error) {
        throw new Error("Registrazione riuscita, ma il login automatico è fallito. Prova ad accedere.");
      }

      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm min-w-0 rounded-xl border border-ink-line bg-ink-panel p-6 sm:p-8">
        <span className="text-sm text-paper-muted">Nuovo profilo</span>
        <h1 className="mt-1 font-display text-2xl font-semibold text-paper">Crea il tuo account</h1>
        <p className="mt-1 text-sm text-paper-muted">Il primo passo prima di costruire il tuo avatar.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Nome">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-paper outline-none focus:border-growth"
              placeholder="Come ti chiami"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-paper outline-none focus:border-growth"
              placeholder="tu@esempio.com"
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-paper outline-none focus:border-growth"
              placeholder="Almeno 8 caratteri"
            />
          </Field>

          {error && (
            <p className="rounded-lg border border-caution/40 bg-caution/10 px-3 py-2 text-sm text-caution">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className={`w-full ${buttonStyles.primary}`}>
            {isSubmitting ? "Creazione in corso…" : "Crea account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-paper-muted">
          Hai già un account?{" "}
          <a href="/login" className="text-growth hover:underline">
            Accedi
          </a>
        </p>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-paper-muted">{label}</span>
      {children}
    </label>
  );
}
