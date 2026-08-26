import { prisma } from "@/lib/prisma";
import { generateWorkoutPlan } from "./generator";
import { GeneratePlanInput } from "./types";

/**
 * Genera un piano di allenamento e lo salva nel DB, disattivando
 * eventuali piani precedentemente attivi per lo stesso utente
 * (un utente ha un solo piano attivo alla volta, per semplicità).
 */
export async function generateAndSavePlan(userId: string, input: GeneratePlanInput) {
  const draft = generateWorkoutPlan(input);

  return prisma.$transaction(async (tx) => {
    await tx.workoutPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    return tx.workoutPlan.create({
      data: {
        userId,
        title: draft.title,
        goalFocus: draft.goalFocus ?? undefined,
        level: draft.level,
        environment: draft.environment,
        durationWeeks: draft.durationWeeks,
        isActive: true,
        sessions: {
          create: draft.sessions.map((session) => ({
            dayOfWeek: session.dayOfWeek,
            title: session.title,
            exercises: {
              create: session.exercises.map((ex) => ({
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                restSeconds: ex.restSeconds,
              })),
            },
          })),
        },
      },
      include: { sessions: { include: { exercises: true } } },
    });
  });
}
