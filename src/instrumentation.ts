export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateConfigAtStartup } = await import("@/config");
    const { logger } = await import("@/lib/ops/logger");

    await validateConfigAtStartup();

    logger.info("instrumentation_registered", {
      env: process.env.APP_ENV || process.env.NODE_ENV,
      version: process.env.APP_VERSION || "0.1.0",
    });
  }
}

export async function onRequestError(
  err: Error & { digest?: string },
  request: { path: string; method: string }
) {
  const { logger } = await import("@/lib/ops/logger");
  logger.error("request_error", {
    path: request.path,
    method: request.method,
    message: err.message,
    digest: err.digest,
  });

  if (process.env.SENTRY_DSN) {
    logger.error("sentry_capture", {
      path: request.path,
      method: request.method,
      message: err.message,
      digest: err.digest,
      sentry: true,
    });
  }
}
