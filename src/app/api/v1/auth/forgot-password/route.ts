import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { securityGate } from "@/lib/security/gate";
import { createEmailToken } from "@/lib/security/otp.service";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";
import { logger } from "@/lib/ops/logger";
import { sendEmail } from "@/modules/notifications/channels/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const gate = await securityGate(request, {
    rateLimit: { limit: 3, windowSec: 300, key: "forgot-password" },
    body,
  });
  if (!gate.ok) return gate.response;

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const emailConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  let emailSent = false;

  if (user) {
    const token = await createEmailToken(user.id, "reset_password", 1);
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    if (emailConfigured) {
      const result = await sendEmail({
        recipient: email,
        title: "Reset your password",
        subject: "Reset your Shree Shyam Dairy Farm password",
        body: "Use the link below to reset your password. This link expires in 1 hour.",
        html: `
          <p>Hello,</p>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
      });

      emailSent = result.ok && result.delivered === true;

      if (!emailSent) {
        logger.error("password_reset_email_failed", {
          email,
          error: result.error || "unknown",
        });
      }
    } else {
      logger.info("password_reset_dev_link", { email, resetUrl });
    }

    await writeAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.PASSWORD_RESET_REQUEST,
      ipAddress: gate.ctx.ip,
    });
  }

  return NextResponse.json({
    success: true,
    message: emailSent
      ? "If an account exists, a reset link has been sent."
      : emailConfigured
        ? "If an account exists, we attempted to send a reset link. Check spam or try again."
        : "Password reset is saved, but email delivery is not configured on the server yet.",
    emailConfigured,
    emailSent: user ? emailSent : false,
  });
}
