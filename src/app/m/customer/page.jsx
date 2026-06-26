"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { InstallPrompt } from "@/features/mobile/ServiceWorkerRegister";
import { getQrUrl } from "@/lib/mobile/scanner";

export default function CustomerAppPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["mobile-customer"],
    queryFn: async () => {
      const res = await fetch("/api/v1/mobile/dashboard?app=customer");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  if (isLoading) return <p className="text-sm text-white/50">Loading…</p>;

  return (
    <div>
      <InstallPrompt />
      <h1 className="font-heading text-xl font-bold">Customer App</h1>
      <p className="mt-1 text-sm text-white/60">Orders, subscriptions & tracking</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link href="/account/orders" className="rounded-xl bg-white/5 p-4 text-sm">
          <p className="font-semibold text-[#C89B3C]">Orders</p>
          <p className="mt-1 text-2xl font-bold">{data?.orders?.length ?? 0}</p>
        </Link>
        <Link href="/account/subscriptions" className="rounded-xl bg-white/5 p-4 text-sm">
          <p className="font-semibold text-[#C89B3C]">Subscriptions</p>
          <p className="mt-1 text-2xl font-bold">{data?.subscriptions?.length ?? 0}</p>
        </Link>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-white/80">Recent Orders</h2>
        <div className="mt-2 space-y-2">
          {(data?.orders ?? []).map((o) => (
            <div key={o.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-mono text-[#C89B3C]">{o.orderNumber}</span>
                <span className="text-white/50">{o.status}</span>
              </div>
              <p className="mt-1 text-white/60">₹{o.total}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 p-4 text-center">
        <p className="text-xs text-white/50">Share referral QR</p>
        <img
          src={getQrUrl("ssd://customer/referral")}
          alt="QR"
          className="mx-auto mt-2"
          width={120}
          height={120}
        />
      </div>
    </div>
  );
}
