"use client";

import { useCartStore } from "@/store/useCartStore";

export async function mergeCartAfterLogin() {
  const { cartItems, orderNote, guestId, hydrateFromServer } = useCartStore.getState();

  try {
    const syncRes = await fetch("/api/v1/cart/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestId,
        items: cartItems.map((i) => ({ id: i.id, quantity: i.quantity })),
        note: orderNote,
      }),
    });

    if (!syncRes.ok) return;

    const syncData = await syncRes.json();
    const contentRes = await fetch("/api/content");
    const content = await contentRes.json();
    const productMap = new Map(content.products.map((p) => [p.id, p]));

    const merged = syncData.items
      .map((item) => {
        const product = productMap.get(item.id);
        if (!product) return null;
        return { ...product, quantity: item.quantity };
      })
      .filter(Boolean);

    hydrateFromServer({ cartItems: merged.length ? merged : cartItems, note: syncData.note });
  } catch {
    /* DB not configured — local cart still works */
  }
}
