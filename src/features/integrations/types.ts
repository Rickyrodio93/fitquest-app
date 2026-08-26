import { MetricSource } from "@prisma/client";

/**
 * Rappresentazione normalizzata di un campione dati, indipendente
 * dal provider di origine (Google Health, Apple Health, inserimento
 * manuale...). Tutti gli adapter dei provider convertono i propri
 * formati proprietari in questa forma comune prima di salvarla.
 */
export interface NormalizedSample {
  type: "WEIGHT" | "BODY_FAT_PERCENT" | "MUSCLE_MASS" | "HEART_RATE" | "CALORIES_BURNED" | "STEPS" | "WORKOUT_MINUTES" | "SLEEP_HOURS";
  value: number;
  unit: string;
  recordedAt: Date;
  source: MetricSource;
}

export interface GoogleHealthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}
