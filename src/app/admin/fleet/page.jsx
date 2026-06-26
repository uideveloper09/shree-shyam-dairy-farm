"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const TABS = [
  ["dashboard", "Dashboard"],
  ["vehicles", "Vehicle"],
  ["tankers", "Milk Tanker"],
  ["drivers", "Drivers"],
  ["fuel", "Fuel"],
  ["maintenance", "Maintenance"],
  ["insurance", "Insurance"],
  ["gps", "GPS"],
  ["routes", "Route Optimization"],
  ["reminders", "Service Reminder"],
  ["trips", "Trip History"],
];

function StatCard({ label, value, suffix }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="text-xl font-bold text-[#C89B3C]">
        {value}
        {suffix && <span className="text-sm font-normal text-white/50"> {suffix}</span>}
      </p>
    </div>
  );
}

export default function FleetAdminPage() {
  const [tab, setTab] = useState("dashboard");
  const qc = useQueryClient();

  const dashboard = useQuery({
    queryKey: ["fleet-dashboard"],
    queryFn: () => fetch("/api/v1/fleet").then((r) => r.json()),
    enabled: tab === "dashboard",
  });

  const vehicles = useQuery({
    queryKey: ["fleet-vehicles"],
    queryFn: () => fetch("/api/v1/fleet/vehicles").then((r) => r.json()),
    enabled: tab === "vehicles",
  });

  const tankers = useQuery({
    queryKey: ["fleet-tankers"],
    queryFn: () => fetch("/api/v1/fleet/vehicles?tankers=1").then((r) => r.json()),
    enabled: tab === "tankers",
  });

  const drivers = useQuery({
    queryKey: ["fleet-drivers"],
    queryFn: () => fetch("/api/v1/fleet/drivers").then((r) => r.json()),
    enabled: tab === "drivers",
  });

  const fuel = useQuery({
    queryKey: ["fleet-fuel"],
    queryFn: () => fetch("/api/v1/fleet/fuel").then((r) => r.json()),
    enabled: tab === "fuel",
  });

  const maintenance = useQuery({
    queryKey: ["fleet-maintenance"],
    queryFn: () => fetch("/api/v1/fleet/maintenance").then((r) => r.json()),
    enabled: tab === "maintenance",
  });

  const insurance = useQuery({
    queryKey: ["fleet-insurance"],
    queryFn: () => fetch("/api/v1/fleet/insurance").then((r) => r.json()),
    enabled: tab === "insurance",
  });

  const gps = useQuery({
    queryKey: ["fleet-gps"],
    queryFn: () => fetch("/api/v1/fleet/gps").then((r) => r.json()),
    enabled: tab === "gps",
  });

  const routes = useQuery({
    queryKey: ["fleet-routes"],
    queryFn: () => fetch("/api/v1/fleet/routes").then((r) => r.json()),
    enabled: tab === "routes",
  });

  const reminders = useQuery({
    queryKey: ["fleet-reminders"],
    queryFn: () => fetch("/api/v1/fleet/reminders").then((r) => r.json()),
    enabled: tab === "reminders",
  });

  const trips = useQuery({
    queryKey: ["fleet-trips"],
    queryFn: () => fetch("/api/v1/fleet/trips").then((r) => r.json()),
    enabled: tab === "trips",
  });

  async function addVehicle(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    await fetch("/api/v1/fleet/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationNo: fd.get("registrationNo"),
        name: fd.get("name"),
        type: fd.get("type") || "TRUCK",
        isTanker: fd.get("isTanker") === "on",
        tankCapacityLiters: fd.get("tankCapacityLiters")
          ? Number(fd.get("tankCapacityLiters"))
          : undefined,
      }),
    });
    e.target.reset();
    qc.invalidateQueries({ queryKey: ["fleet-vehicles"] });
    qc.invalidateQueries({ queryKey: ["fleet-dashboard"] });
  }

  const stats = dashboard.data?.stats;
  const vehicleList = tab === "tankers" ? tankers.data?.vehicles : vehicles.data?.vehicles;

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">Fleet Management</h2>
      <p className="mt-2 text-sm text-white/60">
        Vehicle · Fuel · Maintenance · GPS · Drivers · Insurance · Milk Tanker · Routes · Reminders
        · Trips
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
          <StatCard label="Vehicles" value={stats.vehicles} />
          <StatCard label="Active" value={stats.activeVehicles} />
          <StatCard label="Milk Tankers" value={stats.tankers} />
          <StatCard label="Drivers" value={stats.drivers} />
          <StatCard label="Open Maintenance" value={stats.openMaintenance} />
          <StatCard label="Insurance Expiring" value={stats.expiringInsurance} />
          <StatCard label="Service Reminders" value={stats.pendingReminders} />
          <StatCard label="Active Trips" value={stats.activeTrips} />
          <StatCard
            label="Fuel (month)"
            value={stats.fuelLitersMonth?.toFixed?.(0) ?? stats.fuelLitersMonth}
            suffix="L"
          />
          <StatCard
            label="Fuel Cost"
            value={`₹${stats.fuelCostMonth?.toLocaleString?.() ?? stats.fuelCostMonth}`}
          />
        </div>
      )}

      {(tab === "vehicles" || tab === "tankers") && (
        <div className="mt-8 space-y-6">
          {tab === "vehicles" && (
            <form
              onSubmit={addVehicle}
              className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <input
                name="registrationNo"
                placeholder="Registration"
                required
                className="rounded bg-white/10 px-3 py-2 text-sm"
              />
              <input
                name="name"
                placeholder="Name"
                required
                className="rounded bg-white/10 px-3 py-2 text-sm"
              />
              <select name="type" className="rounded bg-white/10 px-3 py-2 text-sm">
                <option value="TRUCK">Truck</option>
                <option value="VAN">Van</option>
                <option value="TANKER">Tanker</option>
              </select>
              <label className="flex items-center gap-1 text-sm text-white/70">
                <input type="checkbox" name="isTanker" /> Tanker
              </label>
              <input
                name="tankCapacityLiters"
                placeholder="Capacity (L)"
                type="number"
                className="rounded bg-white/10 px-3 py-2 text-sm w-28"
              />
              <button
                type="submit"
                className="rounded bg-[#C89B3C] px-4 py-2 text-sm font-semibold text-[#082F63]"
              >
                Add Vehicle
              </button>
            </form>
          )}
          <div className="space-y-2">
            {(vehicleList ?? []).map((v) => (
              <div
                key={v.id}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="font-semibold">{v.registrationNo}</span>
                <span className="ml-2">{v.name}</span>
                <span className="ml-2 text-white/50">{v.status}</span>
                {v.isTanker && (
                  <span className="ml-2 text-[#C89B3C]">
                    {v.tankCapacityLiters ? `${v.tankCapacityLiters}L` : "Tanker"}
                    {v.currentTempCelsius != null && ` · ${v.currentTempCelsius}°C`}
                  </span>
                )}
                {v.assignedDriver?.user?.name && (
                  <span className="ml-2 text-white/40">→ {v.assignedDriver.user.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "drivers" && (
        <div className="mt-8 space-y-2">
          {(drivers.data?.drivers ?? []).map((d) => (
            <div
              key={d.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{d.user?.name ?? "Driver"}</span>
              <span className="ml-2 text-white/50">{d.licenseNo ?? "—"}</span>
              <span className="ml-2 text-white/40">{d._count?.trips ?? 0} trips</span>
            </div>
          ))}
        </div>
      )}

      {tab === "fuel" && (
        <div className="mt-8 space-y-2">
          {(fuel.data?.logs ?? []).map((f) => (
            <div
              key={f.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{f.vehicle?.registrationNo}</span>
              <span className="ml-2 text-[#C89B3C]">{Number(f.liters)}L</span>
              <span className="ml-2">₹{Number(f.cost).toLocaleString()}</span>
              <span className="ml-2 text-white/40">
                {new Date(f.filledAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "maintenance" && (
        <div className="mt-8 space-y-2">
          {(maintenance.data?.maintenance ?? []).map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{m.title}</span>
              <span className="ml-2 text-white/50">{m.status}</span>
              <span className="ml-2 text-white/40">{m.vehicle?.registrationNo}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "insurance" && (
        <div className="mt-8 space-y-2">
          {(insurance.data?.insurance ?? []).map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{p.provider}</span>
              <span className="ml-2">{p.policyNo}</span>
              <span className="ml-2 text-white/50">{p.status}</span>
              <span className="ml-2 text-white/40">
                until {new Date(p.endDate).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "gps" && (
        <div className="mt-8 space-y-2">
          {(gps.data?.vehicles ?? []).map((v) => (
            <div
              key={v.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{v.registrationNo}</span>
              <span className="ml-2 text-white/50">
                {Number(v.currentLat).toFixed(5)}, {Number(v.currentLng).toFixed(5)}
              </span>
              {v.lastGpsAt && (
                <span className="ml-2 text-white/40">{new Date(v.lastGpsAt).toLocaleString()}</span>
              )}
            </div>
          ))}
          {!(gps.data?.vehicles ?? []).length && (
            <p className="text-sm text-white/50">No GPS positions recorded yet.</p>
          )}
        </div>
      )}

      {tab === "routes" && (
        <div className="mt-8 space-y-2">
          {(routes.data?.routes ?? []).map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{r.name}</span>
              {r.isOptimized && (
                <span className="ml-2 text-green-400">
                  {Number(r.totalDistanceKm)} km · {r.estimatedMinutes} min
                </span>
              )}
              <span className="ml-2 text-white/40">
                {Array.isArray(r.stops) ? r.stops.length : 0} stops
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "reminders" && (
        <div className="mt-8 space-y-2">
          {(reminders.data?.reminders ?? []).map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{r.title}</span>
              <span className={`ml-2 ${r.status === "OVERDUE" ? "text-red-400" : "text-white/50"}`}>
                {r.status}
              </span>
              <span className="ml-2 text-white/40">{r.vehicle?.registrationNo}</span>
              <span className="ml-2 text-white/40">
                due {new Date(r.dueAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "trips" && (
        <div className="mt-8 space-y-2">
          {(trips.data?.trips ?? []).map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{t.vehicle?.registrationNo}</span>
              <span className="ml-2 text-white/50">{t.status}</span>
              {t.milkLiters != null && (
                <span className="ml-2 text-[#C89B3C]">{Number(t.milkLiters)}L milk</span>
              )}
              {t.distanceKm != null && (
                <span className="ml-2 text-white/40">{Number(t.distanceKm)} km</span>
              )}
              {t.driver?.user?.name && (
                <span className="ml-2 text-white/40">· {t.driver.user.name}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
