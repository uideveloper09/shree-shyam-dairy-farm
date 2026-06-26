"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const REQUEST_TYPES = [
  { value: "REFUND", label: "Refund Request" },
  { value: "SUBSCRIPTION", label: "Subscription Change" },
  { value: "EXPENSE", label: "Expense" },
  { value: "LEAVE", label: "Leave" },
];

export default function AccountApprovalsPage() {
  const qc = useQueryClient();
  const [type, setType] = useState("REFUND");
  const [form, setForm] = useState({ amount: "", reason: "", orderNumber: "", action: "pause" });

  const { data, isLoading } = useQuery({
    queryKey: ["my-workflows"],
    queryFn: () => fetch("/api/v1/workflows/requests").then((r) => r.json()),
  });

  const submit = useMutation({
    mutationFn: (body) =>
      fetch("/api/v1/workflows/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-workflows"] }),
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-[#082F63]">Approvals & Requests</h1>
      <p className="mt-2 text-sm text-gray-500">
        Track refund, subscription, and other approval requests.
      </p>

      <form
        className="mt-6 max-w-md space-y-3 rounded-xl border border-[#e8e4dc] bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (type === "REFUND") {
            submit.mutate({
              type,
              amount: Number(form.amount),
              reason: form.reason,
              orderNumber: form.orderNumber,
            });
          } else if (type === "SUBSCRIPTION") {
            submit.mutate({ type, action: form.action, reason: form.reason });
          }
        }}
      >
        <h2 className="text-sm font-semibold text-[#082F63]">New request</h2>
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {REQUEST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {type === "REFUND" && (
          <>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Order number"
              value={form.orderNumber}
              onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
            />
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Amount (INR)"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </>
        )}
        {type === "SUBSCRIPTION" && (
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.action}
            onChange={(e) => setForm({ ...form, action: e.target.value })}
          >
            <option value="pause">Pause subscription</option>
            <option value="cancel">Cancel subscription</option>
            <option value="change_plan">Change plan</option>
          </select>
        )}
        <textarea
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Reason"
          rows={3}
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          required
        />
        <button
          type="submit"
          className="rounded-lg bg-[#082F63] px-4 py-2 text-sm font-semibold text-white"
          disabled={submit.isPending}
        >
          Submit for approval
        </button>
      </form>

      <ul className="mt-8 space-y-3">
        {(data?.requests ?? []).map((req) => (
          <li key={req.id} className="rounded-xl border border-[#e8e4dc] bg-white p-4">
            <p className="font-semibold text-[#082F63]">{req.title}</p>
            <p className="text-sm text-gray-500">
              {req.workflow.type} · <span className="font-medium">{req.status}</span>
            </p>
            <p className="mt-1 text-xs text-gray-400">{new Date(req.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
