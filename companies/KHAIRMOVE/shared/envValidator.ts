/**
 * Environment Validator for Production
 *
 * Validates that all required environment variables are set before the service starts.
 * Fails fast if critical variables are missing.
 */

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate required environment variables
 */
export function validateRequiredEnvVars(required: string[]): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Warn about localhost URLs in production
  if (process.env.NODE_ENV === 'production') {
    const localhostVars = Object.entries(process.env)
      .filter(([, value]) => value?.includes('localhost'))
      .map(([key]) => key);

    for (const key of localhostVars) {
      warnings.push(`${key} points to localhost - this should be changed for production`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get required env vars for a service type
 */
export function getRequiredEnvVars(serviceType: 'api-gateway' | 'backend' | 'worker' | 'mobile'): string[] {
  const base = ['NODE_ENV', 'SERVICE_NAME'];

  switch (serviceType) {
    case 'api-gateway':
      return [
        ...base,
        'PORT',
        'CORS_ORIGINS',
        'INTERNAL_SERVICE_TOKEN',
        'REZ_INTELLIGENCE_API_KEY',
      ];
    case 'backend':
      return [
        ...base,
        'PORT',
        'MONGODB_URI',
        'JWT_SECRET',
        'INTERNAL_SERVICE_TOKEN',
        'REZ_INTELLIGENCE_API_KEY',
      ];
    case 'worker':
      return [
        ...base,
        'MONGODB_URI',
        'REDIS_URL',
        'INTERNAL_SERVICE_TOKEN',
      ];
    case 'mobile':
      return [
        ...base,
        'API_URL',
        'SOCKET_URL',
      ];
    default:
      return base;
  }
}

/**
 * Validate and throw if invalid
 */
export function validateOrThrow(serviceType: 'api-gateway' | 'backend' | 'worker' | 'mobile'): void {
  const required = getRequiredEnvVars(serviceType);
  const result = validateRequiredEnvVars(required);

  if (result.warnings.length > 0) {
    console.warn('Environment warnings:', result.warnings);
  }

  if (!result.valid) {
    throw new Error(`Environment validation failed:\n${result.errors.join('\n')}`);
  }
}