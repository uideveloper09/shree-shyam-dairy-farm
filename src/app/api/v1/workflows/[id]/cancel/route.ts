import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { cancelWorkflow } from "@/modules/workflows/engine";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("workflows:write");
  if (auth.error) return auth.error;

  const { id } = await context.params;

  try {
    const instance = await cancelWorkflow(id, auth.user!.id);
    return NextResponse.json({ instance });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
