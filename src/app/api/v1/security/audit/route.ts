import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { requireSecurityAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireSecurityAdmin();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const action = url.searchParams.get("action");
  const severity = url.searchParams.get("severity");

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(action ? { action } : {}),
      ...(severity ? { severity } : {}),
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ logs, count: logs.length });
}
