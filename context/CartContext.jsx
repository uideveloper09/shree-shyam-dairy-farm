"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useSiteData } from "@/context/SiteDataContext";
import { calculateBill, findCoupon } from "@/lib/cart";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { cart: cartConfig } = useSiteData();
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [removeConfirmId, setRemoveConfirmId] = useState(null);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => {
    setIsCartOpen(false);
    setRemoveConfirmId(null);
  };
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const addToCart = (product) => {
    if (product.inStock === false) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    setRemoveConfirmId(null);
  };

  const increaseQty = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
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
  }, [cartConfig.coupons, couponInput]);

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
