import { prisma } from "@/repositories/prisma";
import { createAuthSession } from "@/lib/security/session-manager";
import type { RequestContext } from "@/lib/security/request-context";

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  error?: string;
};

type GoogleUserInfo = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
};

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth not configured");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokens = (await tokenRes.json()) as GoogleTokenResponse;
  if (!tokens.access_token) {
    throw new Error(tokens.error || "Google token exchange failed");
  }

  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const profile = (await userRes.json()) as GoogleUserInfo;
  if (!profile.sub || !profile.email) {
    throw new Error("Invalid Google profile");
  }

  return profile;
}

export async function findOrCreateGoogleUser(profile: GoogleUserInfo) {
  const email = profile.email!.toLowerCase();

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: profile.sub }, { email }] },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      emailVerified: true,
      isActive: true,
      deletedAt: true,
    },
  });

  if (user?.deletedAt || (user && !user.isActive)) {
    throw new Error("Account is deactivated");
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: profile.name,
        avatar: profile.picture,
        googleId: profile.sub,
        authProvider: "GOOGLE",
        emailVerified: profile.email_verified ? new Date() : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
        isActive: true,
        deletedAt: true,
      },
    });
  } else if (!user.email) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: profile.sub, authProvider: "GOOGLE" },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
        isActive: true,
        deletedAt: true,
      },
    });
  }

  return user;
}

export async function loginWithGoogle(
  code: string,
  redirectUri: string,
  ctx: RequestContext,
  remember = false
) {
  const profile = await exchangeGoogleCode(code, redirectUri);
  const user = await findOrCreateGoogleUser(profile);
  const session = await createAuthSession(
    user.id,
    { email: user.email, role: user.role },
    ctx,
    remember
  );
  return { user, session };
}

export function getGoogleAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Google OAuth not configured");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
