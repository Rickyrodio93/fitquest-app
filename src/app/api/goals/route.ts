import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoal } from "@/features/goals";
import { z } from "zod";

const createGoalSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.enum([
    "STRENGTH",
    "ENDURANCE",
    "CONSISTENCY",
    "WEIGHT_LOSS",
    "MUSCLE_GAIN",
    "CUSTOM",
  ]),
  targetValue: z.number().positive(),
  unit: z.string().min(1),
  deadline: z.string().datetime().optional(),
  difficultyWeight: z.number().min(0.5).max(3).optional(),
  customAvatarImpact: z
    .object({
      muscleLevel: z.number().optional(),
      fatLevel: z.number().optional(),
      staminaLevel: z.number().optional(),
    })
    .optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ goals });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createGoalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.category === "CUSTOM" && !parsed.data.customAvatarImpact) {
    return NextResponse.json(
      { error: "Per obiettivi CUSTOM è richiesto customAvatarImpact" },
      { status: 400 }
    );
  }

  const userId = (session.user as { id: string }).id;

  const goal = await createGoal({
    userId,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    targetValue: parsed.data.targetValue,
    unit: parsed.data.unit,
    deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
    difficultyWeight: parsed.data.difficultyWeight,
    customAvatarImpact: parsed.data.customAvatarImpact,
  });

  return NextResponse.json({ goal }, { status: 201 });
}
