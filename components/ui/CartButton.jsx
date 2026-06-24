"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartButton() {
  const { cartItems, openCart } = useCart();

  const count = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <button
      onClick={openCart}
      className="relative flex items-center justify-center w-11 h-11 rounded border border-[#E5E5E5]"
    >
      <ShoppingCart
        size={22}
        className="text-[#082F63]"
      />

      {count > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] rounded-full bg-[#C89B3C] text-white text-[11px] flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}