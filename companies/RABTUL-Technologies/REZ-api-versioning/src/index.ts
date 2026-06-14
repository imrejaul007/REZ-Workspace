/**
 * REZ API Versioning Middleware
 *
 * A comprehensive API versioning solution for the REZ ecosystem.
 * Supports URL-based, header-based, and query-based versioning with
 * automatic deprecation handling and graceful version transitions.
 *
 * @example
 * ```typescript
 * import express from 'express';
import { tracingMiddleware } from './middleware/tracing';
 * import {
 *   createApiVersioningMiddleware,
 *   registerVersion,
 *   createVersionedRouter,
 *   createVersionManagementRoutes,
 * } from '@rez/api-versioning';
 *
 * const app = express();
 *
 * // Register versions
 * registerVersion({
 *   version: 'v1.0.0',
 *   isActive: true,
 *   breakingChanges: [],
 * });
 *
 * registerVersion({
 *   version: 'v2.0.0',
 *   isActive: true,
 *   deprecationDate: new Date('2025-06-01'),
 *   sunsetDate: new Date('2025-12-01'),
 *   breakingChanges: [
 *     { type: 'changed_response_schema', description: 'User object restructured' }
 *   ],
 * });
 *
 * // Add versioning middleware
 * app.use(createApiVersioningMiddleware({ defaultVersion: 'v1.0.0' }));
 *
 * // Create versioned routes
 * const v1 = createVersionedRouter('v1.0.0');
 * v1.get('/users', (req, res) => {
 *   res.json({ users: [] });
 * });
 *
 * const v2 = createVersionedRouter('v2.0.0');
 * v2.get('/users', (req, res) => {
 *   res.json({ data: [] });
 * });
 *
 * // Mount version management routes
 * const { registry, deprecationManager } = getServices();
 * app.use('/api', createVersionManagementRoutes(registry, deprecationManager));
 *
 * 

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-api-versioning',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(3000);
 * ```
 */

// Types
export type {
  ApiVersion,
  SemanticVersion,
  DeprecationLevel,
  DeprecationInfo,
  BreakingChangeType,
  BreakingChange,
  VersionConfig,
  RequestTransformation,
  ResponseTransformation,
  VersionedRequest,
  VersionedResponse,
  VersionMatch,
  VersionedRoute,
  RegisteredVersion,
  VersionRegistryState,
  ApiVersioningOptions,
  VersionListResponse,
  DeprecationListResponse,
} from './types/index.js';

// Custom Errors
export {
  VersioningError,
  VersionNotFoundError,
  VersionDeprecatedError,
  VERSION_HEADER_NAMES,
  VERSION_MIME_TYPES,
} from './types/index.js';

// Services
export {
  RouteRegistry,
  getRouteRegistry,
  resetRouteRegistry,
} from './services/routeRegistry.js';

export {
  DeprecationManager,
  getDeprecationManager,
  resetDeprecationManager,
} from './services/deprecationManager.js';

// Middleware
export {
  createApiVersioningMiddleware,
  createVersionManagementRoutes,
  createVersionedRouter,
  registerVersion,
  requireVersion,
  applyRequestTransformations,
  applyResponseTransformations,
  getVersionCompatibility,
} from './middleware/apiVersion.js';

// Re-export express types for convenience
export type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Get the core services for external use
 */
export function getServices(): {
  registry: InstanceType<typeof import('./services/routeRegistry.js').RouteRegistry>;
  deprecationManager: InstanceType<typeof import('./services/deprecationManager.js').DeprecationManager>;
} {
  return {
    registry: getRouteRegistry(),
    deprecationManager: getDeprecationManager(),
  };
}

/**
 * Default instance for quick setup
 */
import { getRouteRegistry } from './services/routeRegistry.js';
import { getDeprecationManager } from './services/deprecationManager.js';

/**
 * Initialize with default versions
 */
export function initializeDefaultVersions(): void {
  const registry = getRouteRegistry();
  const deprecationManager = getDeprecationManager();

  // Register default v1
  registry.registerVersion({
    version: 'v1.0.0',
    isActive: true,
    breakingChanges: [],
  });

  deprecationManager.registerDeprecation({
    version: 'v1.0.0',
    deprecationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    sunsetDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
    level: 'warning',
    message: 'Version v1.0.0 is the current stable version',
    breakingChanges: [],
  });
}
