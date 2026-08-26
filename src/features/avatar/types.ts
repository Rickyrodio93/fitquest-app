/**
 * Tipi per il motore di evoluzione dell'avatar.
 * Questi rispecchiano (in forma semplificata) i modelli Prisma
 * Avatar / BodyMetric / Goal / WorkoutLog.
 */

export interface AvatarState {
  muscleLevel: number; // 0-100
  fatLevel: number; // 0-100
  staminaLevel: number; // 0-100
}

export type EffortEventType =
  | "WORKOUT_LOGGED"
  | "GOAL_COMPLETED_STRENGTH"
  | "GOAL_COMPLETED_ENDURANCE"
  | "GOAL_COMPLETED_CONSISTENCY"
  | "GOAL_COMPLETED_WEIGHT_LOSS"
  | "GOAL_COMPLETED_MUSCLE_GAIN"
  | "MISSED_STREAK"; // troppi giorni senza attività registrata

export interface EffortEvent {
  type: EffortEventType;
  // intensità/peso dell'evento, es. durata allenamento in minuti,
  // o quanto un obiettivo era impegnativo (1 = normale, >1 = più ambizioso)
  weight?: number;
}

export type MetricSample = {
  type: "WEIGHT" | "BODY_FAT_PERCENT" | "MUSCLE_MASS" | "WORKOUT_MINUTES";
  value: number;
  recordedAt: Date;
};

export interface AvatarUpdateResult {
  previous: AvatarState;
  next: AvatarState;
  delta: AvatarState; // differenza (può essere negativa)
  reason: string;
}
