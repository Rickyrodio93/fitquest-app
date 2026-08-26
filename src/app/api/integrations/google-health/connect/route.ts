import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { buildGoogleHealthAuthUrl } from "@/features/integrations/googleHealth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // Lo state lega la callback all'utente e protegge da CSRF; qui lo
  // incorporiamo direttamente (in un'app con più traffico converrebbe
  // salvarlo in una tabella/cache con scadenza breve invece che nel
  // valore stesso, per poterlo invalidare dopo l'uso)
  const state = Buffer.from(JSON.stringify({ userId, nonce: crypto.randomBytes(8).toString("hex") })).toString(
    "base64url"
  );

  const authUrl = buildGoogleHealthAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
