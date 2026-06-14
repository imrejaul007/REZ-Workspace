/**
 * Route Registry Service
 * Manages registration and lookup of versioned routes
 */

import type {
  ApiVersion,
  VersionConfig,
  VersionedRoute,
  RegisteredVersion,
  VersionRegistryState,
  BreakingChange,
  SemanticVersion,
} from '../types/index.js';
import { AppError, NotFoundError, ConflictError, BusinessRuleError } from '../../../../shared/rez-errors/src';

/**
 * Parse semantic version string
 */
function parseSemanticVersion(version: ApiVersion): SemanticVersion | null {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?$/);
  if (!match) {
    return null;
  }
  return {
    major: parseInt(match[1]!, 10),
    minor: parseInt(match[2]!, 10),
    patch: parseInt(match[3]!, 10),
    prerelease: match[4] ? [match[4]] : undefined,
  };
}

/**
 * Compare two semantic versions
 * Returns negative if a < b, 0 if a === b, positive if a > b
 */
function compareVersions(a: ApiVersion, b: ApiVersion): number {
  const parsedA = parseSemanticVersion(a);
  const parsedB = parseSemanticVersion(b);

  if (!parsedA || !parsedB) {
    return a.localeCompare(b);
  }

  if (parsedA.major !== parsedB.major) {
    return parsedA.major - parsedB.major;
  }
  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor - parsedB.minor;
  }
  if (parsedA.patch !== parsedB.patch) {
    return parsedA.patch - parsedB.patch;
  }

  // Prerelease versions come before stable versions
  if (parsedA.prerelease && !parsedB.prerelease) return -1;
  if (!parsedA.prerelease && parsedB.prerelease) return 1;
  if (parsedA.prerelease && parsedB.prerelease) {
    return parsedA.prerelease[0]!.localeCompare(parsedB.prerelease[0]!);
  }

  return 0;
}

/**
 * Route Registry - manages all versioned routes
 */
