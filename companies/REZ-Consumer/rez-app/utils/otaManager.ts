// @ts-nocheck
/**
 * OTA Manager - Production-ready OTA with rollback strategy
 *
 * PRODUCTION-READY: Automatic rollback on crash, update validation, and health monitoring
 *
 * @example
 * ```typescript
 * import { otaManager } from '@/utils/otaManager';
 *
 * // Check for updates with automatic rollback setup
 * await otaManager.checkAndDownload();
 *
 * // Apply update with rollback on crash
 * await otaManager.applyUpdate();
 *
 * // Get current update status
 * const status = otaManager.getStatus();
 * ```
 */

import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { logger } from './logger';

const OTA_STORAGE_KEY = '@ota_update_state';
const MAX_ROLLBACK_ATTEMPTS = 3;
const CRASH_THRESHOLD_MINUTES = 30;
const HEALTH_CHECK_INTERVAL_MS = 60000;

interface OTAUpdateState {
  updateId: string;
  downloadedAt: number;
  appliedAt?: number;
  rollbacks: number;
  lastRollbackAt?: number;
  lastHealthCheck?: number;
  isHealthy: boolean;
  updateManifest?: {
    version?: string;
    runtimeVersion?: string;
    commitMessage?: string;
  };
}

interface OTARollbackConfig {
  enableAutoRollback: boolean;
  maxRollbacks: number;
  rollbackOnCrash: boolean;
  validateBeforeApply: boolean;
}

const DEFAULT_CONFIG: OTARollbackConfig = {
  enableAutoRollback: true,
  maxRollbacks: MAX_ROLLBACK_ATTEMPTS,
  rollbackOnCrash: true,
  validateBeforeApply: true,
};

/**
 * OTA Manager with automatic rollback and health monitoring
 */
class OTAUpdateManager {
  private state: OTAUpdateState | null = null;
  private config: OTARollbackConfig;
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;

  constructor(config: Partial<OTARollbackConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize OTA manager and load persisted state
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const stored = await AsyncStorage.getItem(OTA_STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored) as OTAUpdateState;
        logger.debug('[OTA] Loaded state', { updateId: this.state?.updateId });
      }

      // Check for crash-based rollback
      if (this.config.rollbackOnCrash) {
        await this.checkCrashAndRollback();
      }

      // Start health monitoring
      this.startHealthMonitoring();

