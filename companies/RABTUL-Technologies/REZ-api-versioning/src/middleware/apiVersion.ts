/**
 * API Versioning Middleware
 * Main middleware for handling API versioning in Express
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type {
  ApiVersion,
  ApiVersioningOptions,
  VersionMatch,
  VersionedRequest,
  VersionedResponse,
  VersionListResponse,
  DeprecationListResponse,
  DeprecationInfo,
  BreakingChange,
  VersionConfig,
  VersionedRoute,
} from '../types/index.js';
import { RouteRegistry, getRouteRegistry } from '../services/routeRegistry.js';
import { DeprecationManager, getDeprecationManager } from '../services/deprecationManager.js';
import {
  VERSION_HEADER_NAMES,
  VersionNotFoundError,
  VersionDeprecatedError,
} from '../types/index.js';

/**
 * Default middleware options
 */
const DEFAULT_OPTIONS: Required<ApiVersioningOptions> = {
  defaultVersion: 'v1.0.0',
  headerName: 'X-API-Version',
  urlPrefix: '/api/v',
  validateVersions: true,
  includeDeprecationHeaders: true,
  sunsetHeaderName: 'Sunset',
  deprecationHeaderName: 'Deprecation',
  linkHeaderTemplate: '</api/v{version}>; rel="successor-version"',
  allowMultipleVersions: false,
  fallbackVersion: 'v1.0.0',
  onVersionNotFound: undefined as unknown as (req: VersionedRequest, res: VersionedResponse, version: ApiVersion) => void,
  onVersionDeprecated: undefined as unknown as (req: VersionedRequest, res: VersionedResponse, info: DeprecationInfo) => void,
  onBreakingChange: undefined as unknown as (req: VersionedRequest, res: VersionedResponse, changes: BreakingChange[]) => void,
};

/**
 * Parse version from URL path
 */
function parseVersionFromUrl(path: string, urlPrefix: string): ApiVersion | null {
  const match = path.match(new RegExp(`^${urlPrefix.replace('/', '\\/')}(\\d+\\.\\d+\\.\\d+)`));
  return match ? `v${match[1]}` : null;
}

/**
 * Parse version from Accept header
 */
function parseVersionFromHeader(header: string | undefined): ApiVersion | null {
  if (!header) return null;

  // Match: application/vnd.rez.v1+json, application/vnd.rez.v2+json, etc.
  const match = header.match(/application\/vnd\.rez\.v(\d+\.\d+\.\d+)\+json/);
  return match ? `v${match[1]}` : null;
}

/**
 * Parse version from custom header
 */
function parseVersionFromCustomHeader(header: string | undefined): ApiVersion | null {
  if (!header) return null;
  // Support v1, v1.0, v1.0.0 formats
  const match = header.match(/^v?(\d+\.\d+\.\d+)$/);
  return match ? `v${match[1]}` : null;
}

/**
 * Compare versions to check if requested is newer than minimum
 */
function isVersionAtLeast(requested: ApiVersion, minimum: ApiVersion): boolean {
  const requestedParts = requested.replace('v', '').split('.').map(Number);
  const minimumParts = minimum.replace('v', '').split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const req = requestedParts[i] ?? 0;
    const min = minimumParts[i] ?? 0;
    if (req > min) return true;
    if (req < min) return false;
  }
  return true;
}

/**
 * API Versioning Middleware Factory
 */
