"use client";

import { AvatarState, getAvatarVisualState, describeAvatarState } from "@/features/avatar";

interface AvatarPreviewProps {
  state: AvatarState;
  athleteName?: string;
}

/**
 * L'avatar non è un'immagine statica: è una silhouette costruita da
 * forme SVG indipendenti (spalle, petto, vita, gambe), ciascuna scalata
 * in base ai livelli muscleLevel/fatLevel. Il risultato si comporta
 * come una "scheda atleta" — stile scheda di carico da palestra —
 * che si aggiorna dal vivo mentre i valori cambiano.
 */
export function AvatarPreview({ state, athleteName = "Il tuo atleta" }: AvatarPreviewProps) {
  const visual = getAvatarVisualState(state);
  const description = describeAvatarState(state);

  const shoulderScale = 0.85 + (visual.muscleTier - 1) * 0.09;
  const chestScale = 0.88 + (visual.muscleTier - 1) * 0.07;
  const waistScale = 0.85 + (visual.fatTier - 1) * 0.11;
  const armScale = 0.9 + (visual.muscleTier - 1) * 0.08;

  const outlineIntensity = 0.35 + visual.muscleTier * 0.13;

  return (
    <div className="relative w-full max-w-sm rounded-lg border border-ink-line bg-ink-panel bg-grid bg-grid p-6">
      {/* Eyebrow */}
      <div className="flex items-center justify-between border-b border-ink-line pb-3">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-paper-muted">
          Scheda atleta
        </span>
        <span className="font-mono text-xs text-paper-muted">
          Lv.{visual.muscleTier + visual.staminaTier}
        </span>
      </div>

      {/* Nome e descrizione */}
      <div className="mt-3">
        <h3 className="font-display text-xl font-semibold text-paper">{athleteName}</h3>
        <p className="font-mono text-xs text-growth">{description}</p>
      </div>

      {/* Silhouette procedurale */}
      <div className="mt-4 flex justify-center">
        <svg viewBox="0 0 200 260" width="180" height="234" className="overflow-visible">
          {/* Testa */}
          <circle cx="100" cy="38" r="20" fill="#2A2F3A" stroke="#4FD1A5" strokeOpacity={outlineIntensity} strokeWidth="2" />

          {/* Collo */}
          <rect x="93" y="55" width="14" height="14" fill="#2A2F3A" />

          {/* Spalle (trapezio) */}
          <g style={{ transform: `scaleX(${shoulderScale})`, transformOrigin: "100px 78px", transition: "transform 400ms ease" }}>
            <polygon points="60,95 140,95 128,70 72,70" fill="#2A2F3A" stroke="#4FD1A5" strokeOpacity={outlineIntensity} strokeWidth="2" />
          </g>

          {/* Braccia */}
          <g style={{ transform: `scaleX(${armScale})`, transformOrigin: "100px 130px", transition: "transform 400ms ease" }}>
            <rect x="48" y="95" width="16" height="75" rx="6" fill="#232833" />
            <rect x="136" y="95" width="16" height="75" rx="6" fill="#232833" />
          </g>

          {/* Petto/torso */}
          <g style={{ transform: `scaleX(${chestScale})`, transformOrigin: "100px 110px", transition: "transform 400ms ease" }}>
            <rect x="72" y="92" width="56" height="48" fill="#2A2F3A" stroke="#4FD1A5" strokeOpacity={outlineIntensity} strokeWidth="2" />
          </g>

          {/* Vita/addome — reagisce al fatLevel */}
          <g style={{ transform: `scaleX(${waistScale})`, transformOrigin: "100px 165px", transition: "transform 400ms ease" }}>
            <rect
              x="76"
              y="138"
              width="48"
              height="55"
              fill="#2A2F3A"
              stroke={visual.fatTier >= 4 ? "#E2725B" : "#4FD1A5"}
              strokeOpacity={0.5}
              strokeWidth="2"
            />
          </g>

          {/* Gambe */}
          <rect x="78" y="193" width="18" height="60" rx="6" fill="#232833" />
          <rect x="104" y="193" width="18" height="60" rx="6" fill="#232833" />
        </svg>
      </div>

      {/* Readout statistiche in stile scoreboard */}
      <div className="mt-4 space-y-2 border-t border-ink-line pt-4">
        <StatBar label="Muscolo" value={state.muscleLevel} color="bg-growth" />
        <StatBar label="Massa grassa" value={state.fatLevel} color="bg-caution" />
        <StatBar label="Costanza" value={state.staminaLevel} color="bg-effort" />
      </div>
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-wide text-paper-muted">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink">
        <div
          className={`h-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${Math.round(value)}%` }}
        />
      </div>
      <span className="stat-value w-8 shrink-0 text-right font-mono text-[11px] text-paper">
        {Math.round(value)}
      </span>
    </div>
  );
}
