import Razorpay from "razorpay";

export function getRazorpayClient() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId.includes("your_key")) {
    return null;
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function isRazorpayConfigured() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  return Boolean(
    keyId &&
    process.env.RAZORPAY_KEY_SECRET &&
    !keyId.includes("your_key") &&
    keyId.startsWith("rzp_")
  );
}
