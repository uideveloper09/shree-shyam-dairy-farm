import { logger } from "@/lib/ops/logger";

export type JobName = "email" | "notification" | "prediction" | "backup";

export type JobPayload = {
  name: JobName;
  data: Record<string, unknown>;
};

let queueAvailable = false;

export async function enqueueJob(job: JobPayload): Promise<{ id: string; queued: boolean }> {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  if (!process.env.REDIS_URL) {
    logger.info("queue_job_memory", { id, name: job.name });
    return { id, queued: false };
  }

  try {
    const { Queue } = await import("bullmq");
    const connection = { url: process.env.REDIS_URL };
    const queue = new Queue("ssd-jobs", { connection });
    await queue.add(job.name, job.data, {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });
    await queue.close();
    queueAvailable = true;
    logger.info("queue_job_enqueued", { id, name: job.name });
    return { id, queued: true };
  } catch (e) {
    logger.error("queue_enqueue_failed", { id, error: String(e) });
    return { id, queued: false };
  }
}

export function isQueueAvailable() {
  return queueAvailable || Boolean(process.env.REDIS_URL);
}

export async function createWorkerProcessor() {
  if (!process.env.REDIS_URL) {
    logger.warn("queue_worker_skipped_no_redis");
    return null;
  }

  const { Worker } = await import("bullmq");
  const connection = { url: process.env.REDIS_URL };

  const worker = new Worker(
    "ssd-jobs",
    async (job: { id?: string; name: string; data: Record<string, unknown> }) => {
      logger.info("queue_job_processing", { id: job.id, name: job.name });
      switch (job.name) {
        case "email":
          return { ok: true, processedAt: new Date().toISOString() };
        case "notification": {
          const { processNotificationJob } = await import("@/modules/notifications/queue");
          return processNotificationJob(job.data);
        }
        case "prediction":
        case "backup":
          return { ok: true, processedAt: new Date().toISOString() };
        default:
          return { ok: false, reason: "unknown_job" };
      }
    },
    { connection, concurrency: 5 }
  );

  worker.on("failed", (job: { id?: string } | undefined, err: Error) => {
    logger.error("queue_job_failed", { id: job?.id, error: err.message });
  });

  return worker;
}
