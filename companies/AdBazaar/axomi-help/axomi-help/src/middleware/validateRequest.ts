import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Middleware factory that validates `req.body` (and optionally `req.query`)
 * against a Zod schema.
 *
 * On success the parsed (and possibly coerced) value is attached to
 * `req.validatedBody` / `req.validatedQuery`.
 * On failure a 400 response is sent with the Zod issue details.
 */
export function validateRequest<T extends z.ZodType>(
  schema: T,
  source: "body" | "query" | "params" = "body",
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = source === "query"
        ? schema.parse(req.query)
        : source === "params"
          ? schema.parse(req.params)
          : schema.parse(req.body);

      if (source === "body") (req as unknown as Record<string, unknown>).validatedBody = data;
      if (source === "query") (req as unknown as Record<string, unknown>).validatedQuery = data;
      if (source === "params") (req as unknown as Record<string, unknown>).validatedParams = data;

      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        (err as Error & { statusCode?: number }).statusCode = 400;
      }
      next(err);
    }
  };
}
