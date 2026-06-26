"use client";

import { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { useSiteData } from "@/features/cart/context/SiteDataContext";
import { calculateBill, findCoupon } from "@/utils/cart";
import { useCartStore } from "@/features/cart/store/useCartStore";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { cart: cartConfig } = useSiteData();
  const cartItems = useCartStore((s) => s.cartItems);
  const setCartItems = useCartStore((s) => s.setCartItems);
  const orderNote = useCartStore((s) => s.orderNote);
  const setOrderNote = useCartStore((s) => s.setOrderNote);
  const couponInput = useCartStore((s) => s.couponInput);
  const setCouponInput = useCartStore((s) => s.setCouponInput);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const setAppliedCoupon = useCartStore((s) => s.setAppliedCoupon);
  const couponMessage = useCartStore((s) => s.couponMessage);
  const setCouponMessage = useCartStore((s) => s.setCouponMessage);
  const initGuestId = useCartStore((s) => s.initGuestId);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [removeConfirmId, setRemoveConfirmId] = useState(null);

  useEffect(() => {
    initGuestId();
  }, [initGuestId]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => {
    setIsCartOpen(false);
    setRemoveConfirmId(null);
  };
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const addToCart = (product) => {
    if (product.inStock === false) return;

    const prev = useCartStore.getState().cartItems;
    const existing = prev.find((item) => item.id === product.id);
    if (existing) {
      setCartItems(
        prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCartItems([...prev, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCartItems(useCartStore.getState().cartItems.filter((item) => item.id !== id));
    setRemoveConfirmId(null);
  };

  const increaseQty = (id) => {
    setCartItems(
      useCartStore
        .getState()
        .cartItems.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
  };

  const decreaseQty = (id) => {
    setCartItems(
      useCartStore
        .getState()
        .cartItems.map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setOrderNote("");
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage("");
    setRemoveConfirmId(null);
  };

  const applyCoupon = useCallback(() => {
    const coupon = findCoupon(cartConfig.coupons, couponInput);
    if (!coupon) {
      setAppliedCoupon(null);
      setCouponMessage("Invalid coupon code");
      return false;
    }
    setAppliedCoupon(coupon);
    setCouponMessage(`Hurray! ${coupon.code} applied successfully`);
    return true;
  }, [cartConfig.coupons, couponInput, setAppliedCoupon, setCouponMessage]);

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage("");
  };

  const bill = useMemo(
    () => calculateBill(cartItems, cartConfig, appliedCoupon),
    [cartItems, cartConfig, appliedCoupon]
  );

  const totalItems = bill.itemCount;
  const totalPrice = bill.subtotal;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart,
        totalItems,
        totalPrice,
        bill,
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
