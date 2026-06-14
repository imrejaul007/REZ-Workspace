import { v4 as uuidv4 } from 'uuid';
import { Fingerprint, IFingerprint, IFingerprintFeature } from '../models';
import { logger } from '../utils/logger';
import { fingerprintOperationsTotal, fingerprintCacheGauge } from '../utils/metrics';

// Fingerprint input
export interface FingerprintInput {
  deviceId: string;
  features: {
    userAgent?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
    browser?: string;
    cookiesEnabled?: boolean;
    doNotTrack?: boolean;
    javaEnabled?: boolean;
    webglVendor?: string;
    webglRenderer?: string;
    audioContext?: string;
    fonts?: string[];
    canvas?: string;
    plugins?: string[];
    headers?: Record<string, string>;
    [key: string]: unknown;
  };
  sources?: string[];
  metadata?: Record<string, unknown>;
}

// Fingerprint result
export interface FingerprintResult {
  fingerprintId: string;
  deviceId: string;
  hash: string;
  confidence: number;
  features: IFingerprintFeature[];
  version: string;
  processingTimeMs: number;
}

// Fingerprint comparison result
export interface FingerprintComparison {
  fingerprintId1: string;
  fingerprintId2: string;
  similarity: number;
  matchingFeatures: string[];
  differingFeatures: string[];
  confidence: number;
}

export class FingerprintService {
  private readonly CACHE_TTL = 3600; // 1 hour cache

  // Generate hash from features
  private generateHash(features: Record<string, unknown>): string {
    const featureString = JSON.stringify(features, Object.keys(features).sort());
    return this.hashString(featureString);
  }

  // Simple hash function
  private hashString(str: string): string {
    let hash1 = 5381;
    let hash2 = 52711;

    for (let i = 0; i < str.length; i++) {
      hash1 = ((hash1 << 5) + hash1) ^ str.charCodeAt(i);
      hash2 = ((hash2 << 6) + hash2) ^ str.charCodeAt(i);
    }

    const hash1Str = (hash1 >>> 0).toString(16).padStart(8, '0');
    const hash2Str = (hash2 >>> 0).toString(16).padStart(8, '0');

    return `${hash1Str}${hash2Str}`;
  }

  // Extract stable features
  private extractFeatures(input: FingerprintInput['features']): IFingerprintFeature[] {
    const features: IFingerprintFeature[] = [];

    const featureConfig: Array<{ name: string; value: unknown; stable: boolean }> = [
      { name: 'userAgent', value: input.userAgent, stable: true },
      { name: 'screenResolution', value: input.screenResolution, stable: true },
      { name: 'timezone', value: input.timezone, stable: true },
      { name: 'language', value: input.language, stable: true },
      { name: 'platform', value: input.platform, stable: true },
      { name: 'browser', value: input.browser, stable: true },
      { name: 'cookiesEnabled', value: input.cookiesEnabled, stable: true },
      { name: 'doNotTrack', value: input.doNotTrack, stable: true },
      { name: 'javaEnabled', value: input.javaEnabled, stable: true },
      { name: 'webglVendor', value: input.webglVendor, stable: true },
      { name: 'webglRenderer', value: input.webglRenderer, stable: true },
      { name: 'audioContext', value: input.audioContext, stable: true },
      { name: 'fonts', value: input.fonts?.join(','), stable: true },
      { name: 'canvas', value: input.canvas, stable: true },
      { name: 'plugins', value: input.plugins?.join(','), stable: false }
    ];

    for (const config of featureConfig) {
      if (config.value !== undefined && config.value !== null) {
        features.push({
          name: config.name,
          value: config.value as string | number | boolean,
          hash: this.hashString(String(config.value)),
          stable: config.stable,
          firstSeen: new Date(),
          lastSeen: new Date()
        });
      }
    }

    return features;
  }

  // Calculate confidence based on feature completeness and stability
  private calculateConfidence(features: IFingerprintFeature[]): number {
    const totalFeatures = 15; // Expected number of features
    const presentFeatures = features.length;
    const stableFeatures = features.filter(f => f.stable).length;

    // Base score from feature coverage
    const coverageScore = (presentFeatures / totalFeatures) * 50;

    // Score from stable features
    const stabilityScore = (stableFeatures / presentFeatures) * 50;

    return Math.min(100, Math.round(coverageScore + stabilityScore));
  }

