"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { TopNav } from "@/components/ui/TopNav";
import { buttonStyles } from "@/components/ui/buttonStyles";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number | null;
}

interface WorkoutSession {
  id: string;
  dayOfWeek: number;
  title: string;
  exercises: Exercise[];
}

interface WorkoutPlan {
  id: string;
  title: string;
  level: string;
  environment: string;
  durationWeeks: number;
  goalFocus: string | null;
  sessions: WorkoutSession[];
}

interface WorkoutLog {
  id: string;
  title: string;
  durationMin: number;
  performedAt: string;
}

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzato",
};

const ENV_LABELS: Record<string, string> = {
  HOME: "Casa",
  GYM: "Palestra",
  BOTH: "Casa e palestra",
};

const GOAL_FOCUS_LABELS: Record<string, string> = {
  STRENGTH: "Forza",
  ENDURANCE: "Resistenza",
  CONSISTENCY: "Costanza",
  WEIGHT_LOSS: "Dimagrimento",
  MUSCLE_GAIN: "Massa muscolare",
  CUSTOM: "Personalizzato",
};

const inputStyles =
  "w-full rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-paper outline-none focus:border-growth min-w-0";
const labelStyles = "mb-1.5 block text-sm text-paper-muted";

export default function WorkoutsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [plan, setPlan] = useState<WorkoutPlan | null | undefined>(undefined);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loggingSessionId, setLoggingSessionId] = useState<string | null>(null);
  const [durationInputs, setDurationInputs] = useState<Record<string, string>>({});

  const [level, setLevel] = useState("BEGINNER");
  const [environment, setEnvironment] = useState("BOTH");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [goalFocus, setGoalFocus] = useState("CONSISTENCY");
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadPlan();
  }, [status]);

  async function loadPlan() {
    const res = await fetch("/api/workouts");
    const data = await res.json();
    setPlan(data.plan ?? null);
    setRecentLogs(data.recentLogs ?? []);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/workouts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, environment, daysPerWeek, goalFocus, durationWeeks }),
      });
      if (!res.ok) throw new Error("Generazione fallita");
      setShowGenerateForm(false);
      await loadPlan();
      setFeedback("Nuovo piano generato.");
    } catch {
      setFeedback("Qualcosa è andato storto durante la generazione.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleLogSession(session: WorkoutSession) {
    setLoggingSessionId(session.id);
    setFeedback(null);
    try {
      const durationMin = Number(durationInputs[session.id] || 45);
      const res = await fetch("/api/workouts/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: session.title, durationMin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Errore");

      const completedGoals =
        data.goalUpdates?.filter((g: { goal: { status: string } }) => g.goal.status === "COMPLETED") ?? [];
      if (completedGoals.length > 0) {
        setFeedback(`Sessione registrata — e hai completato ${completedGoals.length} obiettivo/i! Avatar aggiornato.`);
      } else if (data.avatar) {
        setFeedback("Sessione registrata — il tuo avatar è cresciuto un po'.");
      } else {
        setFeedback("Sessione registrata.");
      }
      await loadPlan();
    } catch {
      setFeedback("Impossibile registrare la sessione.");
    } finally {
      setLoggingSessionId(null);
    }
  }

  if (status === "loading" || plan === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink">
        <p className="text-sm text-paper-muted">Caricamento…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl min-w-0">
        <TopNav userName={session?.user?.name} />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-paper">Piano di allenamento</h1>
          <button onClick={() => setShowGenerateForm((v) => !v)} className={buttonStyles.primary}>
            {showGenerateForm ? "Annulla" : plan ? "Rigenera piano" : "Genera piano"}
          </button>
        </div>

        {feedback && (
          <p className="mb-6 rounded-lg border border-growth/40 bg-growth/10 px-3 py-2 text-sm text-growth">
            {feedback}
          </p>
        )}

        {showGenerateForm && (
          <form onSubmit={handleGenerate} className="mb-6">
            <Card className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelStyles}>Livello</span>
                  <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputStyles}>
                    {Object.entries(LEVEL_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={labelStyles}>Dove ti alleni</span>
                  <select value={environment} onChange={(e) => setEnvironment(e.target.value)} className={inputStyles}>
                    {Object.entries(ENV_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={labelStyles}>Obiettivo principale</span>
                  <select value={goalFocus} onChange={(e) => setGoalFocus(e.target.value)} className={inputStyles}>
                    {Object.entries(GOAL_FOCUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={labelStyles}>Giorni/settimana — {daysPerWeek}</span>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                    className="w-full accent-growth"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className={labelStyles}>Durata — {durationWeeks} settimane</span>
                  <input
                    type="range"
                    min={4}
                    max={16}
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(Number(e.target.value))}
                    className="w-full accent-growth"
                  />
                </label>
              </div>

              {plan && (
                <p className="rounded-lg border border-effort/40 bg-effort/10 px-3 py-2 text-sm text-effort">
                  Attenzione: generare un nuovo piano disattiverà quello attuale.
                </p>
              )}

              <button type="submit" disabled={isGenerating} className={`w-full ${buttonStyles.primary}`}>
                {isGenerating ? "Generazione…" : "Genera piano"}
              </button>
            </Card>
          </form>
        )}

        {!plan ? (
          <p className="rounded-xl border border-dashed border-ink-line p-8 text-center text-sm text-paper-muted">
            Non hai ancora un piano di allenamento. Generane uno per iniziare.
          </p>
        ) : (
          <>
            <Card className="mb-4">
              <h2 className="font-display text-lg font-semibold text-paper">{plan.title}</h2>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-paper-muted">
                <span>{LEVEL_LABELS[plan.level] ?? plan.level}</span>
                <span>·</span>
                <span>{ENV_LABELS[plan.environment] ?? plan.environment}</span>
                <span>·</span>
                <span>{plan.durationWeeks} settimane</span>
                {plan.goalFocus && (
                  <>
                    <span>·</span>
                    <span>{GOAL_FOCUS_LABELS[plan.goalFocus] ?? plan.goalFocus}</span>
                  </>
                )}
              </div>
            </Card>

            <div className="space-y-4">
              {plan.sessions.map((session) => (
                <Card key={session.id} className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-paper-muted">Giorno {session.dayOfWeek}</p>
                      <h3 className="font-display text-base font-semibold text-paper">{session.title}</h3>
                    </div>
                    <a href={`/workouts/session/${session.id}`} className={buttonStyles.primary}>
                      ▶ Inizia allenamento
                    </a>
                  </div>

                  <div className="min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[420px] text-left text-sm">
                      <thead>
                        <tr className="text-xs text-paper-muted">
                          <th className="pb-2 font-normal">Esercizio</th>
                          <th className="pb-2 font-normal">Serie</th>
                          <th className="pb-2 font-normal">Reps</th>
                          <th className="pb-2 font-normal">Recupero</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.exercises.map((ex) => (
                          <tr key={ex.id} className="border-t border-ink-line/60">
                            <td className="py-2 text-paper">{ex.name}</td>
                            <td className="py-2 font-mono text-xs text-paper-muted">{ex.sets}</td>
                            <td className="py-2 font-mono text-xs text-paper-muted">{ex.reps}</td>
                            <td className="py-2 font-mono text-xs text-paper-muted">
                              {ex.restSeconds ? `${ex.restSeconds}s` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-line pt-3">
                    <input
                      type="number"
                      placeholder="45"
                      value={durationInputs[session.id] ?? ""}
                      onChange={(e) => setDurationInputs((prev) => ({ ...prev, [session.id]: e.target.value }))}
                      className="w-16 min-w-0 rounded-lg border border-ink-line bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-growth"
                    />
                    <span className="text-sm text-paper-muted">min</span>
                    <button
                      onClick={() => handleLogSession(session)}
                      disabled={loggingSessionId === session.id}
                      className={`ml-auto ${buttonStyles.secondary}`}
                    >
                      {loggingSessionId === session.id ? "…" : "Segna come completata"}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {recentLogs.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-medium text-paper-muted">Ultimi allenamenti</h2>
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex min-w-0 items-center justify-between rounded-lg border border-ink-line/70 bg-ink-panel px-4 py-3 text-sm"
                >
                  <span className="min-w-0 truncate text-paper">{log.title}</span>
                  <span className="shrink-0 pl-3 text-sm text-paper-muted">
                    {log.durationMin} min · {new Date(log.performedAt).toLocaleDateString("it-IT")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
