import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { securityGate } from "@/lib/security/gate";
import {
  verifyEmailToken,
  markEmailVerified,
  sendVerificationEmailForUser,
} from "@/lib/auth/email-verification.service";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

/** Verify email from link (?token=). */
export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const token = new URL(request.url).searchParams.get("token")?.trim() || "";
  const verification = await verifyEmailToken(token);

  if (!verification.ok) {
    return NextResponse.json(
      { valid: false, error: verification.error, message: verification.message },
      { status: 400 }
    );
  }

  await markEmailVerified(verification.userId, verification.recordId);

  await writeAudit({
    userId: verification.userId,
    action: AUDIT_ACTIONS.EMAIL_VERIFIED,
  });

  return NextResponse.json({ valid: true, message: "Email verified successfully." });
}

/** Resend verification email (authenticated). */
export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const gate = await securityGate(request, {
    rateLimit: { limit: 3, windowSec: 300, key: "verify-email" },
    checkBot: false,
  });
  if (!gate.ok) return gate.response;

  const { user, error } = await requireUser();
  if (error) return error;

  const result = await sendVerificationEmailForUser(user!.id);

  if (!result.sent) {
    const status = result.error === "Email already verified" ? 400 : 503;
    return NextResponse.json(
      { error: result.error || "Could not send verification email" },
      { status }
    );
  }

  await writeAudit({
    userId: user!.id,
    action: AUDIT_ACTIONS.EMAIL_VERIFY_SENT,
    ipAddress: gate.ctx.ip,
  });

  return NextResponse.json({
    success: true,
    message: "Verification email sent. Check your inbox.",
  });
}
