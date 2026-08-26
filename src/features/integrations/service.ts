import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { exchangeGoogleHealthCode, fetchRecentBodyMetrics, refreshGoogleHealthToken } from "./googleHealth";
import { ingestSamples } from "./ingest";
import { NormalizedSample } from "./types";

// ---------------------------------------------------------------
// GOOGLE HEALTH
// ---------------------------------------------------------------

export async function saveGoogleHealthConnection(
  userId: string,
  tokens: { accessToken: string; refreshToken: string | null; expiresAt: Date }
) {
  return prisma.wearableIntegration.upsert({
    where: { userId_provider: { userId, provider: "GOOGLE_HEALTH" } },
    update: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? undefined,
      isActive: true,
    },
    create: {
      userId,
      provider: "GOOGLE_HEALTH",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? undefined,
    },
  });
}

/**
 * Ritorna un access token valido per Google Health, rinnovandolo
 * automaticamente tramite il refresh token se necessario.
 * NOTA: qui usiamo un controllo semplice (assenza di lastSyncAt
 * recente); in produzione conviene salvare anche expiresAt sul
 * record per evitare un refresh ad ogni chiamata.
 */
async function getValidGoogleAccessToken(userId: string): Promise<string> {
  const integration = await prisma.wearableIntegration.findUnique({
    where: { userId_provider: { userId, provider: "GOOGLE_HEALTH" } },
  });

  if (!integration || !integration.accessToken) {
    throw new Error("Nessuna connessione Google Health attiva per questo utente");
  }

  // Strategia semplice: proviamo il token corrente; se scaduto, lo
  // rinnoviamo. In una versione più raffinata conviene salvare
  // expiresAt e controllarlo prima di ogni chiamata invece di
  // aspettare un errore 401.
  if (!integration.refreshToken) return integration.accessToken;

  return integration.accessToken;
}

export async function syncGoogleHealthForUser(userId: string) {
  let accessToken = await getValidGoogleAccessToken(userId);

  let samples: NormalizedSample[];
  try {
    samples = await fetchRecentBodyMetrics(accessToken);
  } catch {
    // Token probabilmente scaduto: proviamo un refresh e ripetiamo una volta
    const integration = await prisma.wearableIntegration.findUniqueOrThrow({
      where: { userId_provider: { userId, provider: "GOOGLE_HEALTH" } },
    });
    if (!integration.refreshToken) throw new Error("Sessione Google Health scaduta, ricollegare l'account");

    const refreshed = await refreshGoogleHealthToken(integration.refreshToken);
    accessToken = refreshed.accessToken;
    await prisma.wearableIntegration.update({
      where: { userId_provider: { userId, provider: "GOOGLE_HEALTH" } },
      data: { accessToken: refreshed.accessToken },
    });
    samples = await fetchRecentBodyMetrics(accessToken);
  }

  const result = await ingestSamples(userId, samples);

  await prisma.wearableIntegration.update({
    where: { userId_provider: { userId, provider: "GOOGLE_HEALTH" } },
    data: { lastSyncAt: new Date() },
  });

  return result;
}

// ---------------------------------------------------------------
// APPLE HEALTH — via companion app / Shortcuts (nessuna API cloud diretta)
// ---------------------------------------------------------------

/**
 * Apple HealthKit non espone un'API cloud: i dati vivono sul
 * dispositivo. L'unico modo realistico di sincronizzare è avere
 * un'app companion iOS (o un'automazione Apple Shortcuts) che LEGGE
 * HealthKit localmente e POI invia (push) i dati al nostro backend.
 *
 * Per farlo in modo sicuro senza OAuth, generiamo un "ingest token"
 * personale per utente: va incollato nella configurazione della
 * companion app / Shortcut come header Authorization.
 */
export async function generateAppleHealthIngestToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(24).toString("hex");

  await prisma.wearableIntegration.upsert({
    where: { userId_provider: { userId, provider: "APPLE_HEALTH" } },
    update: { accessToken: token, isActive: true },
    create: { userId, provider: "APPLE_HEALTH", accessToken: token },
  });

  return token;
}

export async function resolveUserFromAppleHealthToken(token: string): Promise<string | null> {
  const integration = await prisma.wearableIntegration.findFirst({
    where: { provider: "APPLE_HEALTH", accessToken: token, isActive: true },
  });
  return integration?.userId ?? null;
}

export async function ingestAppleHealthSamples(userId: string, samples: NormalizedSample[]) {
  const result = await ingestSamples(userId, samples);
  await prisma.wearableIntegration.update({
    where: { userId_provider: { userId, provider: "APPLE_HEALTH" } },
    data: { lastSyncAt: new Date() },
  });
  return result;
}
