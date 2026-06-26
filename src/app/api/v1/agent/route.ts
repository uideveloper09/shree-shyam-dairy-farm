import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { requireFarmOperator } from "@/lib/auth/farm-session";
import { confirmAgentAction, listAgentRuns, runAgent } from "@/services/farm/agent.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const { user, error } = await requireFarmOperator();
  if (error) return error;

  if (body.confirmToken && body.runId) {
    const result = await confirmAgentAction(body.runId, body.confirmToken, user!.id);
    return NextResponse.json(result);
  }

  if (!body.prompt) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  const result = await runAgent(user!.id, body.prompt);
  return NextResponse.json(result);
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ runs: [] }, { status: 503 });
  }
  const { user, error } = await requireFarmOperator();
  if (error) return error;
  const runs = await listAgentRuns(user!.id);
  return NextResponse.json({ runs });
}