  // Create fingerprint
  async createFingerprint(input: FingerprintInput): Promise<FingerprintResult> {
    const startTime = Date.now();

    try {
      const features = this.extractFeatures(input.features);
      const hash = this.generateHash(features);
      const confidence = this.calculateConfidence(features);
      const fingerprintId = `fp_${uuidv4()}`;

      const fingerprint = new Fingerprint({
        fingerprintId,
        deviceId: input.deviceId,
        features,
        hash,
        confidence,
        version: '1.0',
        sources: input.sources || ['fingerprint-service'],
        metadata: {
          userAgent: input.features.userAgent,
          screenResolution: input.features.screenResolution,
          timezone: input.features.timezone,
          language: input.features.language,
          platform: input.features.platform,
          browser: input.features.browser,
          ...input.metadata
        }
      });

      await fingerprint.save();

      // Update metrics
      fingerprintOperationsTotal.inc({ operation: 'create', status: 'success' });

      const processingTimeMs = Date.now() - startTime;

      logger.info('Fingerprint created', {
        fingerprintId,
        deviceId: input.deviceId,
        confidence,
        processingTimeMs
      });

      return {
        fingerprintId,
        deviceId: input.deviceId,
        hash,
        confidence,
        features,
        version: '1.0',
        processingTimeMs
      };
    } catch (error) {
      fingerprintOperationsTotal.inc({ operation: 'create', status: 'error' });
      logger.error('Fingerprint creation failed', { error, input });
      throw error;
    }
  }

  // Get fingerprint by ID
  async getFingerprint(fingerprintId: string): Promise<IFingerprint | null> {
    return Fingerprint.findByFingerprintId(fingerprintId);
  }

  // Get fingerprints for device
  async getFingerprintsForDevice(deviceId: string): Promise<IFingerprint[]> {
    return Fingerprint.findByDeviceId(deviceId);
  }

  // Find similar fingerprints
  async findSimilarFingerprints(hash: string, threshold: number = 0.8): Promise<IFingerprint[]> {
    return Fingerprint.findSimilarFingerprints(hash, threshold);
  }

  // Compare two fingerprints
  async compareFingerprints(fingerprintId1: string, fingerprintId2: string): Promise<FingerprintComparison | null> {
    const fp1 = await Fingerprint.findByFingerprintId(fingerprintId1);
    const fp2 = await Fingerprint.findByFingerprintId(fingerprintId2);

    if (!fp1 || !fp2) return null;

    const matchingFeatures: string[] = [];
    const differingFeatures: string[] = [];

    for (const feature1 of fp1.features) {
      const feature2 = fp2.features.find(f => f.name === feature1.name);

      if (feature2) {
        if (feature1.hash === feature2.hash) {
          matchingFeatures.push(feature1.name);
        } else {
          differingFeatures.push(feature1.name);
        }
      } else {
        differingFeatures.push(feature1.name);
      }
    }

    // Add features only in fp2
    for (const feature2 of fp2.features) {
      if (!fp1.features.find(f => f.name === feature2.name)) {
        differingFeatures.push(feature2.name);
      }
    }

    const similarity = fp1.features.length > 0
      ? matchingFeatures.length / (matchingFeatures.length + differingFeatures.length)
      : 0;

    const confidence = Math.round((similarity * 100 + fp1.confidence + fp2.confidence) / 3);

    return {
      fingerprintId1,
      fingerprintId2,
      similarity,
      matchingFeatures,
      differingFeatures,
      confidence
    };
  }

  // Update fingerprint with new features
  async updateFingerprint(fingerprintId: string, newFeatures: FingerprintInput['features']): Promise<IFingerprint | null> {
    const fingerprint = await Fingerprint.findByFingerprintId(fingerprintId);
    if (!fingerprint) return null;

    const features = this.extractFeatures(newFeatures);
    fingerprint.updateFeatures(features);

    fingerprintOperationsTotal.inc({ operation: 'update', status: 'success' });

    return fingerprint;
  }

  // Deactivate fingerprint
  async deactivateFingerprint(fingerprintId: string): Promise<IFingerprint | null> {
    const fingerprint = await Fingerprint.findByFingerprintId(fingerprintId);
    if (!fingerprint) return null;

    fingerprint.isActive = false;
    await fingerprint.save();

    fingerprintOperationsTotal.inc({ operation: 'deactivate', status: 'success' });

    return fingerprint;
  }

  // Get fingerprint statistics
  async getFingerprintStats(deviceId?: string): Promise<{
    totalFingerprints: number;
    activeFingerprints: number;
    avgConfidence: number;
    uniqueHashes: number;
  }> {
    const match = deviceId ? { deviceId } : {};

    const stats = await Fingerprint.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalFingerprints: { $sum: 1 },
          activeFingerprints: { $sum: { $cond: ['$isActive', 1, 0] } },
          avgConfidence: { $avg: '$confidence' },
          uniqueHashes: { $addToSet: '$hash' }
        }
      }
    ]);

    return {
      totalFingerprints: stats[0]?.totalFingerprints || 0,
      activeFingerprints: stats[0]?.activeFingerprints || 0,
      avgConfidence: Math.round(stats[0]?.avgConfidence || 0),
      uniqueHashes: stats[0]?.uniqueHashes?.length || 0
    };
  }

  // Increment match count for fingerprint
  async incrementMatchCount(fingerprintId: string): Promise<void> {
    const fingerprint = await Fingerprint.findByFingerprintId(fingerprintId);
    if (fingerprint) {
      await fingerprint.incrementMatchCount();
    }
  }
}

// Export singleton instance
export const fingerprintService = new FingerprintService();