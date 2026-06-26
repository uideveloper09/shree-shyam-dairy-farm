import { ZodError, type ZodIssue } from "zod";
import { ERROR_CODES } from "./codes";
import { AppError } from "./app-error";
import type { ErrorDetails } from "./types";

export type ValidationIssue = {
  path: (string | number)[];
  message: string;
  code?: string;
};

export class ValidationError extends AppError {
  readonly issues: ValidationIssue[];

  constructor(
    message = "Validation failed",
    issues: ValidationIssue[] = [],
    details?: ErrorDetails
  ) {
    super(message, {
      code: ERROR_CODES.VALIDATION_FAILED,
      statusCode: 400,
      details: details ?? { issues },
    });
    this.issues = issues;
  }

  static fromZod(error: ZodError, message = "Validation failed"): ValidationError {
    const issues = zodIssuesToValidationIssues(error.issues);
    return new ValidationError(message, issues, { issues });
  }
}

export function zodIssuesToValidationIssues(issues: ZodIssue[]): ValidationIssue[] {
  return issues.map((issue) => ({
    path: issue.path.map((segment) => (typeof segment === "symbol" ? String(segment) : segment)),
    message: issue.message,
    code: issue.code,
  }));
}

export function parseOrThrow<T>(schema: { parse: (input: unknown) => T }, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw ValidationError.fromZod(error);
    }
    throw error;
  }
}

export async function parseOrThrowAsync<T>(
  schema: { parseAsync: (input: unknown) => Promise<T> },
  input: unknown
): Promise<T> {
  try {
    return await schema.parseAsync(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw ValidationError.fromZod(error);
    }
    throw error;
  }
}
