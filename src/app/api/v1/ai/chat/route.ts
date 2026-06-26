import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { requireFarmOperator } from "@/lib/auth/farm-session";
import { aiChat } from "@/services/farm/ai.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { user, error } = await requireFarmOperator();
  if (error) return error;

  const body = await request.json();
  if (!body.message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const result = await aiChat(user!.id, body.message, body.locale, body.conversationId);
  return NextResponse.json(result);
}