export function createApiVersioningMiddleware(options: ApiVersioningOptions = {}): RequestHandler[] {
  const opts: Required<ApiVersioningOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const registry = getRouteRegistry(opts.defaultVersion);
  const deprecationManager = getDeprecationManager();

  // Initialize deprecation manager with registered versions
  for (const version of registry.getVersions()) {
    const config = registry.getVersionConfig(version);
    if (config) {
      deprecationManager.registerFromConfig(config);
    }
  }

  /**
   * Main versioning middleware
   */
  const versionMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const versionedReq = req as VersionedRequest;
    const versionedRes = res as VersionedResponse;

    // Try to extract version from multiple sources
    const versionMatch = extractVersion(req, opts);

    if (!versionMatch.matched) {
      // No version specified, use default
      versionedReq.requestedVersion = opts.defaultVersion;
      versionedReq.apiVersion = opts.defaultVersion;
      versionedReq.resolvedVersion = opts.defaultVersion;
    } else {
      versionedReq.requestedVersion = versionMatch.version;
      versionedReq.apiVersion = versionMatch.version;
      versionedReq.resolvedVersion = versionMatch.version;
    }

    const resolvedVersion = versionedReq.resolvedVersion!;

    // Check if version exists
    if (opts.validateVersions && !registry.hasVersion(resolvedVersion)) {
      const error = new VersionNotFoundError(resolvedVersion);
      versionedRes.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        supportedVersions: registry.getSupportedVersions(),
      });
      return;
    }

    // Check deprecation status
    const deprecationInfo = deprecationManager.getDeprecationInfo(resolvedVersion);
    if (deprecationInfo) {
      versionedReq.isDeprecated = true;
      versionedReq.deprecationInfo = deprecationInfo;

      // Call deprecation callback if provided
      if (opts.onVersionDeprecated) {
        opts.onVersionDeprecated(versionedReq, versionedRes, deprecationInfo);
      }

      // Check if sunset
      if (deprecationManager.isSunset(resolvedVersion)) {
        const sunsetError = new VersionDeprecatedError(resolvedVersion, deprecationInfo.sunsetDate);
        versionedRes.status(sunsetError.statusCode).json({
          error: sunsetError.code,
          message: sunsetError.message,
          sunsetDate: deprecationInfo.sunsetDate.toISOString(),
          alternativeVersion: deprecationInfo.alternativeVersion,
        });
        return;
      }

      // Add deprecation headers
      if (opts.includeDeprecationHeaders) {
        const headers = deprecationManager.generateHeaders(resolvedVersion);
        for (const [key, value] of Object.entries(headers)) {
          versionedRes.setHeader(key, value);
        }
      }
    }

    // Check for breaking changes
    const breakingChanges = registry.getBreakingChanges(resolvedVersion);
    if (breakingChanges.length > 0 && opts.onBreakingChange) {
      opts.onBreakingChange(versionedReq, versionedRes, breakingChanges);
    }

    // Set version on response
    versionedRes.apiVersion = resolvedVersion;

    // Add helper to set version headers
    versionedRes.setVersionHeaders = (version: ApiVersion) => {
      const headers = deprecationManager.generateHeaders(version);
      for (const [key, value] of Object.entries(headers)) {
        versionedRes.setHeader(key, value);
      }
      versionedRes.setHeader('X-API-Version', version);
    };

    next();
  };

  /**
   * Route handler middleware
   * Extracts version from URL and routes to correct handler
   */
  const routeMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const versionedReq = req as VersionedRequest;
    const versionedRes = res as VersionedResponse;

    // Extract version from URL if present
    const urlVersion = parseVersionFromUrl(req.path, opts.urlPrefix);
    if (urlVersion) {
      versionedReq.apiVersion = urlVersion;
      versionedReq.resolvedVersion = urlVersion;
    }

    // Find matching routes
    const routes = registry.findRoutes(
      req.method,
      req.path,
      versionedReq.apiVersion
    );

    if (routes.length === 0) {
      // No route found for this version
      if (versionedReq.apiVersion && versionedReq.apiVersion !== registry.getDefaultVersion()) {
        // Try default version
        const defaultRoutes = registry.findRoutes(
          req.method,
          req.path,
          registry.getDefaultVersion()
        );

        if (defaultRoutes.length > 0) {
          // Found in default version - apply transformations and forward
          const route = defaultRoutes[0]!;
          versionedReq.versionTransition = {
            from: versionedReq.apiVersion!,
            to: route.version,
            appliedTransformations: [],
          };
          versionedReq.resolvedVersion = route.version;
        }
      }
    }

    next();
  };

  /**
   * Extract version from request using multiple strategies
   */
  function extractVersion(req: Request, options: Required<ApiVersioningOptions>): VersionMatch {
    // 1. Check URL path
    const urlVersion = parseVersionFromUrl(req.path, options.urlPrefix);
    if (urlVersion && registry.hasVersion(urlVersion)) {
      return { matched: true, version: urlVersion, confidence: 100, source: 'url' };
    }

    // 2. Check Accept header
    const acceptHeader = req.headers[VERSION_HEADER_NAMES.ACCEPT.toLowerCase()];
    const headerVersion = parseVersionFromHeader(
      Array.isArray(acceptHeader) ? acceptHeader[0] : acceptHeader
    );
    if (headerVersion && registry.hasVersion(headerVersion)) {
      return { matched: true, version: headerVersion, confidence: 95, source: 'header' };
    }

    // 3. Check custom header
    const customHeader = req.headers[options.headerName.toLowerCase()];
    const customVersion = parseVersionFromCustomHeader(
      Array.isArray(customHeader) ? customHeader[0] : customHeader
    );
    if (customVersion && registry.hasVersion(customVersion)) {
      return { matched: true, version: customVersion, confidence: 90, source: 'header' };
    }

    // 4. Check query parameter
    const queryVersion = parseVersionFromCustomHeader(req.query.api_version as string);
    if (queryVersion && registry.hasVersion(queryVersion)) {
      return { matched: true, version: queryVersion, confidence: 85, source: 'url' };
    }

    // 5. No version specified - use default
    if (registry.hasVersion(options.defaultVersion)) {
      return { matched: false, version: options.defaultVersion, confidence: 0, source: 'default' };
    }

    return { matched: false, confidence: 0, source: 'default' };
  }

  return [versionMiddleware, routeMiddleware];
}

/**
 * Create routes for version management endpoints
 */
