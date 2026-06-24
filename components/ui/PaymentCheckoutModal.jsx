"use client";

import { useEffect, useState } from "react";
import { HiX } from "react-icons/hi";
import { formatINR } from "@/lib/cart";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", desc: "Pay via any UPI app", icon: "📱" },
  { id: "gpay", label: "Google Pay", desc: "Fast & secure", icon: "🟢" },
  { id: "phonepe", label: "PhonePe", desc: "Quick payment", icon: "🟣" },
  { id: "card", label: "Card", desc: "Credit / Debit card", icon: "💳" },
];

export default function PaymentCheckoutModal({
  open,
  onClose,
  bill,
  cartItems,
  orderNote,
  appliedCoupon,
  site,
  cartConfig,
  onSuccess,
}) {
  const [method, setMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(null);

  useEffect(() => {
    if (!open) return;

    setError("");
    setMethod("upi");
    fetch("/api/payment/config")
      .then((r) => r.json())
      .then(setConfigured)
      .catch(() => setConfigured({ configured: false }));
  }, [open]);

  if (!open) return null;

  const handlePay = async () => {
    setLoading(true);
    setError("");

    try {
      await openRazorpayCheckout({
        amount: bill.estimatedTotal,
        items: cartItems,
        note: orderNote,
        coupon: appliedCoupon,
        bill,
        site,
        onSuccess,
        onDismiss: () => setLoading(false),
      });
      onClose();
    } catch (err) {
      if (err.message !== "Payment cancelled") {
        setError(err.message || "Payment could not be started");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[80] bg-black/60"
        onClick={onClose}
        aria-hidden
      />

      <div className="fixed inset-x-0 bottom-0 z-[90] max-h-[92vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Safe Checkout</h2>
            <p className="text-[12px] text-gray-500">Powered by {cartConfig.paymentProvider}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="Close checkout"
          >
            <HiX size={22} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="mb-5 rounded-xl border border-gray-200 bg-[#fafafa] p-4">
            <div className="flex items-center justify-between text-[14px]">
              <span className="text-gray-600">Amount to pay</span>
              <span className="text-xl font-bold text-[#082F63]">
                {formatINR(bill.estimatedTotal)}
              </span>
            </div>
            <div className="mt-2 space-y-1 border-t border-dashed border-gray-200 pt-2 text-[12px] text-gray-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatINR(bill.subtotal)}</span>
              </div>
              {bill.shippingCharge > 0 && (
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatINR(bill.shippingCharge)}</span>
                </div>
              )}
              {bill.prepaidDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Prepaid discount</span>
                  <span>-{formatINR(bill.prepaidDiscount)}</span>
                </div>
              )}
              {bill.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon</span>
                  <span>-{formatINR(bill.couponDiscount)}</span>
                </div>
              )}
            </div>
          </div>

          {configured === null ? (
            <p className="py-6 text-center text-sm text-gray-500">Loading payment options...</p>
          ) : !configured.configured ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-900">
              <p className="font-semibold">Payment gateway not set up yet</p>
              <p className="mt-2 leading-relaxed">
                Create <code className="rounded bg-amber-100 px-1">.env.local</code> with your
                Razorpay test keys, then restart <code className="rounded bg-amber-100 px-1">npm run dev</code>:
              </p>
              <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-[11px] text-gray-700">
{`NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret`}
              </pre>
              <p className="mt-2 text-[12px]">
                Get keys from{" "}
                <a
                  href="https://dashboard.razorpay.com/app/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  Razorpay Dashboard
                </a>
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-[13px] font-semibold text-gray-800">Select payment method</p>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      method === m.id
                        ? "border-[#082F63] bg-[#082F63]/5 ring-1 ring-[#082F63]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xl">{m.icon}</span>
                    <p className="mt-1 text-[13px] font-semibold text-gray-900">{m.label}</p>
                    <p className="text-[11px] text-gray-500">{m.desc}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handlePay}
            disabled={loading || configured === null || !configured?.configured}
            className="w-full rounded-md bg-[#082F63] py-3.5 text-[14px] font-bold text-white transition hover:bg-[#0a3a7a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Opening payment..."
              : `🎉 Pay ${formatINR(bill.estimatedTotal)} via ${PAYMENT_METHODS.find((m) => m.id === method)?.label} 🎉`}
          </button>

          <p className="mt-3 text-center text-[11px] text-gray-400">
            {cartConfig.paymentMethodsLabel} — Secured by Razorpay
          </p>
        </div>
      </div>
    </>
  );
}
