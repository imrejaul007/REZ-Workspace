/**
 * API Versioning Middleware
 * Supports /api/v1, /api/v2 routes with deprecation warnings
 */

import { Request, Response, NextFunction } from 'express';

// Current active versions
export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
} as const;

export type ApiVersion = (typeof API_VERSIONS)[keyof typeof API_VERSIONS];

// Version deprecation schedule
export const VERSION_DEPRECATION = {
  v1: {
    deprecated: false,
    sunsetDate: '2027-06-01',
    removalDate: '2027-12-01',
    migrationGuide: '/docs/migration/v1-to-v2',
  },
  v2: {
    deprecated: false,
    sunsetDate: null,
    removalDate: null,
  },
} as const;

// Feature flags per version
export const VERSION_FEATURES = {
  v1: {
    basicOrders: true,
    basicPayments: true,
    legacyAuth: true,
    // v1 features
  },
  v2: {
    basicOrders: true,
    basicPayments: true,
    splitPayments: true,
    subscriptionPayments: true,
    realTimeWebhooks: true,
    enhancedAnalytics: true,
    graphQL: true,
    newAuth: true,
    // v2 features
  },
} as const;

interface VersionedRequest extends Request {
  apiVersion?: ApiVersion;
  versionFeatures?: typeof VERSION_FEATURES.v1 | typeof VERSION_FEATURES.v2;
}

/**
 * Extract API version from URL
 * Supports: /api/v1/..., /api/v2/..., ?version=v1
 */
function extractVersion(req: Request): ApiVersion {
  // Check URL path first: /api/v1/orders
  const pathMatch = req.path.match(/\/api\/(v\d+)\//);
  if (pathMatch) {
    return pathMatch[1] as ApiVersion;
  }

  // Check query param: ?version=v1
  if (req.query.version) {
    const version = req.query.version as string;
    if (Object.values(API_VERSIONS).includes(version as ApiVersion)) {
      return version as ApiVersion;
    }
  }

  // Check header: X-API-Version: v1
  const headerVersion = req.headers['x-api-version'] as string;
  if (headerVersion && Object.values(API_VERSIONS).includes(headerVersion as ApiVersion)) {
    return headerVersion as ApiVersion;
  }

  // Default to latest stable version
  return API_VERSIONS.V2;
}

/**
 * API Versioning Middleware
 */
export const apiVersioning = (req: VersionedRequest, res: Response, next: NextFunction) => {
  const version = extractVersion(req);
  req.apiVersion = version;
  req.versionFeatures = VERSION_FEATURES[version];

  // Add version headers
  res.setHeader('X-API-Version', version);
  res.setHeader('X-API-Version-Current', API_VERSIONS.V2);

  // Check if version is deprecated
  const deprecation = VERSION_DEPRECATION[version];
  if (deprecation?.deprecated) {
    res.setHeader('X-API-Deprecated', 'true');
    res.setHeader('X-API-Sunset-Date', deprecation.sunsetDate || '');
    res.setHeader('Deprecation', `true; rel="deprecation"; date="${deprecation.sunsetDate}"`);
  }

  // Log version access
  if (process.env.NODE_ENV !== 'production' || req.path.includes('/health')) {
    console.log(`[API] ${req.method} ${req.path} (version: ${version})`);
  }

  next();
};

/**
 * Require minimum version
 */
export const requireVersion = (minVersion: ApiVersion) => {
  return (req: VersionedRequest, res: Response, next: NextFunction) => {
    const currentVersion = req.apiVersion || extractVersion(req);
    const versions = Object.values(API_VERSIONS);
    const currentIndex = versions.indexOf(currentVersion);
    const minIndex = versions.indexOf(minVersion);

    if (currentIndex < minIndex) {
      return res.status(426).json({
        success: false,
        error: {
          code: 'UPGRADE_REQUIRED',
          message: `This endpoint requires API version ${minVersion} or higher`,
          currentVersion,
          minimumVersion: minVersion,
          upgradeGuide: VERSION_DEPRECATION[minVersion]?.migrationGuide || '/docs/migration',
        },
      });
    }

    next();
  };
};

/**
 * Check if feature is available in current version
 */
export const requireFeature = (feature: keyof typeof VERSION_FEATURES.v2) => {
  return (req: VersionedRequest, res: Response, next: NextFunction) => {
    const features = req.versionFeatures || VERSION_FEATURES.v2;

    if (!features[feature]) {
      return res.status(501).json({
        success: false,
        error: {
          code: 'FEATURE_UNAVAILABLE',
          message: `This feature is not available in your API version`,
          feature,
          currentVersion: req.apiVersion,
          minimumVersion: API_VERSIONS.V2,
          upgradeGuide: '/docs/migration',
        },
      });
    }

    next();
  };
};

/**
 * Version-specific route handler
 */
export const versionedHandler = (
  handlers: Partial<Record<ApiVersion, (req: Request, res: Response, next: NextFunction) => void>>
) => {
  return (req: VersionedRequest, res: Response, next: NextFunction) => {
    const version = req.apiVersion || API_VERSIONS.V2;
    const handler = handlers[version] || handlers[API_VERSIONS.V2];

    if (handler) {
      return handler(req, res, next);
    }

    next();
  };
};

/**
 * Get available versions for an endpoint
 */
export const getAvailableVersions = (endpoint: string): string[] => {
  // In a real app, this would check route definitions
  return Object.values(API_VERSIONS);
};

/**
 * Format deprecation warning response
 */
export const formatDeprecationWarning = (version: ApiVersion) => ({
  warning: `API version ${version} is deprecated`,
  sunsetDate: VERSION_DEPRECATION[version]?.sunsetDate,
  removalDate: VERSION_DEPRECATION[version]?.removalDate,
  migrationGuide: VERSION_DEPRECATION[version]?.migrationGuide,
  recommendation: `Please upgrade to ${API_VERSIONS.V2}`,
});

export default apiVersioning;