export function createVersionManagementRoutes(
  registry: RouteRegistry,
  deprecationManager: DeprecationManager
): { method: string; path: string; handler: RequestHandler }[] {
  return [
    {
      method: 'GET',
      path: '/versions',
      handler: ((req: Request, res: Response) => {
        const versions = registry.getVersions();
        const response: VersionListResponse = {
          defaultVersion: registry.getDefaultVersion(),
          latestVersion: registry.getLatestVersion(),
          supportedVersions: registry.getSupportedVersions(),
          versions: versions.map(v => {
            const config = registry.getVersionConfig(v);
            const deprecation = deprecationManager.getDeprecationInfo(v);

            let status: 'current' | 'supported' | 'deprecated' | 'sunset' = 'supported';
            if (v === registry.getLatestVersion()) status = 'current';
            else if (deprecation) {
              status = deprecationManager.isSunset(v) ? 'sunset' : 'deprecated';
            }

            return {
              version: v,
              status,
              sunsetDate: deprecation?.sunsetDate.toISOString(),
              deprecationDate: deprecation?.deprecationDate.toISOString(),
              breakingChangesCount: config?.breakingChanges.length ?? 0,
            };
          }),
        };

        res.json(response);
      }) as RequestHandler,
    },
    {
      method: 'GET',
      path: '/deprecations',
      handler: ((req: Request, res: Response) => {
        const days = parseInt(req.query.days as string ?? '30', 10);
        const upcomingSunset = deprecationManager.getUpcomingSunset(days);

        const response: DeprecationListResponse = {
          activeDeprecations: deprecationManager.getActiveDeprecations(),
          upcomingSunset: upcomingSunset.map(s => ({
            version: s.version,
            sunsetDate: s.sunsetDate.toISOString(),
            daysRemaining: s.daysRemaining,
          })),
        };

        res.json(response);
      }) as RequestHandler,
    },
  ];
}

/**
 * Helper to create versioned route handlers
 */
export function createVersionedRouter(
  version: ApiVersion,
  options: ApiVersioningOptions = {}
): {
  get: (path: string, ...handlers: RequestHandler[]) => void;
  post: (path: string, ...handlers: RequestHandler[]) => void;
  put: (path: string, ...handlers: RequestHandler[]) => void;
  patch: (path: string, ...handlers: RequestHandler[]) => void;
  delete: (path: string, ...handlers: RequestHandler[]) => void;
  options: (path: string, ...handlers: RequestHandler[]) => void;
  head: (path: string, ...handlers: RequestHandler[]) => void;
} {
  const registry = getRouteRegistry(options.defaultVersion);

  const createMethodHandler = (method: string) => {
    return (path: string, ...handlers: RequestHandler[]) => {
      const [handler, ...middleware] = handlers;
      if (handler) {
        registry.registerRoute(method, path, version, handler, middleware);
      }
    };
  };

  return {
    get: createMethodHandler('GET'),
    post: createMethodHandler('POST'),
    put: createMethodHandler('PUT'),
    patch: createMethodHandler('PATCH'),
    delete: createMethodHandler('DELETE'),
    options: createMethodHandler('OPTIONS'),
    head: createMethodHandler('HEAD'),
  };
}

/**
 * Register a new API version
 */
export function registerVersion(config: VersionConfig): void {
  const registry = getRouteRegistry();
  registry.registerVersion(config);

  const deprecationManager = getDeprecationManager();
  deprecationManager.registerFromConfig(config);
}

/**
 * Convenience middleware for requiring minimum version
 */
export function requireVersion(minimumVersion: ApiVersion): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const versionedReq = req as VersionedRequest;

    if (!versionedReq.apiVersion) {
      res.status(400).json({
        error: 'VERSION_REQUIRED',
        message: 'API version must be specified via URL path, Accept header, or X-API-Version header',
      });
      return;
    }

    if (!isVersionAtLeast(versionedReq.apiVersion, minimumVersion)) {
      res.status(426).json({
        error: 'VERSION_UPGRADE_REQUIRED',
        message: `This endpoint requires API version ${minimumVersion} or higher. Current version: ${versionedReq.apiVersion}`,
        minimumVersion,
        currentVersion: versionedReq.apiVersion,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to apply request transformations
 */
export function applyRequestTransformations(
  transformations: Array<(req: VersionedRequest) => VersionedRequest>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const versionedReq = req as VersionedRequest;

    for (const transform of transformations) {
      transform(versionedReq);
    }

    next();
  };
}

/**
 * Middleware to apply response transformations
 */
export function applyResponseTransformations(
  transformations: Array<(data: unknown, version: ApiVersion) => unknown>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const versionedReq = req as VersionedRequest;
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
      if (versionedReq.apiVersion) {
        for (const transform of transformations) {
          body = transform(body, versionedReq.apiVersion);
        }
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Get version compatibility info
 */
export function getVersionCompatibility(
  fromVersion: ApiVersion,
  toVersion: ApiVersion
): {
  isCompatible: boolean;
  breakingChanges: BreakingChange[];
  requiresMigration: boolean;
  migrationSteps: string[];
} {
  const registry = getRouteRegistry();
  const breakingChanges = registry.getBreakingChanges(toVersion);

  const isCompatible = breakingChanges.length === 0;
  const migrationSteps = breakingChanges
    .filter(c => c.migrationGuide)
    .map(c => c.migrationGuide!);

  return {
    isCompatible,
    breakingChanges,
    requiresMigration: !isCompatible,
    migrationSteps,
  };
}
