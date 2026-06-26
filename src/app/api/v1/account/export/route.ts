import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { requirePermission } from "@/lib/auth/session";
import { exportUserData, requestDataExport } from "@/lib/security/gdpr";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";
import { getRequestContext } from "@/lib/security/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requirePermission("account:read");
  if (auth.error) return auth.error;

  const data = await exportUserData(auth.user!.id);
  if (!data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await requestDataExport(auth.user!.id);

  const ctx = getRequestContext(request);
  await writeAudit({
    userId: auth.user!.id,
    actorId: auth.user!.id,
    action: AUDIT_ACTIONS.GDPR_EXPORT,
    ipAddress: ctx.ip,
    severity: "warn",
  });

  return NextResponse.json(data);
}
