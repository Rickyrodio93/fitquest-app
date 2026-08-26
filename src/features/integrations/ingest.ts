import { prisma } from "@/lib/prisma";
import { applyDelta, AvatarState, calibrateFromMetrics, normalizeBodyFatPercent, normalizeMuscleMassPercent } from "@/features/avatar";
import { NormalizedSample } from "./types";

/**
 * Punto di ingresso unico per QUALSIASI provider (Google Health, Apple
 * Health, inserimento manuale...). Ogni adapter converte i propri dati
 * in NormalizedSample[] e li passa qui: da questo momento in poi la
 * logica è identica indipendentemente dalla fonte.
 *
 * Passi:
 * 1. Salva ogni campione come BodyMetric (storico grezzo, mai perso)
 * 2. Se tra i campioni ci sono peso/massa grassa/massa muscolare
 *    recenti, ricalibra l'avatar verso quei valori reali (vedi
 *    calibrateFromMetrics nel motore avatar — spostamento graduale,
 *    non un salto secco)
 */
export async function ingestSamples(userId: string, samples: NormalizedSample[]) {
  if (samples.length === 0) return { stored: 0, avatarRecalibrated: false };

  await prisma.bodyMetric.createMany({
    data: samples.map((s) => ({
      userId,
      type: s.type,
      value: s.value,
      unit: s.unit,
      recordedAt: s.recordedAt,
      source: s.source,
    })),
    skipDuplicates: true,
  });

  const latestBodyFat = mostRecentOfType(samples, "BODY_FAT_PERCENT");
  const latestMuscleMass = mostRecentOfType(samples, "MUSCLE_MASS");

  if (!latestBodyFat && !latestMuscleMass) {
    return { stored: samples.length, avatarRecalibrated: false };
  }

  const avatar = await prisma.avatar.findUnique({ where: { userId } });
  if (!avatar) {
    // L'utente ha collegato un wearable prima di completare l'onboarding
    // avatar: i dati restano salvati, la calibrazione avverrà al primo
    // sync utile dopo la creazione dell'avatar
    return { stored: samples.length, avatarRecalibrated: false };
  }

  const currentState: AvatarState = {
    muscleLevel: avatar.muscleLevel,
    fatLevel: avatar.fatLevel,
    staminaLevel: avatar.staminaLevel,
  };

  const targets: Partial<Pick<AvatarState, "muscleLevel" | "fatLevel">> = {};
  if (latestBodyFat) targets.fatLevel = normalizeBodyFatPercent(latestBodyFat.value);
  if (latestMuscleMass) targets.muscleLevel = normalizeMuscleMassPercent(latestMuscleMass.value);

  const result = calibrateFromMetrics(currentState, targets);

  await prisma.avatar.update({
    where: { userId },
    data: applyDelta(currentState, result.delta),
  });

  await prisma.avatarStateSnapshot.create({
    data: {
      avatarId: avatar.id,
      muscleLevel: result.next.muscleLevel,
      fatLevel: result.next.fatLevel,
      staminaLevel: result.next.staminaLevel,
      reason: "Sincronizzazione dati da wearable",
    },
  });

  return { stored: samples.length, avatarRecalibrated: true };
}

function mostRecentOfType(samples: NormalizedSample[], type: NormalizedSample["type"]) {
  return samples
    .filter((s) => s.type === type)
    .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0];
}
