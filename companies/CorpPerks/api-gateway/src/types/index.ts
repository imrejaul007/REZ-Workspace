import { z } from 'zod';

// Environment validation schema
export const EnvSchema = z.object({
  PORT: z.string().default('4700'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default('24h'),

  // Internal Service Token (for service-to-service auth)
  INTERNAL_SERVICE_TOKEN: z.string().min(32),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

  // CORS
  CORS_ORIGINS: z.string().default('*'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

// Route configuration
export interface RouteConfig {
  path: string;
  target: string;
  timeout: number;
  retries: number;
  authRequired: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

// Request context
export interface RequestContext {
  requestId: string;
  timestamp: Date;
  method: string;
  path: string;
  ip: string;
  userId?: string;
  serviceId?: string;
  latency?: number;
}

// Auth payload
export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  companyId: string;
  permissions: string[];
  serviceId?: string;
  exp?: number;
  iat?: number;
}

// Extended logging context for security events
export interface SecurityLogContext extends Partial<RequestContext> {
  details?: Record<string, unknown>;
}

// Service health status
export interface ServiceHealth {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  latency?: number;
  lastCheck?: Date;
  error?: string;
}

// Gateway health response
export interface GatewayHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  services: ServiceHealth[];
  stats: {
    totalRequests: number;
    successRate: number;
    avgLatency: number;
    activeConnections: number;
  };
}

// Error response
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
    timestamp: string;
  };
}

// Success response wrapper
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    requestId: string;
    latency: number;
  };
}
