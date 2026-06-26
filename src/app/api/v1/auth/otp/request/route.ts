import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { otpRequestSchema } from "@/lib/validators/auth";
import { securityGate } from "@/lib/security/gate";
import { createOtp } from "@/lib/security/otp.service";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const gate = await securityGate(request, {
    rateLimit: { limit: 3, windowSec: 300, key: `otp:${body?.phone || "unknown"}` },
    body,
  });
  if (!gate.ok) return gate.response;

  const parsed = otpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { phone } = parsed.data;
  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } });

  const result = await createOtp(phone, "login", user?.id);

  await writeAudit({
    userId: user?.id,
    action: AUDIT_ACTIONS.OTP_REQUEST,
    ipAddress: gate.ctx.ip,
    metadata: { phone: phone.slice(-4) },
  });

  return NextResponse.json({
    success: true,
    expiresAt: result.expiresAt,
    ...(result.devCode ? { devCode: result.devCode } : {}),
  });
}
