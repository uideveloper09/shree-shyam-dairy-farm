import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { isDatabaseConfigured, prisma } from "@/repositories/prisma";
import { cartSyncSchema } from "@/lib/validators/auth";
import { getOrCreateUserCart, mergeGuestCartIntoUser } from "@/services/cart";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = cartSyncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cart data" }, { status: 400 });
    }

    const { items, note, couponCode, guestId } = parsed.data;

    if (guestId && items.length) {
      await mergeGuestCartIntoUser(
        user!.id,
        items.map((i) => ({ legacyId: Number(i.id), quantity: i.quantity }))
      );
    }

    const cart = await getOrCreateUserCart(user!.id);

    if (note !== undefined || couponCode !== undefined) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          ...(note !== undefined ? { note } : {}),
          ...(couponCode !== undefined ? { couponCode } : {}),
        },
      });
    }

    for (const item of items) {
      const legacyId = Number(item.id);
      if (!Number.isFinite(legacyId)) continue;

      const product = await prisma.product.findFirst({
        where: { legacyId, isActive: true },
      });
      if (!product) continue;

      await prisma.cartItem.upsert({
        where: {
          cartId_productId: { cartId: cart.id, productId: product.id },
        },
        update: { quantity: item.quantity },
        create: {
          cartId: cart.id,
          productId: product.id,
          quantity: item.quantity,
        },
      });
    }

    const updated = await getOrCreateUserCart(user!.id);

    return NextResponse.json({
      items: updated.items.map((i) => ({ id: i.product.legacyId, quantity: i.quantity })),
      note: updated.note,
      couponCode: updated.couponCode,
    });
  } catch (err) {
    console.error("Cart sync error:", err);
    return NextResponse.json({ error: "Cart sync failed" }, { status: 500 });
  }
}
