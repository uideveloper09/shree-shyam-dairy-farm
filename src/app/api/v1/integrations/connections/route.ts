import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { upsertConnection } from "@/services/integrations/service";
import type { IntegrationProvider } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requirePermission("admin:integrations:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  const connection = await upsertConnection({
    provider: body.provider as IntegrationProvider,
    name: body.name || body.provider,
    config: body.config,
    credentials: body.credentials,
  });

  return NextResponse.json({ connection }, { status: 201 });
}
