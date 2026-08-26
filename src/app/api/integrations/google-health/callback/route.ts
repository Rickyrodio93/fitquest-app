import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleHealthCode } from "@/features/integrations/googleHealth";
import { saveGoogleHealthConnection, syncGoogleHealthForUser } from "@/features/integrations/service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (oauthError) {
    return NextResponse.redirect(`${baseUrl}/dashboard?integration=google_health&status=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/dashboard?integration=google_health&status=error`);
  }

  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    userId = decoded.userId;
  } catch {
    return NextResponse.redirect(`${baseUrl}/dashboard?integration=google_health&status=error`);
  }

  try {
    const tokens = await exchangeGoogleHealthCode(code);
    await saveGoogleHealthConnection(userId, tokens);

    // Primo sync immediato, così l'utente vede subito qualcosa cambiare
    await syncGoogleHealthForUser(userId);

    return NextResponse.redirect(`${baseUrl}/dashboard?integration=google_health&status=connected`);
  } catch (err) {
    console.error("Errore callback Google Health:", err);
    return NextResponse.redirect(`${baseUrl}/dashboard?integration=google_health&status=error`);
  }
}
