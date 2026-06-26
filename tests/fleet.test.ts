import { describe, it, expect } from "vitest";
import { optimizeRoute } from "@/modules/fleet/routes";
import {
  VEHICLE_TYPE_LABELS,
  VEHICLE_STATUS_LABELS,
  MAINTENANCE_TYPE_LABELS,
  INSURANCE_STATUS_LABELS,
  TRIP_STATUS_LABELS,
  REMINDER_STATUS_LABELS,
} from "@/modules/fleet/types";
import { hasPermission } from "@/lib/security/permissions";

describe("fleet/routes", () => {
  it("optimizes multi-stop route", () => {
    const stops = [
      { id: "a", name: "A", lat: 26.91, lng: 75.78 },
      { id: "b", name: "B", lat: 26.92, lng: 75.79 },
      { id: "c", name: "C", lat: 26.9, lng: 75.77 },
    ];
    const result = optimizeRoute(stops, { lat: 26.9124, lng: 75.7873 });
    expect(result.order.length).toBe(3);
    expect(result.totalDistanceKm).toBeGreaterThan(0);
    expect(result.estimatedMinutes).toBeGreaterThan(0);
  });

  it("returns empty for no stops", () => {
    expect(optimizeRoute([])).toEqual({ order: [], totalDistanceKm: 0, estimatedMinutes: 0 });
  });
});

describe("fleet/types", () => {
  it("labels vehicle types including tanker", () => {
    expect(VEHICLE_TYPE_LABELS.TANKER).toBe("Milk Tanker");
    expect(Object.keys(VEHICLE_STATUS_LABELS).length).toBe(4);
  });

  it("labels maintenance, insurance, trip, reminder enums", () => {
    expect(Object.keys(MAINTENANCE_TYPE_LABELS).length).toBe(4);
    expect(INSURANCE_STATUS_LABELS.ACTIVE).toBe("Active");
    expect(TRIP_STATUS_LABELS.COMPLETED).toBe("Completed");
    expect(REMINDER_STATUS_LABELS.OVERDUE).toBe("Overdue");
  });
});

describe("fleet/permissions", () => {
  it("grants admin fleet access", () => {
    expect(hasPermission("ADMIN", "admin:fleet:write")).toBe(true);
    expect(hasPermission("FARM_MANAGER", "admin:fleet:read")).toBe(true);
  });

  it("grants delivery drivers fleet write", () => {
    expect(hasPermission("DELIVERY", "fleet:write")).toBe(true);
    expect(hasPermission("DELIVERY", "admin:fleet:write")).toBe(false);
  });

  it("denies customer fleet access", () => {
    expect(hasPermission("CUSTOMER", "fleet:read")).toBe(false);
  });
});
