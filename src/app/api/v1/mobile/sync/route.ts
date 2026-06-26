import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { processSyncActions } from "@/services/mobile/platform.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  const actions = Array.isArray(body.actions) ? body.actions : [];

  const results = await processSyncActions(auth.user!.id, actions);

  return NextResponse.json({ results });
}
