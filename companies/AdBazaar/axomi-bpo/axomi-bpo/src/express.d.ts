/**
 * Extended Express Request with validated payload properties set by the
 * validateRequest middleware.
 */
declare global {
  namespace Express {
    interface Request {
      /** Parsed and validated request body (set by validateRequest) */
      validatedBody?: Record<string, unknown>;
      /** Parsed and validated query parameters (set by validateRequest) */
      validatedQuery?: Record<string, unknown>;
      /** Parsed and validated route parameters (set by validateRequest) */
      validatedParams?: Record<string, unknown>;
    }
  }
}

export {};