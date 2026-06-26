export type NormalizedReading = {
  sensorKey: string;
  sensorType: string;
  value: number;
  unit?: string;
  recordedAt: Date;
  idempotencyKey?: string;
};

export type IngestEnvelope = {
  v: number;
  deviceKey?: string;
  gatewayKey?: string;
  stationKey?: string;
  readings: Array<{
    sensorKey: string;
    type: string;
    value: number;
    unit?: string;
    recordedAt: string;
    idempotencyKey?: string;
  }>;
};

export const FARM_OPERATOR_ROLES = [
  "ADMIN",
  "OWNER",
  "FARM_MANAGER",
  "IOT_OPERATOR",
  "VETERINARIAN",
  "ACCOUNTANT",
] as const;