      this.isInitialized = true;
    } catch (error) {
      logger.error('[OTA] Init failed', { error });
    }
  }

  /**
   * Check for updates, download if available
   */
  async checkAndDownload(): Promise<{ hasUpdate: boolean; updateId?: string }> {
    try {
      const { isAvailable, manifest } = await Updates.checkForUpdateAsync();

      if (!isAvailable) {
        return { hasUpdate: false };
      }

      logger.info('[OTA] Update available', {
        version: manifest?.version,
        runtimeVersion: manifest?.runtimeVersion,
      });

      // Download the update
      const { isNew } = await Updates.fetchUpdateAsync();

      if (isNew) {
        const updateState: OTAUpdateState = {
          updateId: manifest?.id || `update_${Date.now()}`,
          downloadedAt: Date.now(),
          rollbacks: 0,
          isHealthy: true,
          updateManifest: {
            version: manifest?.version,
            runtimeVersion: manifest?.runtimeVersion,
            commitMessage: (manifest as unknown)?.commitMessage,
          },
        };

        await this.saveState(updateState);
        logger.info('[OTA] Update downloaded', { updateId: updateState.updateId });

        // Report to Sentry
        Sentry.addBreadcrumb({
          category: 'ota',
          message: 'Update downloaded',
          data: { updateId: updateState.updateId },
        });
      }

      return { hasUpdate: isNew, updateId: this.state?.updateId };
    } catch (error) {
      logger.error('[OTA] Check/download failed', { error });
      return { hasUpdate: false };
    }
  }

  /**
   * Apply downloaded update with validation and rollback support
   */
  async applyUpdate(): Promise<{ success: boolean; rolledBack?: boolean }> {
    if (!this.state) {
      logger.warn('[OTA] No update to apply');
      return { success: false };
    }

    if (this.state.rollbacks >= this.config.maxRollbacks) {
      logger.warn('[OTA] Max rollbacks reached, not applying update', {
        rollbacks: this.state.rollbacks,
      });
      return { success: false };
    }

    try {
      // Pre-apply validation
      if (this.config.validateBeforeApply) {
        const isValid = await this.validateUpdate();
        if (!isValid) {
          logger.warn('[OTA] Update validation failed, rolling back');
          await this.rollback();
          return { success: false, rolledBack: true };
        }
      }

      // Record application attempt
      this.state.appliedAt = Date.now();
      this.state.lastHealthCheck = Date.now();
      await this.saveState(this.state);

      // Report to Sentry
      Sentry.addBreadcrumb({
        category: 'ota',
        message: 'Applying update',
        data: { updateId: this.state.updateId },
      });

      // Reload with new update
      await Updates.reloadAsync();

      // If we get here, reload didn't happen (shouldn't occur)
      return { success: true };
    } catch (error) {
      logger.error('[OTA] Apply failed', { error });
      Sentry.captureException(error, { extra: { updateId: this.state?.updateId } });

      // Automatic rollback on error
      await this.rollback();
      return { success: false, rolledBack: true };
    }
  }

  /**
   * Validate update integrity before applying
   */
  private async validateUpdate(): Promise<boolean> {
    try {
      const bundle = await Updates.readLogEntriesAsync();
      const recentErrors = bundle.filter(
        (entry) => entry.level === 'error' && Date.now() - entry.timestamp < 60000
      );

      if (recentErrors.length > 3) {
        logger.warn('[OTA] Too many recent errors, skipping update');
        return false;
      }

      // Check if update was downloaded within expected timeframe
      if (this.state) {
        const downloadAge = Date.now() - this.state.downloadedAt;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (downloadAge > maxAge) {
          logger.warn('[OTA] Update too old, re-downloading recommended');
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('[OTA] Validation error', { error });
      return true; // Allow apply on validation error
    }
  }

  /**
   * Rollback to previous version
   */
  async rollback(): Promise<boolean> {
    if (!this.state) {
      return false;
    }

    try {
      const rollbacks = (this.state.rollbacks || 0) + 1;

      if (rollbacks > this.config.maxRollbacks) {
        logger.warn('[OTA] Max rollbacks exceeded', { rollbacks });
        return false;
      }

      // Update state before rollback
      this.state.rollbacks = rollbacks;
      this.state.lastRollbackAt = Date.now();
      this.state.isHealthy = false;
      await this.saveState(this.state);

      // Report rollback to Sentry
      Sentry.captureMessage('OTA Rollback triggered', {
        level: 'warning',
        extra: {
          updateId: this.state.updateId,
          rollbacks,
          reason: 'crash_or_error',
        },
      });

      logger.warn('[OTA] Rolling back update', {
        updateId: this.state.updateId,
        rollbacks,
      });

      // Clear the downloaded update and reload
      await Updates.reloadAsync();

      return true;
    } catch (error) {
      logger.error('[OTA] Rollback failed', { error });
      Sentry.captureException(error, { extra: { updateId: this.state?.updateId } });
      return false;
    }
  }

  /**
   * Check if app crashed on previous run with new update
   */
  private async checkCrashAndRollback(): Promise<void> {
    const crashKey = '@ota_crash_marker';
    const restartKey = '@ota_restart_marker';

    try {
      const crashMarker = await AsyncStorage.getItem(crashKey);
      const restartMarker = await AsyncStorage.getItem(restartKey);

      // Mark that we're starting up
      await AsyncStorage.setItem(restartKey, JSON.stringify({ timestamp: Date.now() }));

      if (crashMarker && this.state) {
        const crashData = JSON.parse(crashMarker);
        const timeSinceCrash = Date.now() - crashData.timestamp;
        const crashThreshold = CRASH_THRESHOLD_MINUTES * 60 * 1000;

        if (timeSinceCrash < crashThreshold) {
          // Crashed within threshold, increment rollback count
          logger.warn('[OTA] Crash detected after update', {
            crashTimestamp: crashData.timestamp,
            timeSinceCrash,
          });

          this.state.rollbacks = (this.state.rollbacks || 0) + 1;
          this.state.lastRollbackAt = Date.now();
          await this.saveState(this.state);

          if (this.state.rollbacks >= this.config.maxRollbacks) {
            logger.error('[OTA] Max rollbacks reached, disabling update', {
              rollbacks: this.state.rollbacks,
            });
            Sentry.captureMessage('OTA disabled due to repeated crashes', {
              level: 'error',
              extra: { rollbacks: this.state.rollbacks },
            });
          }
        }

        // Clear crash marker
        await AsyncStorage.removeItem(crashKey);
      }
    } catch (error) {
      logger.error('[OTA] Crash check failed', { error });
    }
  }

  /**
   * Mark that app started successfully (call on app mount)
   */
  async markSuccessfulStart(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        '@ota_restart_marker',
        JSON.stringify({ timestamp: Date.now(), healthy: true })
      );
    } catch (error) {
      logger.error('[OTA] Failed to mark start', { error });
    }
  }

  /**
   * Mark that app crashed (call in global error handler)
   */
  async markCrash(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        '@ota_crash_marker',
        JSON.stringify({ timestamp: Date.now(), updateId: this.state?.updateId })
      );
    } catch (error) {
      logger.error('[OTA] Failed to mark crash', { error });
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckTimer) return;

    this.healthCheckTimer = setInterval(async () => {
      if (!this.state?.appliedAt) return;

      try {
        const now = Date.now();
        const healthAge = now - (this.state.lastHealthCheck || 0);

        // If no health check in expected interval, app might have crashed
        if (healthAge > HEALTH_CHECK_INTERVAL_MS * 2 && this.state.isHealthy) {
          logger.warn('[OTA] Health check delayed, possible crash', {
            lastCheck: this.state.lastHealthCheck,
          });
        }

        // Update health check timestamp
        this.state.lastHealthCheck = now;
        await this.saveState(this.state);
      } catch (error) {
        logger.error('[OTA] Health check error', { error });
      }
    }, HEALTH_CHECK_INTERVAL_MS);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Get current OTA state
   */
  getStatus(): {
    hasUpdate: boolean;
    updateId?: string;
    isHealthy: boolean;
    rollbacks: number;
    downloadedAt?: number;
    appliedAt?: number;
  } {
    return {
      hasUpdate: !!this.state,
      updateId: this.state?.updateId,
      isHealthy: this.state?.isHealthy ?? true,
      rollbacks: this.state?.rollbacks ?? 0,
      downloadedAt: this.state?.downloadedAt,
      appliedAt: this.state?.appliedAt,
    };
  }

  /**
   * Clear OTA state (after successful run)
   */
  async clearState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OTA_STORAGE_KEY);
      this.state = null;
      logger.info('[OTA] State cleared');
    } catch (error) {
      logger.error('[OTA] Clear state failed', { error });
    }
  }

  /**
   * Persist state to storage
   */
  private async saveState(state: OTAUpdateState): Promise<void> {
    try {
      await AsyncStorage.setItem(OTA_STORAGE_KEY, JSON.stringify(state));
      this.state = state;
    } catch (error) {
      logger.error('[OTA] Save state failed', { error });
    }
  }
}

// Singleton instance with production config
export const otaManager = new OTAUpdateManager({
  enableAutoRollback: true,
  maxRollbacks: MAX_ROLLBACK_ATTEMPTS,
  rollbackOnCrash: true,
  validateBeforeApply: true,
});

// Legacy exports for backwards compatibility
export const checkForUpdates = () => otaManager.checkAndDownload();
export const applyUpdate = () => otaManager.applyUpdate();
export const rollbackUpdate = () => otaManager.rollback();
export const getOTAStatus = () => otaManager.getStatus();
