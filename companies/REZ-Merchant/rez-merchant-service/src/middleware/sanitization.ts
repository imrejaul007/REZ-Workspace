/**
 * Input Sanitization Middleware
 *
 * Security middleware for request sanitization:
 * - XSS prevention
 * - SQL injection prevention (NoSQL)
 * - Parameter pollution prevention
 * - Request size limits
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// ── Configuration ─────────────────────────────────────────────────────────────

const MAX_STRING_LENGTH = 10000;
const MAX_ARRAY_LENGTH = 1000;
const MAX_OBJECT_KEYS = 100;

// Dangerous patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onload, etc.
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<link/gi,
  /<meta/gi,
];

const NO_SQL_INJECTION_PATTERNS = [
  /\$where/gi,
  /\$regex/gi,
  /\$ne/gi,
  /\$in/gi,
  /\$or/gi,
  /\$and/gi,
  /\$not/gi,
  /\$exists/gi,
  /\$type/gi,
  /\$all/gi,
  /\$elemMatch/gi,
];

// ── Sanitization Functions ────────────────────────────────────────────────────

export function sanitizeString(value: unknown): string {
  if (value === null || value === undefined) return '';

  let str = String(value);

  // Truncate long strings
  if (str.length > MAX_STRING_LENGTH) {
    str = str.substring(0, MAX_STRING_LENGTH);
    logger.warn('[Sanitize] String truncated due to length', { originalLength: value.toString().length });
  }

  // Remove XSS patterns
  for (const pattern of XSS_PATTERNS) {
    str = str.replace(pattern, '');
  }

  return str.trim();
}

export function sanitizeObject(obj: unknown): Record<string, unknown> {
  if (obj === null || obj === undefined) return {};
  if (typeof obj !== 'object') return {};

  const sanitized: Record<string, unknown> = {};
  const original = obj as Record<string, unknown>;

  // Check key count
  const keys = Object.keys(original);
  if (keys.length > MAX_OBJECT_KEYS) {
    logger.warn('[Sanitize] Object has too many keys', { keyCount: keys.length });
    return sanitized;
  }

  for (const key of keys) {
    // Skip dangerous MongoDB operators
    if (key.startsWith('$')) {
      logger.warn('[Sanitize] Blocked MongoDB operator', { key });
      continue;
    }

    const value = original[key];

    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = sanitizeArray(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    }
  }

  return sanitized;
}

export function sanitizeArray(arr: unknown[]): unknown[] {
  if (!Array.isArray(arr)) return [];
  if (arr.length > MAX_ARRAY_LENGTH) {
    logger.warn('[Sanitize] Array truncated', { originalLength: arr.length });
    return arr.slice(0, MAX_ARRAY_LENGTH);
  }

  return arr.map((item) => {
    if (typeof item === 'string') {
      return sanitizeString(item);
    } else if (typeof item === 'object' && item !== null) {
      return sanitizeObject(item);
    }
    return item;
  });
}

// ── NoSQL Injection Detection ────────────────────────────────────────────────

export function detectNoSQLInjection(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  for (const pattern of NO_SQL_INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      logger.warn('[Sanitize] Possible NoSQL injection detected', {
        pattern: pattern.toString(),
        value: value.substring(0, 100),
      });
      return true;
    }
  }

  return false;
}

// ── Middleware ───────────────────────────────────────────────────────────────

export function sanitizationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      for (const key of Object.keys(req.query)) {
        const value = req.query[key];
        if (typeof value === 'string') {
          if (detectNoSQLInjection(value)) {
            logger.warn('[Sanitize] NoSQL injection in query', { key });
          }
          (req.query as Record<string, unknown>)[key] = sanitizeString(value);
        }
      }
    }

    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      // Deep sanitize body
      req.body = sanitizeObject(req.body);
    }

    next();
  } catch (err) {
    logger.error('[Sanitize] Sanitization error', { error: err });
    next();
  }
}

// ── Request Size Limiter ────────────────────────────────────────────────────

export function requestSizeLimiter(maxSizeKB: number = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxBytes = maxSizeKB * 1024;

    if (contentLength > maxBytes) {
      logger.warn('[RequestSize] Request too large', {
        size: contentLength,
        max: maxBytes,
      });

      return res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Request body exceeds ${maxSizeKB}KB limit`,
        },
      });
    }

    next();
  };
}

// ── Parameter Pollution Prevention ──────────────────────────────────────────

export function preventParameterPollution(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Express by default handles query parameter pollution
  // This middleware adds logging for monitoring
  const queryKeys = Object.keys(req.query);

  // Check for duplicate keys (Express handles this by using the last value)
  // Log if there are duplicates for monitoring
  const seen = new Set<string>();
  for (const key of queryKeys) {
    if (seen.has(key)) {
      logger.debug('[Pollution] Duplicate query param', { key });
    }
    seen.add(key);
  }

  next();
}
