import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { getRefreshTokenFromCookies } from "@/lib/auth/cookies";
import { signAccessToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { publicUser } from "@/lib/auth/session";
import { validateRefreshToken } from "@/lib/security/session-manager";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";
import { securityGate } from "@/lib/security/gate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const gate = await securityGate(request, {
    rateLimit: { limit: 30, windowSec: 60, key: "refresh" },
    checkBot: false,
  });
  if (!gate.ok) return gate.response;

  try {
    const refreshToken = await getRefreshTokenFromCookies();
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const record = await validateRefreshToken(refreshToken);
    if (!record?.user || !record.user.isActive || record.user.deletedAt) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const user = record.user;
    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await setAuthCookies(accessToken, refreshToken, record.remember);

    await writeAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.REFRESH,
      ipAddress: gate.ctx.ip,
      userAgent: gate.ctx.userAgent,
    });

    return NextResponse.json({
      user: publicUser({ ...user, emailVerified: Boolean(user.emailVerified) }),
    });
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }
}
