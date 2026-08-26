import { GoalLike, GoalProgressUpdate } from "./types";

/**
 * Calcola la percentuale di completamento (0-100), limitata ai bordi.
 */
export function computeProgressPercent(goal: Pick<GoalLike, "currentValue" | "targetValue">): number {
  if (goal.targetValue <= 0) return 0;
  const pct = (goal.currentValue / goal.targetValue) * 100;
  return Math.min(100, Math.max(0, pct));
}

/**
 * Applica un incremento di progresso e determina se l'obiettivo è
 * appena stato completato in questo momento (transizione, non stato).
 * Questo distinguo è importante: vogliamo applicare l'impatto
 * sull'avatar UNA SOLA VOLTA, nel momento esatto del completamento,
 * non ogni volta che l'obiettivo viene ricontrollato.
 */
export function applyProgressIncrement(
  goal: Pick<GoalLike, "currentValue" | "targetValue" | "status">,
  incrementBy: number
): GoalProgressUpdate {
  const wasAlreadyCompleted = goal.status === "COMPLETED";
  const newCurrentValue = Math.max(0, goal.currentValue + incrementBy);
  const nowCompleted = newCurrentValue >= goal.targetValue;

  return {
    newCurrentValue,
    justCompleted: !wasAlreadyCompleted && nowCompleted,
    progressPercent: computeProgressPercent({ currentValue: newCurrentValue, targetValue: goal.targetValue }),
  };
}

/**
 * Verifica se un obiettivo attivo è scaduto senza essere stato
 * completato. Da eseguire in un job periodico (es. cron giornaliero)
 * per aggiornare lo status ad ACTIVE -> FAILED.
 */
export function isGoalExpired(
  goal: Pick<GoalLike, "status" | "deadline">,
  now: Date = new Date()
): boolean {
  if (goal.status !== "ACTIVE") return false;
  if (!goal.deadline) return false;
  return now.getTime() > goal.deadline.getTime();
}
