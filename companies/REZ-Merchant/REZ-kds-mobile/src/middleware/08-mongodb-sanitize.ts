/**
 * MongoDB Security - NoSQL Injection Prevention
 * Copy to: src/middleware/mongoSanitize.ts
 *
 * Usage in index.ts:
 *   import mongoSanitize from 'express-mongo-sanitize';
 *   app.use(mongoSanitize());
 *
 * OR use as middleware:
 *   import { mongoSanitize } from './middleware/mongoSanitize';
 */

import mongoSanitize from 'express-mongo-sanitize';

export { mongoSanitize };

// Additional custom sanitization for specific fields
export function sanitizeQuery(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip keys starting with $ (MongoDB operators)
    if (key.startsWith('$')) {
      continue;
    }

    if (typeof value === 'string') {
      sanitized[key] = value.replace(/[<>]/g, '');
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v =>
        typeof v === 'object' ? sanitizeQuery(v) : v
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeQuery(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
