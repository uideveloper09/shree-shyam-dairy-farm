/**
 * BullMQ background worker
 * Usage: npm run worker:queue
 */
import { createWorkerProcessor } from "@/lib/ops/queue";
import { logger } from "@/lib/ops/logger";

async function main() {
  const worker = await createWorkerProcessor();
  if (!worker) {
    logger.warn("queue_worker_exit_no_redis");
    process.exit(0);
  }
  logger.info("queue_worker_started");
  process.on("SIGTERM", async () => {
    await worker.close();
    process.exit(0);
  });
}

main().catch((e) => {
  logger.error("queue_worker_fatal", { error: String(e) });
  process.exit(1);
});
