import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { securityGate } from "@/lib/security/gate";
import { getGoogleAuthUrl, loginWithGoogle } from "@/lib/security/oauth";
import { publicUser } from "@/lib/auth/session";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/v1/auth/oauth/google`;

  try {
    const state = nanoid(16);
    const url = getGoogleAuthUrl(redirectUri, state);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const gate = await securityGate(request, {
    rateLimit: { limit: 10, windowSec: 60, key: "oauth-google" },
  });
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const code = typeof body.code === "string" ? body.code : "";
  const remember = Boolean(body.remember);

  if (!code) {
    return NextResponse.json({ error: "Authorization code required" }, { status: 400 });
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/v1/auth/oauth/google`;

  try {
    const { user } = await loginWithGoogle(code, redirectUri, gate.ctx, remember);

    await writeAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.OAUTH_LOGIN,
      ipAddress: gate.ctx.ip,
      metadata: { provider: "google" },
    });

    return NextResponse.json({
      user: publicUser({ ...user, emailVerified: Boolean(user.emailVerified) }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "OAuth login failed" },
      { status: 401 }
    );
  }
}
