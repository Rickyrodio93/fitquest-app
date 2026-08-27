import { ExerciseDefinition } from "./types";

export type MovementPattern = "SQUAT" | "PUSH" | "PULL" | "CORE" | "CARDIO";

/**
 * Libreria base di esercizi. Volutamente compatta ma rappresentativa
 * di ogni gruppo muscolare e livello — pensata per essere estesa
 * facilmente (es. caricandola da DB invece che da file statico, in
 * una versione futura con più varietà ed esercizi specifici gym).
 */
export const EXERCISE_LIBRARY: ExerciseDefinition[] = [
  // --- PETTO ---
  { id: "pushup", name: "Piegamenti sulle braccia", muscleGroups: ["CHEST", "ARMS"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" , movementPattern: "PUSH" },
  { id: "db_bench_press", name: "Panca piana con manubri", muscleGroups: ["CHEST", "ARMS"], equipment: "DUMBBELL", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" , movementPattern: "PUSH" },
  { id: "barbell_bench_press", name: "Panca piana con bilanciere", muscleGroups: ["CHEST", "ARMS"], equipment: "BARBELL", compatibleEnvironments: ["GYM"], minLevel: "INTERMEDIATE" , movementPattern: "PUSH" },
  { id: "cable_fly", name: "Croci ai cavi", muscleGroups: ["CHEST"], equipment: "MACHINE", compatibleEnvironments: ["GYM"], minLevel: "INTERMEDIATE" , movementPattern: "PUSH" },

  // --- SCHIENA ---
  { id: "bodyweight_row", name: "Rematore a corpo libero (con tavolo/anelli)", muscleGroups: ["BACK", "ARMS"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" , movementPattern: "PULL" },
  { id: "db_row", name: "Rematore con manubrio", muscleGroups: ["BACK", "ARMS"], equipment: "DUMBBELL", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" , movementPattern: "PULL" },
  { id: "pullup", name: "Trazioni alla sbarra", muscleGroups: ["BACK", "ARMS"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "INTERMEDIATE" , movementPattern: "PULL" },
  { id: "lat_machine", name: "Lat machine", muscleGroups: ["BACK"], equipment: "MACHINE", compatibleEnvironments: ["GYM"], minLevel: "BEGINNER" , movementPattern: "PULL" },
  { id: "barbell_row", name: "Rematore con bilanciere", muscleGroups: ["BACK"], equipment: "BARBELL", compatibleEnvironments: ["GYM"], minLevel: "ADVANCED" , movementPattern: "PULL" },

  // --- GAMBE ---
  { id: "bodyweight_squat", name: "Squat a corpo libero", muscleGroups: ["LEGS"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" , movementPattern: "SQUAT" },
  { id: "goblet_squat", name: "Goblet squat con manubrio", muscleGroups: ["LEGS"], equipment: "DUMBBELL", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" , movementPattern: "SQUAT" },
  { id: "barbell_squat", name: "Squat con bilanciere", muscleGroups: ["LEGS"], equipment: "BARBELL", compatibleEnvironments: ["GYM"], minLevel: "INTERMEDIATE" , movementPattern: "SQUAT" },
  { id: "lunges", name: "Affondi", muscleGroups: ["LEGS"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" , movementPattern: "SQUAT" },
  { id: "leg_press", name: "Leg press", muscleGroups: ["LEGS"], equipment: "MACHINE", compatibleEnvironments: ["GYM"], minLevel: "BEGINNER" , movementPattern: "SQUAT" },
  { id: "deadlift", name: "Stacco da terra", muscleGroups: ["LEGS", "BACK"], equipment: "BARBELL", compatibleEnvironments: ["GYM"], minLevel: "ADVANCED" , movementPattern: "SQUAT" },

  // --- SPALLE ---
  { id: "pike_pushup", name: "Piegamenti a V (spalle)", muscleGroups: ["SHOULDERS", "ARMS"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "INTERMEDIATE" , movementPattern: "PUSH" },
  { id: "db_shoulder_press", name: "Military press con manubri", muscleGroups: ["SHOULDERS", "ARMS"], equipment: "DUMBBELL", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" , movementPattern: "PUSH" },
  { id: "lateral_raise", name: "Alzate laterali", muscleGroups: ["SHOULDERS"], equipment: "DUMBBELL", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" , movementPattern: "PUSH" },

  // --- BRACCIA ---
  { id: "bicep_curl", name: "Curl per bicipiti", muscleGroups: ["ARMS"], equipment: "DUMBBELL", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" , movementPattern: "PULL" },
  { id: "tricep_dips", name: "Dip per tricipiti (su sedia/panca)", muscleGroups: ["ARMS"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" , movementPattern: "PUSH" },

  // --- CORE ---
  { id: "plank", name: "Plank", muscleGroups: ["CORE"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" , movementPattern: "CORE" },
  { id: "crunches", name: "Addominali (crunch)", muscleGroups: ["CORE"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" , movementPattern: "CORE" },
  { id: "hanging_leg_raise", name: "Sollevamento gambe in sospensione", muscleGroups: ["CORE"], equipment: "BODYWEIGHT", compatibleEnvironments: ["GYM"], minLevel: "ADVANCED" , movementPattern: "CORE" },

  // --- FULL BODY / CARDIO ---
  { id: "burpees", name: "Burpees", muscleGroups: ["FULL_BODY", "CARDIO"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "INTERMEDIATE" , movementPattern: "CARDIO" },
  { id: "kettlebell_swing", name: "Kettlebell swing", muscleGroups: ["FULL_BODY", "CARDIO"], equipment: "KETTLEBELL", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "INTERMEDIATE" , movementPattern: "CARDIO" },
  { id: "jumping_jacks", name: "Jumping jacks", muscleGroups: ["CARDIO"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" , movementPattern: "CARDIO" },
  { id: "treadmill_run", name: "Corsa su tapis roulant", muscleGroups: ["CARDIO"], equipment: "CARDIO_MACHINE", compatibleEnvironments: ["GYM"], minLevel: "BEGINNER" , movementPattern: "CARDIO" },
  { id: "rowing_machine", name: "Vogatore", muscleGroups: ["CARDIO", "FULL_BODY"], equipment: "CARDIO_MACHINE", compatibleEnvironments: ["GYM"], minLevel: "BEGINNER" , movementPattern: "PULL" },
];

const LEVEL_RANK: Record<string, number> = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };

export function isLevelSuitable(exerciseMinLevel: string, userLevel: string): boolean {
  return LEVEL_RANK[userLevel] >= LEVEL_RANK[exerciseMinLevel];
}

/**
 * Il piano salvato su DB conserva solo il nome dell'esercizio (non il
 * suo movementPattern — evitiamo così una migration solo per questo).
 * Questa mappa nome→pattern permette al session player di risalire
 * all'animazione giusta a partire dal nome salvato. Funziona perché
 * il generatore di piani (generator.ts) usa sempre esattamente i nomi
 * di questa libreria.
 */
export const EXERCISE_NAME_TO_PATTERN: Record<string, MovementPattern> = Object.fromEntries(
  EXERCISE_LIBRARY.map((ex) => [ex.name, ex.movementPattern])
);

export function getPatternForExerciseName(name: string): MovementPattern {
  return EXERCISE_NAME_TO_PATTERN[name] ?? "CORE";
}
