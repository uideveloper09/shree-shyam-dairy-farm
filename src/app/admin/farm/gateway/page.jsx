"use client";

import { useQuery } from "@tanstack/react-query";

export default function GatewayPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["gateways"],
    queryFn: () => fetch("/api/v1/gateway").then((r) => r.json()),
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-bold">Edge Gateway</h2>
      <button
        type="button"
        onClick={() => refetch()}
        className="mt-4 rounded-lg bg-[#C89B3C] px-3 py-1.5 text-xs font-semibold text-[#082F63]"
      >
        Refresh
      </button>
      {isLoading && <p className="mt-4 text-sm text-white/50">Loading…</p>}
      <pre className="mt-4 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-green-300">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
