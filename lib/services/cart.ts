import { nanoid } from "nanoid";
import { prisma } from "@/lib/db/prisma";

export type CartItemInput = {
  legacyId: number;
  quantity: number;
};

export async function getOrCreateUserCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: { select: { legacyId: true, name: true, price: true, images: true, inStock: true } } },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: { product: { select: { legacyId: true, name: true, price: true, images: true, inStock: true } } },
        },
      },
    });
  }

  return cart;
}

export async function mergeGuestCartIntoUser(userId: string, guestItems: CartItemInput[]) {
  const cart = await getOrCreateUserCart(userId);

  for (const item of guestItems) {
    const product = await prisma.product.findFirst({
      where: { legacyId: item.legacyId, isActive: true },
    });
    if (!product) continue;

    const existing = cart.items.find((i) => i.productId === product.id);

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(99, existing.quantity + item.quantity) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: item.quantity,
        },
      });
    }
  }

  return getOrCreateUserCart(userId);
}

export function getGuestId() {
  return `guest_${nanoid(16)}`;
}
