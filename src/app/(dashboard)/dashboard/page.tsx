"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AvatarPreview } from "@/features/avatar/ui/AvatarPreview";
import type { AvatarState } from "@/features/avatar";

interface Goal {
  id: string;
  title: string;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [avatar, setAvatar] = useState<AvatarState | null | undefined>(undefined);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planMessage, setPlanMessage] = useState<string | null>(null);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [appleToken, setAppleToken] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/avatar")
      .then((r) => r.json())
      .then((data) => {
        if (!data.avatar) {
          router.push("/onboarding");
          return;
        }
        setAvatar(data.avatar);
      });

    fetch("/api/goals")
      .then((r) => r.json())
      .then((data) => setGoals(data.goals ?? []));
  }, [status, router]);

  async function handleSyncGoogleHealth() {
    setIsSyncingGoogle(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/integrations/google-health/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync fallito");
      setSyncMessage(
        data.avatarRecalibrated
          ? `${data.stored} dati sincronizzati — avatar aggiornato.`
          : `${data.stored} dati sincronizzati.`
      );
      // Ricarica l'avatar per riflettere un'eventuale ricalibrazione
      const avatarRes = await fetch("/api/avatar");
      const avatarData = await avatarRes.json();
      if (avatarData.avatar) setAvatar(avatarData.avatar);
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : "Devi prima collegare Google Health.");
    } finally {
      setIsSyncingGoogle(false);
    }
  }

  async function handleGenerateAppleToken() {
    const res = await fetch("/api/integrations/apple-health/token", { method: "POST" });
    const data = await res.json();
    setAppleToken(data.token);
  }

  async function handleGeneratePlan() {
    setIsGeneratingPlan(true);
    setPlanMessage(null);
    try {
      const res = await fetch("/api/workouts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "BEGINNER",
          environment: "BOTH",
          daysPerWeek: 3,
          goalFocus: "CONSISTENCY",
          durationWeeks: 8,
        }),
      });
      if (!res.ok) throw new Error("Generazione fallita");
      setPlanMessage("Piano generato — 3 sessioni/settimana per 8 settimane.");
    } catch {
      setPlanMessage("Qualcosa è andato storto. Riprova.");
    } finally {
      setIsGeneratingPlan(false);
    }
  }

  if (status === "loading" || avatar === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink">
        <p className="font-mono text-sm text-paper-muted">Caricamento…</p>
      </main>
    );
  }

  if (!avatar) return null; // redirect verso /onboarding già in corso

  return (
    <main className="min-h-screen bg-grid bg-grid px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-paper-muted">
              FitQuest
            </span>
            <h1 className="font-display text-2xl font-semibold text-paper">
              Ciao, {session?.user?.name ?? "atleta"}
            </h1>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="font-mono text-xs text-paper-muted hover:text-paper"
          >
            Esci
          </button>
        </header>

        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-start">
          <AvatarPreview state={avatar} athleteName={session?.user?.name ?? "Il tuo atleta"} />

          <div className="space-y-6">
            {/* Obiettivi attivi */}
            <section className="rounded-lg border border-ink-line bg-ink-panel p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-paper">Obiettivi attivi</h2>
                <a href="/goals" className="font-mono text-xs text-growth hover:underline">
                  Vedi tutti →
                </a>
              </div>

              {goals.length === 0 ? (
                <p className="text-sm text-paper-muted">
                  Non hai ancora obiettivi. Impostane uno per iniziare a far evolvere il tuo avatar.
                </p>
              ) : (
                <ul className="space-y-3">
                  {goals
                    .filter((g) => g.status === "ACTIVE")
                    .map((goal) => {
                      const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                      return (
                        <li key={goal.id}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="text-paper">{goal.title}</span>
                            <span className="font-mono text-xs text-paper-muted">
                              {goal.currentValue}/{goal.targetValue} {goal.unit}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-ink">
                            <div
                              className="h-full bg-growth transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </section>

            {/* Connessioni wearable */}
            <section className="rounded-lg border border-ink-line bg-ink-panel p-6">
              <h2 className="font-display text-lg font-semibold text-paper">Connessioni</h2>
              <p className="mt-1 text-sm text-paper-muted">
                Sincronizza i dati dai tuoi dispositivi per calibrare l&apos;avatar con la realtà.
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-md border border-ink-line p-3">
                  <div>
                    <p className="text-sm text-paper">Google Health</p>
                    <p className="text-xs text-paper-muted">Fitbit, Pixel Watch</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="/api/integrations/google-health/connect"
                      className="rounded-md border border-ink-line px-3 py-1.5 text-xs text-paper-muted hover:text-paper"
                    >
                      Collega
                    </a>
                    <button
                      onClick={handleSyncGoogleHealth}
                      disabled={isSyncingGoogle}
                      className="rounded-md bg-growth px-3 py-1.5 text-xs font-semibold text-ink hover:opacity-90 disabled:opacity-50"
                    >
                      {isSyncingGoogle ? "…" : "Sincronizza"}
                    </button>
                  </div>
                </div>

                <div className="rounded-md border border-ink-line p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-paper">Apple Health</p>
                      <p className="text-xs text-paper-muted">Via Shortcuts (nessuna API cloud diretta)</p>
                    </div>
                    <button
                      onClick={handleGenerateAppleToken}
                      className="rounded-md border border-ink-line px-3 py-1.5 text-xs text-paper-muted hover:text-paper"
                    >
                      Genera token
                    </button>
                  </div>
                  {appleToken && (
                    <p className="mt-2 break-all rounded bg-ink px-2 py-1.5 font-mono text-[10px] text-growth">
                      {appleToken}
                    </p>
                  )}
                </div>

                {syncMessage && <p className="font-mono text-xs text-growth">{syncMessage}</p>}
              </div>
            </section>

            {/* Piano di allenamento */}
            <section className="rounded-lg border border-ink-line bg-ink-panel p-6">
              <h2 className="font-display text-lg font-semibold text-paper">Piano di allenamento</h2>
              <p className="mt-1 text-sm text-paper-muted">
                Genera un piano personalizzato in base al tuo livello e ai tuoi obiettivi.
              </p>
              <button
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan}
                className="mt-4 rounded-md bg-effort px-4 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isGeneratingPlan ? "Generazione…" : "Genera piano"}
              </button>
              {planMessage && <p className="mt-3 font-mono text-xs text-growth">{planMessage}</p>}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
