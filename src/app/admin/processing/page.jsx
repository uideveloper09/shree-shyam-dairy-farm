"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const PRODUCT_TABS = [
  ["dashboard", "Dashboard"],
  ["recipes", "Recipe"],
  ["batches", "Batch"],
  ["schedule", "Production Planning"],
  ["quality", "Quality Control"],
  ["packaging", "Packaging"],
  ["expiry", "Expiry"],
  ["labels", "Barcode / QR"],
];

const DAIRY_PRODUCTS = [
  ["PANEER", "Paneer"],
  ["CURD", "Curd"],
  ["BUTTER", "Butter"],
  ["GHEE", "Ghee"],
  ["KHOYA", "Khoya"],
  ["LASSI", "Lassi"],
  ["FLAVOURED_MILK", "Flavoured Milk"],
];

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="text-xl font-bold text-[#C89B3C]">{value}</p>
    </div>
  );
}

export default function ProcessingAdminPage() {
  const [tab, setTab] = useState("dashboard");
  const [productFilter, setProductFilter] = useState("");

  const dashboard = useQuery({
    queryKey: ["processing-dashboard"],
    queryFn: () => fetch("/api/v1/processing").then((r) => r.json()),
    enabled: tab === "dashboard",
  });

  const recipes = useQuery({
    queryKey: ["processing-recipes", productFilter],
    queryFn: () =>
      fetch(
        `/api/v1/processing/recipes${productFilter ? `?productType=${productFilter}` : ""}`
      ).then((r) => r.json()),
    enabled: tab === "recipes" || DAIRY_PRODUCTS.some(([id]) => tab === id.toLowerCase()),
  });

  const batches = useQuery({
    queryKey: ["processing-batches", productFilter, tab],
    queryFn: () => {
      const type =
        productFilter || (DAIRY_PRODUCTS.find(([id]) => tab === id.toLowerCase())?.[0] ?? "");
      return fetch(`/api/v1/processing/batches${type ? `?productType=${type}` : ""}`).then((r) =>
        r.json()
      );
    },
    enabled: tab === "batches" || DAIRY_PRODUCTS.some(([id]) => tab === id.toLowerCase()),
  });

  const schedule = useQuery({
    queryKey: ["processing-schedule"],
    queryFn: () => fetch("/api/v1/processing/schedule").then((r) => r.json()),
    enabled: tab === "schedule",
  });

  const quality = useQuery({
    queryKey: ["processing-quality"],
    queryFn: () => fetch("/api/v1/processing/quality").then((r) => r.json()),
    enabled: tab === "quality",
  });

  const packaging = useQuery({
    queryKey: ["processing-packaging"],
    queryFn: () => fetch("/api/v1/processing/packaging").then((r) => r.json()),
    enabled: tab === "packaging",
  });

  const expiry = useQuery({
    queryKey: ["processing-expiry"],
    queryFn: () => fetch("/api/v1/processing/labels?expiringDays=14").then((r) => r.json()),
    enabled: tab === "expiry",
  });

  const labels = useQuery({
    queryKey: ["processing-labels"],
    queryFn: () => fetch("/api/v1/processing/labels").then((r) => r.json()),
    enabled: tab === "labels",
  });

  const stats = dashboard.data?.stats;
  const isProductTab = DAIRY_PRODUCTS.some(([id]) => tab === id.toLowerCase());
  const productLabel = DAIRY_PRODUCTS.find(([id]) => tab === id.toLowerCase())?.[1];

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">Milk Processing Platform</h2>
      <p className="mt-2 text-sm text-white/60">
        Paneer · Curd · Butter · Ghee · Khoya · Lassi · Flavoured Milk · Recipe · Batch · QC ·
        Packaging · Expiry · Barcode · QR
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PRODUCT_TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setProductFilter("");
            }}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === id ? "bg-[#C89B3C] text-[#082F63]" : "bg-white/10 text-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {DAIRY_PRODUCTS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id.toLowerCase());
              setProductFilter(id);
            }}
            className={`rounded-full px-3 py-1 text-xs ${
              tab === id.toLowerCase() ? "bg-white/20 text-white" : "bg-white/5 text-white/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && stats && (
        <div className="mt-8">
          <div className="grid gap-3 sm:grid-cols-4">
            <StatCard label="Active Batches" value={stats.activeBatches} />
            <StatCard label="QC Pending" value={stats.qcPending} />
            <StatCard label="Expiring (7d)" value={stats.expiringSoon} />
            <StatCard label="Today's Plan" value={stats.todaySchedules} />
            <StatCard label="Recipes" value={stats.recipes} />
            <StatCard label="Failed QC" value={stats.failedQc} />
          </div>
          {dashboard.data?.byProduct?.length > 0 && (
            <div className="mt-6 grid gap-2 sm:grid-cols-4">
              {dashboard.data.byProduct.map((p) => (
                <div
                  key={p.productType}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                >
                  <span className="text-white/50">{p.productType}</span>
                  <span className="ml-2 font-semibold">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "recipes" && (
        <div className="mt-8 space-y-2">
          {(recipes.data?.recipes ?? []).map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{r.name}</span>
              <span className="ml-2 text-[#C89B3C]">{r.productType}</span>
              <span className="ml-2 text-white/50">
                {Number(r.yieldQty)} {r.yieldUnit} · {r.shelfLifeDays}d shelf
              </span>
              <span className="ml-2 text-white/40">{r.ingredients?.length ?? 0} ingredients</span>
            </div>
          ))}
        </div>
      )}

      {(tab === "batches" || isProductTab) && (
        <div className="mt-8">
          {isProductTab && (
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#C89B3C]">
              {productLabel} Batches
            </h3>
          )}
          <div className="space-y-2">
            {(batches.data?.batches ?? []).map((b) => (
              <div
                key={b.id}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="font-semibold">{b.batchNumber}</span>
                <span className="ml-2 text-white/50">{b.status}</span>
                {b.plannedQty != null && (
                  <span className="ml-2 text-white/40">
                    {Number(b.actualQty ?? b.plannedQty)} {b.yieldUnit}
                  </span>
                )}
                {b.expiryDate && (
                  <span className="ml-2 text-white/40">
                    exp {new Date(b.expiryDate).toLocaleDateString()}
                  </span>
                )}
                <span className="ml-2 text-white/30">
                  {b._count?.qualityChecks ?? 0} QC · {b._count?.labels ?? 0} labels
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "schedule" && (
        <div className="mt-8 space-y-2">
          {(schedule.data?.schedules ?? []).map((s) => (
            <div
              key={s.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{s.productType}</span>
              <span className="ml-2 text-[#C89B3C]">
                {Number(s.plannedQty)} {s.yieldUnit}
              </span>
              <span className="ml-2 text-white/50">{s.status}</span>
              <span className="ml-2 text-white/40">
                {new Date(s.scheduledDate).toLocaleDateString()}
              </span>
              {s.batch?.batchNumber && (
                <span className="ml-2 text-white/30">→ {s.batch.batchNumber}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "quality" && (
        <div className="mt-8 space-y-2">
          {(quality.data?.checks ?? []).map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{c.parameter}</span>
              <span
                className={`ml-2 ${c.status === "FAILED" ? "text-red-400" : c.status === "PASSED" ? "text-green-400" : "text-white/50"}`}
              >
                {c.status}
              </span>
              <span className="ml-2 text-white/40">{c.batch?.batchNumber}</span>
              {c.expectedValue && (
                <span className="ml-2 text-white/30">exp: {c.expectedValue}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "packaging" && (
        <div className="mt-8 space-y-2">
          {(packaging.data?.packaging ?? []).map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{p.batch?.batchNumber}</span>
              <span className="ml-2 text-white/50">{p.packagingType}</span>
              <span className="ml-2 text-[#C89B3C]">{Number(p.totalQty)} total</span>
              <span className="ml-2 text-white/40">
                {p.unitCount} units · {p._count?.labels ?? 0} labels
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "expiry" && (
        <div className="mt-8 space-y-2">
          {(expiry.data?.labels ?? []).map((l) => (
            <div
              key={l.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{l.barcode}</span>
              <span className="ml-2 text-[#C89B3C]">{l.productType}</span>
              <span className="ml-2 text-amber-400">
                exp {new Date(l.expiryDate).toLocaleDateString()}
              </span>
              <span className="ml-2 text-white/40">{l.batch?.batchNumber}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "labels" && (
        <div className="mt-8 space-y-2">
          {(labels.data?.labels ?? []).map((l) => (
            <div
              key={l.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-mono font-semibold">{l.barcode}</span>
              <span className="ml-2 text-white/50">{l.productType}</span>
              <span className="ml-2 text-white/40">{l.batch?.batchNumber}</span>
              <span className="ml-2 text-white/30">
                exp {new Date(l.expiryDate).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
