import { describe, it, expect } from "vitest";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  AppError,
  ERROR_CODES,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  InternalServerError,
  DatabaseNotConfiguredError,
  normalizeError,
  getErrorStatus,
  isOperationalError,
  buildErrorBody,
  mapPrismaError,
  parseOrThrow,
  assertFound,
  assertAuth,
  assertDatabaseConfigured,
} from "@/lib/errors";

describe("errors/AppError", () => {
  it("exposes code, status, and slug", () => {
    const err = new NotFoundError("Order not found", { id: "ord_1" });
    expect(err.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(err.statusCode).toBe(404);
    expect(err.slug).toBe("not_found");
    expect(err.isOperational).toBe(true);
  });
});

describe("errors/normalize", () => {
  it("passes through AppError", () => {
    const err = new AuthenticationError("Login required");
    const normalized = normalizeError(err);
    expect(normalized.statusCode).toBe(401);
    expect(normalized.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it("maps ZodError to ValidationError", () => {
    const schema = z.object({ email: z.email() });
    try {
      schema.parse({ email: "bad" });
    } catch (error) {
      const normalized = normalizeError(error);
      expect(normalized.statusCode).toBe(400);
      expect(normalized.code).toBe(ERROR_CODES.VALIDATION_FAILED);
    }
  });

  it("maps unknown errors to InternalServerError", () => {
    const normalized = normalizeError(new Error("boom"));
    expect(normalized.statusCode).toBe(500);
    expect(normalized.isOperational).toBe(false);
    expect(isOperationalError(new NotFoundError())).toBe(true);
  });
});

describe("errors/prisma", () => {
  it("maps P2025 to not found", () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: "6.0.0",
    });
    const mapped = mapPrismaError(prismaError);
    expect(mapped).toBeInstanceOf(NotFoundError);
    expect(getErrorStatus(mapped)).toBe(404);
  });

  it("maps P2002 to conflict", () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("Unique", {
      code: "P2002",
      clientVersion: "6.0.0",
      meta: { target: ["email"] },
    });
    const mapped = mapPrismaError(prismaError);
    expect(mapped.statusCode).toBe(409);
  });

  it("maps initialization error to database unavailable", () => {
    const prismaError = new Prisma.PrismaClientInitializationError("Can't reach DB", "6.0.0");
    const mapped = mapPrismaError(prismaError);
    expect(mapped).toBeInstanceOf(DatabaseNotConfiguredError);
    expect(mapped.statusCode).toBe(503);
  });
});

describe("errors/validation", () => {
  it("parseOrThrow throws ValidationError", () => {
    const schema = z.object({ name: z.string().min(1) });
    expect(() => parseOrThrow(schema, {})).toThrow(ValidationError);
  });
});

describe("errors/response", () => {
  it("builds consistent API error body", () => {
    const body = buildErrorBody(new ForbiddenError("Nope"));
    expect(body.success).toBe(false);
    expect(body.error).toBe("forbidden");
    expect(body.code).toBe(ERROR_CODES.FORBIDDEN);
    expect(body.message).toBe("Nope");
  });
});

describe("errors/assert", () => {
  it("assertFound throws NotFoundError", () => {
    expect(() => assertFound(null)).toThrow(NotFoundError);
  });

  it("assertAuth throws AuthenticationError", () => {
    expect(() => assertAuth(false)).toThrow(AuthenticationError);
  });

  it("assertDatabaseConfigured throws 503", () => {
    expect(() => assertDatabaseConfigured(false)).toThrow(DatabaseNotConfiguredError);
  });
});

describe("errors/custom", () => {
  it("supports subclassing AppError", () => {
    class CustomError extends AppError {
      constructor() {
        super("Custom", { code: ERROR_CODES.BAD_REQUEST, statusCode: 400 });
      }
    }
    expect(new CustomError().statusCode).toBe(400);
  });

  it("internal errors are non-operational", () => {
    expect(new InternalServerError().isOperational).toBe(false);
  });
});
