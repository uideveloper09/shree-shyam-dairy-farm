"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function FarmManagerAppPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["mobile-farm"],
    queryFn: async () => {
      const res = await fetch("/api/v1/mobile/dashboard?app=farm");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  if (isLoading) return <p className="text-sm text-white/50">Loading farm data…</p>;

  return (
    <div>
      <h1 className="font-heading text-xl font-bold">Farm Manager</h1>
      <p className="mt-1 text-sm text-white/60">IoT, weather & operations on the go</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-xs text-white/50">IoT Devices Online</p>
          <p className="text-2xl font-bold text-[#C89B3C]">{data?.devices ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-xs text-white/50">Weather Station</p>
          <p className="text-sm font-medium">{data?.weather?.name || "—"}</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold">Milk Tanks</h2>
        <div className="mt-2 space-y-2">
          {(data?.milkTanks ?? []).map((t) => (
            <div key={t.id} className="rounded-xl bg-white/5 p-3 text-sm">
              <div className="flex justify-between">
                <span>{t.name}</span>
                <span className="text-[#C89B3C]">{t.levelPercent?.toFixed(0) ?? "—"}%</span>
              </div>
              <p className="text-xs text-white/50">Temp: {t.tempC ?? "—"}°C</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-red-400">Emergencies</h2>
        <div className="mt-2 space-y-2">
          {(data?.emergencies ?? []).map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm"
            >
              <p className="font-medium">{e.title}</p>
              <p className="text-xs text-white/60">{e.message}</p>
            </div>
          ))}
          {!data?.emergencies?.length && (
            <p className="text-xs text-white/40">No active emergencies</p>
          )}
        </div>
      </div>

      <Link
        href="/admin/farm"
        className="mt-6 block rounded-xl bg-[#C89B3C] py-3 text-center text-sm font-semibold text-[#082F63]"
      >
        Open Full Farm Admin
      </Link>
    </div>
  );
}
