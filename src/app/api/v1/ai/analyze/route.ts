import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { runModuleAnalysis } from "@/services/ai-platform/service";
import type { AiModule } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_MODULES: AiModule[] = [
  "CEO",
  "FINANCE",
  "FARM",
  "INVENTORY",
  "MARKETING",
  "SALES",
  "CUSTOMER",
  "VOICE",
  "WHATSAPP",
  "AGENT",
];

export async function POST(request: Request) {
  const auth = await requirePermission("ai:read");
  if (auth.error) return auth.error;

  const body = await request.json();
  const aiModule = body.module as AiModule;

  if (!aiModule || !VALID_MODULES.includes(aiModule)) {
    return NextResponse.json({ error: "valid module required" }, { status: 400 });
  }

  try {
    const result = await runModuleAnalysis(aiModule, auth.user!.id, body.question);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
