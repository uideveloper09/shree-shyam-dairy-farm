import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { securityGate } from "@/lib/security/gate";
import { createEmailToken } from "@/lib/security/otp.service";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";
import { logger } from "@/lib/ops/logger";

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

  if (user) {
    const token = await createEmailToken(user.id, "reset_password", 1);
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "noreply@shreeshyamdairyfarm.com",
          to: email,
          subject: "Reset your password",
          html: `<p>Click to reset: <a href="${resetUrl}">${resetUrl}</a></p>`,
        }),
      });
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
    message: "If an account exists, a reset link has been sent.",
  });
}
