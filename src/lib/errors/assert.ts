import { NotFoundError } from "./http-errors";
import { AuthenticationError, ForbiddenError } from "./auth-error";
import { DatabaseNotConfiguredError } from "./database-error";
import { ValidationError } from "./validation-error";
import { isAppError } from "./app-error";

export function assertFound<T>(
  value: T | null | undefined,
  message = "Resource not found"
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(message);
  }
}

export function assertAuth(
  condition: unknown,
  message = "Authentication required"
): asserts condition {
  if (!condition) {
    throw new AuthenticationError(message);
  }
}

export function assertPermission(
  condition: unknown,
  message = "Insufficient permissions"
): asserts condition {
  if (!condition) {
    throw new ForbiddenError(message);
  }
}

export function assertDatabaseConfigured(
  configured: boolean,
  message = "Database not configured"
): asserts configured is true {
  if (!configured) {
    throw new DatabaseNotConfiguredError(message);
  }
}

export function rethrowIfAppError(error: unknown): never {
  if (isAppError(error)) throw error;
  throw error;
}
