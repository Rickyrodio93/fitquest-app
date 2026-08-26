import { EXERCISE_LIBRARY, isLevelSuitable } from "./exerciseLibrary";
import { selectSplitTemplate } from "./splitTemplates";
import {
  ExerciseDefinition,
  GeneratedExercise,
  GeneratedSession,
  GeneratePlanInput,
  GoalFocus,
  MuscleGroup,
  WorkoutPlanDraft,
} from "./types";

/**
 * Schema serie/ripetizioni/recupero in base all'obiettivo primario.
 * Principi standard di programmazione dell'allenamento:
 * - Forza: carichi alti, poche ripetizioni, recuperi lunghi
 * - Ipertrofia/massa: ripetizioni medie, volume più alto
 * - Resistenza/dimagrimento: ripetizioni alte, recuperi brevi (stile circuito)
 */
const REP_SCHEMES: Record<GoalFocus, { sets: number; reps: string; restSeconds: number }> = {
  STRENGTH: { sets: 5, reps: "3-6", restSeconds: 150 },
  MUSCLE_GAIN: { sets: 4, reps: "8-12", restSeconds: 75 },
  ENDURANCE: { sets: 3, reps: "15-20", restSeconds: 40 },
  WEIGHT_LOSS: { sets: 3, reps: "12-15", restSeconds: 35 },
  CONSISTENCY: { sets: 3, reps: "10-12", restSeconds: 60 },
  CUSTOM: { sets: 3, reps: "10-12", restSeconds: 60 },
};

function pickExercisesForMuscleGroups(
  muscleGroups: MuscleGroup[],
  environment: string,
  level: string,
  count: number,
  alreadyUsedIds: Set<string>
): ExerciseDefinition[] {
  const candidates = EXERCISE_LIBRARY.filter(
    (ex) =>
      ex.muscleGroups.some((mg) => muscleGroups.includes(mg)) &&
      (ex.compatibleEnvironments.includes(environment as never) || environment === "BOTH") &&
      isLevelSuitable(ex.minLevel, level) &&
      !alreadyUsedIds.has(ex.id)
  );

  // Distribuisce gli esercizi cercando di coprire più gruppi muscolari
  // possibile invece di prenderne troppi dallo stesso gruppo
  const selected: ExerciseDefinition[] = [];
  const coveredGroups = new Set<MuscleGroup>();

  for (const ex of candidates) {
    if (selected.length >= count) break;
    const addsNewCoverage = ex.muscleGroups.some((mg) => !coveredGroups.has(mg));
    if (addsNewCoverage || selected.length < muscleGroups.length) {
      selected.push(ex);
      ex.muscleGroups.forEach((mg) => coveredGroups.add(mg));
      alreadyUsedIds.add(ex.id);
    }
  }

  // Se non abbiamo raggiunto il count, riempiamo con i candidati rimanenti
  for (const ex of candidates) {
    if (selected.length >= count) break;
    if (!selected.includes(ex)) {
      selected.push(ex);
      alreadyUsedIds.add(ex.id);
    }
  }

  return selected.slice(0, count);
}

export function generateWorkoutPlan(input: GeneratePlanInput): WorkoutPlanDraft {
  const goalFocus = input.goalFocus ?? "CONSISTENCY";
  const durationWeeks = input.durationWeeks ?? 8;
  const exercisesPerSession = input.exercisesPerSession ?? 5;
  const scheme = REP_SCHEMES[goalFocus];

  const split = selectSplitTemplate(input.level, input.daysPerWeek);

  // Set condiviso tra le sessioni della stessa settimana: evita di
  // ripetere lo stesso identico esercizio in giorni consecutivi,
  // pur permettendo che si ripeta tra settimane diverse (qui gestiamo
  // solo la settimana tipo, che si ripete per durationWeeks)
  const usedInWeek = new Set<string>();

  const sessions: GeneratedSession[] = split.sessions.map((sessionTemplate, index) => {
    // Reset parziale: permettiamo il riuso tra sessioni troppo distanti
    // nella settimana per non esaurire troppo in fretta la libreria
    if (usedInWeek.size > EXERCISE_LIBRARY.length * 0.6) {
      usedInWeek.clear();
    }

    const exercises = pickExercisesForMuscleGroups(
      sessionTemplate.targetMuscleGroups,
      input.environment,
      input.level,
      exercisesPerSession,
      usedInWeek
    );

    const generatedExercises: GeneratedExercise[] = exercises.map((ex) => ({
      name: ex.name,
      sets: scheme.sets,
      reps: scheme.reps,
      restSeconds: scheme.restSeconds,
    }));

    return {
      dayOfWeek: index + 1,
      title: sessionTemplate.title,
      exercises: generatedExercises,
    };
  });

  return {
    title: `Piano ${goalFocus === "CUSTOM" ? "personalizzato" : goalFocus.toLowerCase()} — ${input.level.toLowerCase()}`,
    level: input.level,
    environment: input.environment,
    goalFocus: input.goalFocus ?? null,
    durationWeeks,
    sessions,
  };
}
