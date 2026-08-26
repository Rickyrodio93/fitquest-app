import { ExerciseDefinition } from "./types";

/**
 * Libreria base di esercizi. Volutamente compatta ma rappresentativa
 * di ogni gruppo muscolare e livello — pensata per essere estesa
 * facilmente (es. caricandola da DB invece che da file statico, in
 * una versione futura con più varietà ed esercizi specifici gym).
 */
export const EXERCISE_LIBRARY: ExerciseDefinition[] = [
  // --- PETTO ---
  { id: "pushup", name: "Piegamenti sulle braccia", muscleGroups: ["CHEST", "ARMS"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" },
  { id: "db_bench_press", name: "Panca piana con manubri", muscleGroups: ["CHEST", "ARMS"], equipment: "DUMBBELL", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" },
  { id: "barbell_bench_press", name: "Panca piana con bilanciere", muscleGroups: ["CHEST", "ARMS"], equipment: "BARBELL", compatibleEnvironments: ["GYM"], minLevel: "INTERMEDIATE" },
  { id: "cable_fly", name: "Croci ai cavi", muscleGroups: ["CHEST"], equipment: "MACHINE", compatibleEnvironments: ["GYM"], minLevel: "INTERMEDIATE" },

  // --- SCHIENA ---
  { id: "bodyweight_row", name: "Rematore a corpo libero (con tavolo/anelli)", muscleGroups: ["BACK", "ARMS"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" },
  { id: "db_row", name: "Rematore con manubrio", muscleGroups: ["BACK", "ARMS"], equipment: "DUMBBELL", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" },
  { id: "pullup", name: "Trazioni alla sbarra", muscleGroups: ["BACK", "ARMS"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "INTERMEDIATE" },
  { id: "lat_machine", name: "Lat machine", muscleGroups: ["BACK"], equipment: "MACHINE", compatibleEnvironments: ["GYM"], minLevel: "BEGINNER" },
  { id: "barbell_row", name: "Rematore con bilanciere", muscleGroups: ["BACK"], equipment: "BARBELL", compatibleEnvironments: ["GYM"], minLevel: "ADVANCED" },

  // --- GAMBE ---
  { id: "bodyweight_squat", name: "Squat a corpo libero", muscleGroups: ["LEGS"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" },
  { id: "goblet_squat", name: "Goblet squat con manubrio", muscleGroups: ["LEGS"], equipment: "DUMBBELL", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" },
  { id: "barbell_squat", name: "Squat con bilanciere", muscleGroups: ["LEGS"], equipment: "BARBELL", compatibleEnvironments: ["GYM"], minLevel: "INTERMEDIATE" },
  { id: "lunges", name: "Affondi", muscleGroups: ["LEGS"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" },
  { id: "leg_press", name: "Leg press", muscleGroups: ["LEGS"], equipment: "MACHINE", compatibleEnvironments: ["GYM"], minLevel: "BEGINNER" },
  { id: "deadlift", name: "Stacco da terra", muscleGroups: ["LEGS", "BACK"], equipment: "BARBELL", compatibleEnvironments: ["GYM"], minLevel: "ADVANCED" },

  // --- SPALLE ---
  { id: "pike_pushup", name: "Piegamenti a V (spalle)", muscleGroups: ["SHOULDERS", "ARMS"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "INTERMEDIATE" },
  { id: "db_shoulder_press", name: "Military press con manubri", muscleGroups: ["SHOULDERS", "ARMS"], equipment: "DUMBBELL", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" },
  { id: "lateral_raise", name: "Alzate laterali", muscleGroups: ["SHOULDERS"], equipment: "DUMBBELL", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" },

  // --- BRACCIA ---
  { id: "bicep_curl", name: "Curl per bicipiti", muscleGroups: ["ARMS"], equipment: "DUMBBELL", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" },
  { id: "tricep_dips", name: "Dip per tricipiti (su sedia/panca)", muscleGroups: ["ARMS"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" },

  // --- CORE ---
  { id: "plank", name: "Plank", muscleGroups: ["CORE"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" },
  { id: "crunches", name: "Addominali (crunch)", muscleGroups: ["CORE"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" },
  { id: "hanging_leg_raise", name: "Sollevamento gambe in sospensione", muscleGroups: ["CORE"], equipment: "BODYWEIGHT", compatibleEnvironments: ["GYM"], minLevel: "ADVANCED" },

  // --- FULL BODY / CARDIO ---
  { id: "burpees", name: "Burpees", muscleGroups: ["FULL_BODY", "CARDIO"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "INTERMEDIATE" },
  { id: "kettlebell_swing", name: "Kettlebell swing", muscleGroups: ["FULL_BODY", "CARDIO"], equipment: "KETTLEBELL", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "INTERMEDIATE" },
  { id: "jumping_jacks", name: "Jumping jacks", muscleGroups: ["CARDIO"], equipment: "BODYWEIGHT", compatibleEnvironments: ["HOME", "GYM", "BOTH"], minLevel: "BEGINNER" },
  { id: "treadmill_run", name: "Corsa su tapis roulant", muscleGroups: ["CARDIO"], equipment: "CARDIO_MACHINE", compatibleEnvironments: ["GYM"], minLevel: "BEGINNER" },
  { id: "rowing_machine", name: "Vogatore", muscleGroups: ["CARDIO", "FULL_BODY"], equipment: "CARDIO_MACHINE", compatibleEnvironments: ["GYM"], minLevel: "BEGINNER" },
];

const LEVEL_RANK: Record<string, number> = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };

export function isLevelSuitable(exerciseMinLevel: string, userLevel: string): boolean {
  return LEVEL_RANK[userLevel] >= LEVEL_RANK[exerciseMinLevel];
}
