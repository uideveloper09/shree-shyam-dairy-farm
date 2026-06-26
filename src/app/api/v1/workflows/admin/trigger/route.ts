import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { fireWorkflowTrigger } from "@/modules/workflows/triggers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requirePermission("admin:workflows:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  const results = await fireWorkflowTrigger(body.event, {
    ...body.payload,
    requesterId: body.requesterId || auth.user!.id,
    tenantId: body.tenantId,
    title: body.title,
    resourceType: body.resourceType,
    resourceId: body.resourceId,
  });

  return NextResponse.json({ instances: results });
}
