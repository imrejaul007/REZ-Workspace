import { v4 as uuidv4 } from 'uuid';
import { OverlapAnalysis, DataUpload } from '../models';
import { OverlapAnalysisRequest, OverlapResult } from '../types';
import logger from '../config/logger';

export class OverlapService {
  /**
   * Analyze overlap between two datasets
   */
  async analyzeOverlap(request: OverlapAnalysisRequest): Promise<OverlapResult> {
    const analysisId = uuidv4();

    logger.info('Starting overlap analysis', {
      analysisId,
      uploadId1: request.uploadId1,
      uploadId2: request.uploadId2,
      analysisType: request.analysisType,
    });

    try {
      // Get both uploads
      const upload1 = await DataUpload.findOne({ uploadId: request.uploadId1 });
      const upload2 = await DataUpload.findOne({ uploadId: request.uploadId2 });

      if (!upload1 || !upload2) {
        throw new Error('One or both uploads not found');
      }

      // Extract hashed identifiers
      const hashes1 = new Set(
        (upload1.records || [])
          .map(r => r.hashedValue)
          .filter((h): h is string => !!h)
      );

      const hashes2 = new Set(
        (upload2.records || [])
          .map(r => r.hashedValue)
          .filter((h): h is string => !!h)
      );

      // Calculate overlap based on analysis type
      let overlappingRecords = 0;

      switch (request.analysisType) {
        case 'exact':
          // Exact hash match
          for (const hash of hashes1) {
            if (hashes2.has(hash)) {
              overlappingRecords++;
            }
          }
          break;

        case 'fuzzy':
          // Fuzzy matching (prefix match for phone, domain match for email)
          overlappingRecords = this.calculateFuzzyOverlap(hashes1, hashes2);
          break;

        case 'segment':
          // Segment-based overlap analysis
          overlappingRecords = this.calculateSegmentOverlap(hashes1, hashes2, upload1, upload2);
          break;

        default:
          overlappingRecords = this.calculateExactOverlap(hashes1, hashes2);
      }

      const totalRecords1 = upload1.recordCount;
      const totalRecords2 = upload2.recordCount;

      // Calculate overlap metrics
      const overlapPercentage = totalRecords1 > 0 && totalRecords2 > 0
        ? (overlappingRecords / Math.min(totalRecords1, totalRecords2)) * 100
        : 0;

      const uniqueToUpload1 = totalRecords1 - overlappingRecords;
      const uniqueToUpload2 = totalRecords2 - overlappingRecords;

      // Jaccard index: |A ∩ B| / |A ∪ B|
      const union = hashes1.size + hashes2.size - overlappingRecords;
      const jaccardIndex = union > 0 ? overlappingRecords / union : 0;

      // Calculate segment overlap
      const segmentOverlap = this.calculateSegmentOverlapDetails(
        upload1,
        upload2,
        overlappingRecords
      );

      // Create analysis record
      const analysis = new OverlapAnalysis({
        analysisId,
        uploadId1: request.uploadId1,
        uploadId2: request.uploadId2,
        brandId: upload1.brandId,
        analysisType: request.analysisType,
        totalRecords1,
        totalRecords2,
        overlappingRecords,
        overlapPercentage,
        uniqueToUpload1,
        uniqueToUpload2,
        jaccardIndex,
        segmentOverlap,
      });

      await analysis.save();

      logger.info('Overlap analysis completed', {
        analysisId,
        overlappingRecords,
        overlapPercentage: overlapPercentage.toFixed(2),
        jaccardIndex: jaccardIndex.toFixed(4),
      });

      return {
        uploadId1: request.uploadId1,
        uploadId2: request.uploadId2,
        totalRecords1,
        totalRecords2,
        overlappingRecords,
        overlapPercentage,
        uniqueToUpload1,
        uniqueToUpload2,
        jaccardIndex,
        segmentOverlap,
      };
    } catch (error) {
      logger.error('Overlap analysis failed', {
        analysisId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Calculate exact overlap
   */
  private calculateExactOverlap(set1: Set<string>, set2: Set<string>): number {
    let count = 0;
    for (const item of set1) {
      if (set2.has(item)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Calculate fuzzy overlap (prefix matching for phone, domain for email)
   */
  private calculateFuzzyOverlap(set1: Set<string>, set2: Set<string>): number {
    let count = 0;
    const prefixes2 = new Map<string, number>();

    // Build prefix map for set2 (last 4 digits for phone-like hashes)
    for (const hash of set2) {
      const prefix = hash.slice(-4);
      prefixes2.set(prefix, (prefixes2.get(prefix) || 0) + 1);
    }

    // Count fuzzy matches
    for (const hash of set1) {
      const prefix = hash.slice(-4);
      if (prefixes2.has(prefix)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Calculate segment overlap
   */
  private calculateSegmentOverlap(
    hashes1: Set<string>,
    hashes2: Set<string>,
    _upload1: DataUpload,
    _upload2: DataUpload
  ): number {
    // For segment analysis, use exact overlap
    return this.calculateExactOverlap(hashes1, hashes2);
  }

  /**
   * Calculate segment overlap details
   */
  private calculateSegmentOverlapDetails(
    upload1: DataUpload,
    upload2: DataUpload,
    totalOverlap: number
  ): Record<string, { overlap: number; percentage: number }> {
    const segmentOverlap: Record<string, { overlap: number; percentage: number }> = {};

    const segments1 = upload1.segments || [];
    const segments2 = upload2.segments || [];

    // Find common segments
    const commonSegments = segments1.filter(s => segments2.includes(s));

    for (const segment of commonSegments) {
      // Count records in each segment (simplified)
      const records1 = (upload1.records || []).filter(r => r.segment === segment);
      const records2 = (upload2.records || []).filter(r => r.segment === segment);

      // Calculate overlap for this segment
      const hashes1 = new Set(records1.map(r => r.hashedValue).filter(Boolean));
      const hashes2 = new Set(records2.map(r => r.hashedValue).filter(Boolean));

      let segmentOverlapCount = 0;
      for (const hash of hashes1) {
        if (hashes2.has(hash)) {
          segmentOverlapCount++;
        }
      }

      const minSize = Math.min(records1.length, records2.length);
      const percentage = minSize > 0 ? (segmentOverlapCount / minSize) * 100 : 0;

      segmentOverlap[segment] = {
        overlap: segmentOverlapCount,
        percentage,
      };
    }

    return segmentOverlap;
  }

  /**
   * Get overlap analysis by ID
   */
  async getOverlapAnalysis(analysisId: string): Promise<OverlapResult | null> {
    const analysis = await OverlapAnalysis.findOne({ analysisId });

    if (!analysis) {
      return null;
    }

    return {
      uploadId1: analysis.uploadId1,
      uploadId2: analysis.uploadId2,
      totalRecords1: analysis.totalRecords1,
      totalRecords2: analysis.totalRecords2,
      overlappingRecords: analysis.overlappingRecords,
      overlapPercentage: analysis.overlapPercentage,
      uniqueToUpload1: analysis.uniqueToUpload1,
      uniqueToUpload2: analysis.uniqueToUpload2,
      jaccardIndex: analysis.jaccardIndex,
      segmentOverlap: analysis.segmentOverlap as Record<string, { overlap: number; percentage: number }>,
    };
  }

  /**
   * Get overlap analyses by brand
   */
  async getOverlapAnalysesByBrand(brandId: string, limit = 50): Promise<OverlapAnalysis[]> {
    return OverlapAnalysis.find({ brandId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export const overlapService = new OverlapService();