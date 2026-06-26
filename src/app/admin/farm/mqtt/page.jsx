"use client";

import { useQuery } from "@tanstack/react-query";

export default function MqttPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["mqtt-health"],
    queryFn: () => fetch("/api/v1/mqtt/health").then((r) => r.json()),
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-bold">MQTT Broker</h2>
      {isLoading ? (
        <p className="mt-4 text-white/50">Loading…</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-white/50">Connected</p>
            <p className="text-2xl font-bold text-[#C89B3C]">{data?.connected ? "Yes" : "No"}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-white/50">Queue depth</p>
            <p className="text-2xl font-bold">{data?.queueDepth ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-4 sm:col-span-2">
            <p className="text-xs text-white/50">Broker</p>
            <p className="text-sm">
              {data?.brokerType} — {data?.brokerUrl}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
