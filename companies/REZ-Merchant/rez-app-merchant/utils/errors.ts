/**
 * Type-safe error utilities for catch clause handling.
 *
 * TypeScript 4+ makes catch clause variables `unknown` by default.
 * Use these helpers instead of `(e as unknown).message` to safely extract
 * error information without bypassing type safety.
 */

/**
 * Safely extract a message string from an unknown catch clause value.
 *
 * Usage:
 *   } catch (e) {
 *     const msg = getErrorMessage(e);
 *     setError(msg);
 *   }
 */
export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  if (
    typeof e === 'object' &&
    e !== null &&
    'message' in e &&
    typeof (e as Record<string, unknown>).message === 'string'
  ) {
    return (e as Record<string, unknown>).message as string;
  }
  return 'An unexpected error occurred';
}

/**
 * Safely check whether an unknown catch value is an Error instance.
 */
export function isError(e: unknown): e is Error {
  return e instanceof Error;
}

/**
 * Safely extract a status code from an unknown catch clause value.
 * Handles Axios-style errors with `response.status`.
 */
export function getErrorStatus(e: unknown): number | undefined {
  if (
    typeof e === 'object' &&
    e !== null &&
    'response' in e &&
    typeof (e as Record<string, unknown>).response === 'object'
  ) {
    const response = (e as Record<string, unknown>).response as Record<string, unknown>;
    if (typeof response.status === 'number') return response.status;
  }
  if (typeof e === 'object' && e !== null && 'status' in e) {
    const status = (e as Record<string, unknown>).status;
    if (typeof status === 'number') return status;
  }
  return undefined;
}
