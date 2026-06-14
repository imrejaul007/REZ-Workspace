/**
 * API Versioning Types for REZ Ecosystem
 * Defines all type definitions for the versioning middleware
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Supported API version format
 */
export type ApiVersion = string;

/**
 * Semantic version components
 */
export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string[];
}

/**
 * Deprecation status levels
 */
export type DeprecationLevel = 'warning' | 'deprecated' | ' sunset';

/**
 * Deprecation information for a version or route
 */
export interface DeprecationInfo {
  version: ApiVersion;
  sunsetDate: Date;
  deprecationDate: Date;
  level: DeprecationLevel;
  message: string;
  migrationGuide?: string;
  alternativeVersion?: ApiVersion;
  breakingChanges: string[];
}

/**
 * Breaking change types
 */
export type BreakingChangeType =
  | 'removed_endpoint'
  | 'changed_response_schema'
  | 'changed_request_schema'
  | 'changed_behavior'
  | 'removed_parameter'
  | 'changed_parameter_type'
  | 'changed_authentication'
  | 'rate_limit_change';

/**
 * Breaking change definition
 */
export interface BreakingChange {
  type: BreakingChangeType;
  description: string;
  migrationGuide?: string;
  affectedEndpoints?: string[];
}

/**
 * Version configuration
 */
export interface VersionConfig {
  version: ApiVersion;
  isActive: boolean;
  sunsetDate?: Date;
  deprecationDate?: Date;
  breakingChanges: BreakingChange[];
  customHeaders?: Record<string, string>;
  transformations?: {
    request?: RequestTransformation[];
    response?: ResponseTransformation[];
  };
}

/**
 * Request transformation for version migration
 */
export interface RequestTransformation {
  pathPattern: RegExp;
  transform: (req: VersionedRequest) => VersionedRequest;
}

/**
 * Response transformation for version migration
 */
export interface ResponseTransformation {
  pathPattern: RegExp;
  transform: (res: unknown, version: ApiVersion) => unknown;
}

/**
 * Extended Express Request with version info
 */
export interface VersionedRequest extends Request {
  apiVersion?: ApiVersion;
  requestedVersion?: ApiVersion;
  resolvedVersion?: ApiVersion;
  isDeprecated?: boolean;
  deprecationInfo?: DeprecationInfo;
  versionTransition?: {
    from: ApiVersion;
    to: ApiVersion;
    appliedTransformations: string[];
  };
}

/**
 * Extended Express Response with version headers
 */
export interface VersionedResponse extends Response {
  apiVersion?: ApiVersion;
  setVersionHeaders?: (version: ApiVersion) => void;
}

/**
 * Version match result
 */
export interface VersionMatch {
  matched: boolean;
  version?: ApiVersion;
  confidence: number;
  source: 'url' | 'header' | 'default';
}

/**
 * Version route handler
 */
export interface VersionedRoute {
  method: string;
  path: string;
  version: ApiVersion;
  handler: RequestHandler;
  middleware?: RequestHandler[];
}

/**
 * Registered version with its handlers
 */
export interface RegisteredVersion {
  config: VersionConfig;
  routes: Map<string, VersionedRoute[]>;
  registeredAt: Date;
}

/**
 * Version registry state
 */
export interface VersionRegistryState {
  versions: Map<ApiVersion, RegisteredVersion>;
  defaultVersion: ApiVersion;
  latestVersion: ApiVersion;
  supportedVersions: ApiVersion[];
}

/**
 * Versioning middleware options
 */
export interface ApiVersioningOptions {
  defaultVersion: ApiVersion;
  headerName?: string;
  urlPrefix?: string;
  validateVersions?: boolean;
  includeDeprecationHeaders?: boolean;
  sunsetHeaderName?: string;
  deprecationHeaderName?: string;
  linkHeaderTemplate?: string;
  allowMultipleVersions?: boolean;
  fallbackVersion?: ApiVersion;
  onVersionNotFound?: (req: VersionedRequest, res: VersionedResponse, version: ApiVersion) => void;
  onVersionDeprecated?: (req: VersionedRequest, res: VersionedResponse, info: DeprecationInfo) => void;
  onBreakingChange?: (req: VersionedRequest, res: VersionedResponse, changes: BreakingChange[]) => void;
}

/**
 * Version list response
 */
export interface VersionListResponse {
  defaultVersion: ApiVersion;
  latestVersion: ApiVersion;
  supportedVersions: ApiVersion[];
  versions: Array<{
    version: ApiVersion;
    status: 'current' | 'supported' | 'deprecated' | 'sunset';
    sunsetDate?: string;
    deprecationDate?: string;
    breakingChangesCount: number;
  }>;
}

/**
 * Deprecation list response
 */
export interface DeprecationListResponse {
  activeDeprecations: DeprecationInfo[];
  upcomingSunset: Array<{
    version: ApiVersion;
    sunsetDate: string;
    daysRemaining: number;
  }>;
}

/**
 * Header constants for versioning
 */
export const VERSION_HEADER_NAMES = {
  ACCEPT: 'Accept',
  API_VERSION: 'X-API-Version',
  DEPRECATION: 'Deprecation',
  SUNSET: 'Sunset',
  LINK: 'Link',
  PENDING_UPDATE: 'X-API-Pending-Update',
} as const;

/**
 * MIME type for versioned API responses
 */
export const VERSION_MIME_TYPES = {
  V1: 'application/vnd.rez.v1+json',
  V2: 'application/vnd.rez.v2+json',
  V3: 'application/vnd.rez.v3+json',
} as const;

/**
 * Custom errors for versioning
 */
export class VersioningError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'VersioningError';
  }
}

export class VersionNotFoundError extends VersioningError {
  constructor(version: ApiVersion) {
    super(
      `API version '${version}' is not supported`,
      'VERSION_NOT_FOUND',
      404
    );
  }
}

export class VersionDeprecatedError extends VersioningError {
  constructor(version: ApiVersion, sunsetDate: Date) {
    super(
      `API version '${version}' is deprecated and will sunset on ${sunsetDate.toISOString()}`,
      'VERSION_DEPRECATED',
      410
    );
  }
}

/**
 * Express augmentation for custom properties
 */
declare global {
  namespace Express {
    interface Request {
      apiVersion?: ApiVersion;
      requestedVersion?: ApiVersion;
      resolvedVersion?: ApiVersion;
      isDeprecated?: boolean;
      deprecationInfo?: DeprecationInfo;
      versionTransition?: {
        from: ApiVersion;
        to: ApiVersion;
        appliedTransformations: string[];
      };
    }
  }
}
