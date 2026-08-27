"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import type { AvatarState } from "@/features/avatar";
import { getPatternForExerciseName } from "@/features/workouts/exerciseLibrary";

const AvatarTrainer = dynamic(() => import("@/features/avatar/ui/AvatarTrainer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 w-full items-center justify-center rounded-md border border-ink-line bg-ink sm:h-96">
      <p className="font-mono text-xs text-paper-muted">Caricamento avatar…</p>
    </div>
  ),
});

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number | null;
}

interface SessionData {
  id: string;
  title: string;
  exercises: Exercise[];
}

type Phase = "loading" | "exercising" | "resting" | "finished" | "error";

export default function WorkoutSessionPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [planTitle, setPlanTitle] = useState<string>("");
  const [avatar, setAvatar] = useState<AvatarState | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const [sessionRes, avatarRes] = await Promise.all([
          fetch(`/api/workouts/session/${sessionId}`),
          fetch("/api/avatar"),
        ]);
        if (!sessionRes.ok) throw new Error();
        const sessionData = await sessionRes.json();
        const avatarData = await avatarRes.json();

        setSession(sessionData.session);
        setPlanTitle(sessionData.planTitle);
        setAvatar(avatarData.avatar);
        setPhase("exercising");
        startTimeRef.current = Date.now();
      } catch {
        setPhase("error");
      }
    })();
  }, [status, sessionId]);

  // Countdown del riposo tra le serie
  useEffect(() => {
    if (phase !== "resting" || restSecondsLeft <= 0) return;
    const timer = setTimeout(() => setRestSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, restSecondsLeft]);

  useEffect(() => {
    if (phase === "resting" && restSecondsLeft === 0) {
      setPhase("exercising");
    }
  }, [phase, restSecondsLeft]);

  const currentExercise = session?.exercises[exerciseIndex] ?? null;
  const pattern = useMemo(
    () => (currentExercise ? getPatternForExerciseName(currentExercise.name) : "CORE"),
    [currentExercise]
  );

  function handleSetDone() {
    if (!session || !currentExercise) return;

    const isLastSetOfExercise = currentSet >= currentExercise.sets;
    const isLastExercise = exerciseIndex >= session.exercises.length - 1;

    if (!isLastSetOfExercise) {
      setCurrentSet((s) => s + 1);
      setRestSecondsLeft(currentExercise.restSeconds ?? 60);
      setPhase("resting");
      return;
    }

    if (isLastExercise) {
      finishWorkout();
      return;
    }

    setExerciseIndex((i) => i + 1);
    setCurrentSet(1);
    setRestSecondsLeft(currentExercise.restSeconds ?? 60);
    setPhase("resting");
  }

  function handleSkipExercise() {
    if (!session) return;
    if (exerciseIndex >= session.exercises.length - 1) {
      finishWorkout();
      return;
    }
    setExerciseIndex((i) => i + 1);
    setCurrentSet(1);
    setPhase("exercising");
  }

  async function finishWorkout() {
    setIsFinishing(true);
    const durationMin = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
    try {
      const res = await fetch("/api/workouts/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: session?.title ?? planTitle, durationMin }),
      });
      const data = await res.json();
      const completedGoals =
        data.goalUpdates?.filter((g: { goal: { status: string } }) => g.goal.status === "COMPLETED") ?? [];
      if (completedGoals.length > 0) {
        setCompletionMessage(`Allenamento registrato — e hai completato ${completedGoals.length} obiettivo/i! 🎉`);
      } else {
        setCompletionMessage("Allenamento registrato — il tuo avatar è cresciuto un po'.");
      }
    } catch {
      setCompletionMessage("Allenamento concluso, ma la registrazione è fallita. Riprova da /workouts.");
    } finally {
      setIsFinishing(false);
      setPhase("finished");
    }
  }

  if (phase === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink">
        <p className="font-mono text-sm text-paper-muted">Caricamento…</p>
      </main>
    );
  }

  if (phase === "error" || !session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-4 text-center">
        <p className="text-sm text-paper-muted">Non è stato possibile caricare questa sessione.</p>
        <a href="/workouts" className="font-mono text-xs text-growth hover:underline">
          ← Torna al piano
        </a>
      </main>
    );
  }

  if (phase === "finished") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-grid bg-grid px-4 text-center">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-paper-muted">
          Allenamento completato
        </span>
        <h1 className="font-display text-2xl font-semibold text-paper">{session.title}</h1>
        {completionMessage && <p className="max-w-sm text-sm text-growth">{completionMessage}</p>}
        <div className="flex gap-3">
          <a
            href="/dashboard"
            className="rounded-md bg-growth px-5 py-2.5 text-sm font-semibold text-ink hover:opacity-90"
          >
            Vai alla dashboard
          </a>
          <a
            href="/workouts"
            className="rounded-md border border-ink-line px-5 py-2.5 text-sm text-paper-muted hover:text-paper"
          >
            Torna al piano
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-grid bg-grid px-4 py-8">
      <div className="mx-auto max-w-lg">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-paper-muted">
              {planTitle}
            </span>
            <h1 className="font-display text-xl font-semibold text-paper">{session.title}</h1>
          </div>
          <button
            onClick={finishWorkout}
            disabled={isFinishing}
            className="font-mono text-xs text-paper-muted hover:text-caution disabled:opacity-50"
          >
            Termina
          </button>
        </header>

        {/* Progresso esercizi */}
        <div className="mb-4 flex gap-1.5">
          {session.exercises.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < exerciseIndex ? "bg-growth" : i === exerciseIndex ? "bg-effort" : "bg-ink-line"
              }`}
            />
          ))}
        </div>

        {phase === "resting" ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-ink-line bg-ink-panel py-16">
            <span className="font-mono text-xs uppercase tracking-wide text-paper-muted">Riposo</span>
            <span className="font-display text-5xl font-bold text-effort">{restSecondsLeft}s</span>
            <button
              onClick={() => setPhase("exercising")}
              className="mt-2 font-mono text-xs text-paper-muted hover:text-paper"
            >
              Salta riposo →
            </button>
          </div>
        ) : (
          currentExercise && (
            <div className="rounded-lg border border-ink-line bg-ink-panel p-5">
              <div className="mb-3 text-center">
                <h2 className="font-display text-lg font-semibold text-paper">{currentExercise.name}</h2>
                <p className="font-mono text-xs text-paper-muted">
                  Serie {currentSet}/{currentExercise.sets} · {currentExercise.reps} reps
                  {currentExercise.restSeconds ? ` · riposo ${currentExercise.restSeconds}s` : ""}
                </p>
              </div>

              {avatar && <AvatarTrainer state={avatar} pattern={pattern} />}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSkipExercise}
                  className="rounded-md border border-ink-line px-4 py-2.5 text-sm text-paper-muted hover:text-paper"
                >
                  Salta esercizio
                </button>
                <button
                  onClick={handleSetDone}
                  className="flex-1 rounded-md bg-growth py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
                >
                  Serie completata ✓
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </main>
  );
}
