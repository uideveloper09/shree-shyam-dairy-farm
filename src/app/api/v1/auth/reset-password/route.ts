import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { securityGate } from "@/lib/security/gate";
import {
  verifyPasswordResetToken,
  clearPasswordResetToken,
} from "@/lib/auth/password-reset.service";
import { hashPassword } from "@/lib/auth/password";
import { validatePasswordPolicy } from "@/lib/security/password-policy";
import { revokeAllUserSessions } from "@/lib/security/session-manager";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

/** Verify reset token before showing the password form. */
export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const token = new URL(request.url).searchParams.get("token")?.trim() || "";
  const verification = await verifyPasswordResetToken(token);

  if (!verification.ok) {
    return NextResponse.json(
      { valid: false, error: verification.error, message: verification.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ valid: true });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const gate = await securityGate(request, {
    rateLimit: { limit: 5, windowSec: 300, key: "reset-password" },
    body,
  });
  if (!gate.ok) return gate.response;

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { token, password } = parsed.data;
  const policy = validatePasswordPolicy(password);
  if (!policy.valid) {
    return NextResponse.json({ error: policy.errors[0] }, { status: 400 });
  }

  const verification = await verifyPasswordResetToken(token);
  if (!verification.ok) {
    return NextResponse.json(
      { error: verification.message, code: verification.error },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: verification.userId },
    data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
  });

  await clearPasswordResetToken(verification.userId);
  await revokeAllUserSessions(verification.userId);

  await writeAudit({
    userId: verification.userId,
    action: AUDIT_ACTIONS.PASSWORD_RESET,
    ipAddress: gate.ctx.ip,
    severity: "warn",
  });

  return NextResponse.json({ success: true, message: "Password updated. Please sign in again." });
}
