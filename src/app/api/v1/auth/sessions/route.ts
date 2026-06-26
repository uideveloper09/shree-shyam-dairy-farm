import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { requireUser } from "@/lib/auth/session";
import { listUserSessions } from "@/lib/security/session-manager";
import { getRefreshTokenFromCookies } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const currentToken = await getRefreshTokenFromCookies();
  const sessions = await listUserSessions(auth.user!.id);

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      deviceLabel: s.deviceLabel,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      current: s.token === currentToken,
    })),
  });
}
