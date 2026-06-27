import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/validators/auth";
import { publicUser } from "@/lib/auth/session";
import { securityGate } from "@/lib/security/gate";
import { validatePasswordPolicy } from "@/lib/security/password-policy";
import { createAuthSession } from "@/lib/security/session-manager";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";
import { recordGdprConsent } from "@/lib/security/gdpr";
import { sendVerificationEmailForUser } from "@/lib/auth/email-verification.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured. Add DATABASE_URL to .env.local" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const gate = await securityGate(request, {
      rateLimit: { limit: 5, windowSec: 300, key: "register" },
      body,
    });
    if (!gate.ok) return gate.response;

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = parsed.data;
    const policy = validatePasswordPolicy(password);
    if (!policy.valid) {
      return NextResponse.json({ error: policy.errors[0] }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone?.trim() || null;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email or phone already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
        authProvider: "EMAIL",
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

    await createAuthSession(user.id, { email: user.email, role: user.role }, gate.ctx, false);

    await writeAudit({
      userId: user.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.REGISTER,
      ipAddress: gate.ctx.ip,
      userAgent: gate.ctx.userAgent,
    });

    await recordGdprConsent(user.id);

    const verifyResult = await sendVerificationEmailForUser(user.id);
    if (verifyResult.sent) {
      await writeAudit({
        userId: user.id,
        action: AUDIT_ACTIONS.EMAIL_VERIFY_SENT,
        ipAddress: gate.ctx.ip,
      });
    }

    return NextResponse.json({
      user: publicUser({ ...user, emailVerified: Boolean(user.emailVerified) }),
      message: verifyResult.sent
        ? "Account created. Check your email to verify your address."
        : "Account created successfully",
      emailVerificationSent: verifyResult.sent,
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
