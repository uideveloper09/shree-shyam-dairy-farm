import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { requireUser } from "@/lib/auth/session";
import { recordGdprConsent } from "@/lib/security/gdpr";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";
import { getRequestContext } from "@/lib/security/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const version = typeof body.version === "string" ? body.version : "1.0";

  await recordGdprConsent(auth.user!.id, version);

  const ctx = getRequestContext(request);
  await writeAudit({
    userId: auth.user!.id,
    actorId: auth.user!.id,
    action: AUDIT_ACTIONS.GDPR_CONSENT,
    ipAddress: ctx.ip,
    metadata: { version },
  });

  return NextResponse.json({ success: true, version });
}
