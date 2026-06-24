"use client";

import {
createContext,
useContext,
useMemo,
useState,
} from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
const [cartItems, setCartItems] = useState([]);
const [isCartOpen, setIsCartOpen] = useState(false);

// --------------------------------
// Cart Drawer Controls
// --------------------------------

const openCart = () => {
setIsCartOpen(true);
};

const closeCart = () => {
setIsCartOpen(false);
};

const toggleCart = () => {
setIsCartOpen((prev) => !prev);
};

// --------------------------------
// Add To Cart
// --------------------------------

const addToCart = (product) => {
  setCartItems((prev) => {
    const existing = prev.find(
      (item) => item.id === product.id
    );

    if (existing) {
      return prev.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      );
    }

    return [
      ...prev,
      {
        ...product,
        quantity: 1,
      },
    ];
  });

  // Drawer automatically open nahi hoga
};

// --------------------------------
// Remove Item
// --------------------------------

const removeFromCart = (id) => {
setCartItems((prev) =>
prev.filter((item) => item.id !== id)
);
};

// --------------------------------
// Increase Quantity
// --------------------------------

const increaseQty = (id) => {
setCartItems((prev) =>
prev.map((item) =>
item.id === id
? {
...item,
quantity: item.quantity + 1,
}
: item
)
);
};

// --------------------------------
// Decrease Quantity
// --------------------------------

const decreaseQty = (id) => {
  setCartItems((prev) =>
    prev
      .map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity - 1,
            }
          : item
      )
      .filter((item) => item.quantity > 0)
  );
};

// --------------------------------
// Clear Cart
// --------------------------------

const clearCart = () => {
setCartItems([]);
};

// --------------------------------
// Total Items
// --------------------------------

const totalItems = useMemo(() => {
return cartItems.reduce(
(sum, item) => sum + item.quantity,
0
);
}, [cartItems]);

// --------------------------------
// Total Price
// --------------------------------

const totalPrice = useMemo(() => {
return cartItems.reduce(
(sum, item) =>
sum + item.price * item.quantity,
0
);
}, [cartItems]);

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
  }}
>
  {children}
</CartContext.Provider>
);
}

export const useCart = () =>
useContext(CartContext);
