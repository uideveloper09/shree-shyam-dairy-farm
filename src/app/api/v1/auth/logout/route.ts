import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { clearAuthCookies, getRefreshTokenFromCookies } from "@/lib/auth/cookies";
import { getCurrentUser } from "@/lib/auth/session";
import { revokeRefreshToken } from "@/lib/security/session-manager";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";
import { getRequestContext } from "@/lib/security/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = getRequestContext(request);

  try {
    const user = await getCurrentUser();
    const refreshToken = await getRefreshTokenFromCookies();

    if (isDatabaseConfigured() && refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    if (user) {
      await writeAudit({
        userId: user.id,
        actorId: user.id,
        action: AUDIT_ACTIONS.LOGOUT,
        ipAddress: ctx.ip,
      });
    }

    await clearAuthCookies();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    await clearAuthCookies();
    return NextResponse.json({ success: true });
  }
}
