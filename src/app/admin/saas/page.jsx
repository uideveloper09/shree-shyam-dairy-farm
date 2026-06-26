"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const TABS = [
  ["dashboard", "Dashboard"],
  ["tenants", "Multi Tenant"],
  ["whitelabel", "White Label"],
  ["marketplace", "Marketplace"],
  ["appstore", "App Store"],
  ["api", "API Marketplace"],
  ["billing", "Billing"],
  ["subscriptions", "Subscriptions"],
  ["partners", "Partner Portal"],
  ["resellers", "Reseller Portal"],
  ["language", "Multi Language"],
  ["currency", "Multi Currency"],
  ["country", "Multi Country"],
  ["tax", "Global Tax"],
  ["shipping", "Global Shipping"],
];

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="text-xl font-bold text-[#C89B3C]">{value ?? "—"}</p>
    </div>
  );
}

function ListingGrid({ type, excludeTypes, onInstall }) {
  const { data, isLoading } = useQuery({
    queryKey: ["saas-marketplace", type, excludeTypes],
    queryFn: () =>
      fetch(`/api/v1/saas/marketplace${type ? `?type=${type}` : ""}`).then((r) => r.json()),
  });

  if (isLoading) return <p className="mt-4 text-sm text-white/50">Loading…</p>;

  const listings = (data?.listings ?? []).filter(
    (l) => !excludeTypes || !excludeTypes.includes(l.type)
  );

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {listings.map((l) => (
        <div key={l.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{l.name}</p>
              <p className="text-xs text-white/50">
                {l.category} · {l.type}
              </p>
            </div>
            {l.isFeatured && (
              <span className="rounded bg-[#C89B3C]/20 px-2 py-0.5 text-xs text-[#C89B3C]">
                Featured
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-white/60">{l.description}</p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-white/50">{l._count?.installs ?? 0} installs</span>
            {Number(l.price) > 0 ? (
              <span>₹{l.price}/mo</span>
            ) : (
              <span className="text-green-400">Free</span>
            )}
          </div>
          {onInstall && (
            <button
              type="button"
              onClick={() => onInstall(l.id)}
              className="mt-3 rounded-lg bg-[#C89B3C] px-3 py-1.5 text-sm font-medium text-[#082F63]"
            >
              Install
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SaasAdminPage() {
  const [tab, setTab] = useState("dashboard");
  const [selectedTenant, setSelectedTenant] = useState(null);
  const qc = useQueryClient();

  const dashboard = useQuery({
    queryKey: ["saas-dashboard"],
    queryFn: () => fetch("/api/v1/saas").then((r) => r.json()),
    enabled: tab === "dashboard",
  });

  const tenants = useQuery({
    queryKey: ["saas-tenants"],
    queryFn: () => fetch("/api/v1/saas/tenants").then((r) => r.json()),
    enabled: ["tenants", "whitelabel"].includes(tab),
  });

  const whiteLabel = useQuery({
    queryKey: ["saas-whitelabel", selectedTenant],
    queryFn: () => fetch(`/api/v1/saas/tenants?id=${selectedTenant}`).then((r) => r.json()),
    enabled: tab === "whitelabel" && !!selectedTenant,
  });

  const billing = useQuery({
    queryKey: ["saas-billing"],
    queryFn: () => fetch("/api/v1/saas/billing").then((r) => r.json()),
    enabled: ["billing", "subscriptions"].includes(tab),
  });

  const partners = useQuery({
    queryKey: ["saas-partners", tab],
    queryFn: () =>
      fetch(`/api/v1/saas/partners?type=${tab === "resellers" ? "RESELLER" : "PARTNER"}`).then(
        (r) => r.json()
      ),
    enabled: ["partners", "resellers"].includes(tab),
  });

  const regional = useQuery({
    queryKey: ["saas-regional"],
    queryFn: () => fetch("/api/v1/saas/regional").then((r) => r.json()),
    enabled: ["language", "currency", "country"].includes(tab),
  });

  const tax = useQuery({
    queryKey: ["saas-tax"],
    queryFn: () => fetch("/api/v1/saas/regional?section=tax").then((r) => r.json()),
    enabled: tab === "tax",
  });

  const shipping = useQuery({
    queryKey: ["saas-shipping"],
    queryFn: () => fetch("/api/v1/saas/regional?section=shipping").then((r) => r.json()),
    enabled: tab === "shipping",
  });

  const installs = useQuery({
    queryKey: ["saas-installs"],
    queryFn: () => fetch("/api/v1/saas/marketplace?installed=1").then((r) => r.json()),
    enabled: tab === "marketplace",
  });

  const installMut = useMutation({
    mutationFn: (listingId) =>
      fetch("/api/v1/saas/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saas-installs"] });
      qc.invalidateQueries({ queryKey: ["saas-dashboard"] });
    },
  });

  const seedTax = useMutation({
    mutationFn: () =>
      fetch("/api/v1/saas/regional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed-tax" }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saas-tax"] }),
  });

  const stats = dashboard.data?.stats;
  const reg = regional.data?.regional;

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">SaaS Global Platform</h2>
      <p className="mt-2 text-sm text-white/60">
        Multi-tenant · White label · Marketplace · Billing · Partners · Regional
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
        <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Active Tenants" value={stats.tenants} />
          <StatCard label="App Store" value={stats.appStoreItems} />
          <StatCard label="API Listings" value={stats.apiMarketplaceItems} />
          <StatCard label="Installs" value={stats.installs} />
          <StatCard label="Partners" value={stats.partners} />
          <StatCard label="Subscriptions" value={stats.activeSubscriptions} />
        </div>
      )}

      {tab === "tenants" && (
        <div className="mt-6 space-y-2">
          {(tenants.data?.tenants ?? []).map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{t.name}</span>
              <span className="ml-2 text-white/50">{t.slug}</span>
              <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-xs">{t.plan}</span>
              <span className="ml-2 text-white/40">
                {t._count?.members} members · {t._count?.marketplaceInstalls} apps
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "whitelabel" && (
        <div className="mt-6">
          <select
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm"
            value={selectedTenant ?? ""}
            onChange={(e) => setSelectedTenant(e.target.value || null)}
          >
            <option value="">Select tenant…</option>
            {(tenants.data?.tenants ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {whiteLabel.data && (
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
              <p>
                <span className="text-white/50">Company:</span>{" "}
                {whiteLabel.data.branding?.companyName}
              </p>
              <p className="mt-1">
                <span className="text-white/50">Tagline:</span> {whiteLabel.data.branding?.tagline}
              </p>
              <p className="mt-1">
                <span className="text-white/50">Primary:</span>{" "}
                {whiteLabel.data.theme?.primaryColor}
              </p>
              <p className="mt-1">
                <span className="text-white/50">Domains:</span>{" "}
                {(whiteLabel.data.domains ?? []).map((d) => d.hostname).join(", ") || "—"}
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "marketplace" && (
        <div className="mt-6">
          <h3 className="font-semibold">Installed Apps</h3>
          <div className="mt-3 space-y-2">
            {(installs.data?.installs ?? []).map((i) => (
              <div
                key={i.id}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm"
              >
                {i.listing?.name} <span className="text-white/50">({i.status})</span>
              </div>
            ))}
          </div>
          <h3 className="mt-8 font-semibold">Browse All</h3>
          <ListingGrid onInstall={(id) => installMut.mutate(id)} />
        </div>
      )}

      {["appstore", "api"].includes(tab) && (
        <ListingGrid
          type={tab === "api" ? "API" : undefined}
          excludeTypes={tab === "appstore" ? ["API"] : undefined}
          onInstall={tab === "appstore" ? (id) => installMut.mutate(id) : undefined}
        />
      )}

      {tab === "billing" && billing.data && (
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
          <p>
            <span className="text-white/50">Plan:</span> {billing.data.tenant?.plan}
          </p>
          <p className="mt-1">
            <span className="text-white/50">Status:</span>{" "}
            {billing.data.subscription?.status ?? "—"}
          </p>
          <p className="mt-1">
            <span className="text-white/50">Provider:</span>{" "}
            {billing.data.subscription?.billingProvider ?? "—"}
          </p>
          {billing.data.usage && (
            <p className="mt-1">
              <span className="text-white/50">API calls (month):</span>{" "}
              {billing.data.usage.api_calls ?? 0}
            </p>
          )}
        </div>
      )}

      {tab === "subscriptions" && billing.data?.planConfig && (
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
          <p className="font-semibold">{billing.data.planConfig.label}</p>
          <ul className="mt-2 list-inside list-disc text-white/60">
            {Object.entries(billing.data.planConfig.limits ?? {}).map(([k, v]) => (
              <li key={k}>
                {k}: {v === -1 ? "Unlimited" : v}
              </li>
            ))}
          </ul>
        </div>
      )}

      {["partners", "resellers"].includes(tab) && (
        <div className="mt-6 space-y-2">
          {(partners.data?.partners ?? []).map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{p.name}</span>
              <span className="ml-2 text-white/50">{p.commissionRate}% commission</span>
              <span className="ml-2 text-white/40">
                {p._count?.tenants} tenants · {p._count?.members} members
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "language" && reg && (
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
          <p>
            <span className="text-white/50">Default:</span> {reg.defaultLocale}
          </p>
          <p className="mt-1">
            <span className="text-white/50">Enabled:</span> {(reg.enabledLocales ?? []).join(", ")}
          </p>
          <p className="mt-1">
            <span className="text-white/50">Timezone:</span> {reg.timezone}
          </p>
        </div>
      )}

      {tab === "currency" && reg && (
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
          <p>
            <span className="text-white/50">Default:</span> {reg.defaultCurrency}
          </p>
          <p className="mt-1">
            <span className="text-white/50">Enabled:</span>{" "}
            {(reg.enabledCurrencies ?? []).join(", ")}
          </p>
        </div>
      )}

      {tab === "country" && reg && (
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
          <p>
            <span className="text-white/50">Default:</span> {reg.defaultCountry}
          </p>
          <p className="mt-1">
            <span className="text-white/50">Enabled:</span>{" "}
            {(reg.enabledCountries ?? []).join(", ")}
          </p>
        </div>
      )}

      {tab === "tax" && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => seedTax.mutate()}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          >
            Seed default tax rules
          </button>
          <div className="mt-4 space-y-2">
            {(tax.data?.rules ?? []).map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm"
              >
                {r.countryCode}: {r.taxName} {r.rate}% ({r.taxType})
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "shipping" && (
        <div className="mt-6 space-y-2">
          {(shipping.data?.zones ?? []).map((z) => (
            <div
              key={z.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{z.name}</span>
              <span className="ml-2 text-white/50">{z.carrier}</span>
              <p className="mt-1 text-white/60">
                {z.countries.join(", ")} · base {z.currency} {z.baseRate}
                {z.freeAbove ? ` · free above ${z.freeAbove}` : ""}
                {z.etaDays ? ` · ${z.etaDays} days` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
