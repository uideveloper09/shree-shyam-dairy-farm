import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validators/auth";
import { publicUser } from "@/lib/auth/session";
import { securityGate } from "@/lib/security/gate";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";
import {
  isAccountLocked,
  recordFailedLogin,
  clearFailedLogins,
  updateLastLogin,
} from "@/lib/security/brute-force";
import { createAuthSession } from "@/lib/security/session-manager";
import { decryptTotpSecret, verifyTotp } from "@/lib/security/totp";

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
      rateLimit: { limit: 10, windowSec: 60, key: `login:${body?.email || "unknown"}` },
      body,
    });
    if (!gate.ok) return gate.response;

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, remember } = parsed.data;
    const totpCode = typeof body.totpCode === "string" ? body.totpCode : undefined;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
        passwordHash: true,
        isActive: true,
        deletedAt: true,
        twoFactorEnabled: true,
        totpSecretEnc: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt || !user.passwordHash) {
      await writeAudit({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        ipAddress: gate.ctx.ip,
        userAgent: gate.ctx.userAgent,
        metadata: { email: normalizedEmail, reason: "invalid_credentials" },
        severity: "warn",
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (await isAccountLocked(user.id)) {
      await writeAudit({
        userId: user.id,
        action: AUDIT_ACTIONS.LOGIN_LOCKED,
        ipAddress: gate.ctx.ip,
        userAgent: gate.ctx.userAgent,
        severity: "warn",
      });
      return NextResponse.json(
        { error: "Account temporarily locked. Try again later." },
        { status: 423 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const lock = await recordFailedLogin(user.id);
      await writeAudit({
        userId: user.id,
        action: lock.locked ? AUDIT_ACTIONS.LOGIN_LOCKED : AUDIT_ACTIONS.LOGIN_FAILED,
        ipAddress: gate.ctx.ip,
        userAgent: gate.ctx.userAgent,
        metadata: { attempts: lock.attempts },
        severity: "warn",
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.twoFactorEnabled && user.totpSecretEnc) {
      if (!totpCode) {
        return NextResponse.json({ requires2FA: true, message: "Enter your authenticator code" });
      }
      const secret = decryptTotpSecret(user.totpSecretEnc);
      if (!verifyTotp(secret, totpCode)) {
        await writeAudit({
          userId: user.id,
          action: AUDIT_ACTIONS.LOGIN_FAILED,
          ipAddress: gate.ctx.ip,
          metadata: { reason: "invalid_2fa" },
          severity: "warn",
        });
        return NextResponse.json({ error: "Invalid authenticator code" }, { status: 401 });
      }
    }

    await clearFailedLogins(user.id);
    await updateLastLogin(user.id, gate.ctx.ip);

    await createAuthSession(user.id, { email: user.email, role: user.role }, gate.ctx, remember);

    await writeAudit({
      userId: user.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      ipAddress: gate.ctx.ip,
      userAgent: gate.ctx.userAgent,
    });

    const {
      passwordHash: _,
      isActive: __,
      deletedAt: ___,
      totpSecretEnc: ____,
      twoFactorEnabled: _____,
      ...safeUser
    } = user;

    return NextResponse.json({
      user: publicUser({ ...safeUser, emailVerified: Boolean(safeUser.emailVerified) }),
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
