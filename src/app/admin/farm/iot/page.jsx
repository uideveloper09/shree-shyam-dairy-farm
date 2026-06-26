"use client";

import { useQuery } from "@tanstack/react-query";

export default function IoTPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["farm-iot"],
    queryFn: async () => {
      const res = await fetch("/api/v1/iot/data");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold">IoT Devices</h2>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-[#C89B3C] px-3 py-1.5 text-xs font-semibold text-[#082F63]"
        >
          Refresh
        </button>
      </div>
      {isLoading && <p className="mt-4 text-sm text-white/50">Loading…</p>}
      {error && <p className="mt-4 text-sm text-red-400">{error.message}</p>}
      {data && (
        <pre className="mt-4 max-h-[60vh] overflow-auto rounded-xl bg-black/40 p-4 text-xs text-green-300">
          {JSON.stringify(data.devices, null, 2)}
        </pre>
      )}
    </div>
  );
}
