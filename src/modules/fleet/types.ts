import type {
  FleetInsuranceStatus,
  FleetMaintenanceStatus,
  FleetMaintenanceType,
  FleetReminderStatus,
  FleetTripStatus,
  FleetVehicleStatus,
  FleetVehicleType,
} from "@prisma/client";

export const VEHICLE_TYPE_LABELS: Record<FleetVehicleType, string> = {
  TRUCK: "Truck",
  VAN: "Van",
  MOTORCYCLE: "Motorcycle",
  TANKER: "Milk Tanker",
  OTHER: "Other",
};

export const VEHICLE_STATUS_LABELS: Record<FleetVehicleStatus, string> = {
  ACTIVE: "Active",
  IN_SERVICE: "In Service",
  INACTIVE: "Inactive",
  RETIRED: "Retired",
};

export const MAINTENANCE_TYPE_LABELS: Record<FleetMaintenanceType, string> = {
  SCHEDULED: "Scheduled",
  REPAIR: "Repair",
  INSPECTION: "Inspection",
  EMERGENCY: "Emergency",
};

export const MAINTENANCE_STATUS_LABELS: Record<FleetMaintenanceStatus, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const INSURANCE_STATUS_LABELS: Record<FleetInsuranceStatus, string> = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
  PENDING: "Pending",
  CANCELLED: "Cancelled",
};

export const TRIP_STATUS_LABELS: Record<FleetTripStatus, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const REMINDER_STATUS_LABELS: Record<FleetReminderStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  OVERDUE: "Overdue",
  DISMISSED: "Dismissed",
};

export type RouteStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
};
