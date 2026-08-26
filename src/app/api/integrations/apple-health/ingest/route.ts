import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveUserFromAppleHealthToken, ingestAppleHealthSamples } from "@/features/integrations/service";
import { NormalizedSample } from "@/features/integrations/types";

const sampleSchema = z.object({
  type: z.enum([
    "WEIGHT",
    "BODY_FAT_PERCENT",
    "MUSCLE_MASS",
    "HEART_RATE",
    "CALORIES_BURNED",
    "STEPS",
    "WORKOUT_MINUTES",
    "SLEEP_HOURS",
  ]),
  value: z.number(),
  unit: z.string(),
  recordedAt: z.string().datetime(),
});

const ingestSchema = z.object({
  samples: z.array(sampleSchema).min(1).max(500),
});

/**
 * Endpoint pensato per essere chiamato da una Shortcuts automation
 * (o futura companion app iOS), non dal browser dell'utente.
 * Autenticazione tramite token personale (vedi /api/integrations/apple-health/token),
 * non tramite sessione NextAuth — il chiamante non è un browser loggato.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json({ error: "Token mancante" }, { status: 401 });
  }

  const userId = await resolveUserFromAppleHealthToken(token);
  if (!userId) {
    return NextResponse.json({ error: "Token non valido" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const samples: NormalizedSample[] = parsed.data.samples.map((s) => ({
    type: s.type,
    value: s.value,
    unit: s.unit,
    recordedAt: new Date(s.recordedAt),
    source: "APPLE_HEALTH",
  }));

  const result = await ingestAppleHealthSamples(userId, samples);
  return NextResponse.json(result);
}
