import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const goal = await prisma.goal.findUnique({ where: { id: params.goalId } });
  if (!goal || goal.userId !== userId) {
    return NextResponse.json({ error: "Obiettivo non trovato" }, { status: 404 });
  }

  // Non permettiamo di riportare in pausa/attivo un obiettivo già
  // concluso (completato o fallito) — quello stato è definitivo
  if (goal.status === "COMPLETED" || goal.status === "FAILED") {
    return NextResponse.json(
      { error: "Non è possibile modificare un obiettivo già concluso" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.goal.update({
    where: { id: params.goalId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ goal: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const goal = await prisma.goal.findUnique({ where: { id: params.goalId } });
  if (!goal || goal.userId !== userId) {
    return NextResponse.json({ error: "Obiettivo non trovato" }, { status: 404 });
  }

  await prisma.goal.delete({ where: { id: params.goalId } });
  return NextResponse.json({ success: true });
}
