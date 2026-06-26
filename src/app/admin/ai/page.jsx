"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const MODULES = [
  ["CEO", "CEO Dashboard AI"],
  ["FINANCE", "Finance AI"],
  ["FARM", "Farm AI"],
  ["INVENTORY", "Inventory AI"],
  ["MARKETING", "Marketing AI"],
  ["SALES", "Sales AI"],
  ["CUSTOMER", "Customer AI"],
  ["VOICE", "Voice Assistant"],
  ["WHATSAPP", "WhatsApp AI"],
  ["AGENT", "Autonomous Agents"],
];

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="text-xl font-bold text-[#C89B3C]">{value}</p>
    </div>
  );
}

export default function AiAdminPage() {
  const [tab, setTab] = useState("dashboard");
  const [analysis, setAnalysis] = useState(null);
  const [waPhone, setWaPhone] = useState("");
  const [waMsg, setWaMsg] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const qc = useQueryClient();

  const dashboard = useQuery({
    queryKey: ["ai-dashboard"],
    queryFn: () => fetch("/api/v1/ai").then((r) => r.json()),
    enabled: tab === "dashboard",
  });

  const agents = useQuery({
    queryKey: ["ai-agents"],
    queryFn: () => fetch("/api/v1/ai/agents").then((r) => r.json()),
    enabled: tab === "AGENT",
  });

  const whatsapp = useQuery({
    queryKey: ["ai-whatsapp"],
    queryFn: () => fetch("/api/v1/ai/whatsapp").then((r) => r.json()),
    enabled: tab === "WHATSAPP",
  });

  const analyze = useMutation({
    mutationFn: (module) =>
      fetch("/api/v1/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      setAnalysis(data);
      qc.invalidateQueries({ queryKey: ["ai-dashboard"] });
    },
  });

  const stats = dashboard.data?.stats;

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">AI Platform</h2>
      <p className="mt-2 text-sm text-white/60">
        CEO · Finance · Farm · Inventory · Marketing · Sales · Customer · Voice · WhatsApp · Agents
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setTab("dashboard");
            setAnalysis(null);
          }}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            tab === "dashboard" ? "bg-[#C89B3C] text-[#082F63]" : "bg-white/10 text-white/70"
          }`}
        >
          Dashboard
        </button>
        {MODULES.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setAnalysis(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === id ? "bg-[#C89B3C] text-[#082F63]" : "bg-white/10 text-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && stats && (
        <div className="mt-8">
          <div className="grid gap-3 sm:grid-cols-4">
            <StatCard label="Insights" value={stats.insights} />
            <StatCard label="Open Alerts" value={stats.unackAlerts} />
            <StatCard label="Recommendations" value={stats.recommendations} />
            <StatCard label="Agents" value={stats.activeAgents} />
            <StatCard label="WhatsApp Sessions" value={stats.whatsappSessions} />
          </div>
          {dashboard.data?.insights?.length > 0 && (
            <div className="mt-6 space-y-2">
              {dashboard.data.insights.map((i) => (
                <div
                  key={i.id}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  <span className="font-semibold">{i.title}</span>
                  <span className="ml-2 text-white/50">{i.type}</span>
                  {i.score != null && <span className="ml-2 text-[#C89B3C]">{i.score}/100</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab !== "dashboard" && tab !== "WHATSAPP" && tab !== "VOICE" && tab !== "AGENT" && (
        <div className="mt-8">
          <button
            type="button"
            disabled={analyze.isPending}
            onClick={() => analyze.mutate(tab)}
            className="rounded-lg bg-[#C89B3C] px-4 py-2 text-sm font-semibold text-[#082F63] disabled:opacity-50"
          >
            {analyze.isPending ? "Analyzing…" : `Run ${tab} Analysis`}
          </button>
          {analysis?.insight && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="font-semibold text-[#C89B3C]">{analysis.insight.title}</p>
              <p className="mt-2 text-white/80">{analysis.output}</p>
              {analysis.insight.score != null && (
                <p className="mt-2 text-white/50">Score: {analysis.insight.score}/100</p>
              )}
              {analysis.insight.recommendations?.length > 0 && (
                <ul className="mt-3 list-disc pl-5 text-white/60">
                  {analysis.insight.recommendations.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "VOICE" && (
        <div className="mt-8">
          <textarea
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            placeholder="Voice transcript (Hindi/English)…"
            className="w-full max-w-lg rounded-lg bg-white/10 px-4 py-3 text-sm"
            rows={3}
          />
          <button
            type="button"
            className="mt-3 rounded-lg bg-[#C89B3C] px-4 py-2 text-sm font-semibold text-[#082F63]"
            onClick={async () => {
              const res = await fetch("/api/v1/ai/voice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript: voiceText }),
              });
              const data = await res.json();
              setAnalysis({ insight: { title: "Voice Reply" }, output: data.reply });
            }}
          >
            Process Voice
          </button>
        </div>
      )}

      {tab === "WHATSAPP" && (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            <input
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value)}
              placeholder="+91 phone"
              className="rounded-lg bg-white/10 px-3 py-2 text-sm"
            />
            <input
              value={waMsg}
              onChange={(e) => setWaMsg(e.target.value)}
              placeholder="Message"
              className="flex-1 min-w-[200px] rounded-lg bg-white/10 px-3 py-2 text-sm"
            />
            <button
              type="button"
              className="rounded-lg bg-[#C89B3C] px-4 py-2 text-sm font-semibold text-[#082F63]"
              onClick={async () => {
                const res = await fetch("/api/v1/ai/whatsapp", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ phone: waPhone, message: waMsg }),
                });
                const data = await res.json();
                setAnalysis({ insight: { title: "WhatsApp AI" }, output: data.reply });
                qc.invalidateQueries({ queryKey: ["ai-whatsapp"] });
              }}
            >
              Send
            </button>
          </div>
          <div className="space-y-2">
            {(whatsapp.data?.sessions ?? []).map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="font-semibold">{s.phone}</span>
                <span className="ml-2 text-white/50">{s._count?.messages ?? 0} messages</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "AGENT" && (
        <div className="mt-8 space-y-2">
          {(agents.data?.agents ?? []).map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{a.name}</span>
              <span className="ml-2 text-white/50">{a.slug}</span>
              {a.isAutonomous && <span className="ml-2 text-green-400">autonomous</span>}
              <p className="mt-1 text-white/40 text-xs">{a.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
