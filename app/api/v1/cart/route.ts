import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { getOrCreateUserCart } from "@/lib/services/cart";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { user, error } = await requireUser();
  if (error) return error;

  const cart = await getOrCreateUserCart(user!.id);

  return NextResponse.json({
    items: cart.items.map((item) => ({
      id: item.product.legacyId,
      quantity: item.quantity,
    })),
    note: cart.note,
    couponCode: cart.couponCode,
  });
}
