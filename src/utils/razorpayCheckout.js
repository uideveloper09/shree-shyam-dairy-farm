import { loadRazorpayScript } from "@/utils/loadRazorpay";
import { getRazorpayCheckoutOptions } from "@/utils/paymentMethods";

function mapPaymentMethod(method) {
  if (method === "card") return "CARD";
  return "UPI";
}

/**
 * Opens Razorpay Checkout for a prepared order and verifies payment server-side.
 */
export async function openRazorpayCheckout({
  amount,
  receipt,
  internalOrderId,
  site,
  paymentMethod = "upi",
  razorpayOrderId: existingRazorpayOrderId,
  keyId: existingKeyId,
  onSuccess,
  onDismiss,
}) {
  const configRes = await fetch("/api/payment/config");
  const config = await configRes.json();

  if (!config.configured) {
    throw new Error(
      "Payment gateway is not configured. Add Razorpay keys to .env.local and restart the server."
    );
  }

  let razorpayOrderId = existingRazorpayOrderId;
  let keyId = existingKeyId || config.keyId;
  let orderAmount = Math.round(amount * 100);

  if (!razorpayOrderId) {
    const orderRes = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: receipt || `ssd_${Date.now()}`,
        orderId: internalOrderId,
        notes: internalOrderId ? { orderId: internalOrderId } : undefined,
      }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok || !orderData.success) {
      throw new Error(orderData.error || "Could not start checkout");
    }

    razorpayOrderId = orderData.order.id;
    orderAmount = orderData.order.amount;
  }

  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Could not load payment gateway. Check your internet connection.");
  }

  const methodOptions = getRazorpayCheckoutOptions(paymentMethod);

  return new Promise((resolve, reject) => {
    const options = {
      key: keyId,
      amount: orderAmount,
      currency: "INR",
      name: site.name,
      description: "Farm-fresh dairy order",
      order_id: razorpayOrderId,
      ...methodOptions,
      handler: async (response) => {
        try {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId: internalOrderId,
              amount,
              currency: "INR",
              paymentMethod: mapPaymentMethod(paymentMethod),
            }),
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(
              verifyData.message || verifyData.error || "Payment verification failed"
            );
          }

          onSuccess?.(verifyData);
          resolve(verifyData);
        } catch (err) {
          reject(err);
        }
      },
      prefill: {
        contact: site.phone?.replace(/\s/g, "").replace("+91", "") || "",
        email: site.email || "",
      },
      theme: { color: "#082F63" },
      modal: {
        ondismiss: () => {
          onDismiss?.();
          reject(new Error("Payment cancelled"));
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp) => {
      reject(new Error(resp.error?.description || "Payment failed"));
    });
    rzp.open();
  });
}

export async function finalizeQrPayment({
  paymentId,
  orderId: razorpayOrderId,
  internalOrderId,
  amount,
  paymentMethod = "upi",
}) {
  const verifyRes = await fetch("/api/payment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      qr_payment: true,
      orderId: internalOrderId,
      amount,
      currency: "INR",
      paymentMethod: mapPaymentMethod(paymentMethod),
    }),
  });

  const verifyData = await verifyRes.json();

  if (!verifyRes.ok || !verifyData.success) {
    throw new Error(verifyData.message || verifyData.error || "Payment verification failed");
  }

  return verifyData;
}
