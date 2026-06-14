import { z } from 'zod';

// Request validation schemas
export const AuthSchema = z.object({
  authorization: z.string().optional(),
  'x-api-key': z.string().optional(),
  'x-user-id': z.string().optional(),
  'x-tenant-id': z.string().optional()
});

export const RouteConfigSchema = z.object({
  path: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  targetService: z.string(),
  targetPath: z.string(),
  auth: z.boolean().optional(),
  rateLimit: z.number().optional(),
  timeout: z.number().optional(),
  cache: z.boolean().optional(),
  cacheTTL: z.number().optional()
});

export const RateLimitConfigSchema = z.object({
  windowMs: z.number(),
  maxRequests: z.number(),
  keyGenerator: z.function().optional()
});

// Service configuration
export interface ServiceConfig {
  name: string;
  baseUrl: string;
  healthEndpoint: string;
  timeout: number;
  retryAttempts: number;
  circuitBreakerThreshold: number;
}

export interface RouteRule {
  path: string;
  method: string;
  targetService: string;
  targetPath: string;
  auth: boolean;
  rateLimit?: number;
  timeout?: number;
  cache?: boolean;
  cacheTTL?: number;
}

// Request/Response types
export interface GatewayRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  params: Record<string, string>;
  body: unknown;
  user?: {
    id: string;
    tenantId?: string;
    roles?: string[];
  };
  requestId: string;
  timestamp: number;
}

export interface GatewayResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: number;
    duration: number;
    cached?: boolean;
  };
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastCheck: number;
  errorRate: number;
  requests: number;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
  nextRetry: number;
}

// Analytics types
export interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  cacheHitRate: number;
  errorRate: number;
  byService: Record<string, ServiceMetrics>;
}

export interface ServiceMetrics {
  requests: number;
  errors: number;
  latency: number;
  cacheHits: number;
}

// Log types
export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  requestId: string;
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
  service?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  version: string;
  uptime: number;
  services: ServiceHealth[];
  metrics: {
    requests: number;
    errors: number;
    averageLatency: number;
  };
}

// Token payload
export interface TokenPayload {
  sub: string;
  tenantId?: string;
  roles?: string[];
  permissions?: string[];
  iat: number;
  exp: number;
}

// API Key info
export interface ApiKeyInfo {
  keyId: string;
  tenantId: string;
  permissions: string[];
  expiresAt?: number;
}

// Route configuration type for Zod
export type RouteConfig = z.infer<typeof RouteConfigSchema>;

// Re-export commonly used types
export type { Request, Response } from 'express';