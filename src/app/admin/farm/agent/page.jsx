"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AgentPage() {
  const [prompt, setPrompt] = useState("");
  const qc = useQueryClient();

  const { data: runs } = useQuery({
    queryKey: ["agent-runs"],
    queryFn: () => fetch("/api/v1/agent").then((r) => r.json()),
  });

  const run = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-runs"] });
      setPrompt("");
    },
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-bold">AI Farm Agent</h2>
      <p className="mt-2 text-sm text-white/60">
        Read ERP · reports · try &quot;today orders&quot; or &quot;milk forecast&quot;
      </p>
      <div className="mt-4 flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1 rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none"
          placeholder="Agent prompt…"
        />
        <button
          type="button"
          onClick={() => run.mutate()}
          disabled={!prompt.trim() || run.isPending}
          className="rounded-lg bg-[#C89B3C] px-4 py-2 text-xs font-semibold text-[#082F63]"
        >
          Run
        </button>
      </div>
      {run.data && (
        <pre className="mt-4 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-green-300">
          {JSON.stringify(run.data, null, 2)}
        </pre>
      )}
      <h3 className="mt-8 text-sm font-semibold text-[#C89B3C]">Recent runs</h3>
      <pre className="mt-2 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-white/70">
        {JSON.stringify(runs?.runs?.slice(0, 5), null, 2)}
      </pre>
    </div>
  );
}
