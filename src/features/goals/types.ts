import { AvatarState } from "@/features/avatar";

export type GoalCategory =
  | "STRENGTH"
  | "ENDURANCE"
  | "CONSISTENCY"
  | "WEIGHT_LOSS"
  | "MUSCLE_GAIN"
  | "CUSTOM";

export type GoalStatus = "ACTIVE" | "COMPLETED" | "FAILED" | "PAUSED";

/**
 * Rappresentazione "di lavoro" di un obiettivo (sottoinsieme del
 * modello Prisma Goal, usato nelle funzioni pure di logica).
 *
 * Convenzione importante: currentValue si muove SEMPRE verso
 * targetValue man mano che si fanno progressi, indipendentemente
 * dalla categoria. Es. "Perdi 5kg" -> target=5, currentValue = kg
 * persi finora (non il peso assoluto). Questo tiene la logica di
 * completamento uniforme per tutte le categorie.
 */
export interface GoalLike {
  id: string;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  status: GoalStatus;
  deadline: Date | null;
  avatarImpact: Partial<AvatarState> | null;
}

export interface GoalProgressUpdate {
  newCurrentValue: number;
  justCompleted: boolean;
  progressPercent: number;
}
