"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiX,
} from "react-icons/hi";
import {
  ShieldCheck,
  Lock,
  Smartphone,
  CreditCard,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { FaGooglePay } from "react-icons/fa";
import { formatINR } from "@/lib/cart";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";

const PAYMENT_METHODS = [
  {
    id: "upi",
    label: "UPI",
    desc: "Any UPI app",
    Icon: Smartphone,
  },
  {
    id: "gpay",
    label: "Google Pay",
    desc: "Fast & secure",
    Icon: FaGooglePay,
  },
  {
    id: "phonepe",
    label: "PhonePe",
    desc: "Quick payment",
    Icon: Smartphone,
  },
  {
    id: "card",
    label: "Card",
    desc: "Credit / Debit",
    Icon: CreditCard,
  },
];

function BillLine({ label, value, accent = false, muted = false }) {
  if (value === 0 && muted) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className={muted ? "text-white/50" : "text-white/70"}>{label}</span>
      <span
        className={
          accent
            ? "font-semibold text-[#7dffb0]"
            : muted
              ? "text-white/50"
              : "font-medium text-white/90"
        }
      >
        {typeof value === "number" ? formatINR(value) : value}
      </span>
    </div>
  );
}

function DevSetupNotice() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[#C89B3C]/25 bg-[#C89B3C]/8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="text-[13px] font-semibold text-[#082F63]">Payment gateway setup</p>
          <p className="text-[11px] text-[#082F63]/60">Add Razorpay keys to enable live checkout</p>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#C89B3C] transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-[#C89B3C]/20 px-4 pb-4 pt-3 text-[12px] leading-relaxed text-[#082F63]/80">
          <p>
            Create <code className="rounded bg-white/80 px-1.5 py-0.5 text-[11px]">.env.local</code>{" "}
            and restart the dev server:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-white/90 p-3 text-[11px] text-gray-700 ring-1 ring-[#082F63]/10">
{`NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret`}
          </pre>
          <a
            href="https://dashboard.razorpay.com/app/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-[12px] font-semibold text-[#082F63] underline decoration-[#C89B3C]/60 underline-offset-2"
          >
            Get keys from Razorpay Dashboard →
          </a>
        </div>
      )}
    </div>
  );
}

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

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === method);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-[#061E3D]/70 backdrop-blur-[3px]"
            onClick={onClose}
            aria-label="Close checkout overlay"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-3 bottom-3 z-[90] flex max-h-[min(640px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#faf9f6] shadow-[0_24px_80px_rgba(8,47,99,0.35)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#082F63] via-[#0B3D7A] to-[#061E3D] px-5 pb-5 pt-5">
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 100% 0%, #C89B3C 0%, transparent 45%)",
                }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-[#C89B3C]/40 backdrop-blur-sm">
                    <ShieldCheck size={22} className="text-[#C89B3C]" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2
                      id="checkout-title"
                      className="font-heading text-[20px] font-bold leading-tight text-white"
                    >
                      Safe Checkout
                    </h2>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">
                      Powered by {cartConfig.paymentProvider}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                  aria-label="Close checkout"
                >
                  <HiX size={20} />
                </button>
              </div>

              {/* Amount summary */}
              <div className="relative mt-5 rounded-xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C89B3C]/90">
                      Total payable
                    </p>
                    <p className="mt-1 font-heading text-[28px] font-bold leading-none text-white">
                      {formatINR(bill.estimatedTotal)}
                    </p>
                  </div>
                  <div className="rounded-full bg-[#C89B3C]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#C89B3C] ring-1 ring-[#C89B3C]/30">
                    {bill.itemCount} item{bill.itemCount === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="mt-4 space-y-2 border-t border-dashed border-white/15 pt-3">
                  <BillLine label="Subtotal" value={bill.subtotal} />
                  <BillLine label="Shipping" value={bill.shippingCharge} muted />
                  <BillLine label="Prepaid discount" value={bill.prepaidDiscount} accent />
                  <BillLine label="Coupon savings" value={bill.couponDiscount} accent />
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#082F63]/20">
              {configured === null ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <Loader2 size={28} className="animate-spin text-[#082F63]/40" />
                  <p className="text-[13px] text-gray-500">Loading secure payment options...</p>
                </div>
              ) : !configured.configured ? (
                <DevSetupNotice />
              ) : (
                <>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C89B3C]">
                    Payment method
                  </p>
                  <div className="mb-2 grid grid-cols-2 gap-2.5">
                    {PAYMENT_METHODS.map(({ id, label, desc, Icon }) => {
                      const active = method === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setMethod(id)}
                          className={`group relative overflow-hidden rounded-xl border p-3.5 text-left transition duration-200 ${
                            active
                              ? "border-[#082F63] bg-white shadow-[0_8px_24px_rgba(8,47,99,0.12)] ring-2 ring-[#C89B3C]/40"
                              : "border-[#e8e4dc] bg-white hover:border-[#C89B3C]/40 hover:shadow-sm"
                          }`}
                        >
                          {active && (
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#C89B3C]" />
                          )}
                          <Icon
                            size={20}
                            className={active ? "text-[#082F63]" : "text-gray-400 group-hover:text-[#082F63]"}
                          />
                          <p className="mt-2 text-[13px] font-semibold text-[#082F63]">{label}</p>
                          <p className="text-[11px] text-gray-500">{desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {error && (
                <div className="mt-3 rounded-xl border border-red-200/80 bg-red-50 px-3.5 py-3 text-[13px] leading-relaxed text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-[#e8e4dc] bg-white px-5 py-4">
              <button
                type="button"
                onClick={handlePay}
                disabled={loading || configured === null || !configured?.configured}
                className="btn-premium-gold relative flex h-12 w-full items-center justify-center gap-2 text-[13px] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Opening secure payment...
                  </>
                ) : (
                  <>
                    <Lock size={15} strokeWidth={2.25} />
                    Pay {formatINR(bill.estimatedTotal)}
                    {selectedMethod ? ` · ${selectedMethod.label}` : ""}
                  </>
                )}
              </button>

              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-gray-400">
                <Lock size={12} className="text-[#C89B3C]/70" />
                <span>
                  {cartConfig.paymentMethodsLabel} — Secured by {cartConfig.paymentProvider}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
