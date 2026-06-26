import type {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationPriority,
  NotificationType,
} from "@prisma/client";

export type ChannelSendResult = {
  ok: boolean;
  providerId?: string;
  error?: string;
  delivered?: boolean;
};

export type SendNotificationInput = {
  userId?: string;
  tenantId?: string | null;
  channel: NotificationChannel;
  type?: NotificationType;
  priority?: NotificationPriority;
  title: string;
  body: string;
  subject?: string;
  recipient?: string;
  data?: Record<string, unknown>;
  jobId?: string;
  broadcastId?: string;
  scheduledAt?: Date;
  maxAttempts?: number;
};

export type DispatchEventInput = {
  event: string;
  userId?: string;
  tenantId?: string | null;
  payload?: Record<string, unknown>;
};

export type BroadcastInput = {
  tenantId?: string | null;
  title: string;
  body: string;
  channels: NotificationChannel[];
  audienceFilter?: {
    roles?: string[];
    userIds?: string[];
  };
  type?: NotificationType;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  createdById?: string;
};

export const PRIORITY_WEIGHT: Record<NotificationPriority, number> = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  URGENT: 20,
};

export const RETRY_DELAYS_MS = [30_000, 120_000, 600_000, 1_800_000, 3_600_000];

export type DeliveryReport = {
  id: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  attempts: number;
  recipient: string | null;
  lastError: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
};
