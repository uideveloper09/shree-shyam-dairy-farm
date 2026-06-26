"use client";

import { useQuery } from "@tanstack/react-query";

export default function VeterinarianAppPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["mobile-vet"],
    queryFn: async () => {
      const res = await fetch("/api/v1/mobile/dashboard?app=vet");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  if (isLoading) return <p className="text-sm text-white/50">Loading cattle records…</p>;

  return (
    <div>
      <h1 className="font-heading text-xl font-bold">Veterinarian</h1>
      <p className="mt-1 text-sm text-white/60">Cattle health & emergency alerts</p>

      <div className="mt-6">
        <h2 className="text-sm font-semibold">Cattle Registry</h2>
        <div className="mt-2 space-y-2">
          {(data?.cows ?? []).map((cow) => (
            <div key={cow.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-mono text-[#C89B3C]">#{cow.tagNumber}</span>
                <span className="text-xs text-white/50">{cow.status}</span>
              </div>
              <p className="mt-1">
                {cow.name || "Unnamed"} · {cow.breed || "—"}
              </p>
            </div>
          ))}
          {!data?.cows?.length && <p className="text-xs text-white/40">No cattle records yet</p>}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-amber-400">Health Alerts</h2>
        <div className="mt-2 space-y-2">
          {(data?.emergencies ?? []).map((e) => (
            <div key={e.id} className="rounded-xl bg-amber-500/10 p-3 text-sm">
              <p>{e.title || e.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
