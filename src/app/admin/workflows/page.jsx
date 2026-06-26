"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const TYPES = ["EXPENSE", "PURCHASE", "LEAVE", "REFUND", "SUBSCRIPTION", "CUSTOM"];

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-[#C89B3C]">{value}</p>
    </div>
  );
}

function VisualFlow({ visual }) {
  if (!visual?.nodes?.length) return <p className="text-xs text-white/40">No visual layout</p>;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {visual.nodes.map((node, i) => (
        <span key={node.id} className="flex items-center gap-2">
          <span
            className={`rounded-lg px-2 py-1 ${
              node.type === "approval"
                ? "bg-[#C89B3C]/20 text-[#C89B3C]"
                : node.type === "trigger"
                  ? "bg-green-500/20 text-green-300"
                  : "bg-white/10 text-white/60"
            }`}
          >
            {node.label || node.type}
            {node.role ? ` (${node.role})` : ""}
          </span>
          {i < visual.nodes.length - 1 && <span className="text-white/30">→</span>}
        </span>
      ))}
    </div>
  );
}

export default function WorkflowsAdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("dashboard");

  const dashboard = useQuery({
    queryKey: ["workflow-dashboard"],
    queryFn: () =>
      fetch("/api/v1/workflows/admin/definitions?view=dashboard").then((r) => r.json()),
  });

  const definitions = useQuery({
    queryKey: ["workflow-definitions"],
    queryFn: () => fetch("/api/v1/workflows/admin/definitions").then((r) => r.json()),
  });

  const pending = useQuery({
    queryKey: ["workflow-pending"],
    queryFn: () => fetch("/api/v1/workflows/pending").then((r) => r.json()),
    enabled: tab === "pending",
  });

  const approve = useMutation({
    mutationFn: ({ instanceId, stepId, approved, comment }) =>
      fetch(`/api/v1/workflows/${instanceId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, approved, comment }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-pending"] });
      qc.invalidateQueries({ queryKey: ["workflow-dashboard"] });
    },
  });

  const tabs = [
    ["dashboard", "Dashboard"],
    ["definitions", "Workflow Builder"],
    ["pending", "Pending Approvals"],
    ["audit", "Audit Trail"],
  ];

  const stats = dashboard.data?.stats;

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">Approval Workflow Platform</h2>
      <p className="mt-2 text-sm text-white/60">
        Expense · Purchase · Leave · Refund · Subscription · Custom · Visual · Conditions · Triggers
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

      {tab === "dashboard" && stats && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="In Review" value={stats.inReview} />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Rejected" value={stats.rejected} />
          <StatCard label="Pending" value={stats.pending} />
        </div>
      )}

      {tab === "definitions" && (
        <div className="mt-8 space-y-4">
          {(definitions.data?.definitions ?? []).map((def) => (
            <div key={def.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#C89B3C]">{def.name}</p>
                  <p className="text-xs text-white/50">
                    {def.type} · v{def.version} · {def._count?.instances ?? 0} runs
                  </p>
                </div>
                <span className={`text-xs ${def.isActive ? "text-green-400" : "text-white/30"}`}>
                  {def.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-3">
                <VisualFlow visual={def.visual} />
              </div>
              <ul className="mt-3 space-y-1 text-xs text-white/60">
                {def.steps?.map((s) => (
                  <li key={s.id}>
                    {s.order + 1}. {s.name}
                    {s.approverRole ? ` — ${s.approverRole}` : ""}
                    {s.minAmount != null ? ` (≥ ₹${s.minAmount})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === "pending" && (
        <div className="mt-8 space-y-3">
          {(pending.data?.pending ?? []).map((step) => (
            <div key={step.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="font-semibold">{step.instance.title}</p>
              <p className="text-white/50">
                {step.instance.workflow.type} · Step: {step.name} ·{" "}
                {step.instance.requester.name || step.instance.requester.email}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="rounded bg-green-600 px-3 py-1 text-xs font-semibold"
                  onClick={() =>
                    approve.mutate({
                      instanceId: step.instanceId,
                      stepId: step.id,
                      approved: true,
                    })
                  }
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="rounded bg-red-600/80 px-3 py-1 text-xs font-semibold"
                  onClick={() =>
                    approve.mutate({
                      instanceId: step.instanceId,
                      stepId: step.id,
                      approved: false,
                      comment: "Rejected",
                    })
                  }
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {!pending.data?.pending?.length && (
            <p className="text-sm text-white/40">No pending approvals.</p>
          )}
        </div>
      )}

      {tab === "audit" && (
        <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-white/50">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Workflow</th>
                <th className="px-3 py-2">User</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard.data?.audit ?? []).map((log) => (
                <tr key={log.id} className="border-t border-white/5">
                  <td className="px-3 py-2 text-white/60">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-green-300">{log.action}</td>
                  <td className="px-3 py-2 text-white/80">{log.instance?.title}</td>
                  <td className="px-3 py-2">{log.user?.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-dashed border-white/20 p-4 text-xs text-white/40">
        Submit requests via <code className="text-white/60">POST /api/v1/workflows/submit</code>{" "}
        with type: {TYPES.join(" | ")}
      </div>
    </div>
  );
}
