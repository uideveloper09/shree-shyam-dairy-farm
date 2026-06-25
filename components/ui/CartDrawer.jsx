"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { HiX, HiChevronDown, HiChevronUp } from "react-icons/hi";
import { Lock, ShieldCheck } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import { useSiteData } from "@/context/SiteDataContext";
import { formatINR } from "@/lib/cart";
import PaymentCheckoutModal from "@/components/ui/PaymentCheckoutModal";
import { useSectionScroll } from "@/context/SectionScrollContext";
import { HOME_SECTIONS } from "@/lib/sections";

function BillRow({ label, value, highlight = false, muted = false }) {
  if (value === 0 && muted) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className={muted ? "text-gray-500" : "text-gray-600"}>{label}</span>
      <span
        className={
          highlight
            ? "font-semibold text-emerald-600"
            : muted
              ? "text-gray-500"
              : "font-medium text-[#082F63]"
        }
      >
        {typeof value === "number" ? formatINR(value) : value}
      </span>
    </div>
  );
}

function SuggestedProduct({ product, onAdd }) {
  return (
    <div className="flex w-[132px] shrink-0 flex-col">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#faf9f6] ring-1 ring-[#eee]">
        <Image src={product.image} alt={product.name} fill className="object-cover" sizes="132px" />
      </div>
      <p className="mt-2 line-clamp-2 text-[12px] font-semibold text-[#082F63]">{product.name}</p>
      <p className="text-[12px] text-gray-500">{formatINR(product.price)}</p>
      <button
        type="button"
        onClick={() => onAdd(product)}
        className="mt-2 rounded-lg border border-[#082F63]/20 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#082F63] transition hover:border-[#C89B3C]/50 hover:bg-[#faf9f6]"
      >
        Add
      </button>
    </div>
  );
}

