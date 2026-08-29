"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import type { AvatarState } from "@/features/avatar";
import { Card } from "@/components/ui/Card";
import { TopNav } from "@/components/ui/TopNav";
import { buttonStyles } from "@/components/ui/buttonStyles";

const Avatar3D = dynamic(() => import("@/features/avatar/ui/Avatar3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 w-full items-center justify-center rounded-xl border border-ink-line/70 bg-ink-panel">
      <p className="text-sm text-paper-muted">Caricamento avatar…</p>
    </div>
  ),
});

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
      const parts = [];
      if (data.stored > 0) parts.push(`${data.stored} dati`);
      if (data.importedWorkouts > 0) parts.push(`${data.importedWorkouts} allenamenti`);
      const summary = parts.length > 0 ? parts.join(" e ") + " sincronizzati" : "Sincronizzato";
      setSyncMessage(data.avatarRecalibrated ? `${summary} — avatar aggiornato.` : `${summary}.`);
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

  if (status === "loading" || avatar === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink">
        <p className="text-sm text-paper-muted">Caricamento…</p>
      </main>
    );
  }

  if (!avatar) return null; // redirect verso /onboarding già in corso

  const activeGoals = goals.filter((g) => g.status === "ACTIVE");

  return (
    <main className="min-h-screen bg-ink px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl min-w-0">
        <TopNav userName={session?.user?.name} />

        <div className="grid min-w-0 gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
          {/* Avatar — hero della pagina */}
          <div className="min-w-0">
            <Avatar3D state={avatar} athleteName={session?.user?.name ?? "Il tuo atleta"} />
          </div>

          <div className="min-w-0 space-y-6">
            {/* Obiettivi attivi */}
            <Card
              title="Obiettivi attivi"
              action={
                <a href="/goals" className={buttonStyles.ghost}>
                  Vedi tutti →
                </a>
              }
            >
              {activeGoals.length === 0 ? (
                <p className="text-sm text-paper-muted">
                  Non hai ancora obiettivi. Impostane uno per iniziare a far evolvere il tuo avatar.
                </p>
              ) : (
                <ul className="space-y-4">
                  {activeGoals.map((goal) => {
                    const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                    return (
                      <li key={goal.id}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
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
            </Card>

            {/* Piano di allenamento */}
            <Card
              title="Piano di allenamento"
              action={
                <a href="/workouts" className={buttonStyles.ghost}>
                  Apri →
                </a>
              }
            >
              <p className="text-sm text-paper-muted">
                Genera o consulta il tuo piano personalizzato, e segna le sessioni completate.
              </p>
            </Card>

            {/* Connessioni wearable */}
            <Card title="Connessioni">
              <p className="mb-4 text-sm text-paper-muted">
                Sincronizza i dati dai tuoi dispositivi per calibrare l&apos;avatar con la realtà.
              </p>

              <div className="space-y-3">
                <div className="flex flex-col gap-3 rounded-lg border border-ink-line/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-paper">Google Health</p>
                    <p className="text-sm text-paper-muted">Fitbit, Pixel Watch</p>
                  </div>
                  <div className="flex gap-2">
                    <a href="/api/integrations/google-health/connect" className={buttonStyles.secondary}>
                      Collega
                    </a>
                    <button
                      onClick={handleSyncGoogleHealth}
                      disabled={isSyncingGoogle}
                      className={buttonStyles.primary}
                    >
                      {isSyncingGoogle ? "…" : "Sincronizza"}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-ink-line/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-paper">Apple Health</p>
                      <p className="text-sm text-paper-muted">Via Shortcuts (nessuna API cloud diretta)</p>
                    </div>
                    <button onClick={handleGenerateAppleToken} className={buttonStyles.secondary}>
                      Genera token
                    </button>
                  </div>
                  {appleToken && (
                    <p className="mt-3 break-all rounded-md bg-ink px-3 py-2 font-mono text-[11px] text-growth">
                      {appleToken}
                    </p>
                  )}
                </div>

                {syncMessage && <p className="text-sm text-growth">{syncMessage}</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