export class RouteRegistry {
  private versions: Map<ApiVersion, RegisteredVersion> = new Map();
  private defaultVersion: ApiVersion;
  private latestVersion: ApiVersion | null = null;
  private globalMiddleware: Array<(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void> = [];

  constructor(defaultVersion: ApiVersion = 'v1.0.0') {
    this.defaultVersion = defaultVersion;
  }

  /**
   * Register a new API version
   */
  registerVersion(config: VersionConfig): void {
    if (this.versions.has(config.version)) {
      throw new ConflictError(`Version ${config.version} is already registered`, 'VERSION_ALREADY_REGISTERED');
    }

    const registeredVersion: RegisteredVersion = {
      config,
      routes: new Map(),
      registeredAt: new Date(),
    };

    this.versions.set(config.version, registeredVersion);
    this.updateLatestVersion(config.version);
  }

  /**
   * Update an existing version configuration
   */
  updateVersion(version: ApiVersion, config: Partial<VersionConfig>): boolean {
    const existing = this.versions.get(version);
    if (!existing) {
      return false;
    }

    existing.config = { ...existing.config, ...config, version };
    this.updateLatestVersion(version);
    return true;
  }

  /**
   * Remove a version from the registry
   */
  unregisterVersion(version: ApiVersion): boolean {
    if (version === this.defaultVersion) {
      throw new BusinessRuleError(`Cannot unregister the default version ${version}`, 'CANNOT_UNREGISTER_DEFAULT_VERSION');
    }
    return this.versions.delete(version);
  }

  /**
   * Get version configuration
   */
  getVersionConfig(version: ApiVersion): VersionConfig | undefined {
    return this.versions.get(version)?.config;
  }

  /**
   * Get all registered versions
   */
  getVersions(): ApiVersion[] {
    return Array.from(this.versions.keys()).sort(compareVersions);
  }

  /**
   * Get supported (active) versions
   */
  getSupportedVersions(): ApiVersion[] {
    return this.getVersions().filter(v => {
      const config = this.versions.get(v)?.config;
      return config?.isActive !== false;
    });
  }

  /**
   * Get the latest registered version
   */
  getLatestVersion(): ApiVersion {
    return this.latestVersion ?? this.defaultVersion;
  }

  /**
   * Get the default version
   */
  getDefaultVersion(): ApiVersion {
    return this.defaultVersion;
  }

  /**
   * Set the default version
   */
  setDefaultVersion(version: ApiVersion): boolean {
    if (!this.versions.has(version)) {
      throw new NotFoundError(`Version ${version} is not registered`, 'VERSION_NOT_FOUND');
    }
    this.defaultVersion = version;
    return true;
  }

  /**
   * Register a route for a specific version
   */
  registerRoute(
    method: string,
    path: string,
    version: ApiVersion,
    handler: import('express').RequestHandler,
    middleware?: import('express').RequestHandler[]
  ): void {
    const registeredVersion = this.versions.get(version);
    if (!registeredVersion) {
      throw new NotFoundError(`Version ${version} is not registered`, 'VERSION_NOT_FOUND');
    }

    const routeKey = this.createRouteKey(method, path);
    const route: VersionedRoute = {
      method: method.toUpperCase(),
      path,
      version,
      handler,
      middleware,
    };

    const existingRoutes = registeredVersion.routes.get(routeKey) ?? [];
    existingRoutes.push(route);
    registeredVersion.routes.set(routeKey, existingRoutes);
  }

  /**
   * Find matching routes for a given method and path
   */
  findRoutes(
    method: string,
    path: string,
    version?: ApiVersion
  ): VersionedRoute[] {
    const routeKey = this.createRouteKey(method.toUpperCase(), path);

    if (version) {
      const registeredVersion = this.versions.get(version);
      if (!registeredVersion) {
        return [];
      }
      return registeredVersion.routes.get(routeKey) ?? [];
    }

    // Search across all versions
    const allRoutes: VersionedRoute[] = [];
    for (const [, registeredVersion] of this.versions) {
      const routes = registeredVersion.routes.get(routeKey) ?? [];
      allRoutes.push(...routes);
    }

    return allRoutes;
  }

  /**
   * Check if a version is registered
   */
  hasVersion(version: ApiVersion): boolean {
    return this.versions.has(version);
  }

  /**
   * Check if a version is active
   */
  isVersionActive(version: ApiVersion): boolean {
    const config = this.versions.get(version)?.config;
    return config?.isActive ?? false;
  }

  /**
   * Get breaking changes for a version
   */
  getBreakingChanges(version: ApiVersion): BreakingChange[] {
    return this.versions.get(version)?.config.breakingChanges ?? [];
  }

  /**
   * Add global middleware that runs for all versions
   */
  addGlobalMiddleware(middleware: (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void): void {
    this.globalMiddleware.push(middleware);
  }

  /**
   * Get global middleware
   */
  getGlobalMiddleware(): Array<(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void> {
    return [...this.globalMiddleware];
  }

  /**
   * Get registry state for debugging/inspection
   */
  getState(): VersionRegistryState {
    return {
      versions: new Map(this.versions),
      defaultVersion: this.defaultVersion,
      latestVersion: this.latestVersion ?? this.defaultVersion,
      supportedVersions: this.getSupportedVersions(),
    };
  }

  /**
   * Create a route key from method and path
   */
  private createRouteKey(method: string, path: string): string {
    return `${method.toUpperCase()}:${path}`;
  }

  /**
   * Update the latest version tracking
   */
  private updateLatestVersion(version: ApiVersion): void {
    if (!this.latestVersion || compareVersions(version, this.latestVersion) > 0) {
      this.latestVersion = version;
    }
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.versions.clear();
    this.latestVersion = null;
    this.globalMiddleware = [];
  }
}

// Singleton instance for convenience
let globalRegistry: RouteRegistry | null = null;

/**
 * Get or create the global route registry
 */
export function getRouteRegistry(defaultVersion?: ApiVersion): RouteRegistry {
  if (!globalRegistry) {
    globalRegistry = new RouteRegistry(defaultVersion ?? 'v1.0.0');
  }
  return globalRegistry;
}

/**
 * Reset the global route registry (useful for testing)
 */
export function resetRouteRegistry(): void {
  globalRegistry = null;
}
