import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { listAgentDefinitions, listAgentRuns, runAgent } from "@/services/ai-platform/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("ai:read");
  if (auth.error) return auth.error;

  const runs = new URL(request.url).searchParams.get("runs") === "1";
  if (runs) {
    return NextResponse.json({ runs: await listAgentRuns(auth.user!.id) });
  }

  return NextResponse.json({ agents: await listAgentDefinitions() });
}

export async function POST(request: Request) {
  const auth = await requirePermission("ai:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.prompt) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  const result = await runAgent(auth.user!.id, body.prompt);
  return NextResponse.json(result);
}
