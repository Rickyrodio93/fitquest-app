import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const workoutSession = await prisma.workoutSession.findUnique({
    where: { id: params.sessionId },
    include: { exercises: true, plan: { select: { userId: true, title: true } } },
  });

  if (!workoutSession || workoutSession.plan.userId !== userId) {
    return NextResponse.json({ error: "Sessione non trovata" }, { status: 404 });
  }

  return NextResponse.json({
    session: {
      id: workoutSession.id,
      title: workoutSession.title,
      dayOfWeek: workoutSession.dayOfWeek,
      exercises: workoutSession.exercises,
    },
    planTitle: workoutSession.plan.title,
  });
}
