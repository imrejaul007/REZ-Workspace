import crypto from 'crypto';

/**
 * Generate a unique notification ID
 */
export function generateNotificationId(): string {
  return `notif_${generateId()}`;
}

/**
 * Generate a unique template ID
 */
export function generateTemplateId(): string {
  return `tmpl_${generateId()}`;
}

/**
 * Generate a unique preference ID
 */
export function generatePreferenceId(): string {
  return `pref_${generateId()}`;
}

/**
 * Generate a unique schedule ID
 */
export function generateScheduleId(): string {
  return `sched_${generateId()}`;
}

/**
 * Generate a cryptographically secure random ID
 */
export function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...data };
  const sensitiveFields = ['token', 'password', 'secret', 'apiKey', 'authorization'];

  for (const key of Object.keys(masked)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      masked[key] = '***MASKED***';
    }
  }

  return masked;
}

/**
 * Sleep utility for retry logic
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        logger.info(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
