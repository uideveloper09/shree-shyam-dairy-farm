import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { clearAuthCookies, getRefreshTokenFromCookies } from "@/lib/auth/cookies";
import { verifyRefreshToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    if (isDatabaseConfigured()) {
      const refreshToken = await getRefreshTokenFromCookies();
      if (refreshToken) {
        try {
          const payload = await verifyRefreshToken(refreshToken);
          await prisma.refreshToken.updateMany({
            where: { userId: payload.sub, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        } catch {
          /* token already invalid */
        }
      }
    }

    await clearAuthCookies();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    await clearAuthCookies();
    return NextResponse.json({ success: true });
  }
}
