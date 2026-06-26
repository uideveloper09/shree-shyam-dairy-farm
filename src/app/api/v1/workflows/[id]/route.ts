import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { getWorkflowInstance } from "@/services/workflows/service";
import { getWorkflowAuditTrail } from "@/modules/workflows/audit";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("workflows:read");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const instance = await getWorkflowInstance(id);
  if (!instance) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = instance.requesterId === auth.user!.id;
  const canApprove =
    auth.user!.role === "ADMIN" ||
    auth.user!.role === "OWNER" ||
    instance.steps.some(
      (s) => s.assigneeId === auth.user!.id || s.assigneeRole === auth.user!.role
    );

  if (!isOwner && !canApprove && !hasPermission(auth.user!.role, "admin:workflows:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const auditTrail = await getWorkflowAuditTrail(id);
  return NextResponse.json({ instance, auditTrail });
}
