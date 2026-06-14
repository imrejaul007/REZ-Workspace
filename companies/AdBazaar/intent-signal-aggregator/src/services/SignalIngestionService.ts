import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import { IntentSignalModel, IntentSignalDocument, findDuplicateByHash } from '../models/IntentSignal';
import { SignalNormalizationService } from './SignalNormalizationService';
import { SignalEnrichmentService } from './SignalEnrichmentService';
import { SignalRoutingService } from './SignalRoutingService';
import { checkSignalDuplicate, markSignalProcessed } from '../config/redis';
import { config } from '../config';
import { logger } from '../config/logger';
import {
  IntentSignal,
  RawSignal,
  IngestResponse,
  BatchIngestResponse,
  SignalStats,
} from '../types';
import { metrics } from './metrics';

export class SignalIngestionService {
  private normalizationService: SignalNormalizationService;
  private enrichmentService: SignalEnrichmentService;
  private routingService: SignalRoutingService;

  constructor() {
    this.normalizationService = new SignalNormalizationService();
    this.enrichmentService = new SignalEnrichmentService();
    this.routingService = new SignalRoutingService();
  }

  /**
   * Generate a hash for signal deduplication
   */
  private generateSignalHash(signal: RawSignal | IntentSignal): string {
    const hashInput = `${signal.userId}:${signal.source}:${signal.sourceService}:${signal.eventType}:${signal.intentKey}:${signal.timestamp || new Date().toISOString()}`;
    return CryptoJS.SHA256(hashInput).toString();
  }

  /**
   * Check if a signal is a duplicate using Redis cache
   */
  private async isDuplicate(signalHash: string): Promise<boolean> {
    try {
      const exists = await checkSignalDuplicate(signalHash, config.signalDedupWindowMs);
      if (exists) {
        logger.debug('Duplicate signal detected via Redis', { hash: signalHash.substring(0, 16) });
        return true;
      }
      return false;
    } catch (error) {
      logger.warn('Redis dedup check failed, falling back to MongoDB', { error });
      // Fallback to MongoDB check
      const windowStart = new Date(Date.now() - config.signalDedupWindowMs);
      const duplicate = await findDuplicateByHash(signalHash, windowStart);
      return !!duplicate;
    }
  }

  /**
   * Ingest a single signal
   */
  async ingestSignal(rawSignal: RawSignal): Promise<IngestResponse> {
    const startTime = Date.now();

    try {
      // Normalize the signal
      const normalizedSignal = await this.normalizationService.normalize(rawSignal);

      // Generate hash for deduplication
      const signalHash = this.generateSignalHash({
        ...normalizedSignal,
        timestamp: normalizedSignal.timestamp || new Date(),
      });

      // Check for duplicates
      if (await this.isDuplicate(signalHash)) {
        return {
          success: true,
          signalId: normalizedSignal.signalId,
          duplicate: true,
        };
      }

      // Create the signal document
      const signalDoc = new IntentSignalModel({
        ...normalizedSignal,
        signalHash,
        timestamp: normalizedSignal.timestamp || new Date(),
      });

      // Save to database
      await signalDoc.save();

      // Mark as processed in Redis
      await markSignalProcessed(signalHash, config.signalDedupWindowMs);

      // Enrich the signal
      const enrichedSignal = await this.enrichmentService.enrich(normalizedSignal);

      // Update enrichment status if successful
      if (enrichedSignal.enriched) {
        await IntentSignalModel.updateOne(
          { signalId: normalizedSignal.signalId },
          {
            enriched: true,
            enrichmentData: enrichedSignal.enrichmentData,
          }
        );
      }

      // Route to intent graph and marketplace
      await this.routingService.routeSignal(enrichedSignal);

      // Update metrics
      metrics.signalsIngested.inc({ source: normalizedSignal.source, category: normalizedSignal.category });
      metrics.ingestionDuration.observe((Date.now() - startTime) / 1000);

      logger.info('Signal ingested successfully', {
        signalId: normalizedSignal.signalId,
        source: normalizedSignal.source,
        eventType: normalizedSignal.eventType,
      });

      return {
        success: true,
        signalId: normalizedSignal.signalId,
      };
    } catch (error) {
      logger.error('Failed to ingest signal', {
        error: (error as Error).message,
        source: rawSignal.source,
      });
      metrics.ingestionErrors.inc({ source: rawSignal.source });

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Batch ingest multiple signals
   */
  async batchIngest(rawSignals: RawSignal[]): Promise<BatchIngestResponse> {
    const startTime = Date.now();
    const results: BatchIngestResponse = {
      success: true,
      processed: 0,
      duplicates: 0,
      failed: 0,
      signalIds: [],
      errors: [],
    };

    logger.info('Starting batch ingestion', { count: rawSignals.length });

    for (let i = 0; i < rawSignals.length; i++) {
      const rawSignal = rawSignals[i];

      try {
        const result = await this.ingestSignal(rawSignal);

        if (result.duplicate) {
          results.duplicates++;
        } else if (result.success) {
          results.processed++;
          results.signalIds.push(result.signalId!);
        } else {
          results.failed++;
          results.errors?.push({ index: i, error: result.error || 'Unknown error' });
        }
      } catch (error) {
        results.failed++;
        results.errors?.push({ index: i, error: (error as Error).message });
      }
    }

    results.success = results.failed === 0;

    metrics.batchIngestionDuration.observe((Date.now() - startTime) / 1000);
    metrics.batchSize.observe(rawSignals.length);

    logger.info('Batch ingestion complete', {
      processed: results.processed,
      duplicates: results.duplicates,
      failed: results.failed,
      duration: Date.now() - startTime,
    });

    return results;
  }

  /**
   * Get aggregation statistics
   */
  async getStats(): Promise<SignalStats> {
    try {
      return await IntentSignalModel.aggregate([
        {
          $facet: {
            totalCount: [{ $count: 'count' }],
            bySource: [{ $group: { _id: '$source', count: { $sum: 1 } } }],
            byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
            byEventType: [{ $group: { _id: '$eventType', count: { $sum: 1 } } }],
            avgConfidence: [{ $group: { _id: null, avg: { $avg: '$confidence' } } }],
            enrichedCount: [{ $match: { enriched: true } }, { $count: 'count' }],
          },
        },
      ]).then((result) => {
        const r = result[0];
        return {
          totalSignals: r.totalCount[0]?.count || 0,
          signalsBySource: Object.fromEntries(
            r.bySource.map((s: { _id: string; count: number }) => [s._id, s.count])
          ),
          signalsByCategory: Object.fromEntries(
            r.byCategory.map((s: { _id: string; count: number }) => [s._id, s.count])
          ),
          signalsByEventType: Object.fromEntries(
            r.byEventType.map((s: { _id: string; count: number }) => [s._id, s.count])
          ),
          averageConfidence: r.avgConfidence[0]?.avg || 0,
          enrichedSignals: r.enrichedCount[0]?.count || 0,
          lastUpdated: new Date(),
        };
      });
    } catch (error) {
      logger.error('Failed to get signal stats', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get user signal history
   */
  async getUserSignals(userId: string, limit = 100, offset = 0): Promise<IntentSignalDocument[]> {
    return IntentSignalModel.find({ userId })
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
  }
}

export const signalIngestionService = new SignalIngestionService();