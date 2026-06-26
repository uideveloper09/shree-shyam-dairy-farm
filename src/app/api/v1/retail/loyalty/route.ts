import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getLoyaltyAccount } from "@/services/retail/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("retail:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;

  const account = await getLoyaltyAccount(phone, userId);
  if (!account) return NextResponse.json({ pointsBalance: 0, transactions: [] });
  return NextResponse.json(account);
}
