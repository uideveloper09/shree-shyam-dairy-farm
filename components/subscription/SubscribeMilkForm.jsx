"use client";

import { useState } from "react";
import { Loader2, MapPin, Milk, Sun, Moon } from "lucide-react";
import { formatINR } from "@/lib/cart";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FREQUENCIES = [
  { id: "DAILY", label: "Daily" },
  { id: "ALTERNATE_DAY", label: "Alternate day" },
  { id: "WEEKLY", label: "Weekly" },
  { id: "MONTHLY", label: "Monthly" },
  { id: "CUSTOM", label: "Custom days" },
];

export default function SubscribeMilkForm({ milkProducts, onCreated, onCancel }) {
  const [productId, setProductId] = useState(milkProducts[0]?.id ?? 1);
  const [frequency, setFrequency] = useState("DAILY");
  const [quantity, setQuantity] = useState(1);
  const [slot, setSlot] = useState("MORNING");
  const [customDays, setCustomDays] = useState([1, 3, 5]);
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "Bihar",
    pincode: "",
    landmark: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = milkProducts.find((p) => p.id === Number(productId));

  const toggleDay = (day) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productLegacyId: Number(productId),
          frequency,
          quantity,
          deliverySlot: slot,
          customDays: frequency === "CUSTOM" ? customDays : [],
          address,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start subscription");

      if (data.billing?.shortUrl) {
        const setup = window.confirm(
          "Subscription created! Open Razorpay to authorize auto-pay for each delivery?"
        );
        if (setup) window.open(data.billing.shortUrl, "_blank", "noopener,noreferrer");
      }

      onCreated?.(data.subscription);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#C89B3C]/30 bg-[#C89B3C]/5 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Milk size={18} className="text-[#C89B3C]" />
        <h2 className="font-heading text-lg font-bold text-[#082F63]">Start milk subscription</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <label className="mb-3 block">
        <span className="mb-1 block text-xs font-semibold text-[#082F63]/70">Milk product</span>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="h-10 w-full rounded-xl border border-[#e8e4dc] bg-white px-3 text-sm"
        >
          {milkProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {formatINR(p.price)} / {p.unit}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-3">
        <span className="mb-1.5 block text-xs font-semibold text-[#082F63]/70">Delivery frequency</span>
        <div className="flex flex-wrap gap-1.5">
          {FREQUENCIES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFrequency(f.id)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                frequency === f.id
                  ? "bg-[#082F63] text-white"
                  : "border border-[#e8e4dc] bg-white text-[#082F63]/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {frequency === "CUSTOM" && (
        <div className="mb-3">
          <span className="mb-1.5 block text-xs font-semibold text-[#082F63]/70">Select days</span>
          <div className="flex flex-wrap gap-1.5">
            {DAY_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(i)}
                className={`h-9 w-9 rounded-lg text-[11px] font-bold ${
                  customDays.includes(i)
                    ? "bg-[#C89B3C] text-[#082F63]"
                    : "border border-[#e8e4dc] bg-white text-gray-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-3">
        <label>
          <span className="mb-1 block text-xs font-semibold text-[#082F63]/70">Quantity</span>
          <input
            type="number"
            min={1}
            max={10}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="h-10 w-full rounded-xl border border-[#e8e4dc] bg-white px-3 text-sm"
          />
        </label>
        <div>
          <span className="mb-1 block text-xs font-semibold text-[#082F63]/70">Time slot</span>
          <div className="flex gap-1.5">
            {[
              { id: "MORNING", icon: Sun, label: "AM" },
              { id: "EVENING", icon: Moon, label: "PM" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSlot(id)}
                className={`flex h-10 flex-1 items-center justify-center gap-1 rounded-xl text-xs font-semibold ${
                  slot === id
                    ? "bg-[#082F63] text-white"
                    : "border border-[#e8e4dc] bg-white text-[#082F63]"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3 rounded-xl border border-[#e8e4dc] bg-white p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#082F63]/60">
          <MapPin size={14} className="text-[#C89B3C]" /> Delivery address
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            required
            placeholder="Full name"
            value={address.name}
            onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))}
            className="h-9 rounded-lg border border-[#e8e4dc] px-2.5 text-sm sm:col-span-2"
          />
          <input
            required
            placeholder="Mobile (10 digits)"
            value={address.phone}
            onChange={(e) =>
              setAddress((a) => ({ ...a, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))
            }
            className="h-9 rounded-lg border border-[#e8e4dc] px-2.5 text-sm"
          />
          <input
            required
            placeholder="Pincode"
            value={address.pincode}
            onChange={(e) =>
              setAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))
            }
            className="h-9 rounded-lg border border-[#e8e4dc] px-2.5 text-sm"
          />
          <input
            required
            placeholder="House / Street"
            value={address.line1}
            onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
            className="h-9 rounded-lg border border-[#e8e4dc] px-2.5 text-sm sm:col-span-2"
          />
          <input
            placeholder="City"
            value={address.city}
            onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
            className="h-9 rounded-lg border border-[#e8e4dc] px-2.5 text-sm"
          />
          <input
            placeholder="State"
            value={address.state}
            onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
            className="h-9 rounded-lg border border-[#e8e4dc] px-2.5 text-sm"
          />
        </div>
      </div>

      {selected && (
        <p className="mb-3 text-xs text-gray-600">
          Estimated: <strong>{formatINR(selected.price * quantity)}</strong> per delivery
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-premium-gold flex h-10 flex-1 items-center justify-center gap-2 text-sm disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Start subscription
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-xl border border-[#e8e4dc] px-4 text-sm font-semibold text-[#082F63]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
