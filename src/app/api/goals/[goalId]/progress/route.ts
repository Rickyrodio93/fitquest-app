import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordGoalProgress } from "@/features/goals";
import { z } from "zod";

const progressSchema = z.object({
  incrementBy: z.number(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;

  // Verifica che l'obiettivo appartenga all'utente autenticato
  const goal = await prisma.goal.findUnique({ where: { id: params.goalId } });
  if (!goal || goal.userId !== userId) {
    return NextResponse.json({ error: "Obiettivo non trovato" }, { status: 404 });
  }

  const result = await recordGoalProgress(params.goalId, parsed.data.incrementBy);

  return NextResponse.json({
    goal: result.goal,
    avatarUpdated: result.avatar !== null,
    avatar: result.avatar,
  });
}
