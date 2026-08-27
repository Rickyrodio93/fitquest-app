import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { logWorkoutSession } from "@/features/workouts";

const logSchema = z.object({
  title: z.string().min(1),
  durationMin: z.number().int().min(1).max(300),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const body = await request.json();
  const parsed = logSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await logWorkoutSession(userId, parsed.data);
  return NextResponse.json(result, { status: 201 });
}
