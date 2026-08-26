import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Popola il database con dati demo realistici, utili per testare
 * subito l'app senza dover passare manualmente da registrazione e
 * onboarding. Sicuro da rilanciare più volte (upsert sull'utente).
 *
 * Esecuzione: npx prisma db seed
 */
async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@fitquest.app" },
    update: {},
    create: {
      email: "demo@fitquest.app",
      name: "Atleta Demo",
      passwordHash,
      usageContext: "BOTH",
    },
  });

  const avatar = await prisma.avatar.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      gender: "NEUTRAL",
      heightCm: 178,
      muscleLevel: 42,
      fatLevel: 35,
      staminaLevel: 30,
    },
  });

  await prisma.avatarStateSnapshot.createMany({
    data: [
      { avatarId: avatar.id, muscleLevel: 25, fatLevel: 45, staminaLevel: 15, reason: "Punto di partenza (onboarding)" },
      { avatarId: avatar.id, muscleLevel: 34, fatLevel: 40, staminaLevel: 22, reason: "Un mese di allenamenti costanti" },
      { avatarId: avatar.id, muscleLevel: 42, fatLevel: 35, staminaLevel: 30, reason: "Obiettivo di forza completato" },
    ],
  });

  const existingGoals = await prisma.goal.count({ where: { userId: user.id } });
  if (existingGoals === 0) {
    await prisma.goal.createMany({
      data: [
        {
          userId: user.id,
          title: "Allenati con costanza",
          category: "CONSISTENCY",
          targetValue: 12,
          currentValue: 8,
          unit: "sessioni",
          status: "ACTIVE",
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          avatarImpact: { staminaLevel: 1.5, muscleLevel: 0.5, fatLevel: -0.5 },
        },
        {
          userId: user.id,
          title: "Aumenta il carico in panca piana",
          category: "STRENGTH",
          targetValue: 5,
          currentValue: 2,
          unit: "kg in più",
          status: "ACTIVE",
          deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          avatarImpact: { muscleLevel: 3, fatLevel: -0.5, staminaLevel: 0.5 },
        },
        {
          userId: user.id,
          title: "Riduci la massa grassa",
          category: "WEIGHT_LOSS",
          targetValue: 3,
          currentValue: 3,
          unit: "kg persi",
          status: "COMPLETED",
          completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          avatarImpact: { fatLevel: -4 },
        },
      ],
    });
  }

  const existingPlans = await prisma.workoutPlan.count({ where: { userId: user.id } });
  if (existingPlans === 0) {
    await prisma.workoutPlan.create({
      data: {
        userId: user.id,
        title: "Piano consistency — intermediate",
        goalFocus: "CONSISTENCY",
        level: "INTERMEDIATE",
        environment: "BOTH",
        durationWeeks: 8,
        isActive: true,
        sessions: {
          create: [
            {
              dayOfWeek: 1,
              title: "Full Body A",
              exercises: {
                create: [
                  { name: "Squat con bilanciere", sets: 4, reps: "8-12", restSeconds: 75 },
                  { name: "Panca piana con manubri", sets: 4, reps: "8-12", restSeconds: 75 },
                  { name: "Rematore con manubrio", sets: 4, reps: "8-12", restSeconds: 75 },
                  { name: "Plank", sets: 3, reps: "10-12", restSeconds: 75 },
                ],
              },
            },
            {
              dayOfWeek: 3,
              title: "Full Body B",
              exercises: {
                create: [
                  { name: "Military press con manubri", sets: 4, reps: "8-12", restSeconds: 75 },
                  { name: "Trazioni alla sbarra", sets: 4, reps: "8-12", restSeconds: 75 },
                  { name: "Affondi", sets: 4, reps: "8-12", restSeconds: 75 },
                  { name: "Curl per bicipiti", sets: 3, reps: "8-12", restSeconds: 75 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  console.log("✅ Seed completato.");
  console.log("   Login demo → email: demo@fitquest.app · password: demo1234");
}

main()
  .catch((e) => {
    console.error("❌ Errore durante il seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
