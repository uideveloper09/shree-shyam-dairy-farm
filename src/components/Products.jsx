/**
 * Products Section
 * ─────────────────
 * Spec:
 *   Section bg  : #F7F7F7
 *   Padding     : 90px
 *   H2          : 52px Playfair, centered
 *   Grid        : 5 columns, gap 24px
 *   Card radius : 18px
 *   Card shadow : subtle
 *   Image height: 220px (flush top)
 *   Card padding: 20px bottom content
 *   Card title  : 28px Playfair 600
 *   Desc        : 14px gray
 *   Button      : h-10 px-5, full width, navy
 */
"use client";
import Image from "next/image";
import MotionReveal from "@/components/ui/MotionReveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { PRODUCTS } from "@/utils/site";
import { CONTAINER } from "@/constants/layout";
import { useCart } from "@/features/cart/context/CartContext";

export default function Products() {
  const { cartItems, addToCart, increaseQty, decreaseQty } = useCart();
  return (
    <section id="products" className="bg-[#F7F7F7] py-[60px]">
      <div className={CONTAINER}>
        {/* Heading */}
        <MotionReveal delay={0.06}>
          <SectionHeading
            align="center"
            label="Our Products"
            title="Shuddhata Jo Dikhe, Swad Jo Mehsoos Ho"
          />
        </MotionReveal>

        {/* 5-column grid — gap 24px */}
        <div className="mt-12 lg:mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {PRODUCTS.map((product, i) => {
            const cartItem = cartItems.find((item) => item.id === product.id);
            return (
              <MotionReveal key={product.name} delay={0.12 + i * 0.08}>
                <article className="group flex flex-col bg-white rounded-[18px] overflow-hidden border border-transparent shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:border-[#C89B3C] hover:-translate-y-1.5 hover:shadow-[0_8px_32px_rgba(8,47,99,0.12)] transition duration-300">
                  {/* Image area — 220px, flush top */}
                  <div className="relative h-[220px] w-full overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className={`${product.imageClass} group-hover:scale-105 transition duration-300`}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  </div>

                  {/* Card body — 20px padding */}
                  <div className="flex flex-col flex-1 p-5 pt-4 items-center text-center">
                    {product.badge && (
                      <span className="mb-3 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {product.badge}
                      </span>
                    )}

                    <h3
                      className="
      font-heading font-semibold text-[#082F63] leading-snug
      text-[1.125rem] sm:text-[1.25rem] lg:text-[1.5rem]
    "
                    >
                      {product.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">{product.desc}</p>

                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-xl font-bold text-[#082F63]">₹{product.price}</span>

                      <span className="text-sm text-gray-400">{product.unit}</span>
                    </div>

                    {cartItem ? (
                      <div className="mt-5 flex h-[50px] w-full items-center justify-between overflow-hidden rounded-lg border border-[#082F63]">
                        <button
                          onClick={() => decreaseQty(product.id)}
                          className="px-5 text-xl font-bold text-[#082F63]"
                        >
                          -
                        </button>

                        <span className="font-semibold text-[#082F63]">{cartItem.quantity}</span>

                        <button
                          onClick={() => increaseQty(product.id)}
                          className="px-5 text-xl font-bold text-[#082F63]"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="mt-5 w-full rounded-lg bg-[#082F63] py-3 font-semibold text-white transition hover:bg-[#0B3D7A]"
                      >
                        🛒 Add To Cart
                      </button>
                    )}
                  </div>
                </article>
              </MotionReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
