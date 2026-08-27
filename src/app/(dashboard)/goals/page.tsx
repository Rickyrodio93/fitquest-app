"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { GOAL_TEMPLATES } from "@/features/goals/defaults";
import type { GoalCategory } from "@/features/goals/types";

interface Goal {
  id: string;
  title: string;
  description?: string | null;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: "ACTIVE" | "COMPLETED" | "FAILED" | "PAUSED";
  deadline: string | null;
  completedAt: string | null;
}

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  STRENGTH: "Forza",
  ENDURANCE: "Resistenza",
  CONSISTENCY: "Costanza",
  WEIGHT_LOSS: "Dimagrimento",
  MUSCLE_GAIN: "Massa muscolare",
  CUSTOM: "Personalizzato",
};

const DIFFICULTY_OPTIONS = [
  { label: "Leggero", weight: 0.75 },
  { label: "Standard", weight: 1 },
  { label: "Ambizioso", weight: 1.5 },
];

export default function GoalsPage() {
  const router = useRouter();
  const { status } = useSession();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stato del form di creazione
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GoalCategory>("CONSISTENCY");
  const [targetValue, setTargetValue] = useState(12);
  const [unit, setUnit] = useState("sessioni");
  const [durationDays, setDurationDays] = useState(30);
  const [difficultyWeight, setDifficultyWeight] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stato per l'incremento rapido di progresso per-obiettivo
  const [progressInputs, setProgressInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadGoals();
  }, [status]);

  async function loadGoals() {
    setIsLoading(true);
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals(data.goals ?? []);
    setIsLoading(false);
  }

  function applyTemplate(idx: number) {
    const t = GOAL_TEMPLATES[idx];
    setSelectedTemplateIdx(idx);
    setTitle(t.title);
    setCategory(t.category);
    setTargetValue(t.suggestedTarget);
    setUnit(t.unit);
    setDurationDays(t.suggestedDurationDays);
  }

  function resetForm() {
    setSelectedTemplateIdx(null);
    setTitle("");
    setCategory("CONSISTENCY");
    setTargetValue(12);
    setUnit("sessioni");
    setDurationDays(30);
    setDifficultyWeight(1);
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const deadline = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, targetValue, unit, deadline, difficultyWeight }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.formErrors?.[0] ?? "Errore nella creazione dell'obiettivo");
      }
      resetForm();
      setShowForm(false);
      await loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRecordProgress(goalId: string) {
    const raw = progressInputs[goalId];
    const increment = raw ? Number(raw) : 1; // default: +1 se non specificato
    if (Number.isNaN(increment)) return;

    const res = await fetch(`/api/goals/${goalId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incrementBy: increment }),
    });
    if (res.ok) {
      setProgressInputs((prev) => ({ ...prev, [goalId]: "" }));
      await loadGoals();
    }
  }

  async function handleToggleStatus(goal: Goal) {
    const newStatus = goal.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) await loadGoals();
  }

  async function handleDelete(goalId: string) {
    const res = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
    if (res.ok) await loadGoals();
  }

  const grouped = useMemo(() => {
    return {
      active: goals.filter((g) => g.status === "ACTIVE"),
      paused: goals.filter((g) => g.status === "PAUSED"),
      completed: goals.filter((g) => g.status === "COMPLETED"),
      failed: goals.filter((g) => g.status === "FAILED"),
    };
  }, [goals]);

  if (status === "loading" || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink">
        <p className="font-mono text-sm text-paper-muted">Caricamento…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-grid bg-grid px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-paper-muted">
              FitQuest
            </span>
            <h1 className="font-display text-2xl font-semibold text-paper">I tuoi obiettivi</h1>
          </div>
          <div className="flex gap-3">
            <a href="/dashboard" className="font-mono text-xs text-paper-muted hover:text-paper">
              ← Dashboard
            </a>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-md bg-growth px-4 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
            >
              {showForm ? "Annulla" : "+ Nuovo obiettivo"}
            </button>
          </div>
        </header>

        {/* Form di creazione */}
        {showForm && (
          <form
            onSubmit={handleCreateGoal}
            className="mb-8 space-y-5 rounded-lg border border-ink-line bg-ink-panel p-6"
          >
            <div>
              <span className="mb-2 block font-mono text-[11px] uppercase tracking-wide text-paper-muted">
                Parti da un template
              </span>
              <div className="flex flex-wrap gap-2">
                {GOAL_TEMPLATES.map((t, idx) => (
                  <button
                    key={t.title}
                    type="button"
                    onClick={() => applyTemplate(idx)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      selectedTemplateIdx === idx
                        ? "border-growth bg-growth/10 text-paper"
                        : "border-ink-line text-paper-muted hover:border-ink-line/70"
                    }`}
                  >
                    {CATEGORY_LABELS[t.category]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-paper-muted">
                  Titolo
                </span>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. Allenati con costanza"
                  className="w-full rounded-md border border-ink-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-growth"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-paper-muted">
                  Categoria
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GoalCategory)}
                  className="w-full rounded-md border border-ink-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-growth"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-paper-muted">
                  Unità di misura
                </span>
                <input
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Es. kg, sessioni, minuti"
                  className="w-full rounded-md border border-ink-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-growth"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-paper-muted">
                  Target — {targetValue}
                </span>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="w-full accent-growth"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-paper-muted">
                  Scadenza — tra {durationDays} giorni
                </span>
                <input
                  type="range"
                  min={7}
                  max={180}
                  step={1}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full accent-growth"
                />
              </label>
            </div>

            <div>
              <span className="mb-2 block font-mono text-[11px] uppercase tracking-wide text-paper-muted">
                Quanto è ambizioso? (influenza l&apos;impatto sull&apos;avatar al completamento)
              </span>
              <div className="flex gap-2">
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setDifficultyWeight(opt.weight)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                      difficultyWeight === opt.weight
                        ? "border-effort bg-effort/10 text-paper"
                        : "border-ink-line text-paper-muted hover:border-ink-line/70"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

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
              {isSubmitting ? "Creazione…" : "Crea obiettivo"}
            </button>
          </form>
        )}

        {/* Obiettivi attivi */}
        <GoalSection title="Attivi" emptyLabel="Nessun obiettivo attivo. Creane uno per iniziare.">
          {grouped.active.map((goal) => (
            <ActiveGoalCard
              key={goal.id}
              goal={goal}
              inputValue={progressInputs[goal.id] ?? ""}
              onInputChange={(v) => setProgressInputs((prev) => ({ ...prev, [goal.id]: v }))}
              onRecordProgress={() => handleRecordProgress(goal.id)}
              onPause={() => handleToggleStatus(goal)}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </GoalSection>

        {/* In pausa */}
        {grouped.paused.length > 0 && (
          <GoalSection title="In pausa">
            {grouped.paused.map((goal) => (
              <PausedGoalCard key={goal.id} goal={goal} onResume={() => handleToggleStatus(goal)} onDelete={() => handleDelete(goal.id)} />
            ))}
          </GoalSection>
        )}

        {/* Completati */}
        {grouped.completed.length > 0 && (
          <GoalSection title="Completati">
            {grouped.completed.map((goal) => (
              <CompletedGoalCard key={goal.id} goal={goal} />
            ))}
          </GoalSection>
        )}

        {/* Falliti */}
        {grouped.failed.length > 0 && (
          <GoalSection title="Non riusciti">
            {grouped.failed.map((goal) => (
              <FailedGoalCard key={goal.id} goal={goal} onDelete={() => handleDelete(goal.id)} />
            ))}
          </GoalSection>
        )}
      </div>
    </main>
  );
}

function GoalSection({
  title,
  children,
  emptyLabel,
}: {
  title: string;
  children: React.ReactNode;
  emptyLabel?: string;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <section className="mb-6">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-wide text-paper-muted">{title}</h2>
      {!hasChildren && emptyLabel ? (
        <p className="rounded-lg border border-dashed border-ink-line p-6 text-center text-sm text-paper-muted">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}

function ActiveGoalCard({
  goal,
  inputValue,
  onInputChange,
  onRecordProgress,
  onPause,
  onDelete,
}: {
  goal: Goal;
  inputValue: string;
  onInputChange: (v: string) => void;
  onRecordProgress: () => void;
  onPause: () => void;
  onDelete: () => void;
}) {
  const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="rounded-lg border border-ink-line bg-ink-panel p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-paper">{goal.title}</p>
          <p className="font-mono text-[11px] text-paper-muted">
            {CATEGORY_LABELS[goal.category]}
            {daysLeft !== null && ` · ${daysLeft > 0 ? `${daysLeft} giorni rimasti` : "scaduto"}`}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={onPause} title="Metti in pausa" className="text-xs text-paper-muted hover:text-effort">
            ⏸
          </button>
          <button onClick={onDelete} title="Elimina" className="text-xs text-paper-muted hover:text-caution">
            ✕
          </button>
        </div>
      </div>

      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-mono text-paper-muted">
          {goal.currentValue}/{goal.targetValue} {goal.unit}
        </span>
        <span className="font-mono text-growth">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink">
        <div className="h-full bg-growth transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="+1"
          className="w-20 rounded-md border border-ink-line bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-growth"
        />
        <button
          onClick={onRecordProgress}
          className="rounded-md border border-growth/40 bg-growth/10 px-3 py-1.5 text-xs font-semibold text-growth hover:bg-growth/20"
        >
          Registra progresso
        </button>
      </div>
    </div>
  );
}

function PausedGoalCard({ goal, onResume, onDelete }: { goal: Goal; onResume: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-ink-line bg-ink-panel p-4 opacity-70">
      <div>
        <p className="text-sm text-paper">{goal.title}</p>
        <p className="font-mono text-[11px] text-paper-muted">
          {goal.currentValue}/{goal.targetValue} {goal.unit}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={onResume} className="text-xs text-growth hover:underline">
          Riattiva
        </button>
        <button onClick={onDelete} className="text-xs text-paper-muted hover:text-caution">
          Elimina
        </button>
      </div>
    </div>
  );
}

function CompletedGoalCard({ goal }: { goal: Goal }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-growth/30 bg-growth/5 p-4">
      <div>
        <p className="text-sm text-paper">✓ {goal.title}</p>
        <p className="font-mono text-[11px] text-paper-muted">
          {goal.completedAt && new Date(goal.completedAt).toLocaleDateString("it-IT")}
        </p>
      </div>
      <span className="font-mono text-xs text-growth">{CATEGORY_LABELS[goal.category]}</span>
    </div>
  );
}

function FailedGoalCard({ goal, onDelete }: { goal: Goal; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-caution/30 bg-caution/5 p-4">
      <div>
        <p className="text-sm text-paper">{goal.title}</p>
        <p className="font-mono text-[11px] text-paper-muted">
          {goal.currentValue}/{goal.targetValue} {goal.unit} — scaduto
        </p>
      </div>
      <button onClick={onDelete} className="text-xs text-paper-muted hover:text-caution">
        Elimina
      </button>
    </div>
  );
}
