import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { requirePermission } from "@/lib/auth/session";
import { deleteUserAccount } from "@/lib/security/gdpr";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";
import { getRequestContext } from "@/lib/security/request-context";
import { clearAuthCookies } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requirePermission("account:delete");
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  if (body.confirm !== "DELETE MY ACCOUNT") {
    return NextResponse.json(
      { error: 'Send { "confirm": "DELETE MY ACCOUNT" } to confirm deletion' },
      { status: 400 }
    );
  }

  const ctx = getRequestContext(request);

  await writeAudit({
    userId: auth.user!.id,
    actorId: auth.user!.id,
    action: AUDIT_ACTIONS.GDPR_DELETE,
    ipAddress: ctx.ip,
    severity: "critical",
  });

  await deleteUserAccount(auth.user!.id);
  await clearAuthCookies();

  return NextResponse.json({
    success: true,
    message: "Account scheduled for deletion and anonymized.",
  });
}
