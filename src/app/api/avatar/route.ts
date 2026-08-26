import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeBodyFatPercent, normalizeMuscleMassPercent } from "@/features/avatar";

const createAvatarSchema = z.object({
  gender: z.enum(["MASCULINE", "FEMININE", "NEUTRAL"]),
  heightCm: z.number().int().min(120).max(230),
  usageContext: z.enum(["HOME", "GYM", "BOTH"]),
  // Autovalutazione iniziale (opzionale): se l'utente conosce la sua
  // % di massa grassa/muscolare (es. da una bilancia impedenziometrica),
  // la usiamo per calibrare subito l'avatar invece di partire "neutro"
  knownBodyFatPercent: z.number().min(3).max(60).optional(),
  knownMuscleMassPercent: z.number().min(15).max(60).optional(),
  // In alternativa, un'autovalutazione semplice su scala 1-5
  selfAssessedBuild: z.number().int().min(1).max(5).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const avatar = await prisma.avatar.findUnique({ where: { userId } });
  return NextResponse.json({ avatar });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const existing = await prisma.avatar.findUnique({ where: { userId } });
  if (existing) {
    return NextResponse.json({ error: "Avatar già creato" }, { status: 409 });
  }

  const body = await request.json();
  const parsed = createAvatarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Punto di partenza dell'avatar: se abbiamo dati corporei reali li
  // usiamo (massima precisione), altrimenti un'autovalutazione 1-5,
  // altrimenti un valore neutro di default
  const fatLevel = data.knownBodyFatPercent !== undefined
    ? normalizeBodyFatPercent(data.knownBodyFatPercent)
    : data.selfAssessedBuild !== undefined
    ? (data.selfAssessedBuild - 1) * 20 // mappa 1-5 -> 0-80 (grezzo, poi calibrato coi dati reali)
    : 40;

  const muscleLevel = data.knownMuscleMassPercent !== undefined
    ? normalizeMuscleMassPercent(data.knownMuscleMassPercent)
    : data.selfAssessedBuild !== undefined
    ? (data.selfAssessedBuild - 1) * 15
    : 20;

  const avatar = await prisma.avatar.create({
    data: {
      userId,
      gender: data.gender,
      heightCm: data.heightCm,
      muscleLevel,
      fatLevel,
      staminaLevel: 15, // parte sempre bassa: si costruisce con la costanza
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { usageContext: data.usageContext },
  });

  return NextResponse.json({ avatar }, { status: 201 });
}
