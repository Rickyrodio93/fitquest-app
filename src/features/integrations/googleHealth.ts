import { NormalizedSample } from "./types";

/**
 * ==================================================================
 * ADAPTER — GOOGLE HEALTH API
 * ==================================================================
 * Nota storica importante: le "Google Fit APIs" classiche sono state
 * dismesse (stop registrazioni da maggio 2024, spegnimento definitivo
 * nel 2026). Il loro erede per l'accesso via BACKEND WEB non è
 * Health Connect (quello è on-device, solo Android, richiede
 * un'app companion) ma la nuova **Google Health API**
 * (health.googleapis.com/v4) — evoluzione della Fitbit Web API,
 * copre dispositivi Fitbit e Google Pixel Watch, con OAuth 2.0 e
 * REST standard. È quella che usiamo qui.
 *
 * Prima di usare in produzione: verifica gli scope esatti necessari
 * nella Google Cloud Console del progetto (Data Access page) — qui
 * usiamo i due più plausibili per i nostri dati (attività + metriche
 * corporee), ma vanno confermati/aggiustati in fase di setup reale.
 * ==================================================================
 */

const GOOGLE_HEALTH_API_BASE = "https://health.googleapis.com/v4";
const GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

const SCOPES = [
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
];

function getRedirectUri(): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/api/integrations/google-health/callback`;
}

/**
 * Costruisce l'URL a cui reindirizzare l'utente per dare il consenso
 * OAuth. `state` va generato e verificato per protezione CSRF.
 */
export function buildGoogleHealthAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_HEALTH_CLIENT_ID ?? "",
    redirect_uri: getRedirectUri(),
    response_type: "code",
    access_type: "offline", // necessario per ottenere il refresh_token
    prompt: "consent",
    scope: SCOPES.join(" "),
    state,
  });
  return `${GOOGLE_OAUTH_AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export async function exchangeGoogleHealthCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
}> {
  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_HEALTH_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_HEALTH_CLIENT_SECRET ?? "",
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new Error(`Scambio token Google fallito: ${res.status} ${await res.text()}`);
  }

  const data: TokenResponse = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function refreshGoogleHealthToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: Date;
}> {
  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_HEALTH_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_HEALTH_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`Refresh token Google fallito: ${res.status} ${await res.text()}`);
  }

  const data: TokenResponse = await res.json();
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Legge peso e % massa grassa recenti (ultimi N giorni) dalla Google
 * Health API e li normalizza nel formato comune dell'app.
 *
 * Nota sui nomi: nell'URL il tipo dato usa il kebab-case ("body-fat"),
 * mentre nei filtri va snake_case ("body_fat") — convenzione della
 * Google Health API, non un'incoerenza nostra.
 */
