import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const plan = await prisma.workoutPlan.findFirst({
    where: { userId, isActive: true },
    include: { sessions: { include: { exercises: true }, orderBy: { dayOfWeek: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const recentLogs = await prisma.workoutLog.findMany({
    where: { userId },
    orderBy: { performedAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ plan, recentLogs });
}
