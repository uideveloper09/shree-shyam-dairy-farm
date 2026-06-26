import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getAccessTokenFromCookies } from "@/lib/auth/cookies";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { hasPermission, hasAnyPermission, type Permission } from "@/lib/security/permissions";
import { authorize } from "@/lib/security/abac";

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
      where: { id: payload.sub, isActive: true, deletedAt: null },
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

export async function requirePermission(permission: Permission, resourceOwnerId?: string) {
  const result = await requireUser();
  if (result.error) return result;

  const decision = authorize(
    {
      actorId: result.user!.id,
      actorRole: result.user!.role,
      action: permission,
      resourceOwnerId,
    },
    permission
  );

  if (!decision.allowed) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden", reason: decision.reason }, { status: 403 }),
    };
  }

  return result;
}

export async function requireAnyPermission(permissions: Permission[], resourceOwnerId?: string) {
  const result = await requireUser();
  if (result.error) return result;

  if (!hasAnyPermission(result.user!.role, permissions)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}

export async function requireAdmin() {
  return requirePermission("admin:farm:read");
}

export async function requireSecurityAdmin() {
  return requirePermission("admin:security:read");
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
