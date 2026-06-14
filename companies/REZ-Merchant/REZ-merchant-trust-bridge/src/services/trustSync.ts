import axios, { AxiosInstance } from 'axios';
import { TrustScore, TrustSourceConfig, ApiResponse } from '../types';
import { TrustScoreModel, SyncLogModel, ITrustScoreDocument } from '../models';
import { config } from '../config';
import { trustSyncLogger as logger } from '../utils/logger';
import { TrustScoreSchema } from '../types';

interface TrustApiResponse {
  merchantId: string;
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: {
    paymentHistory: number;
    disputeRate: number;
    complianceScore: number;
    businessAge: number;
    volumeScore: number;
  };
  lastUpdated: string;
  metadata?: Record<string, unknown>;
}

export class TrustSyncService {
  private axiosInstances: Map<string, AxiosInstance> = new Map();
  private syncTimers: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeAxiosInstances();
  }

  /**
   * Initialize HTTP clients for each trust source
   */
  private initializeAxiosInstances(): void {
    for (const source of config.trustSources) {
      if (!source.enabled) {
        logger.info(`Trust source ${source.id} is disabled, skipping initialization`);
        continue;
      }

      if (!source.endpoint) {
        logger.warn(`Trust source ${source.id} has no endpoint configured`);
        continue;
      }

      const instance = axios.create({
        baseURL: source.endpoint,
        timeout: source.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...(source.apiKey && { 'X-API-Key': source.apiKey }),
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
        },
      });

      this.axiosInstances.set(source.id, instance);
      logger.info(`Initialized trust source: ${source.id} (${source.endpoint})`);
    }
  }

  /**
   * Start automatic sync for all enabled sources
   */
  startAutoSync(): void {
    if (this.isInitialized) {
      logger.warn('Auto sync already initialized');
      return;
    }

    for (const source of config.trustSources) {
      if (!source.enabled) continue;

      this.scheduleSync(source);
    }

    this.isInitialized = true;
    logger.info('Auto sync started for all enabled trust sources');
  }

  /**
   * Stop automatic sync for all sources
   */
  stopAutoSync(): void {
    for (const [sourceId, timer] of this.syncTimers) {
      clearTimeout(timer);
      logger.info(`Stopped auto sync for source: ${sourceId}`);
    }

    this.syncTimers.clear();
    this.isInitialized = false;
    logger.info('Auto sync stopped for all sources');
  }

  /**
   * Schedule periodic sync for a source
   */
  private scheduleSync(source: TrustSourceConfig): void {
    const timer = setInterval(async () => {
      await this.syncFromSource(source.id);
    }, source.syncInterval);

    this.syncTimers.set(source.id, timer);

    // Also run an immediate sync
    this.syncFromSource(source.id).catch((err) => {
      logger.error(`Initial sync failed for ${source.id}`, { error: err.message });
    });

    logger.info(`Scheduled sync for ${source.id} every ${source.syncInterval / 1000}s`);
  }

  /**
   * Sync trust data from a specific source
   */
  async syncFromSource(sourceId: string): Promise<SyncResult> {
    const source = config.trustSources.find((s) => s.id === sourceId);
    if (!source) {
      throw new Error(`Unknown trust source: ${sourceId}`);
    }

    if (!source.enabled) {
      return { status: 'skipped', message: `Source ${sourceId} is disabled` };
    }

    const instance = this.axiosInstances.get(sourceId);
    if (!instance) {
      throw new Error(`No HTTP client for source: ${sourceId}`);
    }

    const startTime = new Date();
    let syncLog: InstanceType<typeof SyncLogModel> | null = null;

    try {
      logger.info(`Starting sync from ${sourceId}`);

      // Fetch trust data from source
      const response = await instance.get<{ data: TrustApiResponse[] }>('/api/trust/scores');
      const trustDataArray = response.data.data;

      if (!Array.isArray(trustDataArray)) {
        throw new Error(`Invalid response format from ${sourceId}`);
      }

      let updated = 0;
      let failed = 0;

      // Process each trust record
      for (const trustData of trustDataArray) {
        try {
          await this.processTrustRecord(trustData, sourceId);
          updated++;
        } catch (err) {
          failed++;
          logger.error(`Failed to process trust record for ${trustData.merchantId}`, {
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      const endTime = new Date();

      // Create sync log
      syncLog = new SyncLogModel({
        source: sourceId,
        status: failed === 0 ? 'SUCCESS' : 'PARTIAL',
        startTime,
        endTime,
        recordsProcessed: trustDataArray.length,
        recordsUpdated: updated,
        recordsFailed: failed,
      });
      await syncLog.save();

      logger.info(`Sync completed from ${sourceId}`, {
        processed: trustDataArray.length,
        updated,
        failed,
        duration: `${endTime.getTime() - startTime.getTime()}ms`,
      });

      return {
        status: failed === 0 ? 'SUCCESS' : 'PARTIAL',
        source: sourceId,
        processed: trustDataArray.length,
        updated,
        failed,
        duration: endTime.getTime() - startTime.getTime(),
      };
    } catch (error) {
      const endTime = new Date();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error(`Sync failed from ${sourceId}`, { error: errorMessage });

      // Log the failure
      syncLog = new SyncLogModel({
        source: sourceId,
        status: 'FAILED',
        startTime,
        endTime,
        errorMessage,
        errorDetails: error instanceof Error ? { stack: error.stack } : undefined,
      });
      await syncLog.save();

      return {
        status: 'FAILED',
        source: sourceId,
        error: errorMessage,
        duration: endTime.getTime() - startTime.getTime(),
      };
    }
  }

  /**
   * Process a single trust record
   */
  private async processTrustRecord(
    data: TrustApiResponse,
    source: string
  ): Promise<ITrustScoreDocument> {
    // Validate the incoming data
    const validated = TrustScoreSchema.parse({
      ...data,
      source,
    });

    // Find existing record
    let existingRecord = await TrustScoreModel.findOne({
      merchantId: validated.merchantId,
    });

    const previousScore = existingRecord?.score;
    const previousRiskLevel = existingRecord?.riskLevel;
    const now = new Date();

    if (existingRecord) {
      // Update existing record
      existingRecord.score = validated.score;
      existingRecord.riskLevel = validated.riskLevel;
      existingRecord.factors = validated.factors;
      existingRecord.lastUpdated = new Date(validated.lastUpdated);
      existingRecord.source = source;

      if (validated.metadata) {
        existingRecord.metadata = validated.metadata;
      }

      // Add to sync history if score changed
      if (previousScore !== validated.score) {
        existingRecord.syncHistory.push({
          timestamp: now,
          previousScore: previousScore ?? 0,
          newScore: validated.score,
          source,
        });

        // Keep only last 100 history entries
        if (existingRecord.syncHistory.length > 100) {
          existingRecord.syncHistory = existingRecord.syncHistory.slice(-100);
        }
      }

      await existingRecord.save();

      logger.debug(`Updated trust score for ${validated.merchantId}`, {
        previousScore,
        newScore: validated.score,
        riskLevel: validated.riskLevel,
      });

      return existingRecord;
    } else {
      // Create new record
      const newRecord = new TrustScoreModel({
        merchantId: validated.merchantId,
        score: validated.score,
        riskLevel: validated.riskLevel,
        factors: validated.factors,
        lastUpdated: new Date(validated.lastUpdated),
        source,
        metadata: validated.metadata,
        syncHistory: [
          {
            timestamp: now,
            previousScore: 0,
            newScore: validated.score,
            source,
          },
        ],
      });

      await newRecord.save();

      logger.info(`Created new trust record for ${validated.merchantId}`, {
        score: validated.score,
        riskLevel: validated.riskLevel,
      });

      return newRecord;
    }
  }

  /**
   * Sync trust data for a specific merchant
   */
  async syncMerchant(merchantId: string, forceSync = false): Promise<SyncResult> {
    const startTime = new Date();

    try {
      // Try each enabled source until one succeeds
      for (const source of config.trustSources) {
        if (!source.enabled) continue;

        const instance = this.axiosInstances.get(source.id);
        if (!instance) continue;

        try {
          const response = await instance.get<{ data: TrustApiResponse }>(
            `/api/trust/score/${merchantId}`
          );

          await this.processTrustRecord(response.data.data, source.id);

          const endTime = new Date();

          logger.info(`Synced trust data for merchant ${merchantId}`, {
            source: source.id,
            duration: `${endTime.getTime() - startTime.getTime()}ms`,
          });

          return {
            status: 'SUCCESS',
            source: source.id,
            merchantId,
            duration: endTime.getTime() - startTime.getTime(),
          };
        } catch (err) {
          logger.warn(`Failed to fetch from ${source.id}, trying next source`, {
            merchantId,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
          continue;
        }
      }

      // If we get here, all sources failed
      throw new Error('All trust sources failed');
    } catch (error) {
      const endTime = new Date();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error(`Failed to sync merchant ${merchantId}`, { error: errorMessage });

      return {
        status: 'FAILED',
        merchantId,
        error: errorMessage,
        duration: endTime.getTime() - startTime.getTime(),
      };
    }
  }

  /**
   * Get trust score for a merchant
   */
  async getTrustScore(merchantId: string): Promise<TrustScore | null> {
    const record = await TrustScoreModel.findOne({ merchantId }).lean();

    if (!record) {
      return null;
    }

    return {
      merchantId: record.merchantId,
      score: record.score,
      riskLevel: record.riskLevel as TrustScore['riskLevel'],
      factors: record.factors as TrustScore['factors'],
      lastUpdated: record.lastUpdated.toISOString(),
      source: record.source,
      metadata: record.metadata as Record<string, unknown> | undefined,
    };
  }

  /**
   * Get trust score history for a merchant
   */
  async getTrustHistory(
    merchantId: string,
    limit = 30
  ): Promise<Array<{ timestamp: Date; score: number; riskLevel: string }>> {
    const record = await TrustScoreModel.findOne({ merchantId });

    if (!record) {
      return [];
    }

    return record.syncHistory.slice(-limit).map((entry) => ({
      timestamp: entry.timestamp,
      score: entry.newScore,
      riskLevel: '',
    }));
  }

  /**
   * Get sync status for all sources
   */
  async getSyncStatus(): Promise<SyncStatus[]> {
    const statuses: SyncStatus[] = [];

    for (const source of config.trustSources) {
      const lastSync = await SyncLogModel.findOne({ source: source.id })
        .sort({ createdAt: -1 })
        .lean();

      statuses.push({
        sourceId: source.id,
        sourceName: source.name,
        enabled: source.enabled,
        lastSyncTime: lastSync?.createdAt?.toISOString() || null,
        lastStatus: lastSync?.status || 'NEVER_RUN',
        recordsProcessed: lastSync?.recordsProcessed || 0,
        recordsUpdated: lastSync?.recordsUpdated || 0,
        recordsFailed: lastSync?.recordsFailed || 0,
        nextSync: source.enabled
          ? new Date(Date.now() + source.syncInterval).toISOString()
          : null,
      });
    }

    return statuses;
  }
}

export interface SyncResult {
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'skipped';
  source?: string;
  merchantId?: string;
  processed?: number;
  updated?: number;
  failed?: number;
  duration: number;
  error?: string;
  message?: string;
}

export interface SyncStatus {
  sourceId: string;
  sourceName: string;
  enabled: boolean;
  lastSyncTime: string | null;
  lastStatus: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'NEVER_RUN';
  recordsProcessed: number;
  recordsUpdated: number;
  recordsFailed: number;
  nextSync: string | null;
}

// Export singleton instance
export const trustSyncService = new TrustSyncService();
export default trustSyncService;
