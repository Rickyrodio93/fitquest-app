export type MuscleGroup =
  | "CHEST"
  | "BACK"
  | "LEGS"
  | "SHOULDERS"
  | "ARMS"
  | "CORE"
  | "CARDIO"
  | "FULL_BODY";

export type Equipment =
  | "BODYWEIGHT"
  | "DUMBBELL"
  | "BARBELL"
  | "MACHINE"
  | "KETTLEBELL"
  | "BANDS"
  | "CARDIO_MACHINE";

export type Environment = "HOME" | "GYM" | "BOTH";
export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type GoalFocus =
  | "STRENGTH"
  | "ENDURANCE"
  | "CONSISTENCY"
  | "WEIGHT_LOSS"
  | "MUSCLE_GAIN"
  | "CUSTOM";

export interface ExerciseDefinition {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment;
  // Ambienti in cui l'esercizio è realisticamente eseguibile
  compatibleEnvironments: Environment[];
  minLevel: ExperienceLevel;
  // Pattern di movimento — usato dal "personal trainer 3D" per scegliere
  // quale animazione dell'avatar mostrare durante l'esecuzione
  movementPattern: "SQUAT" | "PUSH" | "PULL" | "CORE" | "CARDIO";
}

export interface SplitSessionTemplate {
  title: string;
  targetMuscleGroups: MuscleGroup[];
}

export interface SplitTemplate {
  level: ExperienceLevel;
  daysPerWeek: number;
  sessions: SplitSessionTemplate[];
}

export interface GeneratedExercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
}

export interface GeneratedSession {
  dayOfWeek: number; // 1-7
  title: string;
  exercises: GeneratedExercise[];
}

export interface WorkoutPlanDraft {
  title: string;
  level: ExperienceLevel;
  environment: Environment;
  goalFocus: GoalFocus | null;
  durationWeeks: number;
  sessions: GeneratedSession[];
}

export interface GeneratePlanInput {
  level: ExperienceLevel;
  environment: Environment;
  daysPerWeek: number;
  goalFocus?: GoalFocus;
  durationWeeks?: number;
  exercisesPerSession?: number;
}
