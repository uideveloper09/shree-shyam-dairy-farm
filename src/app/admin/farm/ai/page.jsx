"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function AiPage() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  const { data: insights } = useQuery({
    queryKey: ["ai-insights"],
    queryFn: () => fetch("/api/v1/ai?type=insights").then((r) => r.json()),
  });

  const chat = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, locale: "hi-IN" }),
      });
      return res.json();
    },
    onSuccess: (data) => setReply(data.reply || data.error),
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-bold">AI Decision Intelligence</h2>
      <div className="mt-6 rounded-xl border border-white/10 p-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Poochho — doodh, orders, inventory, finance…"
          className="w-full rounded-lg bg-black/30 p-3 text-sm text-white outline-none"
          rows={3}
        />
        <button
          type="button"
          onClick={() => chat.mutate()}
          disabled={!message.trim() || chat.isPending}
          className="mt-2 rounded-lg bg-[#C89B3C] px-4 py-2 text-xs font-semibold text-[#082F63] disabled:opacity-50"
        >
          {chat.isPending ? "Thinking…" : "Ask AI"}
        </button>
        {reply && (
          <p className="mt-4 whitespace-pre-wrap rounded-lg bg-white/5 p-3 text-sm text-white/90">
            {reply}
          </p>
        )}
      </div>
      <h3 className="mt-8 text-sm font-semibold text-[#C89B3C]">Recent insights</h3>
      <pre className="mt-2 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-green-300">
        {JSON.stringify(insights?.insights?.slice(0, 5), null, 2)}
      </pre>
    </div>
  );
}
