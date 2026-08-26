import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAppleHealthIngestToken } from "@/features/integrations/service";

/**
 * Apple HealthKit non ha un'API cloud diretta: qui generiamo un
 * token personale che l'utente incolla in un'automazione Apple
 * Shortcuts (o in una futura companion app iOS), la quale legge
 * HealthKit sul dispositivo e invia i dati a /api/integrations/apple-health/ingest
 * usando questo token come credenziale.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const token = await generateAppleHealthIngestToken(userId);

  return NextResponse.json({
    token,
    ingestUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/integrations/apple-health/ingest`,
    instructions:
      "Usa questo token come header 'Authorization: Bearer <token>' in una Shortcuts automation che invia i dati di Salute in formato JSON all'ingestUrl indicato.",
  });
}
