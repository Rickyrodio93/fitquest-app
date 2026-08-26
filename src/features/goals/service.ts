import { prisma } from "@/lib/prisma";
import { applyDelta, AvatarState } from "@/features/avatar";
import { applyProgressIncrement, isGoalExpired } from "./progress";
import { getDefaultAvatarImpact } from "./defaults";
import { GoalCategory } from "./types";

interface CreateGoalInput {
  userId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  targetValue: number;
  unit: string;
  deadline?: Date;
  difficultyWeight?: number; // amplifica l'impatto sull'avatar, default 1
  customAvatarImpact?: Partial<AvatarState>; // richiesto se category === CUSTOM
}

export async function createGoal(input: CreateGoalInput) {
  const avatarImpact =
    input.customAvatarImpact ??
    getDefaultAvatarImpact(input.category, input.difficultyWeight ?? 1);

  return prisma.goal.create({
    data: {
      userId: input.userId,
      title: input.title,
      description: input.description,
      category: input.category,
      targetValue: input.targetValue,
      unit: input.unit,
      deadline: input.deadline,
      avatarImpact: avatarImpact as object | undefined,
    },
  });
}

/**
 * Registra un incremento di progresso su un obiettivo. Se l'incremento
 * porta al completamento, in una singola transazione:
 * 1. aggiorna lo status del Goal a COMPLETED
 * 2. applica l'avatarImpact allo stato corrente dell'Avatar
 * 3. salva uno snapshot storico dell'avatar con il motivo del cambio
 *
 * Ritorna il goal aggiornato e, se applicabile, il nuovo stato avatar.
 */
export async function recordGoalProgress(goalId: string, incrementBy: number) {
  return prisma.$transaction(async (tx) => {
    const goal = await tx.goal.findUniqueOrThrow({ where: { id: goalId } });

    const update = applyProgressIncrement(goal, incrementBy);

    const updatedGoal = await tx.goal.update({
      where: { id: goalId },
      data: {
        currentValue: update.newCurrentValue,
        ...(update.justCompleted
          ? { status: "COMPLETED", completedAt: new Date() }
          : {}),
      },
    });

    if (!update.justCompleted) {
      return { goal: updatedGoal, avatar: null };
    }

    // --- Applica l'impatto sull'avatar, solo al momento del completamento ---
    const avatar = await tx.avatar.findUnique({ where: { userId: goal.userId } });
    if (!avatar) {
      // L'utente non ha ancora completato l'onboarding avatar: il goal
      // resta comunque completato, semplicemente non c'è nulla da aggiornare
      return { goal: updatedGoal, avatar: null };
    }

    const impact = (goal.avatarImpact as Partial<AvatarState> | null) ?? {};
    const currentState: AvatarState = {
      muscleLevel: avatar.muscleLevel,
      fatLevel: avatar.fatLevel,
      staminaLevel: avatar.staminaLevel,
    };
    const nextState = applyDelta(currentState, impact);

    const updatedAvatar = await tx.avatar.update({
      where: { userId: goal.userId },
      data: nextState,
    });

    await tx.avatarStateSnapshot.create({
      data: {
        avatarId: avatar.id,
        muscleLevel: nextState.muscleLevel,
        fatLevel: nextState.fatLevel,
        staminaLevel: nextState.staminaLevel,
        reason: `Obiettivo completato: ${goal.title}`,
      },
    });

    return { goal: updatedGoal, avatar: updatedAvatar };
  });
}

/**
 * Da eseguire periodicamente (cron): marca come FAILED gli obiettivi
 * attivi la cui deadline è passata senza essere stati completati.
 */
export async function expireOverdueGoals() {
  const activeGoals = await prisma.goal.findMany({
    where: { status: "ACTIVE", deadline: { not: null } },
  });

  const now = new Date();
  const toExpire = activeGoals.filter((g) => isGoalExpired(g, now));

  if (toExpire.length === 0) return { expiredCount: 0 };

  await prisma.goal.updateMany({
    where: { id: { in: toExpire.map((g) => g.id) } },
    data: { status: "FAILED" },
  });

  return { expiredCount: toExpire.length };
}
