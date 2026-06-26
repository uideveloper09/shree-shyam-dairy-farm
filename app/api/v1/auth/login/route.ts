import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { loginSchema } from "@/lib/validators/auth";
import { publicUser } from "@/lib/auth/session";

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
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, remember } = parsed.data;
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
      },
    });

    if (!user || !user.isActive || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshJwt = await signRefreshToken({ sub: user.id }, remember);
    const refreshTokenValue = nanoid(48);
    const refreshDays = remember ? 30 : 7;

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenValue,
        remember,
        expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
      },
    });

    await setAuthCookies(accessToken, refreshJwt, remember);

    const { passwordHash: _, isActive: __, ...safeUser } = user;

    return NextResponse.json({
      user: publicUser({ ...safeUser, emailVerified: Boolean(safeUser.emailVerified) }),
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
