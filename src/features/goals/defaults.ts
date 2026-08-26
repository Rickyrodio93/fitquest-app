import { AvatarState, EFFORT_EVENT_DELTAS } from "@/features/avatar";
import { GoalCategory } from "./types";

/**
 * Mappa ogni categoria di obiettivo al relativo evento del motore
 * avatar, per riutilizzare gli stessi delta base già calibrati lì
 * (single source of truth: i numeri vivono in features/avatar/engine.ts).
 */
const CATEGORY_TO_EFFORT_EVENT: Record<
  Exclude<GoalCategory, "CUSTOM">,
  keyof typeof EFFORT_EVENT_DELTAS
> = {
  STRENGTH: "GOAL_COMPLETED_STRENGTH",
  ENDURANCE: "GOAL_COMPLETED_ENDURANCE",
  CONSISTENCY: "GOAL_COMPLETED_CONSISTENCY",
  WEIGHT_LOSS: "GOAL_COMPLETED_WEIGHT_LOSS",
  MUSCLE_GAIN: "GOAL_COMPLETED_MUSCLE_GAIN",
};

/**
 * Calcola l'impatto di default sull'avatar per una categoria/difficoltà.
 * `difficultyWeight` amplifica l'effetto per obiettivi più ambiziosi
 * (es. 1 = standard, 2 = obiettivo lungo/impegnativo).
 *
 * Per CUSTOM non c'è un default sensato: l'utente (o l'admin/coach)
 * deve specificarlo esplicitamente in fase di creazione.
 */
export function getDefaultAvatarImpact(
  category: GoalCategory,
  difficultyWeight = 1
): Partial<AvatarState> | null {
  if (category === "CUSTOM") return null;

  const eventKey = CATEGORY_TO_EFFORT_EVENT[category];
  const base = EFFORT_EVENT_DELTAS[eventKey];

  return {
    muscleLevel: (base.muscleLevel ?? 0) * difficultyWeight,
    fatLevel: (base.fatLevel ?? 0) * difficultyWeight,
    staminaLevel: (base.staminaLevel ?? 0) * difficultyWeight,
  };
}

/**
 * Template pronti da mostrare in UI quando l'utente crea un nuovo
 * obiettivo — velocizzano l'onboarding invece di partire da un form
 * completamente vuoto.
 */
export const GOAL_TEMPLATES: Array<{
  category: GoalCategory;
  title: string;
  unit: string;
  suggestedTarget: number;
  suggestedDurationDays: number;
}> = [
  { category: "CONSISTENCY", title: "Allenati con costanza", unit: "sessioni", suggestedTarget: 12, suggestedDurationDays: 30 },
  { category: "STRENGTH", title: "Aumenta il carico in un esercizio chiave", unit: "kg in più", suggestedTarget: 5, suggestedDurationDays: 60 },
  { category: "ENDURANCE", title: "Migliora la resistenza cardio", unit: "minuti continui", suggestedTarget: 10, suggestedDurationDays: 45 },
  { category: "WEIGHT_LOSS", title: "Riduci la massa grassa", unit: "kg persi", suggestedTarget: 3, suggestedDurationDays: 60 },
  { category: "MUSCLE_GAIN", title: "Aumenta la massa muscolare", unit: "kg guadagnati", suggestedTarget: 2, suggestedDurationDays: 90 },
];
