import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { completeFollowUp, createFollowUp, listFollowUps } from "@/services/crm/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("crm:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const upcoming = searchParams.get("upcoming") === "1";
  const followUps = await listFollowUps(auth.user!.id, upcoming);
  return NextResponse.json({ followUps });
}

export async function POST(request: Request) {
  const auth = await requirePermission("crm:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.subject || !body.scheduledAt) {
    return NextResponse.json({ error: "subject and scheduledAt required" }, { status: 400 });
  }

  const followUp = await createFollowUp({
    ...body,
    assigneeId: body.assigneeId ?? auth.user!.id,
  });
  return NextResponse.json(followUp, { status: 201 });
}
