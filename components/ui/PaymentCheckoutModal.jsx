"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiX } from "react-icons/hi";
import { ShieldCheck, Lock, ChevronDown, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/cart";
import { finalizeQrPayment, openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { PaymentMethodLogo } from "@/components/ui/PaymentMethodIcons";
import PaymentScannerPanel from "@/components/ui/PaymentScannerPanel";
import {
  PAYMENT_METHOD_META,
  UPI_METHODS,
} from "@/lib/paymentMethods";

const PAYMENT_METHODS = Object.values(PAYMENT_METHOD_META);

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
    <div className="overflow-hidden rounded-xl border border-[#C89B3C]/25 bg-[#C89B3C]/8">
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
        </div>
      )}
    </div>
  );
}

function MethodTabs({ method, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {PAYMENT_METHODS.map((item) => {
        const active = method === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-pressed={active}
            className={`flex shrink-0 flex-col items-center gap-1.5 rounded-xl px-3 py-2.5 transition sm:min-w-[72px] ${
              active
                ? "border-[0.5px] bg-white shadow-sm"
                : "border border-[#e8e4dc] bg-[#faf9f6] hover:border-[#d8d4cc]"
            }`}
            style={active ? { borderColor: item.brandColor } : undefined}
          >
            <PaymentMethodLogo id={item.id} size="sm" active={active} brandColor={item.brandColor} />
            <span
              className={`max-w-[68px] truncate text-center text-[10px] font-semibold leading-tight sm:text-[11px] ${
                active ? "text-[#082F63]" : "text-[#082F63]/70"
              }`}
            >
              {item.shortLabel}
            </span>
          </button>
        );
      })}
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
  const [isMobile, setIsMobile] = useState(false);

  const [qrImageUrl, setQrImageUrl] = useState("");
  const [qrId, setQrId] = useState("");
  const [qrKind, setQrKind] = useState("qr_code");
  const [orderId, setOrderId] = useState("");
  const [keyId, setKeyId] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [showBillDetails, setShowBillDetails] = useState(false);

  const pollRef = useRef(null);
  const qrRequestRef = useRef(0);

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const completePayment = useCallback(async () => {
    setPaidSuccess(true);
    clearPoll();
    onSuccess?.();
    onClose();
  }, [clearPoll, onClose, onSuccess]);

  const loadUpiQr = useCallback(async () => {
    if (!UPI_METHODS.has(method)) return;

    const requestId = ++qrRequestRef.current;
    setQrLoading(true);
    setQrError("");
    setQrImageUrl("");
    setQrId("");
    setQrKind("qr_code");
    setOrderId("");

    try {
      const res = await fetch("/api/payment/upi-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: bill.estimatedTotal,
          items: cartItems,
          note: orderNote,
          coupon: appliedCoupon,
          method,
        }),
      });

      const data = await res.json();
      if (requestId !== qrRequestRef.current) return;

      if (!res.ok) {
        throw new Error(data.error || data.detail || "Could not load QR");
      }

      setOrderId(data.orderId);
      setKeyId(data.keyId);

      if (data.qrFailed) {
        setQrError(data.qrError || "QR could not be loaded");
        return;
      }

      setQrImageUrl(data.qrImageUrl);
      setQrId(data.qrId);
      setQrKind(data.qrKind || "qr_code");
    } catch (err) {
      if (requestId !== qrRequestRef.current) return;
      setQrError(err.message || "QR load failed");
    } finally {
      if (requestId === qrRequestRef.current) {
        setQrLoading(false);
      }
    }
  }, [appliedCoupon, bill.estimatedTotal, cartItems, method, orderNote]);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!open) return;

    setError("");
    setMethod("upi");
    setPaidSuccess(false);
    setShowBillDetails(false);
    setQrImageUrl("");
    setQrId("");
    setQrKind("qr_code");
    setOrderId("");

    fetch("/api/payment/config")
      .then((r) => r.json())
      .then(setConfigured)
      .catch(() => setConfigured({ configured: false }));

    return () => clearPoll();
  }, [clearPoll, open]);

  useEffect(() => {
    if (!open || !configured?.configured) return undefined;

    if (UPI_METHODS.has(method)) {
      loadUpiQr();
    } else {
      setQrImageUrl("");
      setQrId("");
      setOrderId("");
      clearPoll();
    }

    return () => {
      qrRequestRef.current += 1;
    };
  }, [clearPoll, configured?.configured, loadUpiQr, method, open]);

  useEffect(() => {
    clearPoll();

    if (!open || !qrId || !orderId || paidSuccess || !UPI_METHODS.has(method)) {
      return undefined;
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payment/qr-status?qrId=${encodeURIComponent(qrId)}&orderId=${encodeURIComponent(orderId)}&qrKind=${encodeURIComponent(qrKind)}`
        );
        const data = await res.json();

        if (data.paid) {
          await finalizeQrPayment({
            paymentId: data.paymentId,
            orderId: data.orderId,
            items: cartItems,
            bill,
            note: orderNote,
            coupon: appliedCoupon,
          });
          await completePayment();
        }
      } catch {
        /* keep polling */
      }
    }, 3000);

    return clearPoll;
  }, [
    appliedCoupon,
    bill,
    cartItems,
    clearPoll,
    completePayment,
    method,
    open,
    orderId,
    orderNote,
    paidSuccess,
    qrId,
    qrKind,
  ]);

  const handleOpenApp = async () => {
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
        paymentMethod: method,
        orderId,
        keyId,
        onSuccess: completePayment,
        onDismiss: () => setLoading(false),
      });
    } catch (err) {
      if (err.message !== "Payment cancelled") {
        setError(err.message || "Payment could not be started");
      }
    } finally {
      setLoading(false);
    }
  };

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
        paymentMethod: method,
        orderId: method !== "card" ? orderId : undefined,
        keyId: method !== "card" ? keyId : undefined,
        onSuccess: completePayment,
        onDismiss: () => setLoading(false),
      });
    } catch (err) {
      if (err.message !== "Payment cancelled") {
        setError(err.message || "Payment could not be started");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedMethod = PAYMENT_METHOD_META[method];
  const payLabel =
    method === "card"
      ? `Pay ${formatINR(bill.estimatedTotal)} · Card`
      : isMobile
        ? `${selectedMethod?.openLabel || "Pay"} · ${formatINR(bill.estimatedTotal)}`
        : `Pay ${formatINR(bill.estimatedTotal)} · ${selectedMethod?.label || "UPI"}`;

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
            className="fixed inset-x-3 bottom-3 z-[90] grid max-h-[min(92dvh,720px)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-white/10 bg-[#faf9f6] shadow-[0_24px_80px_rgba(8,47,99,0.35)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#082F63] via-[#0B3D7A] to-[#061E3D] px-5 pb-4 pt-5">
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

              <div className="relative mt-4">
                <button
                  type="button"
                  onClick={() => setShowBillDetails((v) => !v)}
                  aria-expanded={showBillDetails}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-left backdrop-blur-sm transition hover:bg-white/[0.1]"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C89B3C]/90">
                      Total payable
                    </p>
                    <p className="mt-0.5 font-heading text-[22px] font-bold leading-none text-white sm:text-[24px]">
                      {formatINR(bill.estimatedTotal)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-[#C89B3C]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#C89B3C] ring-1 ring-[#C89B3C]/30">
                      {bill.itemCount} item{bill.itemCount === 1 ? "" : "s"}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-[#C89B3C] transition ${showBillDetails ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {showBillDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                        <div className="space-y-1.5">
                          <BillLine label="Subtotal" value={bill.subtotal} />
                          <BillLine label="Shipping" value={bill.shippingCharge} muted />
                          <BillLine label="Prepaid discount" value={bill.prepaidDiscount} accent />
                          <BillLine label="Coupon savings" value={bill.couponDiscount} accent />
                        </div>
                        <p className="mt-3 border-t border-dashed border-white/15 pt-3 text-[11px] text-white/45">
                          Tap above to hide bill details
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-4 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#082F63]/20">
              {configured === null ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <Loader2 size={28} className="animate-spin text-[#082F63]/40" />
                  <p className="text-[13px] text-gray-500">Loading secure payment options...</p>
                </div>
              ) : !configured.configured ? (
                <DevSetupNotice />
              ) : (
                <div className="space-y-4 pb-1">
                  <div>
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C89B3C]">
                      Payment method
                    </p>
                    <MethodTabs method={method} onChange={setMethod} />
                  </div>

                  <PaymentScannerPanel
                    methodId={method}
                    amount={bill.estimatedTotal}
                    qrImageUrl={UPI_METHODS.has(method) ? qrImageUrl : ""}
                    qrLoading={UPI_METHODS.has(method) && qrLoading}
                    qrError={qrError}
                    isMobile={isMobile}
                    onOpenApp={handleOpenApp}
                    openLoading={loading}
                  />
                </div>
              )}

              {error && (
                <div className="mt-3 rounded-xl border border-red-200/80 bg-red-50 px-3.5 py-3 text-[13px] leading-relaxed text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-[#e8e4dc] bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={handlePay}
                disabled={loading || configured === null || !configured?.configured || qrLoading}
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
                    {payLabel}
                  </>
                )}
              </button>

              <div className="mt-3 flex items-center justify-center gap-2 text-center text-[11px] leading-snug text-gray-400">
                <Lock size={12} className="shrink-0 text-[#C89B3C]/70" />
                <span>
                  {UPI_METHODS.has(method)
                    ? "Scan QR or open app — auto-detects payment"
                    : `${cartConfig.paymentMethodsLabel} — Secured by ${cartConfig.paymentProvider}`}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
