"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Loader2, Lock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { useSiteData } from "@/features/cart/context/SiteDataContext";
import { openRazorpayCheckout } from "@/utils/razorpayCheckout";
import { formatINR } from "@/utils/cart";

const TEST_AMOUNT = 1;

export default function TestPaymentClient() {
  const { site } = useSiteData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const handlePay = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      const checkoutRes = await fetch("/api/v1/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ id: 1, name: "Payment Test", quantity: 1, price: TEST_AMOUNT }],
          bill: {
            subtotal: TEST_AMOUNT,
            shippingCharge: 0,
            discount: 0,
            estimatedTotal: TEST_AMOUNT,
          },
          note: "₹1 live payment test",
        }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || "Could not prepare order");
      }

      await openRazorpayCheckout({
        amount: checkoutData.amount,
        receipt: checkoutData.receipt,
        internalOrderId: checkoutData.orderId,
        site,
        paymentMethod: "upi",
        onSuccess: (verifyData) => {
          setSuccess({
            orderNumber: checkoutData.orderNumber,
            message: verifyData.message,
          });
        },
        onDismiss: () => setLoading(false),
      });
    } catch (err) {
      if (err.message !== "Payment cancelled") {
        setError(err.message || "Payment could not be started");
      }
    } finally {
      setLoading(false);
    }
  }, [site]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#f8f6f1] to-white px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#082F63]/70 transition hover:text-[#082F63]"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white shadow-[0_16px_48px_rgba(8,47,99,0.1)]">
          <div className="bg-gradient-to-br from-[#082F63] via-[#0B3D7A] to-[#061E3D] px-6 py-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C89B3C]">
              Live payment test
            </p>
            <h1 className="mt-1 font-heading text-[22px] font-bold text-white">
              Razorpay ₹1 Check
            </h1>
            <p className="mt-1 text-[12px] text-white/60">Full checkout → verify → DB save flow</p>
          </div>

          <div className="space-y-4 px-6 py-6">
            <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-900">
              <strong>Live Razorpay</strong> — is test se asli {formatINR(TEST_AMOUNT)} charge hoga.
              Sirf payment flow verify karne ke liye use karein.
            </div>

            <div className="rounded-xl border border-[#e8e4dc] bg-[#faf9f6] px-4 py-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C89B3C]">
                Test amount
              </p>
              <p className="mt-1 font-heading text-[32px] font-bold text-[#082F63]">
                {formatINR(TEST_AMOUNT)}
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50 px-3.5 py-3 text-[13px] text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3.5 py-3 text-[13px] text-emerald-800">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Payment successful!</p>
                  <p className="mt-0.5 text-[12px]">Order: {success.orderNumber}</p>
                  {success.message ? (
                    <p className="mt-0.5 text-[12px] text-emerald-700/80">{success.message}</p>
                  ) : null}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handlePay}
              disabled={loading}
              className="btn-premium-gold flex h-12 w-full items-center justify-center gap-2 text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Opening Razorpay...
                </>
              ) : (
                <>
                  <Lock size={15} strokeWidth={2.25} />
                  Pay {formatINR(TEST_AMOUNT)} · Test
                </>
              )}
            </button>

            <p className="text-center text-[11px] leading-relaxed text-gray-400">
              Razorpay secure checkout — UPI, GPay, PhonePe, Paytm
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
