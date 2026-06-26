"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function PredictionsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["predictions"],
    queryFn: () => fetch("/api/v1/predictions").then((r) => r.json()),
  });

  const runDaily = useMutation({
    mutationFn: () =>
      fetch("/api/v1/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "daily" }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["predictions"] }),
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-bold">Predictive Analytics</h2>
      <button
        type="button"
        onClick={() => runDaily.mutate()}
        disabled={runDaily.isPending}
        className="mt-4 rounded-lg bg-[#C89B3C] px-4 py-2 text-xs font-semibold text-[#082F63]"
      >
        {runDaily.isPending ? "Running…" : "Run daily forecasts"}
      </button>
      {isLoading ? (
        <p className="mt-4 text-white/50">Loading…</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {(data?.predictions || []).map((p) => (
            <div key={p.id} className="rounded-xl border border-white/10 p-4">
              <p className="text-xs text-[#C89B3C]">
                {p.domain} · {p.horizon}
              </p>
              <p className="text-2xl font-bold">
                {p.pointValue ?? "—"} {p.unit}
              </p>
              {p.valueLow != null && (
                <p className="text-xs text-white/50">
                  {p.valueLow} – {p.valueHigh}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
