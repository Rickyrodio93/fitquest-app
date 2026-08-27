import { prisma } from "@/lib/prisma";
import { applyEffortEvent, AvatarState } from "@/features/avatar";
import { recordGoalProgress } from "@/features/goals";

interface LogSessionInput {
  title: string;
  durationMin: number;
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
 */
export async function logWorkoutSession(userId: string, input: LogSessionInput) {
  const log = await prisma.workoutLog.create({
    data: { userId, title: input.title, durationMin: input.durationMin, source: "MANUAL" },
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
