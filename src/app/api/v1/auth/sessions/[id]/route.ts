import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { requireUser } from "@/lib/auth/session";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  const token = await prisma.refreshToken.findFirst({
    where: { id, userId: auth.user!.id, revokedAt: null },
  });

  if (!token) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await prisma.refreshToken.update({
    where: { id: token.id },
    data: { revokedAt: new Date() },
  });

  if (token.sessionId) {
    await prisma.session.updateMany({
      where: { id: token.sessionId },
      data: { revokedAt: new Date() },
    });
  }

  await writeAudit({
    userId: auth.user!.id,
    actorId: auth.user!.id,
    action: AUDIT_ACTIONS.SESSION_REVOKED,
    resourceId: id,
    severity: "warn",
  });

  return NextResponse.json({ success: true });
}
