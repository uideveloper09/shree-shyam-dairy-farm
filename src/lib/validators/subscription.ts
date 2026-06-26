import { z } from "zod";

const addressSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile required"),
  line1: z.string().min(5).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: z.string().regex(/^\d{6}$/, "Valid 6-digit pincode required"),
  landmark: z.string().max(120).optional(),
});

export const createSubscriptionSchema = z.object({
  productLegacyId: z.number().int().positive(),
  frequency: z.enum(["DAILY", "ALTERNATE_DAY", "WEEKLY", "MONTHLY", "CUSTOM"]),
  quantity: z.number().int().min(1).max(10).default(1),
  deliverySlot: z.enum(["MORNING", "EVENING"]).default("MORNING"),
  customDays: z.array(z.number().int().min(0).max(6)).optional().default([]),
  startDate: z.string().datetime().optional(),
  address: addressSchema,
});

export const updateSubscriptionSchema = z.object({
  quantity: z.number().int().min(1).max(10).optional(),
  deliverySlot: z.enum(["MORNING", "EVENING"]).optional(),
  frequency: z.enum(["DAILY", "ALTERNATE_DAY", "WEEKLY", "MONTHLY", "CUSTOM"]).optional(),
  customDays: z.array(z.number().int().min(0).max(6)).optional(),
});

export const vacationSchema = z.object({
  until: z.string().datetime(),
});

export const pauseSchema = z.object({
  until: z.string().datetime().optional(),
});
