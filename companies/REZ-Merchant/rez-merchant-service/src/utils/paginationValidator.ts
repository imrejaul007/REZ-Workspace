/**
 * Pagination validation utilities.
 *
 * BE-MER-014 & BE-MER-033 FIX: Validates pagination parameters across all routes.
 * SECURITY FIX (MA-BACK-AUDIT-007): Replaced `unknown` types with proper interfaces.
 */

export interface ValidatedPagination {
  page: number;
  limit: number;
}

/** Type for input pagination parameters (string, number, or undefined) */
export type PaginationInput = string | number | undefined;

/**
 * Validates and normalizes pagination parameters.
 *
 * @param page Page number (1-indexed)
 * @param limit Items per page
 * @param maxLimit Maximum allowed limit (default: 100)
 * @returns Validated page and limit
 */
export function validatePagination(
  page: PaginationInput,
  limit: PaginationInput,
  maxLimit: number = 100,
): { isValid: boolean; pagination?: ValidatedPagination; error?: string } {
  const p = typeof page === 'string' ? parseInt(page, 10) : page;
  const l = typeof limit === 'string' ? parseInt(limit, 10) : limit;

  // Check if they're valid numbers
  if (!Number.isFinite(p) || !Number.isFinite(l)) {
    return { isValid: false, error: 'page and limit must be valid numbers' };
  }

  // Check if they're positive
  if (p < 1) {
    return { isValid: false, error: 'page must be >= 1' };
  }
  if (l < 1) {
    return { isValid: false, error: 'limit must be >= 1' };
  }

  // Enforce max limit
  const validLimit = Math.min(l, maxLimit);

  return {
    isValid: true,
    pagination: {
      page: p,
      limit: validLimit,
    },
  };
}

/**
 * Calculates skip offset from page and limit.
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
