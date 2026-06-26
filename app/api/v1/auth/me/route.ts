import { NextResponse } from "next/server";
import { getCurrentUser, publicUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ user: null, configured: false });
  }

  const user = await getCurrentUser();
  return NextResponse.json({ user: user ? publicUser(user) : null, configured: true });
}
