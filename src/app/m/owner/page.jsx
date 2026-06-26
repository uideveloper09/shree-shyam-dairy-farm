"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function OwnerDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["mobile-owner"],
    queryFn: async () => {
      const res = await fetch("/api/v1/mobile/dashboard?app=owner");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  if (isLoading) return <p className="text-sm text-white/50">Loading KPIs…</p>;

  const k = data?.kpis ?? {};

  return (
    <div>
      <h1 className="font-heading text-xl font-bold">Owner Dashboard</h1>
      <p className="mt-1 text-sm text-white/60">Business overview & alerts</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          { label: "Orders Today", value: k.ordersToday },
          { label: "Revenue (7d)", value: `₹${(k.revenue7d ?? 0).toLocaleString("en-IN")}` },
          { label: "Subscriptions", value: k.activeSubscriptions },
          { label: "Pending Deliveries", value: k.pendingDeliveries },
          { label: "Farm Devices", value: k.farmDevices },
          { label: "Emergencies", value: k.emergencyEvents },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white/5 p-4">
            <p className="text-[10px] uppercase text-white/50">{item.label}</p>
            <p className="mt-1 text-xl font-bold text-[#C89B3C]">{item.value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold">Recent Orders</h2>
        <div className="mt-2 space-y-2">
          {(data?.recentOrders ?? []).map((o) => (
            <div key={o.id} className="flex justify-between rounded-xl bg-white/5 p-3 text-sm">
              <span className="font-mono text-[#C89B3C]">{o.orderNumber}</span>
              <span>₹{o.total}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <Link
          href="/admin/security"
          className="flex-1 rounded-xl bg-white/10 py-3 text-center text-xs"
        >
          Security
        </Link>
        <Link href="/admin/farm" className="flex-1 rounded-xl bg-white/10 py-3 text-center text-xs">
          Farm ERP
        </Link>
      </div>
    </div>
  );
}
