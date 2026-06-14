/**
 * @deprecated Use @rez/shared utilities instead.
 * This file re-exports from @rez/shared for backward compatibility.
 *
 * Migration:
 *   Before: import { logger, createServiceLogger } from './config/logger';
 *   After:  import { logger, createServiceLogger } from '@rez/shared';
 */

export { logger, createServiceLogger } from '@rez/shared';
