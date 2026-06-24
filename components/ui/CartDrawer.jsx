"use client";

import { useState } from "react";
import Image from "next/image";
import { HiX, HiChevronDown, HiChevronUp } from "react-icons/hi";
import { useCart } from "@/context/CartContext";
import { useSiteData } from "@/context/SiteDataContext";
import { formatINR } from "@/lib/cart";
import PaymentCheckoutModal from "@/components/ui/PaymentCheckoutModal";

function BillRow({ label, value, highlight = false, muted = false }) {
  if (value === 0 && muted) return null;
  return (
    <div className="flex items-center justify-between text-[14px]">
      <span className={muted ? "text-gray-500" : "text-gray-700"}>{label}</span>
      <span
        className={
          highlight
            ? "font-semibold text-green-600"
            : muted
              ? "text-gray-500"
              : "font-medium text-gray-900"
        }
      >
        {typeof value === "number" ? formatINR(value) : value}
      </span>
    </div>
  );
}

function SuggestedProduct({ product, onAdd }) {
  return (
    <div className="flex w-[140px] shrink-0 flex-col">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        <Image src={product.image} alt={product.name} fill className="object-cover" sizes="140px" />
      </div>
      <p className="mt-2 line-clamp-2 text-[12px] font-medium text-gray-800">{product.name}</p>
      <p className="text-[12px] text-gray-500">{formatINR(product.price)}</p>
      <button
        type="button"
        onClick={() => onAdd(product)}
        className="mt-2 rounded border border-gray-300 py-1.5 text-[11px] font-semibold uppercase hover:bg-gray-50"
      >
        Add
      </button>
    </div>
  );
}

export default function CartDrawer() {
  const { site, cart: cartConfig, products } = useSiteData();
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
  const [showBill, setShowBill] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

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

      <div className="fixed inset-0 z-[60] bg-black/50" onClick={closeCart} aria-hidden />

      <aside className="fixed top-0 right-0 z-[70] flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1a]">{cartConfig.title}</h2>
            <p className="text-[13px] text-gray-500">({bill.itemCount}) items</p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="Close cart"
          >
            <HiX size={22} />
          </button>
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
                document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-6 rounded-md bg-[#1a1a1a] px-8 py-3 text-[13px] font-bold uppercase tracking-wide text-white hover:bg-[#333]"
            >
              {cartConfig.emptyCta}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
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
                      <div className="flex gap-3">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-[14px] font-semibold leading-snug text-gray-900">
                              {item.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => setRemoveConfirmId(item.id)}
                              className="shrink-0 text-gray-400 hover:text-red-500"
                              aria-label="Remove item"
                            >
                              <HiX size={16} />
                            </button>
                          </div>
                          <p className="mt-0.5 text-[13px] text-gray-500">{item.unit}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center overflow-hidden rounded-md border border-gray-300">
                              <button
                                type="button"
                                onClick={() => decreaseQty(item.id)}
                                className="px-2.5 py-1 text-sm hover:bg-gray-50"
                              >
                                −
                              </button>
                              <span className="min-w-[28px] text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => increaseQty(item.id)}
                                className="px-2.5 py-1 text-sm hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[14px] font-semibold">
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
              <div className="border-t px-5 py-4">
                <button
                  type="button"
                  onClick={() => setShowNote((p) => !p)}
                  className="flex w-full items-center justify-between text-[14px] font-medium text-gray-800"
                >
                  Add a note
                  {showNote ? <HiChevronUp size={18} /> : <HiChevronDown size={18} />}
                </button>
                {showNote && (
                  <textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    rows={3}
                    placeholder="Delivery instructions, preferred time..."
                    className="mt-3 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#082F63]"
                  />
                )}
              </div>

              {/* Coupon */}
              <div className="border-t px-5 py-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-green-800">Hurray!</p>
                      <p className="text-xs text-green-700">
                        {appliedCoupon.code} applied — You saved {formatINR(bill.couponDiscount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs font-semibold text-red-600 hover:underline"
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
                      className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#082F63]"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="shrink-0 rounded-md bg-[#1a1a1a] px-4 py-2 text-[12px] font-bold uppercase text-white hover:bg-[#333]"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {couponMessage && !appliedCoupon && (
                  <p className="mt-2 text-xs text-red-500">{couponMessage}</p>
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

            {/* Footer — Bill + Checkout */}
            <div className="border-t bg-[#fafafa] px-5 py-4">
              <button
                type="button"
                onClick={() => setShowBill((p) => !p)}
                className="mb-3 flex w-full items-center justify-between text-[14px] font-semibold text-gray-800"
              >
                Bill Summary
                {showBill ? <HiChevronUp size={18} /> : <HiChevronDown size={18} />}
              </button>

              {showBill && (
                <div className="mb-4 space-y-2 rounded-lg border border-gray-200 bg-white p-4">
                  <BillRow label="Subtotal" value={bill.subtotal} />
                  <BillRow
                    label="Shipping Charges"
                    value={bill.shippingCharge === 0 ? "FREE" : bill.shippingCharge}
                    muted={bill.shippingCharge === 0}
                  />
                  <BillRow
                    label="Prepaid Discount"
                    value={-bill.prepaidDiscount}
                    highlight={bill.prepaidDiscount > 0}
                  />
                  <BillRow
                    label="Discount on MRP"
                    value={-bill.discountOnMrp}
                    highlight={bill.discountOnMrp > 0}
                  />
                  {bill.couponDiscount > 0 && (
                    <BillRow
                      label={`Coupon (${appliedCoupon?.code})`}
                      value={-bill.couponDiscount}
                      highlight
                    />
                  )}
                  <div className="border-t border-dashed border-gray-200 pt-2">
                    <BillRow label="Estimated Total" value={bill.estimatedTotal} />
                  </div>
                </div>
              )}

              <div className="mb-3 flex items-center justify-between">
                <span className="text-[15px] font-semibold text-gray-800">Estimated Total</span>
                <span className="text-lg font-bold text-[#1a1a1a]">
                  {formatINR(bill.estimatedTotal)}
                </span>
              </div>

              <button
                type="button"
                onClick={openPaymentModal}
                className="mb-3 w-full rounded-md bg-[#082F63] py-3.5 text-[14px] font-bold text-white transition hover:bg-[#0a3a7a]"
              >
                🎉 {cartConfig.checkoutCta} 🎉
              </button>

              <button
                type="button"
                onClick={openPaymentModal}
                className="mb-3 w-full rounded-md border-2 border-[#082F63] bg-white py-3 text-[13px] font-bold text-[#082F63] transition hover:bg-[#082F63]/5"
              >
                {cartConfig.placeOrderCta} — {cartConfig.paymentMethodsLabel}
              </button>

              <button
                type="button"
                onClick={whatsappCheckout}
                className="w-full py-2 text-center text-[12px] font-medium text-green-700 hover:underline"
              >
                Or order on WhatsApp
              </button>

              <p className="mt-3 text-center text-[11px] text-gray-400">
                Powered by {cartConfig.paymentProvider}
              </p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
