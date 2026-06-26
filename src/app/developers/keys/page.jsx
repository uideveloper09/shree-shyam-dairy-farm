"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

export default function ApiKeysPage() {
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dev-keys"],
    queryFn: async () => {
      const res = await fetch("/api/v1/developers/keys");
      if (res.status === 401) throw new Error("LOGIN_REQUIRED");
      if (!res.ok) throw new Error("Failed to load keys");
      return res.json();
    },
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (name) => {
      const res = await fetch("/api/v1/developers/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create key");
      return res.json();
    },
    onSuccess: (result) => {
      setRevealedKey(result.key);
      setNewKeyName("");
      qc.invalidateQueries({ queryKey: ["dev-keys"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id) => {
      await fetch("/api/v1/developers/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dev-keys"] }),
  });

  if (error?.message === "LOGIN_REQUIRED") {
    return (
      <div className="text-center">
        <p className="text-white/60">Sign in to manage API keys</p>
        <Link
          href="/login?redirect=/developers/keys"
          className="mt-4 inline-block rounded-lg bg-[#C89B3C] px-4 py-2 text-sm font-semibold text-[#082F63]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">API Keys</h2>
      <p className="mt-2 text-sm text-white/60">Scoped keys with per-tier rate limits</p>

      {revealedKey && (
        <div className="mt-4 rounded-xl border border-amber-500/50 bg-amber-500/10 p-4">
          <p className="text-xs font-semibold text-amber-300">Copy your key now — shown once</p>
          <code className="mt-2 block break-all text-sm text-green-300">{revealedKey}</code>
          <button
            type="button"
            onClick={() => setRevealedKey(null)}
            className="mt-2 text-xs text-white/50"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <input
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name (e.g. Production)"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={!newKeyName.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate(newKeyName.trim())}
          className="rounded-lg bg-[#C89B3C] px-4 py-2 text-sm font-semibold text-[#082F63] disabled:opacity-50"
        >
          Create Key
        </button>
      </div>

      {isLoading && <p className="mt-4 text-sm text-white/50">Loading…</p>}

      <div className="mt-6 space-y-2">
        {(data?.keys ?? []).map((key) => (
          <div
            key={key.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-sm"
          >
            <div>
              <p className="font-medium">{key.name}</p>
              <p className="font-mono text-xs text-white/50">{key.keyPrefix}…</p>
              <p className="text-xs text-white/40">
                {key.scopes.join(", ")} · {key.rateLimit}/min
              </p>
            </div>
            <button
              type="button"
              onClick={() => revokeMutation.mutate(key.id)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Revoke
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
