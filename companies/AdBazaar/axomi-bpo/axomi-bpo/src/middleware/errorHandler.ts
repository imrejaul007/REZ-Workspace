import type { Request, Response, NextFunction } from "express";

/**
 * Standard error response shape returned by the error handler middleware.
 */
export interface ErrorResponse {
  status: "error";
  message: string;
  errors?: unknown;
  timestamp: string;
}

/**
 * Express error-handling middleware.
 *
 * Catches errors passed via `next(err)` and returns a consistent JSON payload.
 * Also handles Zod validation errors with field-level detail.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction,
): void {
  logger.error("[ERROR]", err.message, err.stack);

  const statusCode = (err as Error & { statusCode?: number }).statusCode || 500;
  const isZod = err.name === "ZodError";

  res.status(statusCode).json({
    status: "error",
    message: isZod ? "Validation failed" : err.message || "Internal server error",
    ...(isZod ? { errors: (err as Error & { issues?: unknown }).issues } : {}),
    timestamp: new Date().toISOString(),
  });
}
