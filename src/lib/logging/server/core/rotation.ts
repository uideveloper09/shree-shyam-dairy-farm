import "server-only";

import pino from "pino";
import type { DestinationStream } from "pino";

/**
 * File destination compatible with external log rotation (logrotate, rotating-file-stream).
 *
 * - `sync: false` — buffered writes; pair with `reopenAllLogDestinations()` on SIGHUP/SIGUSR1
 * - `mkdir: true` — creates `logs/` automatically
 */
const rotatableDestinations = new Set<DestinationStream>();

export function createRotatableDestination(filePath: string, sync = false): DestinationStream {
  const dest = pino.destination({ dest: filePath, mkdir: true, sync });
  rotatableDestinations.add(dest);
  return dest;
}

/** Reopen file handles after rotation (call from SIGHUP / SIGUSR1 handlers). */
export function reopenAllLogDestinations(): number {
  let reopened = 0;
  for (const dest of rotatableDestinations) {
    const stream = dest as unknown as { reopen?: () => void };
    if (typeof stream.reopen === "function") {
      stream.reopen();
      reopened += 1;
    }
  }
  return reopened;
}

let rotationHandlersRegistered = false;

/** Register process signal handlers for log rotation (idempotent). */
export function registerRotationSignalHandlers(): void {
  if (rotationHandlersRegistered || typeof process === "undefined") return;
  rotationHandlersRegistered = true;

  const handle = () => {
    const count = reopenAllLogDestinations();
    if (count > 0) {
      process.stdout.write(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "info",
          message: "log_destinations_reopened",
          count,
        }) + "\n"
      );
    }
  };

  process.on("SIGHUP", handle);
  process.on("SIGUSR1", handle);
}

export function clearRotatableDestinationsForTests(): void {
  rotatableDestinations.clear();
  rotationHandlersRegistered = false;
}
