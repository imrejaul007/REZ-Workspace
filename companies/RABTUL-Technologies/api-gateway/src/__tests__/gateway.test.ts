/**
 * API Gateway Tests
 * Tests for routing, rate limiting, and middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface Route {
  path: string;
  method: string;
  service: string;
  timeout: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Route matching
function matchRoute(routes: Route[], path: string, method: string): Route | null {
  for (const route of routes) {
    if (route.method !== method && route.method !== '*') continue;
    if (matchPath(route.path, path)) return route;
  }
  return null;
}

function matchPath(pattern: string, path: string): boolean {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) return false;

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) continue;
    if (patternParts[i] !== pathParts[i]) return false;
  }

  return true;
}

// Route extraction
function extractParams(pattern: string, path: string): Record<string, string> {
  const params: Record<string, string> = {};
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    }
  }

  return params;
}

// Rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(key: string, limit: number, windowMs: number): {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: new Date(now + windowMs) };
  }

  entry.count++;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: new Date(entry.resetAt) };
  }

  return { allowed: true, remaining: limit - entry.count, resetAt: new Date(entry.resetAt) };
}

// Request forwarding
interface ForwardRequest {
  service: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
}

function buildForwardUrl(baseUrl: string, path: string, params: Record<string, string>): string {
  let url = `${baseUrl}${path}`;
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    queryParams.append(key, value);
  }
  const query = queryParams.toString();
  return query ? `${url}?${query}` : url;
}

// Health check aggregation
interface ServiceHealth {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  latency?: number;
}

async function checkServiceHealth(name: string, url: string): Promise<ServiceHealth> {
  const start = Date.now();
  // Simulate health check
  const isHealthy = Math.random() > 0.1;
  return {
    name,
    url,
    status: isHealthy ? 'healthy' : 'unhealthy',
    latency: Date.now() - start,
  };
}

describe('Route Matching', () => {
  const routes: Route[] = [
    { path: '/api/auth/login', method: 'POST', service: 'auth', timeout: 5000 },
    { path: '/api/auth/:id', method: '*', service: 'auth', timeout: 5000 },
    { path: '/api/payments/:id', method: '*', service: 'payment', timeout: 10000 },
    { path: '/api/orders', method: 'GET', service: 'order', timeout: 5000 },
    { path: '/api/orders', method: 'POST', service: 'order', timeout: 5000 },
  ];

  it('should match exact path and method', () => {
    const route = matchRoute(routes, '/api/auth/login', 'POST');
    expect(route).not.toBeNull();
    expect(route?.service).toBe('auth');
  });

  it('should match wildcard method', () => {
    const route = matchRoute(routes, '/api/auth/user123', 'GET');
    expect(route).not.toBeNull();
    expect(route?.service).toBe('auth');
  });

  it('should return null for unmatched route', () => {
    const route = matchRoute(routes, '/api/unknown', 'GET');
    expect(route).toBeNull();
  });

  it('should match parameterized routes', () => {
    const route = matchRoute(routes, '/api/payments/pay_123', 'GET');
    expect(route).not.toBeNull();
    expect(route?.service).toBe('payment');
  });

  it('should handle root path', () => {
    const rootRoutes: Route[] = [
      { path: '/', method: 'GET', service: 'static', timeout: 5000 },
    ];
    const route = matchRoute(rootRoutes, '/', 'GET');
    expect(route?.service).toBe('static');
  });
});

describe('Parameter Extraction', () => {
  it('should extract single parameter', () => {
    const params = extractParams('/api/users/:id', '/api/users/123');
    expect(params).toEqual({ id: '123' });
  });

  it('should extract multiple parameters', () => {
    const params = extractParams('/api/orders/:orderId/items/:itemId', '/api/orders/o123/items/i456');
    expect(params).toEqual({ orderId: 'o123', itemId: 'i456' });
  });

  it('should return empty object for no parameters', () => {
    const params = extractParams('/api/users', '/api/users');
    expect(params).toEqual({});
  });
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    rateLimitStore.clear();
  });

  it('should allow first request', () => {
    const result = checkRateLimit('test_key', 100, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });

  it('should decrement remaining count', () => {
    checkRateLimit('test_key', 100, 60000);
    const result = checkRateLimit('test_key', 100, 60000);
    expect(result.remaining).toBe(98);
  });

  it('should block when limit exceeded', () => {
    for (let i = 0; i < 100; i++) {
      checkRateLimit('limited_key', 100, 60000);
    }
    const result = checkRateLimit('limited_key', 100, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset after window expires', () => {
    // Simulate time passing by checking after manual reset
    rateLimitStore.set('expiring_key', { count: 100, resetAt: Date.now() - 1 });
    const result = checkRateLimit('expiring_key', 100, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });

  it('should track different keys independently', () => {
    checkRateLimit('key1', 100, 60000);
    checkRateLimit('key1', 100, 60000);
    const result1 = checkRateLimit('key2', 100, 60000);
    expect(result1.remaining).toBe(99);
  });
});

describe('URL Building', () => {
  it('should build URL without params', () => {
    const url = buildForwardUrl('http://auth:4002', '/api/users', {});
    expect(url).toBe('http://auth:4002/api/users');
  });

  it('should build URL with params', () => {
    const url = buildForwardUrl('http://payment:4001', '/api/payments/:id', { id: 'pay_123' });
    expect(url).toBe('http://payment:4001/api/payments/pay_123?id=pay_123');
  });

  it('should handle multiple params', () => {
    const url = buildForwardUrl('http://order:4006', '/api/orders/:orderId/items/:itemId', {
      orderId: 'ord_1',
      itemId: 'item_1'
    });
    expect(url).toContain('ord_1');
    expect(url).toContain('item_1');
  });
});

describe('Service Health', () => {
  it('should aggregate multiple services', async () => {
    const services = [
      { name: 'auth', url: 'http://auth:4002/health' },
      { name: 'payment', url: 'http://payment:4001/health' },
      { name: 'wallet', url: 'http://wallet:4004/health' },
    ];

    const results = await Promise.all(
      services.map(s => checkServiceHealth(s.name, s.url))
    );

    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(['healthy', 'unhealthy']).toContain(result.status);
    });
  });

  it('should calculate aggregate health', async () => {
    const results: ServiceHealth[] = [
      { name: 'auth', url: '', status: 'healthy' },
      { name: 'payment', url: '', status: 'healthy' },
      { name: 'wallet', url: '', status: 'unhealthy' },
    ];

    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const totalHealth = (healthyCount / results.length) * 100;

    expect(totalHealth).toBeCloseTo(66.67, 1);
  });
});

describe('Request Validation', () => {
  function validateRequest(req: Partial<ForwardRequest>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!req.method) errors.push('method is required');
    if (!req.path) errors.push('path is required');
    if (!req.service) errors.push('service is required');
    if (req.path?.startsWith(' ') || req.path?.endsWith(' ')) {
      errors.push('path cannot have leading/trailing spaces');
    }

    return { valid: errors.length === 0, errors };
  }

  it('should validate complete request', () => {
    const result = validateRequest({
      method: 'GET',
      path: '/api/users',
      service: 'auth'
    });
    expect(result.valid).toBe(true);
  });

  it('should reject missing method', () => {
    const result = validateRequest({ path: '/api/users', service: 'auth' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('method is required');
  });

  it('should reject invalid path', () => {
    const result = validateRequest({
      method: 'GET',
      path: ' /api/users',
      service: 'auth'
    });
    expect(result.valid).toBe(false);
  });
});

describe('Circuit Breaker Integration', () => {
  interface CircuitState {
    failures: number;
    lastFailure: number;
    state: 'closed' | 'open' | 'half_open';
  }

  const circuits = new Map<string, CircuitState>();

  function recordFailure(service: string): void {
    const circuit = circuits.get(service) || { failures: 0, lastFailure: 0, state: 'closed' as const };
    circuit.failures++;
    circuit.lastFailure = Date.now();

    if (circuit.failures >= 5) {
      circuit.state = 'open';
    }

    circuits.set(service, circuit);
  }

  function shouldAllowRequest(service: string): boolean {
    const circuit = circuits.get(service);
    if (!circuit) return true;
    if (circuit.state === 'open') {
      if (Date.now() - circuit.lastFailure > 60000) {
        circuit.state = 'half_open';
        return true;
      }
      return false;
    }
    return true;
  }

  it('should allow requests initially', () => {
    expect(shouldAllowRequest('new_service')).toBe(true);
  });

  it('should open circuit after failures', () => {
    const service = 'failing_service';
    for (let i = 0; i < 5; i++) {
      recordFailure(service);
    }
    expect(shouldAllowRequest(service)).toBe(false);
  });
});
