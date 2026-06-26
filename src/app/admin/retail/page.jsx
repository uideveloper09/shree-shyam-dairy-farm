"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const TABS = [
  ["dashboard", "Dashboard"],
  ["bills", "Retail Billing"],
  ["scan", "Barcode / QR"],
  ["discount", "Discount"],
  ["loyalty", "Loyalty"],
  ["drawer", "Cash Drawer"],
  ["printer", "Thermal Printer"],
  ["offline", "Offline Billing"],
  ["invoices", "GST Invoice"],
  ["returns", "Returns"],
  ["exchange", "Exchange"],
];

function StatCard({ label, value, prefix }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="text-xl font-bold text-[#C89B3C]">
        {prefix}
        {value}
      </p>
    </div>
  );
}

export default function RetailAdminPage() {
  const [tab, setTab] = useState("dashboard");
  const [scanCode, setScanCode] = useState("");

  const dashboard = useQuery({
    queryKey: ["retail-dashboard"],
    queryFn: () => fetch("/api/v1/retail").then((r) => r.json()),
    enabled: tab === "dashboard",
  });

  const bills = useQuery({
    queryKey: ["retail-bills"],
    queryFn: () => fetch("/api/v1/retail/bills").then((r) => r.json()),
    enabled: ["bills", "invoices", "discount"].includes(tab),
  });

  const returns = useQuery({
    queryKey: ["retail-returns"],
    queryFn: () => fetch("/api/v1/retail/returns").then((r) => r.json()),
    enabled: tab === "returns" || tab === "exchange",
  });

  const offline = useQuery({
    queryKey: ["retail-offline"],
    queryFn: () => fetch("/api/v1/retail/offline").then((r) => r.json()),
    enabled: tab === "offline",
  });

  const terminals = useQuery({
    queryKey: ["retail-terminals"],
    queryFn: () => fetch("/api/v1/retail/terminals").then((r) => r.json()),
    enabled: ["drawer", "printer"].includes(tab),
  });

  const scan = useQuery({
    queryKey: ["retail-scan", scanCode],
    queryFn: () =>
      fetch(`/api/v1/retail/scan?code=${encodeURIComponent(scanCode)}`).then((r) => r.json()),
    enabled: tab === "scan" && scanCode.length >= 3,
  });

  const stats = dashboard.data?.stats;
  const billList = bills.data?.bills ?? [];
  const returnList = returns.data?.returns ?? [];

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">Retail Billing Platform</h2>
      <p className="mt-2 text-sm text-white/60">
        POS · Barcode · QR · Discount · Loyalty · Cash Drawer · Thermal Print · Offline · GST ·
        Returns · Exchange
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
        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          <StatCard
            label="Today Revenue"
            value={stats.todayRevenue?.toLocaleString?.() ?? stats.todayRevenue}
            prefix="₹"
          />
          <StatCard label="Bills Today" value={stats.todayBills} />
          <StatCard label="Offline Queue" value={stats.pendingOffline} />
          <StatCard label="Pending Returns" value={stats.pendingReturns} />
          <StatCard label="Loyalty Members" value={stats.loyaltyAccounts} />
          <StatCard label="POS Terminals" value={stats.terminals} />
        </div>
      )}

      {tab === "bills" && (
        <div className="mt-8 space-y-2">
          {billList.map((b) => (
            <div
              key={b.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{b.billNumber}</span>
              <span className="ml-2 text-[#C89B3C]">₹{Number(b.total).toLocaleString()}</span>
              <span className="ml-2 text-white/50">{b.status}</span>
              {b.invoiceNumber && <span className="ml-2 text-white/40">{b.invoiceNumber}</span>}
              {b.isOffline && <span className="ml-2 text-amber-400">offline</span>}
            </div>
          ))}
        </div>
      )}

      {tab === "scan" && (
        <div className="mt-8">
          <input
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            placeholder="Scan barcode or QR code…"
            className="w-full max-w-md rounded-lg bg-white/10 px-4 py-2 text-sm"
          />
          {scan.data && !scan.data.error && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="text-[#C89B3C]">Type: {scan.data.type}</p>
              {scan.data.product && (
                <p className="mt-2">
                  {scan.data.product.name} — ₹{Number(scan.data.product.price)}
                </p>
              )}
              {scan.data.bill && <p className="mt-2">Bill {scan.data.bill.billNumber}</p>}
            </div>
          )}
        </div>
      )}

      {tab === "discount" && (
        <div className="mt-8 space-y-2">
          {billList
            .filter((b) => Number(b.discountAmount) > 0)
            .map((b) => (
              <div
                key={b.id}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="font-semibold">{b.billNumber}</span>
                <span className="ml-2 text-green-400">-₹{Number(b.discountAmount).toFixed(2)}</span>
                {Number(b.loyaltyRedeemed) > 0 && (
                  <span className="ml-2 text-white/40">loyalty ₹{Number(b.loyaltyRedeemed)}</span>
                )}
              </div>
            ))}
        </div>
      )}

      {tab === "loyalty" && (
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
          <p>Loyalty: 1 point per ₹1 spent · redeem at ₹0.50/point</p>
          <p className="mt-2">Lookup: GET /api/v1/retail/loyalty?phone=…</p>
        </div>
      )}

      {tab === "drawer" && (
        <div className="mt-8 space-y-2">
          {(terminals.data?.terminals ?? []).map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{t.name}</span>
              <span className="ml-2 text-white/50">{t.location}</span>
              <span className={`ml-2 ${t.cashDrawerEnabled ? "text-green-400" : "text-white/40"}`}>
                {t.cashDrawerEnabled ? "Drawer enabled" : "No drawer"}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "printer" && (
        <div className="mt-8 space-y-2">
          {(terminals.data?.terminals ?? []).map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{t.name}</span>
              <span className="ml-2 text-white/50">{t.printerName ?? "Default printer"}</span>
              <span className="ml-2 text-white/40">{t.printerWidth}mm</span>
            </div>
          ))}
          <p className="text-xs text-white/40 mt-4">
            Print receipt: GET /api/v1/retail/bills/&#123;id&#125;?print=1
          </p>
        </div>
      )}

      {tab === "offline" && (
        <div className="mt-8 space-y-2">
          {(offline.data?.queue ?? []).map((q) => (
            <div
              key={q.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-mono">{q.clientId}</span>
              <span
                className={`ml-2 ${q.status === "PENDING" ? "text-amber-400" : q.status === "SYNCED" ? "text-green-400" : "text-red-400"}`}
              >
                {q.status}
              </span>
              <span className="ml-2 text-white/40">{new Date(q.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "invoices" && (
        <div className="mt-8 space-y-2">
          {billList
            .filter((b) => b.invoiceNumber)
            .map((b) => (
              <div
                key={b.id}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="font-semibold">{b.invoiceNumber}</span>
                <span className="ml-2">{b.billNumber}</span>
                <span className="ml-2 text-[#C89B3C]">₹{Number(b.total).toLocaleString()}</span>
                <span className="ml-2 text-white/50">{b.invoiceType ?? "B2C"}</span>
                {b.customerGstin && (
                  <span className="ml-2 text-white/40">GSTIN: {b.customerGstin}</span>
                )}
              </div>
            ))}
        </div>
      )}

      {tab === "returns" && (
        <div className="mt-8 space-y-2">
          {returnList
            .filter((r) => r.type === "RETURN")
            .map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="font-semibold">{r.returnNumber}</span>
                <span className="ml-2 text-white/50">{r.status}</span>
                <span className="ml-2 text-[#C89B3C]">₹{Number(r.refundAmount).toFixed(2)}</span>
                <span className="ml-2 text-white/40">{r.originalBill?.billNumber}</span>
              </div>
            ))}
        </div>
      )}

      {tab === "exchange" && (
        <div className="mt-8 space-y-2">
          {returnList
            .filter((r) => r.type === "EXCHANGE")
            .map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="font-semibold">{r.returnNumber}</span>
                <span className="ml-2 text-white/50">{r.status}</span>
                <span className="ml-2 text-white/40">{r.originalBill?.billNumber}</span>
                {r.exchangeBillId && <span className="ml-2 text-green-400">→ new bill</span>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
