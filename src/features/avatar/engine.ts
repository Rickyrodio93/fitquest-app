import { AvatarState, EffortEvent, EffortEventType, AvatarUpdateResult } from "./types";

/**
 * =================================================================
 * MOTORE DI EVOLUZIONE DELL'AVATAR
 * =================================================================
 *
 * Il motore lavora su due livelli, applicati in momenti diversi:
 *
 * 1) EFFORT LAYER (immediato, motivazionale)
 *    Ogni allenamento loggato o obiettivo completato dà un piccolo
 *    "boost" istantaneo. Serve per il rinforzo positivo: l'utente
 *    vede il proprio avatar reagire subito alle proprie azioni.
 *
 * 2) CALIBRATION LAYER (periodico, basato su dati reali)
 *    Quando arrivano dati oggettivi (peso, % massa grassa, massa
 *    muscolare da bilancia/wearable), lo stato dell'avatar viene
 *    "tirato" verso il valore reale con un peso limitato per ciclo,
 *    per evitare salti bruschi ma garantire che nel tempo l'avatar
 *    rifletta la realtà, non solo lo sforzo percepito.
 *
 * Questo evita due problemi opposti:
 * - un avatar che migliora solo perché l'utente "checka la casella"
 *   senza risultati fisici reali
 * - un avatar che ignora completamente lo sforzo e si aggiorna solo
 *   a bilanciate periodiche, risultando demotivante nel breve termine
 * =================================================================
 */

export const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

export function applyDelta(state: AvatarState, delta: Partial<AvatarState>): AvatarState {
  return {
    muscleLevel: clamp(state.muscleLevel + (delta.muscleLevel ?? 0)),
    fatLevel: clamp(state.fatLevel + (delta.fatLevel ?? 0)),
    staminaLevel: clamp(state.staminaLevel + (delta.staminaLevel ?? 0)),
  };
}

// ---------------------------------------------------------------
// 1) EFFORT LAYER
// ---------------------------------------------------------------

/**
 * Delta base per tipo di evento (a peso=1). Valori volutamente piccoli
 * per i singoli allenamenti: la trasformazione visibile arriva dalla
 * costanza nel tempo, non da un singolo evento.
 */
export const EFFORT_EVENT_DELTAS: Record<EffortEventType, Partial<AvatarState>> = {
  WORKOUT_LOGGED: { muscleLevel: 0.3, fatLevel: -0.1, staminaLevel: 0.5 },
  GOAL_COMPLETED_STRENGTH: { muscleLevel: 3, fatLevel: -0.5, staminaLevel: 0.5 },
  GOAL_COMPLETED_ENDURANCE: { staminaLevel: 3, fatLevel: -1 },
  GOAL_COMPLETED_CONSISTENCY: { staminaLevel: 1.5, muscleLevel: 0.5, fatLevel: -0.5 },
  GOAL_COMPLETED_WEIGHT_LOSS: { fatLevel: -4 },
  GOAL_COMPLETED_MUSCLE_GAIN: { muscleLevel: 4, fatLevel: 0.5 }, // piccolo trade-off realistico
  MISSED_STREAK: { muscleLevel: -0.5, fatLevel: 0.5, staminaLevel: -1 },
};

export function applyEffortEvent(
  state: AvatarState,
  event: EffortEvent
): AvatarUpdateResult {
  const weight = event.weight ?? 1;
  const baseDelta = EFFORT_EVENT_DELTAS[event.type];

  const scaledDelta: Partial<AvatarState> = {
    muscleLevel: (baseDelta.muscleLevel ?? 0) * weight,
    fatLevel: (baseDelta.fatLevel ?? 0) * weight,
    staminaLevel: (baseDelta.staminaLevel ?? 0) * weight,
  };

  const next = applyDelta(state, scaledDelta);

  return {
    previous: state,
    next,
    delta: {
      muscleLevel: next.muscleLevel - state.muscleLevel,
      fatLevel: next.fatLevel - state.fatLevel,
      staminaLevel: next.staminaLevel - state.staminaLevel,
    },
    reason: `Evento: ${event.type}`,
  };
}

/**
 * Decadimento per inattività prolungata: se l'utente non registra
 * nulla per troppi giorni, l'avatar regredisce leggermente.
 * Va chiamato da un job schedulato (es. cron giornaliero/settimanale).
 */
export function applyInactivityDecay(
  state: AvatarState,
  daysSinceLastActivity: number
): AvatarUpdateResult {
  if (daysSinceLastActivity < 7) {
    return { previous: state, next: state, delta: { muscleLevel: 0, fatLevel: 0, staminaLevel: 0 }, reason: "Nessun decadimento" };
  }
  // Ogni settimana di inattività oltre la prima applica il delta di MISSED_STREAK
  const weeksInactive = Math.floor(daysSinceLastActivity / 7);
  return applyEffortEvent(state, { type: "MISSED_STREAK", weight: weeksInactive });
}

// ---------------------------------------------------------------
// 2) CALIBRATION LAYER — normalizzazione dati reali
// ---------------------------------------------------------------

/**
 * Converte una % di massa grassa reale in un fatLevel (0-100).
 * Range di riferimento volutamente ampio e semplificato per l'MVP:
 * 6% (atleta molto definito) -> fatLevel 0
 * 35% (alta massa grassa)    -> fatLevel 100
 * Andrà raffinato per genere/età in una versione successiva.
 */
export function normalizeBodyFatPercent(percent: number): number {
  const MIN = 6;
  const MAX = 35;
  return clamp(((percent - MIN) / (MAX - MIN)) * 100);
}

/**
 * Converte una % di massa muscolare (scheletrica, sul peso corporeo)
 * in un muscleLevel (0-100).
 * 25% -> muscleLevel 0 (bassa)
 * 50% -> muscleLevel 100 (alta)
 */
export function normalizeMuscleMassPercent(percent: number): number {
  const MIN = 25;
  const MAX = 50;
  return clamp(((percent - MIN) / (MAX - MIN)) * 100);
}

/**
 * Ricalibra lo stato dell'avatar verso valori target derivati da dati
 * corporei reali, con uno spostamento massimo per ciclo (per evitare
 * salti visivi bruschi da una singola misurazione anomala).
 *
 * alpha: quanto ci si avvicina al target in questo ciclo (0-1)
 * maxChangePerCycle: tetto massimo di variazione per punto, per ciclo
 */
export function calibrateFromMetrics(
  state: AvatarState,
  targets: Partial<Pick<AvatarState, "muscleLevel" | "fatLevel">>,
  alpha = 0.3,
  maxChangePerCycle = 8
): AvatarUpdateResult {
  const next = { ...state };

  (["muscleLevel", "fatLevel"] as const).forEach((key) => {
    const target = targets[key];
    if (target === undefined) return;

    const rawDelta = (target - state[key]) * alpha;
    const boundedDelta = clamp(rawDelta, -maxChangePerCycle, maxChangePerCycle);
    next[key] = clamp(state[key] + boundedDelta);
  });

  return {
    previous: state,
    next,
    delta: {
      muscleLevel: next.muscleLevel - state.muscleLevel,
      fatLevel: next.fatLevel - state.fatLevel,
      staminaLevel: 0,
    },
    reason: "Calibrazione da dati corporei reali",
  };
}
