import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { listPlugins, invokePlugin } from "@/modules/integrations/plugins";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("admin:integrations:read");
  if (auth.error) return auth.error;

  const plugins = await listPlugins();
  return NextResponse.json(plugins);
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:integrations:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  const result = await invokePlugin(body.slug, body.hook, {
    tenantId: body.tenantId,
    userId: auth.user!.id,
    payload: body.payload,
  });

  return NextResponse.json({ result });
}
