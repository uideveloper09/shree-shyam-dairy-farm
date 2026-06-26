"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function formatInr(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function StatCard({ label, value, highlight, danger }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          danger ? "text-red-400" : highlight ? "text-[#7dffb0]" : "text-[#C89B3C]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MethodBar({ method, amount, maxAmount }) {
  const width = maxAmount > 0 ? Math.max(8, (amount / maxAmount) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-white/70">
        <span>{method}</span>
        <span>{formatInr(amount)}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-[#C89B3C]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function EcommerceAdminPage() {
  const queryClient = useQueryClient();

  const dashboard = useQuery({
    queryKey: ["payment-dashboard"],
    queryFn: () =>
      fetch("/api/v1/admin/payments/dashboard").then((response) => {
        if (!response.ok) throw new Error("Failed to load dashboard");
        return response.json();
      }),
    refetchInterval: 10_000,
    staleTime: 0,
  });

  useEffect(() => {
    const source = new EventSource("/api/v1/admin/payments/dashboard/events");

    source.onmessage = () => {
      void queryClient.invalidateQueries({ queryKey: ["payment-dashboard"] });
    };

    return () => source.close();
  }, [queryClient]);

  const metrics = dashboard.data;
  const maxMethodAmount = Math.max(
    ...(metrics?.analytics?.byMethod?.map((row) => row.amount) ?? [0]),
    0
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">Payment Overview</h2>
          <p className="mt-2 text-sm text-white/60">
            Live Razorpay metrics — refreshes automatically after each successful payment.
          </p>
        </div>
        {metrics?.generatedAt ? (
          <p className="text-xs text-white/40">
            Updated {new Date(metrics.generatedAt).toLocaleTimeString("en-IN")}
          </p>
        ) : null}
      </div>

      {dashboard.isLoading ? (
        <p className="mt-8 text-sm text-white/50">Loading dashboard…</p>
      ) : null}

      {dashboard.isError ? (
        <p className="mt-8 text-sm text-red-400">Could not load payment metrics.</p>
      ) : null}

      {metrics ? (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total Revenue" value={formatInr(metrics.totalRevenue)} highlight />
            <StatCard label="Today's Sales" value={formatInr(metrics.todaysSales)} />
            <StatCard label="Pending Orders" value={metrics.pendingOrders} />
            <StatCard label="Paid Orders" value={metrics.paidOrders} highlight />
            <StatCard label="Failed Payments" value={metrics.failedPayments} danger />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-semibold text-[#C89B3C]">Payment Analytics</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-[#082F63]/40 p-4">
                  <p className="text-xs text-white/50">Success Rate</p>
                  <p className="text-2xl font-bold text-[#7dffb0]">
                    {metrics.analytics.successRate}%
                  </p>
                </div>
                <div className="rounded-lg bg-[#082F63]/40 p-4">
                  <p className="text-xs text-white/50">Total Transactions</p>
                  <p className="text-2xl font-bold">{metrics.analytics.totalTransactions}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Revenue by Method
                </p>
                {metrics.analytics.byMethod.length === 0 ? (
                  <p className="text-sm text-white/40">No paid transactions yet.</p>
                ) : (
                  metrics.analytics.byMethod.map((row) => (
                    <MethodBar
                      key={row.method}
                      method={row.method}
                      amount={row.amount}
                      maxAmount={maxMethodAmount}
                    />
                  ))
                )}
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Last 7 Days
                </p>
                <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-white/50">
                  {metrics.analytics.last7Days.map((day) => (
                    <div key={day.date} className="rounded bg-white/5 p-2">
                      <p>{day.date.slice(5)}</p>
                      <p className="mt-1 font-semibold text-[#C89B3C]">
                        ₹{Math.round(day.revenue).toLocaleString("en-IN")}
                      </p>
                      <p>{day.orders} orders</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-semibold text-[#C89B3C]">Recent Transactions</h3>
              <div className="mt-4 space-y-2">
                {metrics.recentTransactions.length === 0 ? (
                  <p className="text-sm text-white/40">No transactions recorded yet.</p>
                ) : (
                  metrics.recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="rounded-lg border border-white/10 bg-[#082F63]/30 px-4 py-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">{tx.orderNumber}</span>
                        <span className="text-[#C89B3C]">{formatInr(tx.amount)}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-white/50">
                        <span>{tx.status}</span>
                        <span>{tx.method}</span>
                        <span>{new Date(tx.paymentDate).toLocaleString("en-IN")}</span>
                      </div>
                      {tx.razorpayPaymentId ? (
                        <p className="mt-1 truncate text-[11px] text-white/35">
                          {tx.razorpayPaymentId}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
