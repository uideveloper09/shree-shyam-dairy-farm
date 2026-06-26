"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Milk } from "lucide-react";
import SubscriptionCard from "@/features/subscription/SubscriptionCard";
import SubscribeMilkForm from "@/features/subscription/SubscribeMilkForm";

export default function SubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [milkProducts, setMilkProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, prodRes] = await Promise.all([
        fetch("/api/v1/subscriptions"),
        fetch("/api/products?category=milk"),
      ]);

      const subData = await subRes.json();
      const prodData = await prodRes.json();

      if (subRes.status === 503) {
        setDbError(subData.error || "Database not configured");
        setSubscriptions([]);
      } else if (subRes.ok) {
        setSubscriptions(subData.subscriptions ?? []);
        setDbError("");
      }

      setMilkProducts(prodData.products ?? []);
    } catch {
      setDbError("Could not load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void loadSubscriptions();
    });
    return () => {
      cancelled = true;
    };
  }, [loadSubscriptions]);

  const handleAction = async (id, action, body) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/v1/subscriptions/${id}/${action}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (action === "cancel") {
        setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      } else {
        setSubscriptions((prev) => prev.map((s) => (s.id === id ? data.subscription : s)));
      }
    } catch (err) {
      alert(err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreated = (sub) => {
    setSubscriptions((prev) => [sub, ...prev]);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-[#082F63]/30" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#082F63]">Milk Subscription</h1>
          <p className="mt-1 text-sm text-gray-500">
            Daily fresh milk — pause, skip, or vacation anytime
          </p>
        </div>
        {!showForm && milkProducts.length > 0 && !dbError && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#082F63] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B3D7A]"
          >
            <Plus size={16} />
            New subscription
          </button>
        )}
      </div>

      {dbError && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Database setup required</p>
          <p className="mt-1 text-xs text-amber-800">
            Add <code className="rounded bg-white/80 px-1">DATABASE_URL</code> to .env.local, then
            run <code className="rounded bg-white/80 px-1">npm run db:push</code> and{" "}
            <code className="rounded bg-white/80 px-1">npm run db:seed</code>
          </p>
        </div>
      )}

      {showForm && milkProducts.length > 0 && (
        <div className="mt-5">
          <SubscribeMilkForm
            milkProducts={milkProducts}
            onCreated={handleCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="mt-6 space-y-4">
        {subscriptions.length === 0 && !showForm && !dbError && (
          <div className="rounded-2xl border border-dashed border-[#C89B3C]/40 bg-[#faf9f6] py-12 text-center">
            <Milk size={32} className="mx-auto text-[#C89B3C]/60" />
            <p className="mt-3 font-semibold text-[#082F63]">No active subscriptions</p>
            <p className="mt-1 text-sm text-gray-500">
              Subscribe for farm-fresh milk at your doorstep
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="btn-premium-gold mt-4 inline-flex h-10 items-center px-6 text-sm"
            >
              Subscribe now
            </button>
          </div>
        )}

        {subscriptions.map((sub) => (
          <SubscriptionCard
            key={sub.id}
            subscription={sub}
            onAction={handleAction}
            actionLoading={actionLoading}
            onRefresh={loadSubscriptions}
          />
        ))}
      </div>
    </div>
  );
}
