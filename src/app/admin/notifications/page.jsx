"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CHANNELS = ["EMAIL", "SMS", "WHATSAPP", "PUSH", "IN_APP"];

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-[#C89B3C]">{value}</p>
    </div>
  );
}

export default function NotificationsAdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("analytics");
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    body: "",
    channels: ["IN_APP", "PUSH"],
    roles: ["CUSTOMER"],
  });

  const analytics = useQuery({
    queryKey: ["notif-analytics"],
    queryFn: () => fetch("/api/v1/notifications/admin/analytics").then((r) => r.json()),
  });

  const deliveries = useQuery({
    queryKey: ["notif-deliveries"],
    queryFn: () => fetch("/api/v1/notifications/admin/deliveries").then((r) => r.json()),
  });

  const templates = useQuery({
    queryKey: ["notif-templates"],
    queryFn: () => fetch("/api/v1/notifications/admin/templates").then((r) => r.json()),
  });

  const rules = useQuery({
    queryKey: ["notif-rules"],
    queryFn: () => fetch("/api/v1/notifications/admin/rules").then((r) => r.json()),
  });

  const broadcasts = useQuery({
    queryKey: ["notif-broadcasts"],
    queryFn: () => fetch("/api/v1/notifications/admin/broadcasts").then((r) => r.json()),
  });

  const sendBroadcast = useMutation({
    mutationFn: (body) =>
      fetch("/api/v1/notifications/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif-broadcasts"] });
      qc.invalidateQueries({ queryKey: ["notif-analytics"] });
    },
  });

  const tabs = [
    ["analytics", "Analytics"],
    ["deliveries", "Delivery Reports"],
    ["templates", "Templates"],
    ["rules", "Rules Engine"],
    ["broadcast", "Broadcast"],
    ["history", "Broadcast History"],
  ];

  const byChannel = analytics.data?.byChannel ?? {};

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">Notification Platform</h2>
      <p className="mt-2 text-sm text-white/60">
        Email · SMS · WhatsApp · Push · In-App · Templates · Scheduling · Queue · Retry · Priority
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === id ? "bg-[#C89B3C] text-[#082F63]" : "bg-white/10 text-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "analytics" && (
        <div className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CHANNELS.map((ch) => (
              <StatCard
                key={ch}
                label={ch}
                value={byChannel[ch] ? `${byChannel[ch].delivered}/${byChannel[ch].sent}` : "0/0"}
              />
            ))}
          </div>
          {analytics.data?.deliveryStatus && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="font-semibold text-[#C89B3C]">Delivery status (30d)</p>
              <pre className="mt-2 overflow-x-auto text-white/70">
                {JSON.stringify(analytics.data.deliveryStatus, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {tab === "deliveries" && (
        <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-white/50">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Channel</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Attempts</th>
                <th className="px-3 py-2">Title</th>
              </tr>
            </thead>
            <tbody>
              {(deliveries.data?.reports ?? []).map((d) => (
                <tr key={d.id} className="border-t border-white/5">
                  <td className="px-3 py-2 text-white/60">
                    {new Date(d.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{d.channel}</td>
                  <td className="px-3 py-2">{d.status}</td>
                  <td className="px-3 py-2">{d.priority}</td>
                  <td className="px-3 py-2">{d.attempts}</td>
                  <td className="px-3 py-2 text-white/80">{d.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "templates" && (
        <div className="mt-8 space-y-3">
          {(templates.data?.templates ?? []).map((t) => (
            <div key={t.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="font-mono text-[#C89B3C]">{t.slug}</p>
              <p className="text-white/80">
                {t.name} · {t.channel} · {t.type}
              </p>
              <p className="mt-2 text-white/50">{t.body}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "rules" && (
        <div className="mt-8 space-y-3">
          {(rules.data?.rules ?? []).map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="font-semibold">{r.name}</p>
              <p className="text-white/60">
                Event: <span className="font-mono text-green-300">{r.event}</span>
              </p>
              <p className="text-white/50">
                Template: {r.template?.slug} · Priority: {r.priority}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "broadcast" && (
        <form
          className="mt-8 max-w-lg space-y-4 rounded-xl border border-white/10 bg-white/5 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            sendBroadcast.mutate({
              title: broadcastForm.title,
              body: broadcastForm.body,
              channels: broadcastForm.channels,
              audienceFilter: { roles: broadcastForm.roles },
              type: "BROADCAST",
            });
          }}
        >
          <h3 className="font-semibold text-[#C89B3C]">New Broadcast</h3>
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            placeholder="Title"
            value={broadcastForm.title}
            onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
            required
          />
          <textarea
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            placeholder="Message body"
            rows={4}
            value={broadcastForm.body}
            onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
            required
          />
          <p className="text-xs text-white/50">Channels: IN_APP, PUSH, EMAIL, SMS, WHATSAPP</p>
          <button
            type="submit"
            className="rounded-lg bg-[#C89B3C] px-4 py-2 text-sm font-semibold text-[#082F63]"
            disabled={sendBroadcast.isPending}
          >
            {sendBroadcast.isPending ? "Sending…" : "Send Broadcast"}
          </button>
        </form>
      )}

      {tab === "history" && (
        <div className="mt-8 space-y-3">
          {(broadcasts.data?.broadcasts ?? []).map((b) => (
            <div key={b.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="font-semibold">{b.title}</p>
              <p className="text-white/50">
                {b.status} · {b.type}
              </p>
              {b.stats && <p className="mt-1 text-xs text-white/40">{JSON.stringify(b.stats)}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
