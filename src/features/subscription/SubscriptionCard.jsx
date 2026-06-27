"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Pause, Play, Plane, SkipForward, XCircle, CreditCard } from "lucide-react";
import { formatINR } from "@/utils/cart";
import { fetchWithSession } from "@/lib/auth/client-fetch";
import DeliveryCalendar from "@/features/subscription/DeliveryCalendar";

const STATUS_BADGE = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PAUSED: "bg-amber-50 text-amber-700 ring-amber-200",
  VACATION: "bg-sky-50 text-sky-700 ring-sky-200",
  CANCELLED: "bg-gray-100 text-gray-500 ring-gray-200",
};

export default function SubscriptionCard({ subscription, onAction, actionLoading, onRefresh }) {
  const loading = actionLoading === subscription.id;
  const [billingLoading, setBillingLoading] = useState(false);

  const run = (action, body) => onAction(subscription.id, action, body);

  return (
    <article className="rounded-2xl border border-[#e8e4dc] bg-[#faf9f6] p-4 sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        {subscription.product.image && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-[#e8e4dc] sm:h-20 sm:w-20">
            <Image
              src={subscription.product.image}
              alt={subscription.product.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-[#082F63]">{subscription.product.name}</h3>
              <p className="text-xs text-gray-500">
                {subscription.quantity} × {subscription.product.unit} ·{" "}
                {formatINR(subscription.product.price)}/delivery
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${
                STATUS_BADGE[subscription.status] || STATUS_BADGE.ACTIVE
              }`}
            >
              {subscription.statusLabel}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
            <span>{subscription.frequencyLabel}</span>
            <span>{subscription.deliverySlotLabel}</span>
            {subscription.nextDelivery && subscription.status === "ACTIVE" && (
              <span className="font-medium text-[#082F63]">
                Next:{" "}
                {new Date(subscription.nextDelivery).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <DeliveryCalendar calendar={subscription.calendar} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!subscription.hasAutoPay && subscription.status === "ACTIVE" && (
          <ActionBtn
            icon={CreditCard}
            label="Setup auto-pay"
            onClick={async () => {
              setBillingLoading(true);
              try {
                const res = await fetchWithSession(
                  `/api/v1/subscriptions/${subscription.id}/billing`,
                  { method: "POST" }
                );
                const data = await res.json();
                if (res.status === 401) {
                  throw new Error("Session expired. Please log in again.");
                }
                if (!res.ok) throw new Error(data.error || "Auto-pay setup failed");
                if (data.billing?.shortUrl) {
                  window.open(data.billing.shortUrl, "_blank", "noopener,noreferrer");
                }
                onRefresh?.();
              } catch (err) {
                alert(err.message || "Auto-pay setup failed");
              } finally {
                setBillingLoading(false);
              }
            }}
            loading={billingLoading}
            primary
          />
        )}
        {subscription.status === "ACTIVE" && (
          <>
            <ActionBtn
              icon={SkipForward}
              label="Skip tomorrow"
              onClick={() => run("skip-tomorrow")}
              loading={loading}
            />
            <ActionBtn icon={Pause} label="Pause" onClick={() => run("pause")} loading={loading} />
            <ActionBtn
              icon={Plane}
              label="Vacation"
              onClick={() => {
                const days = prompt("Vacation for how many days?", "7");
                if (!days) return;
                const until = new Date();
                until.setDate(until.getDate() + Number(days));
                run("vacation", { until: until.toISOString() });
              }}
              loading={loading}
            />
          </>
        )}
        {(subscription.status === "PAUSED" || subscription.status === "VACATION") && (
          <ActionBtn
            icon={Play}
            label="Resume"
            onClick={() => run("resume")}
            loading={loading}
            primary
          />
        )}
        <ActionBtn
          icon={XCircle}
          label="Cancel"
          onClick={() => {
            if (confirm("Cancel this milk subscription?")) run("cancel");
          }}
          loading={loading}
          danger
        />
      </div>

      {subscription.recentDeliveries?.length > 0 && (
        <div className="mt-4 border-t border-[#e8e4dc] pt-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#082F63]/50">
            Recent deliveries
          </p>
          <ul className="mt-2 space-y-1">
            {subscription.recentDeliveries.slice(0, 5).map((d) => (
              <li key={d.id} className="flex justify-between text-[12px] text-gray-600">
                <span>
                  {new Date(d.date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="capitalize">{d.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function ActionBtn({ icon: Icon, label, onClick, loading, primary, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition disabled:opacity-50 ${
        primary
          ? "bg-[#082F63] text-white hover:bg-[#0B3D7A]"
          : danger
            ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
            : "border border-[#e8e4dc] bg-white text-[#082F63] hover:border-[#C89B3C]/40"
      }`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
      {label}
    </button>
  );
}
