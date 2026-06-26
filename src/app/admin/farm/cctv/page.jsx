"use client";

import { useQuery } from "@tanstack/react-query";

export default function CctvPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["cctv"],
    queryFn: () => fetch("/api/v1/cctv/events").then((r) => r.json()),
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-bold">Smart CCTV</h2>
      {isLoading ? (
        <p className="mt-4 text-white/50">Loading…</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-white/60">
            {data?.cameras?.length ?? 0} cameras · {data?.events?.length ?? 0} recent events
          </p>
          <pre className="mt-4 max-h-[50vh] overflow-auto rounded-xl bg-black/40 p-4 text-xs text-green-300">
            {JSON.stringify(data?.events?.slice(0, 10), null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
