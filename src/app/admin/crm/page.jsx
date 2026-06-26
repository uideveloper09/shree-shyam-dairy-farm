"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const TABS = [
  ["dashboard", "Dashboard"],
  ["leads", "Leads"],
  ["customers", "Customers"],
  ["pipeline", "Pipeline"],
  ["opportunities", "Opportunities"],
  ["followups", "Follow Up"],
  ["quotations", "Quotation"],
  ["campaigns", "Marketing"],
  ["referrals", "Referral"],
  ["tickets", "Ticketing"],
];

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="text-xl font-bold text-[#C89B3C]">{value}</p>
    </div>
  );
}

export default function CrmAdminPage() {
  const [tab, setTab] = useState("dashboard");
  const qc = useQueryClient();

  const dashboard = useQuery({
    queryKey: ["crm-dashboard"],
    queryFn: () => fetch("/api/v1/crm").then((r) => r.json()),
    enabled: tab === "dashboard",
  });

  const leads = useQuery({
    queryKey: ["crm-leads"],
    queryFn: () => fetch("/api/v1/crm/leads").then((r) => r.json()),
    enabled: tab === "leads",
  });

  const customers = useQuery({
    queryKey: ["crm-customers"],
    queryFn: () => fetch("/api/v1/crm/customers").then((r) => r.json()),
    enabled: tab === "customers",
  });

  const pipeline = useQuery({
    queryKey: ["crm-pipeline"],
    queryFn: () => fetch("/api/v1/crm/pipeline").then((r) => r.json()),
    enabled: tab === "pipeline",
  });

  const opportunities = useQuery({
    queryKey: ["crm-opportunities"],
    queryFn: () => fetch("/api/v1/crm/opportunities").then((r) => r.json()),
    enabled: tab === "opportunities",
  });

  const followups = useQuery({
    queryKey: ["crm-followups"],
    queryFn: () => fetch("/api/v1/crm/follow-ups?upcoming=1").then((r) => r.json()),
    enabled: tab === "followups",
  });

  const quotations = useQuery({
    queryKey: ["crm-quotations"],
    queryFn: () => fetch("/api/v1/crm/quotations").then((r) => r.json()),
    enabled: tab === "quotations",
  });

  const campaigns = useQuery({
    queryKey: ["crm-campaigns"],
    queryFn: () => fetch("/api/v1/crm/campaigns").then((r) => r.json()),
    enabled: tab === "campaigns",
  });

  const referrals = useQuery({
    queryKey: ["crm-referrals"],
    queryFn: () => fetch("/api/v1/crm/referrals").then((r) => r.json()),
    enabled: tab === "referrals",
  });

  const tickets = useQuery({
    queryKey: ["crm-tickets"],
    queryFn: () => fetch("/api/v1/crm/tickets").then((r) => r.json()),
    enabled: tab === "tickets",
  });

  async function createLead(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    await fetch("/api/v1/crm/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email") || undefined,
        phone: fd.get("phone") || undefined,
        source: fd.get("source") || undefined,
      }),
    });
    e.target.reset();
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
  }

  const stats = dashboard.data?.stats;

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">CRM Platform</h2>
      <p className="mt-2 text-sm text-white/60">
        Lead · Customer · Sales · Pipeline · Opportunity · Quotation · Marketing · Referral ·
        Support · Ticketing
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map(([id, label]) => (
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
        <div className="mt-8">
          <div className="grid gap-3 sm:grid-cols-4">
            <StatCard label="Leads" value={stats.leads} />
            <StatCard label="Customers" value={stats.customers} />
            <StatCard label="Open Deals" value={stats.openOpportunities} />
            <StatCard
              label="Pipeline ₹"
              value={stats.pipelineValue?.toLocaleString?.() ?? stats.pipelineValue}
            />
            <StatCard label="Follow-ups" value={stats.pendingFollowUps} />
            <StatCard label="Open Tickets" value={stats.openTickets} />
            <StatCard label="Campaigns" value={stats.activeCampaigns} />
            <StatCard label="Referrals" value={stats.pendingReferrals} />
          </div>
        </div>
      )}

      {tab === "leads" && (
        <div className="mt-8 space-y-6">
          <form
            onSubmit={createLead}
            className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <input
              name="name"
              placeholder="Name"
              required
              className="rounded bg-white/10 px-3 py-2 text-sm"
            />
            <input
              name="email"
              placeholder="Email"
              className="rounded bg-white/10 px-3 py-2 text-sm"
            />
            <input
              name="phone"
              placeholder="Phone"
              className="rounded bg-white/10 px-3 py-2 text-sm"
            />
            <input
              name="source"
              placeholder="Source"
              className="rounded bg-white/10 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded bg-[#C89B3C] px-4 py-2 text-sm font-semibold text-[#082F63]"
            >
              Add Lead
            </button>
          </form>
          <div className="space-y-2">
            {(leads.data?.leads ?? []).map((l) => (
              <div
                key={l.id}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="font-semibold">{l.name}</span>
                <span className="ml-2 text-white/50">{l.status}</span>
                {l.email && <span className="ml-2 text-white/40">{l.email}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "customers" && (
        <div className="mt-8 space-y-2">
          {(customers.data?.customers ?? []).map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{c.name}</span>
              <span className="ml-2 text-white/40">
                {c._count?.opportunities ?? 0} deals · {c._count?.tickets ?? 0} tickets
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "pipeline" && pipeline.data?.byStage && (
        <div className="mt-8 flex gap-3 overflow-x-auto pb-4">
          {pipeline.data.byStage.map(({ stage, opportunities: opps }) => (
            <div
              key={stage.id}
              className="min-w-[200px] rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <p className="text-xs font-semibold uppercase text-[#C89B3C]">{stage.name}</p>
              <p className="text-xs text-white/40">{stage.probability}%</p>
              <div className="mt-2 space-y-2">
                {opps.map((o) => (
                  <div key={o.id} className="rounded bg-white/10 p-2 text-xs">
                    <p className="font-medium">{o.title}</p>
                    <p className="text-white/50">₹{Number(o.amount).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "opportunities" && (
        <div className="mt-8 space-y-2">
          {(opportunities.data?.opportunities ?? []).map((o) => (
            <div
              key={o.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{o.title}</span>
              <span className="ml-2 text-[#C89B3C]">₹{Number(o.amount).toLocaleString()}</span>
              <span className="ml-2 text-white/50">{o.stage}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "followups" && (
        <div className="mt-8 space-y-2">
          {(followups.data?.followUps ?? []).map((f) => (
            <div
              key={f.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{f.subject}</span>
              <span className="ml-2 text-white/50">{f.type}</span>
              <span className="ml-2 text-white/40">{new Date(f.scheduledAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "quotations" && (
        <div className="mt-8 space-y-2">
          {(quotations.data?.quotations ?? []).map((q) => (
            <div
              key={q.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{q.quoteNumber}</span>
              <span className="ml-2 text-[#C89B3C]">₹{Number(q.total).toLocaleString()}</span>
              <span className="ml-2 text-white/50">{q.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "campaigns" && (
        <div className="mt-8 space-y-2">
          {(campaigns.data?.campaigns ?? []).map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{c.name}</span>
              <span className="ml-2 text-white/50">{c.status}</span>
              <span className="ml-2 text-white/40">{c._count?.members ?? 0} members</span>
            </div>
          ))}
        </div>
      )}

      {tab === "referrals" && (
        <div className="mt-8 space-y-2">
          {(referrals.data?.referrals ?? []).map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{r.referrerCode ?? "—"}</span>
              <span className="ml-2 text-white/50">{r.status}</span>
              <span className="ml-2 text-white/40">{r.referredEmail ?? r.referredPhone}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "tickets" && (
        <div className="mt-8 space-y-2">
          {(tickets.data?.tickets ?? []).map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{t.ticketNumber}</span>
              <span className="ml-2">{t.subject}</span>
              <span className="ml-2 text-white/50">{t.status}</span>
              <span className="ml-2 text-white/40">{t.priority}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
