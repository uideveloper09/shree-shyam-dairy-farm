"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

export default function WebhooksPage() {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState(["order.created"]);
  const [secret, setSecret] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dev-webhooks"],
    queryFn: async () => {
      const res = await fetch("/api/v1/developers/webhooks");
      if (res.status === 401) throw new Error("LOGIN_REQUIRED");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/developers/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (result) => {
      setSecret(result.webhook.secret);
      setUrl("");
      qc.invalidateQueries({ queryKey: ["dev-webhooks"] });
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/developers/webhooks/test", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (error?.message === "LOGIN_REQUIRED") {
    return (
      <div className="text-center">
        <p className="text-white/60">Sign in to manage webhooks</p>
        <Link
          href="/login?redirect=/developers/webhooks"
          className="mt-4 inline-block rounded-lg bg-[#C89B3C] px-4 py-2 text-sm font-semibold text-[#082F63]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const available = data?.availableEvents ?? [];

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">Webhooks</h2>
      <p className="mt-2 text-sm text-white/60">Signed deliveries with automatic retries</p>

      {secret && (
        <div className="mt-4 rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-sm">
          <p className="text-xs text-amber-300">Webhook secret (store securely):</p>
          <code className="mt-1 block break-all text-green-300">{secret}</code>
        </div>
      )}

      <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-server.com/webhooks/ssd"
          className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {available.map((ev) => (
            <label key={ev} className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={events.includes(ev)}
                onChange={(e) =>
                  setEvents((prev) =>
                    e.target.checked ? [...prev, ev] : prev.filter((x) => x !== ev)
                  )
                }
              />
              {ev}
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={!url || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className="rounded-lg bg-[#C89B3C] px-4 py-2 text-sm font-semibold text-[#082F63] disabled:opacity-50"
        >
          Add Endpoint
        </button>
      </div>

      <button
        type="button"
        onClick={() => testMutation.mutate()}
        className="mt-4 text-xs text-[#C89B3C] hover:underline"
      >
        Send test event →
      </button>
      {testMutation.data && (
        <p className="mt-1 text-xs text-green-400">
          Dispatched to {testMutation.data.dispatched} endpoint(s)
        </p>
      )}

      {isLoading && <p className="mt-4 text-sm text-white/50">Loading…</p>}

      <div className="mt-6 space-y-2">
        {(data?.webhooks ?? []).map((wh) => (
          <div key={wh.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            <p className="break-all font-mono text-xs">{wh.url}</p>
            <p className="mt-1 text-xs text-white/50">{wh.events.join(", ")}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-black/30 p-4 font-mono text-xs text-white/60">
        <p>Verify signatures:</p>
        <pre className="mt-2 text-green-300">{`const expected = hmac_sha256(secret, timestamp + "." + body)
// Header: X-SSD-Signature: v1={expected}`}</pre>
      </div>
    </div>
  );
}
