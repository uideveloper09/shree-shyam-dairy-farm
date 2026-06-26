import type {
  SubscriptionFrequency,
  SubscriptionStatus,
  DeliverySlot,
  PrismaClient,
} from "@prisma/client";

export const FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  DAILY: "Every day",
  ALTERNATE_DAY: "Alternate days",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  CUSTOM: "Custom days",
};

export const SLOT_LABELS: Record<DeliverySlot, string> = {
  MORNING: "Morning (6–9 AM)",
  EVENING: "Evening (5–8 PM)",
};

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  CANCELLED: "Cancelled",
  VACATION: "Vacation mode",
};

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return startOfDay(d);
}

export function calculateNextDelivery(
  frequency: SubscriptionFrequency,
  customDays: number[],
  from = new Date(),
  lastDelivery?: Date | null
): Date {
  const base = startOfDay(from);

  switch (frequency) {
    case "DAILY":
      return addDays(base, 1);
    case "ALTERNATE_DAY": {
      const ref = lastDelivery ? startOfDay(lastDelivery) : base;
      return addDays(ref, 2);
    }
    case "WEEKLY":
      return addDays(base, 7);
    case "MONTHLY": {
      const d = new Date(base);
      d.setMonth(d.getMonth() + 1);
      return startOfDay(d);
    }
    case "CUSTOM": {
      for (let i = 1; i <= 21; i++) {
        const candidate = addDays(base, i);
        if (customDays.includes(candidate.getDay())) return candidate;
      }
      return addDays(base, 7);
    }
    default:
      return addDays(base, 1);
  }
}

export function isDeliveryDay(
  date: Date,
  frequency: SubscriptionFrequency,
  customDays: number[],
  startDate: Date
): boolean {
  const d = startOfDay(date);
  const start = startOfDay(startDate);
  if (d < start) return false;

  const diffDays = Math.round((d.getTime() - start.getTime()) / 86400000);

  switch (frequency) {
    case "DAILY":
      return true;
    case "ALTERNATE_DAY":
      return diffDays % 2 === 0;
    case "WEEKLY":
      return d.getDay() === start.getDay();
    case "MONTHLY":
      return d.getDate() === start.getDate();
    case "CUSTOM":
      return customDays.includes(d.getDay());
    default:
      return false;
  }
}

export type CalendarDay = {
  date: string;
  label: string;
  isDelivery: boolean;
  status: "scheduled" | "skipped" | "delivered" | "off";
};

export function buildDeliveryCalendar(
  subscription: {
    frequency: SubscriptionFrequency;
    customDays: number[];
    startDate: Date;
    status: SubscriptionStatus;
    pausedUntil?: Date | null;
    vacationUntil?: Date | null;
  },
  deliveries: {
    scheduledDate: Date;
    skipped: boolean;
    status: string;
    deliveredAt?: Date | null;
  }[],
  daysAhead = 28
): CalendarDay[] {
  const today = startOfDay(new Date());
  const deliveryMap = new Map(
    deliveries.map((d) => [startOfDay(d.scheduledDate).toISOString(), d])
  );

  const calendar: CalendarDay[] = [];

  for (let i = 0; i < daysAhead; i++) {
    const date = addDays(today, i);
    const key = date.toISOString();
    const existing = deliveryMap.get(key);
    const isPaused =
      subscription.status === "PAUSED" &&
      subscription.pausedUntil &&
      date <= startOfDay(subscription.pausedUntil);
    const isVacation =
      subscription.status === "VACATION" &&
      subscription.vacationUntil &&
      date <= startOfDay(subscription.vacationUntil);

    let isDelivery = isDeliveryDay(
      date,
      subscription.frequency,
      subscription.customDays,
      subscription.startDate
    );

    if (subscription.status === "CANCELLED") isDelivery = false;
    if (isPaused || isVacation) isDelivery = false;

    let status: CalendarDay["status"] = "off";
    if (isDelivery) {
      if (existing?.skipped) status = "skipped";
      else if (existing?.deliveredAt || existing?.status === "delivered") status = "delivered";
      else status = "scheduled";
    }

    calendar.push({
      date: date.toISOString(),
      label: `${DAY_LABELS[date.getDay()]} ${date.getDate()}`,
      isDelivery,
      status,
    });
  }

  return calendar;
}

export async function syncUpcomingDeliveries(
  subscriptionId: string,
  subscription: {
    frequency: SubscriptionFrequency;
    customDays: number[];
    startDate: Date;
    status: SubscriptionStatus;
    nextDelivery: Date | null;
    pausedUntil?: Date | null;
    vacationUntil?: Date | null;
  },
  prisma: PrismaClient
) {
  if (subscription.status === "CANCELLED") return;

  const existing = await prisma.subscriptionDelivery.findMany({
    where: {
      subscriptionId,
      scheduledDate: { gte: startOfDay(new Date()) },
    },
    select: { scheduledDate: true },
  });

  const existingSet = new Set(existing.map((e) => startOfDay(e.scheduledDate).toISOString()));
  const calendar = buildDeliveryCalendar(subscription, [], 21);

  for (const day of calendar) {
    if (day.status !== "scheduled") continue;
    if (existingSet.has(day.date)) continue;

    await prisma.subscriptionDelivery.create({
      data: {
        subscriptionId,
        scheduledDate: new Date(day.date),
        status: "scheduled",
      },
    });
  }
}
