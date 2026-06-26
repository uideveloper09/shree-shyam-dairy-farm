"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AutonomyPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["autonomy"],
    queryFn: () => fetch("/api/v1/autonomy").then((r) => r.json()),
  });

  const updateMode = useMutation({
    mutationFn: (mode) =>
      fetch("/api/v1/autonomy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autonomy"] }),
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-bold">Autonomous Dairy Farm</h2>
      {isLoading ? (
        <p className="mt-4 text-white/50">Loading…</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {["MANUAL", "SEMI_AUTO", "AUTONOMOUS"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => updateMode.mutate(m)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                  data?.config?.mode === m
                    ? "bg-[#C89B3C] text-[#082F63]"
                    : "bg-white/10 text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.actuators || []).map((a) => (
              <div key={a.deviceKey} className="rounded-xl border border-white/10 p-4">
                <p className="font-semibold">{a.name}</p>
                <p className="text-xs text-white/50">{a.type}</p>
                <p className="mt-2 text-lg text-[#C89B3C]">{a.state}</p>
              </div>
            ))}
          </div>
          {data?.tanks?.[0] && (
            <div className="mt-6 rounded-xl border border-white/10 p-4">
              <p className="font-semibold">Milk Tank — {data.tanks[0].name}</p>
              <p className="text-sm">
                Level: {data.tanks[0].levelPercent ?? "—"}% · Temp: {data.tanks[0].tempC ?? "—"}°C
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
