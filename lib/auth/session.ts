import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getAccessTokenFromCookies } from "@/lib/auth/cookies";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: string;
  emailVerified: boolean;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const token = await getAccessTokenFromCookies();
    if (!token) return null;

    const payload = await verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub, isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      emailVerified: Boolean(user.emailVerified),
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, error: null };
}

export async function requireAdmin() {
  const result = await requireUser();
  if (result.error) return result;
  if (result.user?.role !== "ADMIN") {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return result;
}

export function publicUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}
