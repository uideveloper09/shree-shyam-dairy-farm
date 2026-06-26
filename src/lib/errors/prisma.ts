import { Prisma } from "@prisma/client";
import { ConflictError } from "./http-errors";
import { NotFoundError } from "./http-errors";
import { ValidationError } from "./validation-error";
import { DatabaseError, DatabaseNotConfiguredError } from "./database-error";
import { AppError } from "./app-error";
import { isAppError } from "./app-error";

export function isPrismaClientError(
  error: unknown
): error is
  | Prisma.PrismaClientKnownRequestError
  | Prisma.PrismaClientValidationError
  | Prisma.PrismaClientInitializationError
  | Prisma.PrismaClientRustPanicError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  );
}

/**
 * Map Prisma errors to operational AppError subclasses.
 * Unknown Prisma errors become DatabaseError (500).
 */
export function mapPrismaError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseNotConfiguredError(error.message);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError("Invalid database query", [{ path: [], message: error.message }]);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        const target = (error.meta?.target as string[] | undefined)?.join(", ");
        return new ConflictError(
          target ? `Unique constraint failed on: ${target}` : "Record already exists",
          { prismaCode: error.code, field: target }
        );
      }
      case "P2003":
        return new DatabaseError("Foreign key constraint failed", {
          statusCode: 400,
          meta: { prismaCode: error.code, field: String(error.meta?.field_name ?? "") },
          cause: error,
        });
      case "P2025":
        return new NotFoundError("Record not found", { prismaCode: error.code });
      case "P2014":
        return new DatabaseError("Invalid ID for relation", {
          statusCode: 400,
          meta: { prismaCode: error.code },
          cause: error,
        });
      case "P1001":
      case "P1002":
      case "P1003":
        return new DatabaseNotConfiguredError("Database server unreachable");
      default:
        return new DatabaseError(error.message, {
          meta: { prismaCode: error.code, model: error.meta?.modelName as string | undefined },
          cause: error,
        });
    }
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new DatabaseError("Database engine panic", { cause: error, isOperational: false });
  }

  return new DatabaseError(error instanceof Error ? error.message : "Unknown database error", {
    cause: error,
  });
}
