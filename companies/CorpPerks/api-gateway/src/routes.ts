/**
 * API Gateway Routes Configuration
 *
 * Central routing configuration for all CorpPerks services.
 * Routes are now loaded from service-config.ts for production readiness.
 *
 * @module api-gateway/routes
 * @author RTNM Digital
 * @version 2.0.0
 *
 * Environment Variables:
 * - All service URLs are configured in service-config.ts
 */

import { RouteConfig } from './types';
import { serviceUrls, services } from './service-config';

/**
 * Build route config from service name
 */
function buildRoute(
  path: string,
  serviceName: string,
  options?: Partial<RouteConfig>
): RouteConfig {
  const config = services[serviceName];
  if (!config) {
    throw new Error(`Service '${serviceName}' not found in configuration`);
  }

  return {
    path,
    target: config.url,
    timeout: config.timeout,
    retries: config.retries,
    authRequired: true,
    rateLimit: { windowMs: 60000, max: 100 },
    ...options,
  };
}

export const routes: RouteConfig[] = [
  // Core HR Services
  buildRoute('/api/employees', 'backend', {
    rateLimit: { windowMs: 60000, max: 100 },
  }),
  buildRoute('/api/attendance', 'backend', {
    rateLimit: { windowMs: 60000, max: 200 },
  }),

  // Performance& OKR
  buildRoute('/api/performance', 'performance', {
    rateLimit: { windowMs: 60000, max: 100 },
  }),
  buildRoute('/api/1on1', 'meeting', {
    rateLimit: { windowMs: 60000, max: 100 },
  }),
  buildRoute('/api/okr', 'okr', {
    rateLimit: { windowMs: 60000, max: 100 },
  }),

  // Workflow & Automation
  buildRoute('/api/workflow', 'workflow', {
    timeout: 45000,
    rateLimit: { windowMs: 60000, max: 50 },
  }),

  // Employee Lifecycle
  buildRoute('/api/onboarding', 'onboarding', {
    rateLimit: { windowMs: 60000, max: 100 },
  }),
  buildRoute('/api/exit', 'exit', {
    rateLimit: { windowMs: 60000, max: 50 },
  }),

  // Learning & Development
  buildRoute('/api/lms', 'lms', {
    rateLimit: { windowMs: 60000, max: 100 },
  }),

  // Analytics & Reports
  buildRoute('/api/reports', 'reports', {
    timeout: 60000,
    rateLimit: { windowMs: 60000, max: 30 },
  }),

  // Calendar & Scheduling
  buildRoute('/api/calendar', 'calendar', {
    rateLimit: { windowMs: 60000, max: 100 },
  }),

  // SSO & Identity
  buildRoute('/api/sso', 'sso', {
    timeout: 20000,
    authRequired: false, // SSO endpoints handle their own auth
    rateLimit: { windowMs: 60000, max: 50 },
  }),

  // Payroll
  buildRoute('/api/payroll', 'payroll', {
    timeout: 45000,
    rateLimit: { windowMs: 60000, max: 50 },
  }),

  // Shift Management
  buildRoute('/api/shifts', 'shift', {
    rateLimit: { windowMs: 60000, max: 100 },
  }),

  // Compensation
  buildRoute('/api/compensation', 'compensation', {
    rateLimit: { windowMs: 60000, max: 50 },
  }),

  // Document Management
  buildRoute('/api/documents', 'document', {
    rateLimit: { windowMs: 60000, max: 100 },
  }),

  // Video Conferencing
  buildRoute('/api/video', 'video', {
    rateLimit: { windowMs: 60000, max: 100 },
  }),

  // CRM
  buildRoute('/api/crm', 'corpCrm', {
    rateLimit: { windowMs: 60000, max: 100 },
  }),

  // Corporate ID
  buildRoute('/api/corpid', 'corpId', {
    rateLimit: { windowMs: 60000, max: 100 },
  }),

  // Project Management
  buildRoute('/api/projects', 'projectos', {
    rateLimit: { windowMs: 60000, max: 100 },
  }),

  // Team Management
  buildRoute('/api/team', 'teamCollab', {
    rateLimit: { windowMs: 60000, max: 100 },
  }),
];

// Create a map for faster lookup
export const routeMap = new Map<string, RouteConfig>(
  routes.map((route) => [route.path, route])
);

/**
 * Find matching route for a given path
 */
export function findRoute(path: string): RouteConfig | undefined {
  // Exact match first
  if (routeMap.has(path)) {
    return routeMap.get(path);
  }

  // Prefix match for nested routes
  for (const [routePath, config] of routeMap) {
    if (path.startsWith(`${routePath}/`) || path.startsWith(`${routePath}?`)) {
      return config;
    }
  }

  return undefined;
}

// Routes that don't require authentication
export const publicRoutes = [
  '/health',
  '/api/health',
  '/api/sso/login',
  '/api/sso/callback',
  '/api/sso/verify',
];

// Check if route requires auth
export function requiresAuth(path: string): boolean {
  // Check public routes first
  for (const publicRoute of publicRoutes) {
    if (path === publicRoute || path.startsWith(`${publicRoute}/`)) {
      return false;
    }
  }

  // Check if route is configured and auth is required
  const route = findRoute(path);
  return route?.authRequired ?? true;
}
