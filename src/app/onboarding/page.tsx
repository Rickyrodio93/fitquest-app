"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { normalizeBodyFatPercent, normalizeMuscleMassPercent } from "@/features/avatar";

const Avatar3D = dynamic(() => import("@/features/avatar/ui/Avatar3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 w-full max-w-sm items-center justify-center rounded-lg border border-ink-line bg-ink-panel">
      <p className="font-mono text-xs text-paper-muted">Caricamento avatar 3D…</p>
    </div>
  ),
});

type Gender = "MASCULINE" | "FEMININE" | "NEUTRAL";
type UsageContext = "HOME" | "GYM" | "BOTH";

const BUILD_OPTIONS = [
  { value: 1, label: "Sto ripartendo da zero" },
  { value: 2, label: "Attività leggera, saltuaria" },
  { value: 3, label: "Mi alleno regolarmente" },
  { value: 4, label: "Buona forma, alleno da anni" },
  { value: 5, label: "Livello avanzato/atletico" },
];

const STEPS = ["Profilo", "Punto di partenza", "Conferma"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { status } = useSession();

  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<Gender>("NEUTRAL");
  const [heightCm, setHeightCm] = useState(175);
  const [usageContext, setUsageContext] = useState<UsageContext>("BOTH");
  const [selfAssessedBuild, setSelfAssessedBuild] = useState(3);
  const [useKnownData, setUseKnownData] = useState(false);
  const [bodyFatPercent, setBodyFatPercent] = useState(20);
  const [muscleMassPercent, setMuscleMassPercent] = useState(35);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Stato avatar calcolato dal vivo, con la stessa logica usata dal server
  const previewState = useMemo(() => {
    const fatLevel = useKnownData
      ? normalizeBodyFatPercent(bodyFatPercent)
      : (selfAssessedBuild - 1) * 20;
    const muscleLevel = useKnownData
      ? normalizeMuscleMassPercent(muscleMassPercent)
      : (selfAssessedBuild - 1) * 15;
    return { muscleLevel, fatLevel, staminaLevel: 15 };
  }, [useKnownData, bodyFatPercent, muscleMassPercent, selfAssessedBuild]);

  async function handleConfirm() {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender,
          heightCm,
          usageContext,
          ...(useKnownData
            ? { knownBodyFatPercent: bodyFatPercent, knownMuscleMassPercent: muscleMassPercent }
            : { selfAssessedBuild }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Errore nella creazione dell'avatar");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-grid bg-grid px-4 py-10">
      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
        {/* Colonna form */}
        <div className="rounded-lg border border-ink-line bg-ink-panel p-8">
          {/* Stepper */}
          <div className="mb-6 flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] ${
                    i <= step ? "bg-growth text-ink" : "bg-ink text-paper-muted"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-xs ${i <= step ? "text-paper" : "text-paper-muted"}`}>{label}</span>
                {i < STEPS.length - 1 && <div className="h-px w-6 bg-ink-line" />}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-semibold text-paper">Parliamo di te</h2>
                <p className="mt-1 text-sm text-paper-muted">
                  Servono solo pochi dati per impostare il tuo avatar.
                </p>
              </div>

              <FieldGroup label="Genere avatar">
                <div className="flex gap-2">
                  {(["MASCULINE", "FEMININE", "NEUTRAL"] as Gender[]).map((g) => (
                    <OptionButton key={g} active={gender === g} onClick={() => setGender(g)}>
                      {g === "MASCULINE" ? "Maschile" : g === "FEMININE" ? "Femminile" : "Neutro"}
                    </OptionButton>
                  ))}
                </div>
              </FieldGroup>

              <FieldGroup label={`Altezza — ${heightCm} cm`}>
                <input
                  type="range"
                  min={140}
                  max={210}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full accent-growth"
                />
              </FieldGroup>

              <FieldGroup label="Dove ti alleni">
                <div className="flex gap-2">
                  {(["HOME", "GYM", "BOTH"] as UsageContext[]).map((u) => (
                    <OptionButton key={u} active={usageContext === u} onClick={() => setUsageContext(u)}>
                      {u === "HOME" ? "Casa" : u === "GYM" ? "Palestra" : "Entrambi"}
                    </OptionButton>
                  ))}
                </div>
              </FieldGroup>

              <button
                onClick={() => setStep(1)}
                className="w-full rounded-md bg-growth py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
              >
                Continua
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-semibold text-paper">Da dove parti</h2>
                <p className="mt-1 text-sm text-paper-muted">
                  Il tuo avatar parte da qui, poi evolve con i tuoi allenamenti.
                </p>
              </div>

              {!useKnownData && (
                <FieldGroup label="Come descriveresti il tuo livello attuale?">
                  <div className="space-y-2">
                    {BUILD_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelfAssessedBuild(opt.value)}
                        className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          selfAssessedBuild === opt.value
                            ? "border-growth bg-growth/10 text-paper"
                            : "border-ink-line text-paper-muted hover:border-ink-line/70"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </FieldGroup>
              )}

              <button
                type="button"
                onClick={() => setUseKnownData((v) => !v)}
                className="font-mono text-xs text-growth hover:underline"
              >
                {useKnownData ? "← Torna all'autovalutazione rapida" : "Ho dati precisi da bilancia/wearable →"}
              </button>

              {useKnownData && (
                <div className="space-y-4 rounded-md border border-ink-line p-4">
                  <FieldGroup label={`% massa grassa — ${bodyFatPercent}%`}>
                    <input
                      type="range"
                      min={6}
                      max={40}
                      value={bodyFatPercent}
                      onChange={(e) => setBodyFatPercent(Number(e.target.value))}
                      className="w-full accent-caution"
                    />
                  </FieldGroup>
                  <FieldGroup label={`% massa muscolare — ${muscleMassPercent}%`}>
                    <input
                      type="range"
                      min={25}
                      max={50}
                      value={muscleMassPercent}
                      onChange={(e) => setMuscleMassPercent(Number(e.target.value))}
                      className="w-full accent-growth"
                    />
                  </FieldGroup>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 rounded-md border border-ink-line py-2.5 text-sm text-paper-muted hover:text-paper"
                >
                  Indietro
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-md bg-growth py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
                >
                  Continua
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-semibold text-paper">Tutto pronto</h2>
                <p className="mt-1 text-sm text-paper-muted">
                  Questo è il tuo punto di partenza. Da qui in poi, ogni allenamento lo farà evolvere.
                </p>
              </div>

              {error && (
                <p className="rounded-md border border-caution/40 bg-caution/10 px-3 py-2 text-sm text-caution">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-md border border-ink-line py-2.5 text-sm text-paper-muted hover:text-paper"
                >
                  Indietro
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-1 rounded-md bg-growth py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Creazione…" : "Crea il mio avatar"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Colonna anteprima — sticky, si aggiorna dal vivo */}
        <div className="md:sticky md:top-10">
          <Avatar3D state={previewState} athleteName="Anteprima" />
        </div>
      </div>
    </main>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-wide text-paper-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
        active ? "border-growth bg-growth/10 text-paper" : "border-ink-line text-paper-muted hover:border-ink-line/70"
      }`}
    >
      {children}
    </button>
  );
}
