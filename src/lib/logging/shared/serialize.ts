import type { SerializedError } from "./types";

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    const err = error as Error & { code?: string; cause?: unknown };
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      cause: err.cause,
    };
  }

  if (typeof error === "string") {
    return { name: "Error", message: error };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
}
