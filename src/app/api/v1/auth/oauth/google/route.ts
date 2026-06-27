import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { securityGate } from "@/lib/security/gate";
import { getGoogleAuthUrl, loginWithGoogle } from "@/lib/security/oauth";
import { publicUser } from "@/lib/auth/session";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";
import { getRequestContext } from "@/lib/security/request-context";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

function resolveRedirectUri(request: Request): string {
  return process.env.GOOGLE_REDIRECT_URI?.trim() || `${getSiteUrl()}/api/v1/auth/oauth/google`;
}

type OAuthState = { s: string; r?: string; rm?: boolean };

function encodeOAuthState(payload: OAuthState): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeOAuthState(value: string | null): OAuthState | null {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as OAuthState;
  } catch {
    return null;
  }
}

/** Start OAuth flow or complete callback (?code=). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim();
  const redirectUri = resolveRedirectUri(request);

  if (code) {
    if (!isDatabaseConfigured()) {
      return NextResponse.redirect(new URL("/login?error=oauth_unavailable", request.url));
    }

    const ctx = getRequestContext(request);
    const statePayload = decodeOAuthState(url.searchParams.get("state"));
    const remember = Boolean(statePayload?.rm);
    const redirectTo = statePayload?.r || "/account";

    try {
      const { user } = await loginWithGoogle(code, redirectUri, ctx, remember);

      await writeAudit({
        userId: user.id,
        action: AUDIT_ACTIONS.OAUTH_LOGIN,
        ipAddress: ctx.ip,
        metadata: { provider: "google" },
      });

      return NextResponse.redirect(new URL(redirectTo, request.url));
    } catch (err) {
      console.error("Google OAuth callback error:", err);
      return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
    }
  }

  try {
    const redirectTo = url.searchParams.get("redirect") || "/account";
    const remember = url.searchParams.get("remember") === "1";
    const state = encodeOAuthState({ s: nanoid(16), r: redirectTo, rm: remember });
    const authUrl = getGoogleAuthUrl(redirectUri, state);
    return NextResponse.redirect(authUrl);
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

  const redirectUri = resolveRedirectUri(request);

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
