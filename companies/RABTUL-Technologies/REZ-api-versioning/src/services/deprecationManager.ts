import logger from './utils/logger';

/**
 * Deprecation Manager Service
 * Handles deprecation warnings, sunset dates, and migration guidance
 */

import type {
  ApiVersion,
  DeprecationInfo,
  DeprecationLevel,
  BreakingChange,
  VersionConfig,
} from '../types/index.js';

interface DeprecationEntry extends DeprecationInfo {
  createdAt: Date;
  notifiedCount: number;
  lastNotifiedAt?: Date;
}

interface SunsettingVersion {
  version: ApiVersion;
  sunsetDate: Date;
  daysRemaining: number;
  notified: boolean;
}

/**
 * Calculate days remaining until a date
 */
function daysUntil(date: Date): number {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date for RFC 7231 (RFC 7231 §7.1.1.1)
 */
function formatHttpDate(date: Date): string {
  return date.toUTCString();
}

/**
 * Generate Link header value for deprecation
 */
function generateLinkHeader(
  version: ApiVersion,
  alternativeVersion?: ApiVersion,
  documentationUrl?: string
): string {
  const links: string[] = [];

  if (alternativeVersion) {
    links.push(`<${documentationUrl ?? `/api/v${alternativeVersion.replace('v', '')}`}>; rel="successor-version"; title="Suggested replacement version"`);
  }

  if (documentationUrl) {
    links.push(`<${documentationUrl}>; rel="deprecation"; type="text/html"`);
  }

  return links.join(', ');
}

/**
 * Deprecation Manager - manages deprecation lifecycle
 */
export class DeprecationManager {
  private deprecations: Map<ApiVersion, DeprecationEntry> = new Map();
  private listeners: Array<(info: DeprecationInfo) => void> = [];
  private webhookUrl?: string;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl;
  }

  /**
   * Set webhook URL for deprecation notifications
   */
  setWebhookUrl(url: string): void {
    this.webhookUrl = url;
  }

  /**
   * Register deprecation for a version
   */
  registerDeprecation(info: DeprecationInfo): void {
    const entry: DeprecationEntry = {
      ...info,
      createdAt: new Date(),
      notifiedCount: 0,
    };
    this.deprecations.set(info.version, entry);
  }

  /**
   * Register deprecation from version config
   */
  registerFromConfig(config: VersionConfig): void {
    if (config.deprecationDate || config.sunsetDate) {
      this.registerDeprecation({
        version: config.version,
        deprecationDate: config.deprecationDate ?? new Date(),
        sunsetDate: config.sunsetDate ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        level: this.calculateLevel(config),
        message: this.generateDeprecationMessage(config),
        alternativeVersion: this.findAlternativeVersion(config),
        breakingChanges: config.breakingChanges,
        migrationGuide: this.generateMigrationGuide(config),
      });
    }
  }

  /**
   * Get deprecation info for a version
   */
  getDeprecationInfo(version: ApiVersion): DeprecationInfo | undefined {
    const entry = this.deprecations.get(version);
    if (!entry) return undefined;

    // Check if sunset date has passed
    if (new Date() > entry.sunsetDate) {
      return {
        ...entry,
        level: 'sunset',
        message: `API version '${version}' has reached its sunset date and is no longer available.`,
      };
    }

    return entry;
  }

  /**
   * Check if a version is deprecated
   */
  isDeprecated(version: ApiVersion): boolean {
    const info = this.getDeprecationInfo(version);
    return info !== undefined && (info.level === 'deprecated' || info.level === 'sunset');
  }

  /**
   * Check if a version has reached sunset
   */
  isSunset(version: ApiVersion): boolean {
    const info = this.getDeprecationInfo(version);
    if (!info) return false;

    const isPastSunset = new Date() > info.sunsetDate;
    return isPastSunset || info.level === 'sunset';
  }

  /**
   * Get all active deprecations
   */
  getActiveDeprecations(): DeprecationInfo[] {
    const now = new Date();
    const active: DeprecationInfo[] = [];

    for (const [, entry] of this.deprecations) {
      if (entry.level === 'warning' || entry.level === 'deprecated') {
        if (now <= entry.sunsetDate) {
          active.push(entry);
        }
      }
    }

    return active.sort((a, b) => a.sunsetDate.getTime() - b.sunsetDate.getTime());
  }

  /**
   * Get versions with upcoming sunset dates
   */
  getUpcomingSunset(daysThreshold: number = 30): SunsettingVersion[] {
    const threshold = new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000);
    const upcoming: SunsettingVersion[] = [];

    for (const [version, entry] of this.deprecations) {
      if (entry.sunsetDate <= threshold && new Date() < entry.sunsetDate) {
        upcoming.push({
          version,
          sunsetDate: entry.sunsetDate,
          daysRemaining: daysUntil(entry.sunsetDate),
          notified: entry.notified,
        });
      }
    }

    return upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  /**
   * Generate deprecation headers for response
   */
  generateHeaders(version: ApiVersion): Record<string, string> {
    const info = this.getDeprecationInfo(version);
    const headers: Record<string, string> = {};

    if (!info) return headers;

    // RFC 7234 Deprecation header
    headers['Deprecation'] = formatHttpDate(info.deprecationDate);

    // RFC 8599 Sunset header
    headers['Sunset'] = formatHttpDate(info.sunsetDate);

    // Link header for migration
    const linkHeader = generateLinkHeader(
      version,
      info.alternativeVersion,
      info.migrationGuide
    );
    if (linkHeader) {
      headers['Link'] = linkHeader;
    }

    // Custom header for API version
    headers['X-API-Version'] = version;

    return headers;
  }

  /**
   * Generate deprecation warning body
   */
  generateWarningBody(version: ApiVersion): {
    type: string;
    title: string;
    detail: string;
    instance: string;
  } | null {
    const info = this.getDeprecationInfo(version);
    if (!info) return null;

    return {
      type: `https://rez.app/errors/api-deprecated`,
      title: `API Version ${version} Deprecated`,
      detail: info.message,
      instance: version,
    };
  }

  /**
   * Add listener for deprecation events
   */
  addListener(listener: (info: DeprecationInfo) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove listener
   */
  removeListener(listener: (info: DeprecationInfo) => void): boolean {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Record that a notification was sent
   */
  recordNotification(version: ApiVersion): void {
    const entry = this.deprecations.get(version);
    if (entry) {
      entry.notifiedCount++;
      entry.lastNotifiedAt = new Date();
    }
  }

  /**
   * Clear all deprecations (for testing)
   */
  clear(): void {
    this.deprecations.clear();
    this.listeners = [];
  }

  /**
   * Calculate deprecation level based on dates
   */
  private calculateLevel(config: VersionConfig): DeprecationLevel {
    const now = new Date();
    const sunsetThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (config.sunsetDate && config.sunsetDate <= sunsetThreshold) {
      return 'sunset';
    }
    if (config.deprecationDate && config.deprecationDate <= now) {
      return 'deprecated';
    }
    return 'warning';
  }

  /**
   * Generate deprecation message
   */
  private generateDeprecationMessage(config: VersionConfig): string {
    const message = `API version ${config.version} is deprecated`;

    if (config.sunsetDate) {
      const daysRemaining = daysUntil(config.sunsetDate);
      return `${message}. Sunset date: ${config.sunsetDate.toISOString().split('T')[0]} (${daysRemaining} days remaining)`;
    }

    return message;
  }

  /**
   * Find alternative version from breaking changes
   */
  private findAlternativeVersion(config: VersionConfig): ApiVersion | undefined {
    // Look for a successor version in breaking changes
    for (const change of config.breakingChanges) {
      if (change.type === 'removed_endpoint' && change.migrationGuide) {
        // Extract version from migration guide if present
        const versionMatch = change.migrationGuide.match(/v(\d+)/);
        if (versionMatch) {
          return `v${versionMatch[1]}`;
        }
      }
    }
    return undefined;
  }

  /**
   * Generate migration guide from breaking changes
   */
  private generateMigrationGuide(config: VersionConfig): string | undefined {
    if (config.breakingChanges.length === 0) {
      return undefined;
    }

    const guides = config.breakingChanges
      .filter(c => c.migrationGuide)
      .map(c => `- ${c.type}: ${c.migrationGuide}`)
      .join('\n');

    return guides ? `Migration guide:\n${guides}` : undefined;
  }

  /**
   * Notify listeners of deprecation
   */
  notifyListeners(info: DeprecationInfo): void {
    this.recordNotification(info.version);
    for (const listener of this.listeners) {
      try {
        listener(info);
      } catch (error) {
        logger.error(`Deprecation listener error: ${error}`);
      }
    }
  }
}

// Singleton instance
let globalManager: DeprecationManager | null = null;

/**
 * Get or create the global deprecation manager
 */
export function getDeprecationManager(webhookUrl?: string): DeprecationManager {
  if (!globalManager) {
    globalManager = new DeprecationManager(webhookUrl);
  }
  return globalManager;
}

/**
 * Reset the global deprecation manager
 */
export function resetDeprecationManager(): void {
  globalManager = null;
}
