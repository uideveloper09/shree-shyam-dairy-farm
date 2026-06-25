import { loadRazorpayScript } from "@/lib/loadRazorpay";
import { getRazorpayCheckoutOptions } from "@/lib/paymentMethods";

export async function openRazorpayCheckout({
  amount,
  items,
  note,
  coupon,
  bill,
  site,
  paymentMethod = "upi",
  orderId: existingOrderId,
  keyId: existingKeyId,
  onSuccess,
  onDismiss,
}) {
  let orderId = existingOrderId;
  let keyId = existingKeyId;
  let orderAmount = Math.round(amount * 100);

  if (!orderId) {
    const configRes = await fetch("/api/payment/config");
    const config = await configRes.json();

    if (!config.configured) {
      throw new Error(
        "Payment gateway is not configured. Add Razorpay keys to .env.local and restart the server."
      );
    }

    const orderRes = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, items, note, coupon }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      throw new Error(orderData.error || "Could not start checkout");
    }

    orderId = orderData.orderId;
    keyId = orderData.keyId;
    orderAmount = orderData.amount;
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
      order_id: orderId,
      ...methodOptions,
      handler: async (response) => {
        try {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              items,
              bill,
              note,
              coupon,
            }),
          });

          if (!verifyRes.ok) {
            throw new Error("Payment verification failed");
          }

          onSuccess?.();
          resolve(response);
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

export async function finalizeQrPayment({ paymentId, orderId, items, bill, note, coupon }) {
  const verifyRes = await fetch("/api/payment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      qr_payment: true,
      items,
      bill,
      note,
      coupon,
    }),
  });

  if (!verifyRes.ok) {
    throw new Error("Payment verification failed");
  }

  return verifyRes.json();
}
