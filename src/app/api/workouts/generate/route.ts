import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAndSavePlan } from "@/features/workouts";
import { z } from "zod";

const generatePlanSchema = z.object({
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  environment: z.enum(["HOME", "GYM", "BOTH"]),
  daysPerWeek: z.number().int().min(1).max(7),
  goalFocus: z
    .enum(["STRENGTH", "ENDURANCE", "CONSISTENCY", "WEIGHT_LOSS", "MUSCLE_GAIN", "CUSTOM"])
    .optional(),
  durationWeeks: z.number().int().min(1).max(52).optional(),
  exercisesPerSession: z.number().int().min(3).max(10).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = generatePlanSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;
  const plan = await generateAndSavePlan(userId, parsed.data);

  return NextResponse.json({ plan }, { status: 201 });
}
