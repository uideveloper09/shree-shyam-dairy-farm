"use client";

import LazyImage from "@/components/ui/LazyImage";
import { useCart } from "@/context/CartContext";
import { getSavePercent } from "@/lib/utils";

export default function ProductCard({ product }) {
  const { cartItems, addToCart, increaseQty, decreaseQty } = useCart();
  const cartItem = cartItems.find((item) => item.id === product.id);
  const savePercent = getSavePercent(product.price, product.compareAtPrice);

  return (
    <article className="premium-card group flex w-[260px] shrink-0 snap-start flex-col overflow-hidden p-3 sm:w-[280px]">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#faf9f6]">
        {savePercent > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-[#C89B3C] to-[#d4ab5a] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#061E3D] shadow-sm">
            Save {savePercent}%
          </span>
        )}
        {product.badge && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-[#082F63]/90 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            {product.badge}
          </span>
        )}
        <LazyImage
          src={product.image}
          alt={product.name}
          fill
          className={`${product.imageClass} group-hover:scale-105`}
          sizes="280px"
        />
      </div>

      <div className="flex flex-1 flex-col px-1 pt-4 pb-1">
        <h3 className="font-heading text-[16px] font-semibold leading-snug text-[#082F63]">
          {product.name}
        </h3>

        {product.desc && (
          <p className="mt-1 line-clamp-1 text-[12px] text-gray-500">{product.desc}</p>
        )}

        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-[17px] font-bold text-[#082F63]">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          {product.compareAtPrice > product.price && (
            <span className="text-[13px] text-gray-400 line-through">
              ₹{product.compareAtPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {product.unit && (
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[#C89B3C]">
            {product.unit}
          </p>
        )}

        {product.inStock === false ? (
          <button
            type="button"
            disabled
            className="mt-4 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 text-[12px] font-semibold uppercase tracking-wide text-gray-400"
          >
            Sold out
          </button>
        ) : cartItem ? (
          <div className="mt-4 flex h-11 items-center justify-between overflow-hidden rounded-lg border-2 border-[#082F63] bg-[#faf9f6]">
            <button
              type="button"
              onClick={() => decreaseQty(product.id)}
              className="flex h-full w-11 items-center justify-center text-lg font-medium text-[#082F63] hover:bg-white"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="text-sm font-bold text-[#082F63]">{cartItem.quantity}</span>
            <button
              type="button"
              onClick={() => increaseQty(product.id)}
              className="flex h-full w-11 items-center justify-center text-lg font-medium text-[#082F63] hover:bg-white"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => addToCart(product)}
            className="mt-4 h-11 w-full rounded-lg bg-[#082F63] text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-[#0a3a7a]"
          >
            Add to cart
          </button>
        )}
      </div>
    </article>
  );
}
