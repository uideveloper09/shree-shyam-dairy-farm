import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GUEST_CART_KEY } from "@/lib/auth/constants";

function ensureGuestId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem(GUEST_CART_KEY);
  if (!id) {
    id = `guest_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    localStorage.setItem(GUEST_CART_KEY, id);
  }
  return id;
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],
      orderNote: "",
      couponInput: "",
      appliedCoupon: null,
      couponMessage: "",
      guestId: null,

      setGuestId: (id) => set({ guestId: id }),

      initGuestId: () => {
        const id = ensureGuestId();
        if (id) set({ guestId: id });
        return id;
      },

      setCartItems: (items) => set({ cartItems: items }),

      setOrderNote: (note) => set({ orderNote: note }),

      setCouponInput: (value) => set({ couponInput: value }),

      setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),

      setCouponMessage: (msg) => set({ couponMessage: msg }),

      hydrateFromServer: (data) =>
        set({
          cartItems: data.cartItems ?? get().cartItems,
          orderNote: data.note ?? get().orderNote,
        }),

      clearCoupon: () => set({ appliedCoupon: null, couponInput: "", couponMessage: "" }),
    }),
    {
      name: "ssd-cart",
      partialize: (state) => ({
        cartItems: state.cartItems,
        orderNote: state.orderNote,
        guestId: state.guestId,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);
