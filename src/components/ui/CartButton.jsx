"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/features/cart/context/CartContext";

export default function CartButton({ className = "h-10 w-10" }) {
  const { cartItems, openCart } = useCart();
  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label="Open shopping cart"
      className={`relative flex shrink-0 items-center justify-center rounded-lg border border-[#eee] bg-[#faf9f6] text-[#082F63] transition hover:border-[#C89B3C]/40 hover:bg-white hover:shadow-sm ${className}`}
    >
      <ShoppingCart size={20} />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-[#C89B3C] to-[#d4ab5a] px-1 text-[10px] font-bold text-[#061E3D] shadow-sm">
          {count}
        </span>
      )}
    </button>
  );
}