export async function fetchRecentBodyMetrics(
  accessToken: string,
  sinceDays = 14
): Promise<NormalizedSample[]> {
  const sinceIso = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const samples: NormalizedSample[] = [];

  const dataTypes: Array<{ path: string; filterField: string; sampleKey: "WEIGHT" | "BODY_FAT_PERCENT" }> = [
    { path: "weight", filterField: "weight", sampleKey: "WEIGHT" },
    { path: "body-fat", filterField: "body_fat", sampleKey: "BODY_FAT_PERCENT" },
  ];
  for (const dt of dataTypes) {
    const url = `${GOOGLE_HEALTH_API_BASE}/users/me/dataTypes/${dt.path}/dataPoints?filter=${encodeURIComponent(
      `${dt.filterField}.sample_time.physical_time >= "${sinceIso}"`
    )}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });

    if (!res.ok) {
      // Non blocchiamo l'intero sync per un singolo tipo di dato mancante
      console.error(`Errore lettura ${dt.path} da Google Health API:`, res.status);
      continue;
    }

    const data = await res.json();
    for (const point of data.dataPoints ?? []) {
      if (dt.sampleKey === "WEIGHT" && point.weight) {
        samples.push({
          type: "WEIGHT",
          value: point.weight.kilograms ?? point.weight.value,
          unit: "kg",
          recordedAt: new Date(point.weight.sampleTime?.physicalTime ?? Date.now()),
          source: "GOOGLE_HEALTH",
        });
      }
      if (dt.sampleKey === "BODY_FAT_PERCENT" && point.bodyFat) {
        samples.push({
          type: "BODY_FAT_PERCENT",
          value: point.bodyFat.percentage,
          unit: "%",
          recordedAt: new Date(point.bodyFat.sampleTime?.physicalTime ?? Date.now()),
          source: "GOOGLE_HEALTH",
        });
      }
    }
  }

  return samples;
}

export interface RawExerciseSession {
  title: string;
  durationMin: number;
  startedAt: Date;
  caloriesBurned: number | null;
}

/**
 * Legge passi e calorie totali recenti. Stesso pattern difensivo di
 * fetchRecentBodyMetrics: se un tipo di dato fallisce, non blocchiamo
 * gli altri.
 */
export async function fetchRecentActivitySamples(
  accessToken: string,
  sinceDays = 14
): Promise<NormalizedSample[]> {
  const sinceIso = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const samples: NormalizedSample[] = [];

  const dataTypes: Array<{ path: string; filterField: string; sampleKey: "STEPS" | "CALORIES_BURNED" }> = [
    { path: "steps", filterField: "steps", sampleKey: "STEPS" },
    { path: "total-calories", filterField: "total_calories", sampleKey: "CALORIES_BURNED" },
  ];

  for (const dt of dataTypes) {
    const url = `${GOOGLE_HEALTH_API_BASE}/users/me/dataTypes/${dt.path}/dataPoints?filter=${encodeURIComponent(
      `${dt.filterField}.interval.start_time.physical_time >= "${sinceIso}"`
    )}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });

    if (!res.ok) {
      console.error(`Errore lettura ${dt.path} da Google Health API:`, res.status);
      continue;
    }

    const data = await res.json();
    for (const point of data.dataPoints ?? []) {
      // I tipi "steps"/"total-calories" sono a INTERVALLO (non a
      // campione singolo come peso/grasso): il valore rappresenta un
      // periodo, quindi usiamo l'orario di fine come recordedAt.
      const recordedAt = new Date(
        point.interval?.endTime?.physicalTime ?? point.interval?.startTime?.physicalTime ?? Date.now()
      );

      if (dt.sampleKey === "STEPS" && point.steps) {
        const value = point.steps.count ?? point.steps.value;
        if (typeof value === "number") {
          samples.push({ type: "STEPS", value, unit: "passi", recordedAt, source: "GOOGLE_HEALTH" });
        }
      }
      if (dt.sampleKey === "CALORIES_BURNED" && point.totalCalories) {
        const value = point.totalCalories.kilocalories ?? point.totalCalories.value;
        if (typeof value === "number") {
          samples.push({ type: "CALORIES_BURNED", value, unit: "kcal", recordedAt, source: "GOOGLE_HEALTH" });
        }
      }
    }
  }

  return samples;
}

/**
 * Legge le sessioni di allenamento registrate dal dispositivo
 * (dataType "exercise" — record di tipo SESSIONE, non campione).
 *
 * ATTENZIONE — nota di trasparenza tecnica: la Google Health API è
 * recente e la forma esatta del JSON per le sessioni "exercise" non è
 * completamente documentata pubblicamente. Il parsing qui sotto è
 * difensivo (prova più percorsi di campo plausibili) ma va VERIFICATO
 * contro una risposta reale al primo sync effettivo — se non trova
 * corrispondenze, stampa il punto grezzo in console per poterlo
 * ispezionare e correggere i nomi dei campi di conseguenza.
 */
export async function fetchRecentExerciseSessions(
  accessToken: string,
  sinceDays = 14
): Promise<RawExerciseSession[]> {
  const sinceIso = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const sessions: RawExerciseSession[] = [];

  const url = `${GOOGLE_HEALTH_API_BASE}/users/me/dataTypes/exercise/dataPoints?filter=${encodeURIComponent(
    `exercise.session.start_time.physical_time >= "${sinceIso}"`
  )}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });

  if (!res.ok) {
    console.error("Errore lettura sessioni exercise da Google Health API:", res.status);
    return sessions;
  }

  const data = await res.json();
  for (const point of data.dataPoints ?? []) {
    const session = point.exercise ?? point.session ?? point;
    const startRaw = session?.startTime?.physicalTime ?? session?.session?.startTime ?? point.startTime;
    const endRaw = session?.endTime?.physicalTime ?? session?.session?.endTime ?? point.endTime;

    if (!startRaw) {
      console.warn("Sessione exercise non riconosciuta, punto grezzo:", JSON.stringify(point));
      continue;
    }

    const startedAt = new Date(startRaw);
    const durationMin = endRaw
      ? Math.max(1, Math.round((new Date(endRaw).getTime() - startedAt.getTime()) / 60000))
      : 30; // fallback prudente se l'orario di fine non è disponibile

    const activityName =
      session?.activityType ?? session?.exerciseType ?? session?.name ?? "Allenamento (Google Health)";
    const caloriesBurned = session?.calories?.kilocalories ?? session?.calories ?? null;

    sessions.push({
      title: humanizeActivityName(activityName),
      durationMin,
      startedAt,
      caloriesBurned: typeof caloriesBurned === "number" ? caloriesBurned : null,
    });
  }

  return sessions;
}

function humanizeActivityName(raw: string): string {
  // Google spesso usa costanti tipo "RUNNING", "STRENGTH_TRAINING" —
  // le rendiamo leggibili invece di mostrarle urlate e con underscore
  return raw
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
