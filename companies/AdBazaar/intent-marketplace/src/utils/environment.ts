export function getEnvironment(): string {
  return process.env.NODE_ENV || 'development';
}

export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export function getPort(): number {
  return parseInt(process.env.PORT || '4802', 10);
}

export function getJwtSecret(): string {
  return getRequiredEnv('JWT_SECRET');
}

export function getInternalServiceKey(): string {
  return getRequiredEnv('INTERNAL_SERVICE_KEY');
}
