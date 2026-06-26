"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const CATEGORY_ORDER = [
  "payments",
  "shipping",
  "accounting",
  "tax",
  "messaging",
  "maps",
  "analytics",
  "platform",
];

function StatusDot({ configured }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${configured ? "bg-green-400" : "bg-amber-400"}`}
    />
  );
}

export default function IntegrationsAdminPage() {
  const [tab, setTab] = useState("catalog");

  const { data, isLoading } = useQuery({
    queryKey: ["integrations-dashboard"],
    queryFn: () => fetch("/api/v1/integrations").then((r) => r.json()),
  });

  const events = useQuery({
    queryKey: ["integration-events"],
    queryFn: () => fetch("/api/v1/integrations/events").then((r) => r.json()),
    enabled: tab === "webhooks",
  });

  const plugins = useQuery({
    queryKey: ["integration-plugins"],
    queryFn: () => fetch("/api/v1/integrations/plugins").then((r) => r.json()),
    enabled: tab === "plugins",
  });

  if (isLoading) return <p className="text-sm text-white/50">Loading integrations…</p>;

  const tabs = [
    ["catalog", "Provider Catalog"],
    ["webhooks", "Webhook Engine"],
    ["plugins", "Plugin System"],
    ["api", "REST / GraphQL / SDK"],
  ];

  const catalog = data?.catalog ?? [];
  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: catalog.filter((p) => p.category === cat),
  })).filter((g) => g.items.length);

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">Integrations Platform</h2>
      <p className="mt-2 text-sm text-white/60">
        Payments · Shipping · Accounting · Analytics · Webhooks · GraphQL · SDK · Plugins
      </p>

      {data?.stats && (
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/50">Providers</p>
            <p className="text-xl font-bold text-[#C89B3C]">{data.stats.totalProviders}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/50">Configured</p>
            <p className="text-xl font-bold text-green-400">{data.stats.configured}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/50">Connected</p>
            <p className="text-xl font-bold text-white">{data.stats.connected}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/50">Events (24h)</p>
            <p className="text-xl font-bold text-white">{data.stats.events24h}</p>
          </div>
        </div>
      )}

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

      {tab === "catalog" && (
        <div className="mt-8 space-y-6">
          {byCategory.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#C89B3C]">
                {group.category}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <StatusDot configured={p.status.configured} />
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/50">{p.description}</p>
                    <p className="mt-2 text-xs text-white/40">{p.status.message}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "webhooks" && (
        <div className="mt-8">
          <p className="text-xs text-white/50 mb-4">
            Inbound: POST /api/v1/integrations/webhooks/&#123;provider&#125;
          </p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/50">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(events.data?.logs ?? []).map((log) => (
                  <tr key={log.id} className="border-t border-white/5">
                    <td className="px-3 py-2 text-white/60">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{log.provider}</td>
                    <td className="px-3 py-2 font-mono text-green-300">{log.event}</td>
                    <td className="px-3 py-2">{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "plugins" && (
        <div className="mt-8 space-y-3">
          {[...(plugins.data?.runtime ?? []), ...(plugins.data?.registered ?? [])].map((p) => (
            <div key={p.slug} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="font-semibold text-[#C89B3C]">{p.name}</p>
              <p className="text-xs text-white/50">
                {p.slug} · v{p.version} · hooks: {JSON.stringify(p.hooks)}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "api" && (
        <div className="mt-8 space-y-4 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h4 className="font-semibold text-[#C89B3C]">REST API</h4>
            <p className="mt-2 text-white/60">
              Public v1: <code>/api/public/v1</code> · OpenAPI:{" "}
              <code>/api/public/openapi.json</code>
            </p>
            <a
              href="/developers/docs"
              className="mt-2 inline-block text-xs text-[#C89B3C] underline"
            >
              Swagger UI →
            </a>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h4 className="font-semibold text-[#C89B3C]">GraphQL</h4>
            <p className="mt-2 text-white/60">
              Endpoint: <code>POST /api/graphql</code>
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-black/30 p-2 text-xs text-white/70">{`{ integrationCatalog { id name configured } }`}</pre>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h4 className="font-semibold text-[#C89B3C]">TypeScript SDK</h4>
            <p className="mt-2 text-white/60">
              <code>sdk/typescript/</code> — ShreeShyamClient
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h4 className="font-semibold text-[#C89B3C]">Outbound Webhooks</h4>
            <p className="mt-2 text-white/60">
              Developer webhooks with HMAC signatures + retry worker
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
