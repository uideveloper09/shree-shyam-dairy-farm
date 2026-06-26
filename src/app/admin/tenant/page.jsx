"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TENANT_PLANS } from "@/constants/tenant";

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="font-semibold text-[#C89B3C]">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function TenantAdminPage() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");

  const { data: config } = useQuery({
    queryKey: ["tenant-config"],
    queryFn: async () => {
      const res = await fetch("/api/v1/tenant/config");
      return res.json();
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ["tenant-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/v1/tenant/admin/analytics");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: usage } = useQuery({
    queryKey: ["tenant-usage"],
    queryFn: async () => {
      const res = await fetch("/api/v1/tenant/admin/usage");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const saveBranding = useMutation({
    mutationFn: async (body) => {
      const res = await fetch("/api/v1/tenant/admin/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setMsg("Branding saved");
      qc.invalidateQueries({ queryKey: ["tenant-config"] });
    },
  });

  const saveTheme = useMutation({
    mutationFn: async (body) => {
      const res = await fetch("/api/v1/tenant/admin/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setMsg("Theme saved — refresh to preview");
      qc.invalidateQueries({ queryKey: ["tenant-config"] });
    },
  });

  const branding = config?.branding || {};
  const theme = config?.theme || {};

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">Tenant Platform</h2>
      <p className="mt-2 text-sm text-white/60">
        Branding, domains, themes, billing & analytics — Plan:{" "}
        <span className="text-[#C89B3C]">{config?.plan || "starter"}</span>
      </p>

      {msg && <p className="mt-3 text-sm text-green-400">{msg}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Section title="Branding & Logo">
          <div className="space-y-3 text-sm">
            <input
              id="companyName"
              defaultValue={branding.companyName || ""}
              placeholder="Company name"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2"
            />
            <input
              id="tagline"
              defaultValue={branding.tagline || ""}
              placeholder="Tagline"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2"
            />
            <input
              id="logoUrl"
              defaultValue={branding.logoUrl || ""}
              placeholder="Logo URL"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2"
            />
            <input
              id="faviconUrl"
              defaultValue={branding.faviconUrl || ""}
              placeholder="Favicon URL"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2"
            />
            <button
              type="button"
              onClick={() => {
                const companyName = document.getElementById("companyName").value;
                const tagline = document.getElementById("tagline").value;
                const logoUrl = document.getElementById("logoUrl").value;
                const faviconUrl = document.getElementById("faviconUrl").value;
                saveBranding.mutate({ companyName, tagline, logoUrl, faviconUrl });
              }}
              className="rounded-lg bg-[#C89B3C] px-4 py-2 text-xs font-semibold text-[#082F63]"
            >
              Save Branding
            </button>
          </div>
        </Section>

        <Section title="Theme">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["primaryColor", "Primary", theme.primaryColor],
              ["accentColor", "Accent", theme.accentColor],
              ["backgroundColor", "Background", theme.backgroundColor],
            ].map(([key, label, val]) => (
              <label key={key} className="block">
                <span className="text-xs text-white/50">{label}</span>
                <input
                  id={key}
                  type="color"
                  defaultValue={val || "#082F63"}
                  className="mt-1 h-10 w-full cursor-pointer rounded"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              saveTheme.mutate({
                primaryColor: document.getElementById("primaryColor").value,
                accentColor: document.getElementById("accentColor").value,
                backgroundColor: document.getElementById("backgroundColor").value,
              });
            }}
            className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-xs"
          >
            Save Theme
          </button>
        </Section>

        <Section title="Languages">
          <p className="text-xs text-white/50">
            Default: {config?.locale?.defaultLocale || "en"} · Enabled:{" "}
            {(config?.locale?.enabledLocales || ["en"]).join(", ")}
          </p>
          <p className="mt-2 text-xs text-white/40">English + Hindi supported</p>
        </Section>

        <Section title="Custom Domain">
          <input
            id="customDomain"
            placeholder="shop.yourfarm.com"
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={async () => {
              const domain = document.getElementById("customDomain").value;
              const res = await fetch("/api/v1/tenant/admin/domains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain }),
              });
              const data = await res.json();
              setMsg(data.verifyInstructions || "Domain added");
            }}
            className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-xs"
          >
            Add Domain
          </button>
          <ul className="mt-3 space-y-1 text-xs text-white/50">
            {(config?.domains || []).map((d) => (
              <li key={d.domain}>✓ {d.domain}</li>
            ))}
          </ul>
        </Section>

        <Section title="Subscription Billing">
          <div className="space-y-2 text-sm">
            {Object.entries(TENANT_PLANS).map(([key, plan]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2"
              >
                <span>
                  {plan.name} — ₹{plan.priceInr}/mo
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch("/api/v1/tenant/billing/razorpay/subscribe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ plan: key }),
                      });
                      const data = await res.json();
                      if (data.shortUrl) window.open(data.shortUrl, "_blank");
                      else setMsg(data.error || "Razorpay error");
                    }}
                    className="text-xs text-[#C89B3C]"
                  >
                    Razorpay
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch("/api/v1/tenant/billing/stripe/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ plan: key }),
                      });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                      else setMsg(data.error || "Stripe error");
                    }}
                    className="text-xs text-[#C89B3C]"
                  >
                    Stripe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Usage Metering">
          {usage ? (
            <div className="space-y-2 text-xs">
              {Object.entries(usage.limits || {}).map(([metric, limit]) => (
                <div key={metric} className="flex justify-between">
                  <span>{metric}</span>
                  <span>
                    {usage.usage?.[metric] ?? 0} / {limit < 0 ? "∞" : limit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/40">Loading usage…</p>
          )}
        </Section>

        <Section title="Tenant Analytics (30d)">
          {analytics?.daily?.length ? (
            <div className="space-y-1 text-xs">
              {analytics.daily.slice(-7).map((d) => (
                <div key={d.date} className="flex justify-between text-white/60">
                  <span>{new Date(d.date).toLocaleDateString()}</span>
                  <span>
                    {d.orders} orders · ₹{d.revenue}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/40">No analytics data yet</p>
          )}
        </Section>
      </div>
    </div>
  );
}