export default function CartDrawer() {
  const { site, cart: cartConfig, products } = useSiteData();
  const { navigateToSection } = useSectionScroll();
  const {
    isCartOpen,
    closeCart,
    cartItems,
    bill,
    increaseQty,
    decreaseQty,
    removeFromCart,
    clearCart,
    orderNote,
    setOrderNote,
    couponInput,
    setCouponInput,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponMessage,
    removeConfirmId,
    setRemoveConfirmId,
    addToCart,
  } = useCart();

  const [showNote, setShowNote] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (!isCartOpen) return;

    const scrollY = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const suggested = products
    .filter((p) => p.inStock !== false && p.category !== "combo")
    .filter((p) => !cartItems.some((c) => c.id === p.id))
    .slice(0, 6);

  const whatsappCheckout = () => {
    const orderText = cartItems
      .map((item) => `${item.name} x ${item.quantity} = ${formatINR(item.price * item.quantity)}`)
      .join("\n");

    const message = `🛒 ${site.name} Order

${orderText}

Subtotal: ${formatINR(bill.subtotal)}
${bill.couponDiscount ? `Coupon (${appliedCoupon?.code}): -${formatINR(bill.couponDiscount)}` : ""}
Shipping: ${bill.shippingCharge ? formatINR(bill.shippingCharge) : "FREE"}
Prepaid Discount: -${formatINR(bill.prepaidDiscount)}
Total: ${formatINR(bill.estimatedTotal)}
${orderNote ? `\nNote: ${orderNote}` : ""}`;

    window.open(
      `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const openPaymentModal = () => {
    if (!cartItems.length) return;
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setShowPayment(false);
    clearCart();
    setTimeout(() => {
      setPaymentSuccess(false);
      closeCart();
    }, 2500);
  };

  return (
    <>
      <PaymentCheckoutModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        bill={bill}
        cartItems={cartItems}
        orderNote={orderNote}
        appliedCoupon={appliedCoupon}
        site={site}
        cartConfig={cartConfig}
        onSuccess={handlePaymentSuccess}
      />

      <div className="fixed inset-0 z-[60] bg-[#061E3D]/60 backdrop-blur-[2px]" onClick={closeCart} aria-hidden />

      <aside className="fixed top-0 right-0 z-[70] flex h-dvh max-h-dvh w-full max-w-[440px] flex-col overflow-hidden overscroll-contain bg-[#faf9f6] shadow-[-8px_0_40px_rgba(8,47,99,0.18)]">
        {/* Header */}
        <div className="relative shrink-0 border-b border-[#eee] bg-white px-5 py-4">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#C89B3C] to-transparent" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C89B3C]">
                Your order
              </p>
              <h2 className="font-heading text-[20px] font-bold text-[#082F63]">{cartConfig.title}</h2>
              <p className="mt-0.5 text-[12px] text-gray-500">
                {bill.itemCount} item{bill.itemCount === 1 ? "" : "s"} · Farm-fresh delivery
              </p>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eee] bg-[#faf9f6] text-[#082F63] transition hover:border-[#C89B3C]/40 hover:bg-white"
              aria-label="Close cart"
            >
              <HiX size={20} />
            </button>
          </div>
        </div>

        {paymentSuccess ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 text-5xl">🎉</div>
            <h3 className="text-xl font-bold text-[#082F63]">Order Placed Successfully!</h3>
            <p className="mt-2 text-sm text-gray-500">Thank you for shopping with us.</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 text-5xl opacity-80">🛍️</div>
            <h3 className="text-lg font-bold text-[#1a1a1a]">{cartConfig.emptyTitle}</h3>
            <p className="mt-2 text-sm text-gray-500">{cartConfig.emptyDesc}</p>
            <button
              type="button"
              onClick={() => {
                closeCart();
                navigateToSection(HOME_SECTIONS.PRODUCTS);
              }}
              className="btn-premium-gold mt-6 px-8 py-3 text-[12px]"
            >
              {cartConfig.emptyCta}
            </button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {/* Cart items */}
              <div className="space-y-0 divide-y divide-gray-100 px-5">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-4">
                    {removeConfirmId === item.id ? (
                      <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-center">
                        <p className="text-sm text-gray-700">
                          Are you sure you want to remove the item?
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="flex-1 rounded bg-red-600 py-2 text-sm font-semibold text-white"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemoveConfirmId(null)}
                            className="flex-1 rounded border py-2 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3.5">
                        <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-[#eee]">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="88px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-[14px] font-semibold leading-snug text-[#082F63]">
                              {item.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => setRemoveConfirmId(item.id)}
                              className="shrink-0 rounded-full p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                              aria-label="Remove item"
                            >
                              <HiX size={16} />
                            </button>
                          </div>
                          <p className="mt-0.5 text-[12px] text-gray-500">{item.unit}</p>
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex items-center overflow-hidden rounded-lg border-2 border-[#082F63]/15 bg-white">
                              <button
                                type="button"
                                onClick={() => decreaseQty(item.id)}
                                className="flex h-8 w-8 items-center justify-center text-[#082F63] transition hover:bg-[#082F63]/5"
                              >
                                −
                              </button>
                              <span className="min-w-[32px] text-center text-[13px] font-semibold text-[#082F63]">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => increaseQty(item.id)}
                                className="flex h-8 w-8 items-center justify-center text-[#082F63] transition hover:bg-[#082F63]/5"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[15px] font-bold text-[#082F63]">
                              {formatINR(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add a note */}
              <div className="border-t border-[#eee] px-5 py-4">
                <button
                  type="button"
                  onClick={() => setShowNote((p) => !p)}
                  className="flex w-full items-center justify-between text-[13px] font-semibold text-[#082F63]"
                >
                  Add a note
                  {showNote ? <HiChevronUp size={18} className="text-gray-400" /> : <HiChevronDown size={18} className="text-gray-400" />}
                </button>
                {showNote && (
                  <textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    rows={3}
                    placeholder="Delivery instructions, preferred time..."
                    className="mt-3 w-full resize-none rounded-xl border border-[#eee] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#C89B3C]/50 focus:ring-2 focus:ring-[#C89B3C]/15"
                  />
                )}
              </div>

              {/* Coupon */}
              <div className="border-t border-[#eee] px-5 py-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-3">
                    <div>
                      <p className="text-[13px] font-semibold text-emerald-800">Coupon applied</p>
                      <p className="text-[11px] text-emerald-700">
                        {appliedCoupon.code} — saved {formatINR(bill.couponDiscount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-[11px] font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Coupon code (e.g. FRESH10)"
                      className="min-w-0 flex-1 rounded-xl border border-[#eee] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#C89B3C]/50 focus:ring-2 focus:ring-[#C89B3C]/15"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="btn-premium-navy shrink-0 px-4 py-2.5 text-[11px]"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {couponMessage && !appliedCoupon && (
                  <p className="mt-2 text-xs text-red-500">{couponMessage}</p>
                )}
              </div>

              {/* Bill summary — scrolls with content so footer stays visible */}
              <div className="border-t border-[#eee] px-5 py-4">
                <button
                  type="button"
                  onClick={() => setShowBill((p) => !p)}
                  className="flex w-full items-center justify-between rounded-xl border border-[#eee] bg-white px-3.5 py-2.5 text-left transition hover:border-[#C89B3C]/30"
                >
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-[#082F63]">
                    <ShieldCheck size={16} className="text-[#C89B3C]" />
                    Bill Summary
                  </span>
                  {showBill ? (
                    <HiChevronUp size={18} className="text-gray-400" />
                  ) : (
                    <HiChevronDown size={18} className="text-gray-400" />
                  )}
                </button>

                {showBill && (
                  <div className="mt-3 space-y-2.5 rounded-xl border border-[#eee] bg-white p-4">
                    <BillRow label="Subtotal" value={bill.subtotal} />
                    <BillRow
                      label="Shipping"
                      value={bill.shippingCharge === 0 ? "FREE" : bill.shippingCharge}
                      muted={bill.shippingCharge === 0}
                    />
                    {bill.prepaidDiscount > 0 && (
                      <BillRow label="Prepaid discount" value={-bill.prepaidDiscount} highlight />
                    )}
                    {bill.discountOnMrp > 0 && (
                      <BillRow label="Discount on MRP" value={-bill.discountOnMrp} highlight />
                    )}
                    {bill.couponDiscount > 0 && (
                      <BillRow
                        label={`Coupon (${appliedCoupon?.code})`}
                        value={-bill.couponDiscount}
                        highlight
                      />
                    )}
                  </div>
                )}
              </div>

              {/* You may also like */}
              {suggested.length > 0 && (
                <div className="border-t px-5 py-4">
                  <h3 className="mb-3 text-[14px] font-semibold text-gray-800">
                    Items you may like
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {suggested.map((product) => (
                      <SuggestedProduct
                        key={product.id}
                        product={product}
                        onAdd={addToCart}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer — sticky checkout actions */}
            <div className="shrink-0 border-t border-[#eee] bg-white shadow-[0_-12px_40px_rgba(8,47,99,0.08)]">
              <div className="px-5 pt-3.5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C89B3C]">
                      Estimated total
                    </p>
                    {(bill.prepaidDiscount + bill.discountOnMrp + bill.couponDiscount) > 0 && (
                      <p className="mt-1 text-[11px] font-medium text-emerald-600">
                        You save{" "}
                        {formatINR(bill.prepaidDiscount + bill.discountOnMrp + bill.couponDiscount)}
                      </p>
                    )}
                  </div>
                  <p className="font-heading text-[24px] font-bold leading-none text-[#082F63] sm:text-[26px]">
                    {formatINR(bill.estimatedTotal)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openPaymentModal}
                  className="btn-premium-gold mb-2 flex h-11 w-full items-center justify-center gap-2 text-[12px] sm:h-12"
                >
                  <Lock size={14} strokeWidth={2.5} />
                  {cartConfig.checkoutCta}
                </button>

                <button
                  type="button"
                  onClick={whatsappCheckout}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border-2 border-[#25D366]/30 bg-[#25D366]/5 text-[11px] font-bold uppercase tracking-wide text-[#128C7E] transition hover:border-[#25D366]/50 hover:bg-[#25D366]/10 sm:h-11 sm:text-[12px]"
                >
                  <FaWhatsapp size={16} />
                  Order on WhatsApp
                </button>

                <div className="mt-2.5 flex flex-col items-center gap-1 pb-0.5">
                  <p className="text-center text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    {cartConfig.paymentMethodsLabel}
                  </p>
                  <p className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <Lock size={10} className="text-[#C89B3C]/70" />
                    Secured by {cartConfig.paymentProvider}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
