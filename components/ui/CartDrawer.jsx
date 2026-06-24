"use client";

import { HiX } from "react-icons/hi";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
const {
isCartOpen,
closeCart,
cartItems,
totalPrice,
increaseQty,
decreaseQty,
removeFromCart,
clearCart,
} = useCart();

if (!isCartOpen) return null;

const whatsappCheckout = () => {
if (!cartItems.length) return;

const orderText = cartItems
  .map(
    (item) =>
      `${item.name} x ${item.quantity} = ₹${item.price * item.quantity}`
  )
  .join("\n");

const message = `🛒 Shree Shyam Dairy Farm Order

${orderText}

Total Amount: ₹${totalPrice}
--------------------------------`;

const phoneNumber = "919876543210";

window.open(
  `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
  "_blank"
);
}
return (
<>
{/* Overlay */} <div
     className="fixed inset-0 z-[60] bg-black/40"
     onClick={closeCart}
   />

  {/* Drawer */}
  <aside className="fixed top-0 right-0 z-[70] h-full w-full max-w-[420px] bg-white shadow-2xl flex flex-col">

    {/* Header */}
    <div className="flex items-center justify-between border-b px-5 py-4">
      <h2 className="text-xl font-bold text-[#082F63]">
        Shopping Cart
      </h2>

      <button
        onClick={closeCart}
        className="rounded-md p-2 hover:bg-gray-100 transition"
      >
        <HiX size={22} />
      </button>
    </div>

    {/* Cart Items */}
    <div className="flex-1 overflow-y-auto p-5">
      {cartItems.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <h3 className="mb-2 text-lg font-semibold">
            Your Cart Is Empty
          </h3>

          <p className="text-sm text-gray-500">
            Add products to continue shopping.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">
                    {item.name}
                  </h4>

                  <p className="text-sm text-gray-500">
                    ₹{item.price}
                  </p>
                </div>

                <button
                  onClick={() =>
                    removeFromCart(item.id)
                  }
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">

                <div className="flex items-center overflow-hidden rounded-lg border">

                  <button
                    onClick={() =>
                      decreaseQty(item.id)
                    }
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    -
                  </button>

                  <span className="px-4 font-medium">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      increaseQty(item.id)
                    }
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    +
                  </button>

                </div>

                <strong>
                  ₹
                  {item.price *
                    item.quantity}
                </strong>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Footer */}
    {cartItems.length > 0 && (
      <div className="border-t bg-white p-5">

        <div className="mb-4 flex items-center justify-between text-lg font-semibold">
          <span>Total</span>
          <span>₹{totalPrice}</span>
        </div>

        <div className="space-y-3">

          <button
            onClick={whatsappCheckout}
            className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 transition"
          >
            Order on WhatsApp
          </button>

          <button
            onClick={clearCart}
            className="w-full rounded-lg border border-red-500 py-3 font-semibold text-red-500 hover:bg-red-50 transition"
          >
            Clear Cart
          </button>

        </div>
      </div>
    )}

  </aside>
</>

);
}