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

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        note: note ?? cart.note,
        couponCode: couponCode ?? cart.couponCode,
        guestId: guestId ?? cart.guestId,
      },
    });

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { legacyId: Number(item.id), isActive: true },
      });
      if (!product) continue;

      const existing = cart.items.find((i) => i.productId === product.id);
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: item.quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: { cartId: cart.id, productId: product.id, quantity: item.quantity },
        });
      }
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
