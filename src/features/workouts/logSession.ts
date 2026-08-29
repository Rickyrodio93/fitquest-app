import { prisma } from "@/lib/prisma";
import { applyEffortEvent, AvatarState } from "@/features/avatar";
import { recordGoalProgress } from "@/features/goals";
import type { MetricSource } from "@prisma/client";

interface LogSessionInput {
  title: string;
  durationMin: number;
  /** Se non passato, usa l'istante corrente (log manuale) */
  performedAt?: Date;
  /** MANUAL di default; usare la fonte reale per gli import da wearable */
  source?: MetricSource;
}

/**
 * Registra una sessione di allenamento come completata. Effetti a
 * cascata (riusando logica già esistente, non duplicata):
 *
 * 1. Salva il WorkoutLog (storico)
 * 2. Applica un piccolo boost immediato all'avatar (WORKOUT_LOGGED,
 *    lo stesso evento del motore avatar usato altrove)
 * 3. Fa avanzare di 1 ogni obiettivo attivo di categoria CONSISTENCY
 *    (es. "12 allenamenti in 30 giorni") — se questo porta al
 *    completamento dell'obiettivo, recordGoalProgress applicherà
 *    automaticamente anche il suo impatto sull'avatar
 *
 * Per le sessioni importate da wearable (source diverso da MANUAL),
 * evitiamo doppioni: se una sessione con lo stesso utente/fonte/orario
 * esiste già (tipico di un re-sync), la saltiamo senza riapplicare
 * gli effetti sull'avatar/obiettivi una seconda volta.
 */
export async function logWorkoutSession(userId: string, input: LogSessionInput) {
  const source: MetricSource = input.source ?? "MANUAL";

  if (source !== "MANUAL" && input.performedAt) {
    const existing = await prisma.workoutLog.findFirst({
      where: { userId, source, performedAt: input.performedAt },
    });
    if (existing) {
      return { log: existing, avatar: null, goalUpdates: [], skipped: true as const };
    }
  }

  const log = await prisma.workoutLog.create({
    data: {
      userId,
      title: input.title,
      durationMin: input.durationMin,
      source,
      ...(input.performedAt ? { performedAt: input.performedAt } : {}),
    },
  });

  let updatedAvatar = null;
  const avatar = await prisma.avatar.findUnique({ where: { userId } });
  if (avatar) {
    const currentState: AvatarState = {
      muscleLevel: avatar.muscleLevel,
      fatLevel: avatar.fatLevel,
      staminaLevel: avatar.staminaLevel,
    };
    const result = applyEffortEvent(currentState, { type: "WORKOUT_LOGGED" });
    updatedAvatar = await prisma.avatar.update({ where: { userId }, data: result.next });
  }

  const consistencyGoals = await prisma.goal.findMany({
    where: { userId, status: "ACTIVE", category: "CONSISTENCY" },
  });

  const goalResults = [];
  for (const goal of consistencyGoals) {
    goalResults.push(await recordGoalProgress(goal.id, 1));
  }

  return { log, avatar: updatedAvatar, goalUpdates: goalResults };
}
