import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncGoogleHealthForUser } from "@/features/integrations/service";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  try {
    const result = await syncGoogleHealthForUser(userId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync fallito" },
      { status: 400 }
    );
  }
}
