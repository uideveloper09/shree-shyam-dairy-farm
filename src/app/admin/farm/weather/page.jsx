"use client";

import { useQuery } from "@tanstack/react-query";

export default function WeatherPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["weather"],
    queryFn: () => fetch("/api/v1/weather").then((r) => r.json()),
  });

  const w = data?.weather;

  return (
    <div>
      <h2 className="font-heading text-xl font-bold">Smart Weather Station</h2>
      {isLoading ? (
        <p className="mt-4 text-white/50">Loading…</p>
      ) : w ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-white/50">THI</p>
            <p className="text-2xl font-bold text-[#C89B3C]">{w.thi?.toFixed(1) ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-white/50">Heat stress</p>
            <p className="text-xl font-bold">{w.heatStress}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-white/50">Station</p>
            <p className="text-sm">{w.station?.name}</p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/50">No weather station provisioned yet.</p>
      )}
    </div>
  );
}
