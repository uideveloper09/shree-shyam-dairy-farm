export function formatINR(amount) {
  return `₹${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function calculateBill(cartItems, cartConfig, appliedCoupon = null) {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const mrpTotal = cartItems.reduce(
    (sum, item) => sum + (item.compareAtPrice || item.price) * item.quantity,
    0
  );

  const discountOnMrp = Math.max(0, mrpTotal - subtotal);

  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percent") {
      couponDiscount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else if (appliedCoupon.type === "fixed") {
      couponDiscount = appliedCoupon.value;
    }
    couponDiscount = Math.min(couponDiscount, subtotal);
  }

  const afterCoupon = Math.max(0, subtotal - couponDiscount);
  const shippingCharge =
    afterCoupon >= (cartConfig.freeShippingMin ?? 500)
      ? 0
      : (cartConfig.shippingCharge ?? 40);

  const amountBeforePrepaid = afterCoupon + shippingCharge;
  const prepaidDiscount = Math.round(
    (amountBeforePrepaid * (cartConfig.prepaidDiscountPercent ?? 5)) / 100
  );
  const estimatedTotal = Math.max(0, amountBeforePrepaid - prepaidDiscount);

  return {
    subtotal,
    mrpTotal,
    discountOnMrp,
    couponDiscount,
    shippingCharge,
    prepaidDiscount,
    estimatedTotal,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export function findCoupon(coupons, code) {
  if (!code?.trim()) return null;
  const normalized = code.trim().toUpperCase();
  return coupons.find((c) => c.code.toUpperCase() === normalized) || null;
}
