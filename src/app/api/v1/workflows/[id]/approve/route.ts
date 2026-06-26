import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { approveStep } from "@/modules/workflows/engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("workflows:approve");
  if (auth.error) return auth.error;

  const { id: instanceId } = await context.params;
  const body = await request.json();

  try {
    const instance = await approveStep({
      instanceId,
      stepId: body.stepId,
      actorId: auth.user!.id,
      actorRole: auth.user!.role,
      approved: body.approved !== false,
      comment: body.comment,
    });
    return NextResponse.json({ instance });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
