import { AvatarState } from "./types";

/**
 * Traduce i valori numerici (0-100) dell'avatar in una "tier" discreta,
 * usata per scegliere quale asset/variante grafica mostrare.
 *
 * Usiamo 5 livelli per ogni asse (muscolo, grasso) = fino a 25
 * combinazioni visive. Con un sistema a "layer" (es. corpo base +
 * layer massa muscolare + layer definizione), bastano molti meno
 * asset perché i layer si combinano tra loro.
 */

export type Tier = 1 | 2 | 3 | 4 | 5;

export interface AvatarVisualState {
  muscleTier: Tier;
  fatTier: Tier;
  staminaTier: Tier;
  // Chiave pronta per selezionare l'asset, es. "m3_f2"
  spriteKey: string;
}

function levelToTier(level: number): Tier {
  if (level < 20) return 1;
  if (level < 40) return 2;
  if (level < 60) return 3;
  if (level < 80) return 4;
  return 5;
}

export function getAvatarVisualState(state: AvatarState): AvatarVisualState {
  const muscleTier = levelToTier(state.muscleLevel);
  const fatTier = levelToTier(state.fatLevel);
  const staminaTier = levelToTier(state.staminaLevel);

  return {
    muscleTier,
    fatTier,
    staminaTier,
    spriteKey: `m${muscleTier}_f${fatTier}`,
  };
}

/**
 * Etichette testuali descrittive, utili per messaggi motivazionali
 * o riepiloghi ("Il tuo avatar è passato da 'Tonico' a 'Atletico'").
 */
const MUSCLE_LABELS: Record<Tier, string> = {
  1: "Snello",
  2: "Tonico",
  3: "Atletico",
  4: "Muscoloso",
  5: "Massiccio",
};

const FAT_LABELS: Record<Tier, string> = {
  1: "Molto definito",
  2: "Definito",
  3: "Regolare",
  4: "Morbido",
  5: "Sovrappeso",
};

export function describeAvatarState(state: AvatarState): string {
  const visual = getAvatarVisualState(state);
  return `${MUSCLE_LABELS[visual.muscleTier]} • ${FAT_LABELS[visual.fatTier]}`;
}
