import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { otpVerifySchema } from "@/lib/validators/auth";
import { securityGate } from "@/lib/security/gate";
import { verifyOtp } from "@/lib/security/otp.service";
import { createAuthSession } from "@/lib/security/session-manager";
import { publicUser } from "@/lib/auth/session";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const gate = await securityGate(request, {
    rateLimit: { limit: 10, windowSec: 300, key: `otp-verify:${body?.phone || "unknown"}` },
    body,
  });
  if (!gate.ok) return gate.response;

  const parsed = otpVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { phone, code } = parsed.data;
  const otp = await verifyOtp(phone, code, "login");
  if (!otp.valid) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
  }

  let user = otp.userId
    ? await prisma.user.findUnique({
        where: { id: otp.userId, isActive: true, deletedAt: null },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          emailVerified: true,
        },
      })
    : null;

  if (!user) {
    user = await prisma.user.findUnique({
      where: { phone, isActive: true, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
      },
    });
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        phoneVerified: new Date(),
        authProvider: "PHONE",
        gdprConsentAt: new Date(),
        gdprConsentVersion: "1.0",
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
      },
    });
  } else if (!user.phone) {
    await prisma.user.update({
      where: { id: user.id },
      data: { phone, phoneVerified: new Date(), authProvider: "PHONE" },
    });
  }

  await createAuthSession(user.id, { email: user.email, role: user.role }, gate.ctx);

  await writeAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.OTP_VERIFY,
    ipAddress: gate.ctx.ip,
  });

  return NextResponse.json({
    user: publicUser({ ...user, emailVerified: Boolean(user.emailVerified) }),
  });
}
