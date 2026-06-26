"use client";

import { useQuery } from "@tanstack/react-query";

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-[#C89B3C]">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/40">{sub}</p>}
    </div>
  );
}

export default function SecurityDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["security-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/v1/security/dashboard");
      if (!res.ok) throw new Error("Failed to load security dashboard");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  if (isLoading) return <p className="text-sm text-white/50">Loading security metrics…</p>;
  if (error) return <p className="text-sm text-red-400">{error.message}</p>;

  const { summary, recentAudits, controls } = data;

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">Security Overview</h2>
      <p className="mt-2 text-sm text-white/60">
        Authentication, authorization, audit logs, and compliance controls.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Users"
          value={summary.activeUsers}
          sub={`${summary.totalUsers} total`}
        />
        <StatCard label="Active Sessions" value={summary.activeSessions} />
        <StatCard
          label="2FA Adoption"
          value={`${summary.twoFactorAdoptionPct}%`}
          sub={`${summary.twoFactorUsers} users`}
        />
        <StatCard label="Locked Accounts" value={summary.lockedAccounts} />
        <StatCard label="Failed Logins (24h)" value={summary.failedLogins24h} />
        <StatCard label="Audit Events (24h)" value={summary.auditEvents24h} />
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="font-semibold text-[#C89B3C]">Security Controls</h3>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {Object.entries(controls).map(([key, enabled]) => (
            <li key={key} className="flex items-center gap-2">
              <span className={enabled ? "text-green-400" : "text-white/30"}>●</span>
              <span className="text-white/80">{key.replace(/([A-Z])/g, " $1")}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold text-white">Recent Audit Log</h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-white/50">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {recentAudits.map((log) => (
                <tr key={log.id} className="border-t border-white/5">
                  <td className="px-3 py-2 text-white/60">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-green-300">{log.action}</td>
                  <td className="px-3 py-2">{log.severity}</td>
                  <td className="px-3 py-2 text-white/50">{log.ipAddress || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
