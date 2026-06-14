import { v4 as uuidv4 } from 'uuid';
import { ProbMatch, IProbMatch, MatchGraph, MatchStats } from '../models';
import { logger } from '../utils/logger';
import { mergeOperationsTotal } from '../utils/metrics';

// Merge input
export interface MergeInput {
  sourceMatchIds: string[];
  targetMatchId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// Merge result
export interface MergeResult {
  mergeId: string;
  sourceMatchIds: string[];
  targetMatchId: string;
  mergedDeviceIds: string[];
  probability: number;
  confidence: number;
  mergeCount: number;
  status: 'success' | 'partial' | 'failed';
  errors: string[];
  processingTimeMs: number;
}

// Split result
export interface SplitResult {
  originalMatchId: string;
  newMatchIds: string[];
  status: 'success' | 'failed';
  processingTimeMs: number;
}

export class MergeService {
  // Merge multiple matches into one
  async mergeMatches(input: MergeInput): Promise<MergeResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const mergeId = `merge_${uuidv4()}`;

    try {
      // Get all source matches
      const sourceMatches: IProbMatch[] = [];
      for (const matchId of input.sourceMatchIds) {
        const match = await ProbMatch.findByMatchId(matchId);
        if (match) {
          sourceMatches.push(match);
        } else {
          errors.push(`Match not found: ${matchId}`);
        }
      }

      if (sourceMatches.length < 2) {
        return {
          mergeId,
          sourceMatchIds: input.sourceMatchIds,
          targetMatchId: '',
          mergedDeviceIds: [],
          probability: 0,
          confidence: 0,
          mergeCount: 0,
          status: 'failed',
          errors: ['At least 2 valid matches required for merge'],
          processingTimeMs: Date.now() - startTime
        };
      }

      // If target match ID provided, use it; otherwise create new
      let targetMatch: IProbMatch;
      if (input.targetMatchId) {
        const existingTarget = await ProbMatch.findByMatchId(input.targetMatchId);
        if (existingTarget) {
          targetMatch = existingTarget;
        } else {
          errors.push(`Target match not found: ${input.targetMatchId}`);
          targetMatch = sourceMatches[0];
        }
      } else {
        targetMatch = sourceMatches[0];
      }

      // Collect all unique device IDs
      const deviceIdSet = new Set<string>();
      for (const match of sourceMatches) {
        for (const deviceId of match.deviceIds) {
          deviceIdSet.add(deviceId);
        }
      }
      const mergedDeviceIds = Array.from(deviceIdSet);

      // Calculate merged probability (weighted average)
      let totalWeight = 0;
      let weightedProb = 0;
      let weightedConf = 0;

      for (const match of sourceMatches) {
        const weight = match.confidence / 100;
        weightedProb += match.probability * weight;
        weightedConf += match.confidence * weight;
        totalWeight += weight;
      }

      const probability = totalWeight > 0 ? weightedProb / totalWeight : 0;
      const confidence = totalWeight > 0 ? weightedConf / totalWeight : 0;

      // Update target match
      targetMatch.deviceIds = mergedDeviceIds;
      targetMatch.probability = probability;
      targetMatch.confidence = confidence;
      targetMatch.mergeCount += sourceMatches.length;
      targetMatch.lastSeen = new Date();
      targetMatch.metadata = {
        ...targetMatch.metadata,
        mergeId,
        mergeReason: input.reason,
        ...input.metadata
      };

      await targetMatch.save();

      // Mark source matches as merged
      for (const match of sourceMatches) {
        if (match.matchId !== targetMatch.matchId) {
          match.status = 'merged';
          match.mergedInto = targetMatch.matchId;
          match.lastSeen = new Date();
          await match.save();
        }
      }

      // Update graphs if they exist
      await this.updateMergedGraphs(targetMatch.matchId, sourceMatches.map(m => m.matchId));

      // Update stats
      await this.updateMergeStats(sourceMatches.length);

      const processingTimeMs = Date.now() - startTime;

      mergeOperationsTotal.inc({ status: errors.length === 0 ? 'success' : 'partial' });

      logger.info('Matches merged', {
        mergeId,
        sourceCount: sourceMatches.length,
        targetMatchId: targetMatch.matchId,
        mergedDeviceCount: mergedDeviceIds.length,
        processingTimeMs
      });

      return {
        mergeId,
        sourceMatchIds: input.sourceMatchIds,
        targetMatchId: targetMatch.matchId,
        mergedDeviceIds,
        probability,
        confidence,
        mergeCount: sourceMatches.length,
        status: errors.length === 0 ? 'success' : 'partial',
        errors,
        processingTimeMs
      };
    } catch (error) {
      mergeOperationsTotal.inc({ status: 'failed' });
      logger.error('Merge failed', { error, input });

      return {
        mergeId,
        sourceMatchIds: input.sourceMatchIds,
        targetMatchId: input.targetMatchId || '',
        mergedDeviceIds: [],
        probability: 0,
        confidence: 0,
        mergeCount: 0,
        status: 'failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  // Update graphs after merge
  private async updateMergedGraphs(targetMatchId: string, sourceMatchIds: string[]): Promise<void> {
    // Find graphs containing source matches
    const graphs = await MatchGraph.find({
      'metadata.relatedMatchIds': { $in: sourceMatchIds }
    });

    for (const graph of graphs) {
      // Add target match to metadata
      if (!graph.metadata.relatedMatchIds) {
        graph.metadata.relatedMatchIds = [];
      }
      (graph.metadata.relatedMatchIds as string[]).push(targetMatchId);

      // Remove source match IDs
      (graph.metadata.relatedMatchIds as string[]) = (
        graph.metadata.relatedMatchIds as string[]
      ).filter((id: string) => !sourceMatchIds.includes(id));

      await graph.save();
    }
  }

  // Update merge statistics
  private async updateMergeStats(mergeCount: number): Promise<void> {
    const stats = await MatchStats.getOrCreateForDate(new Date());
    stats.mergeOperations += mergeCount;
    stats.mergedMatches += 1;
    await stats.save();
  }

  // Split a match into multiple matches
  async splitMatch(matchId: string, deviceGroups: string[][]): Promise<SplitResult> {
    const startTime = Date.now();

    try {
      const originalMatch = await ProbMatch.findByMatchId(matchId);
      if (!originalMatch) {
        return {
          originalMatchId: matchId,
          newMatchIds: [],
          status: 'failed',
          processingTimeMs: Date.now() - startTime
        };
      }

      const newMatchIds: string[] = [];

      for (const deviceGroup of deviceGroups) {
        if (deviceGroup.length === 0) continue;

        const newMatch = new ProbMatch({
          matchId: `match_${uuidv4()}`,
          deviceIds: deviceGroup,
          probability: originalMatch.probability * (deviceGroup.length / originalMatch.deviceIds.length),
          confidence: originalMatch.confidence * 0.9, // Slight reduction for split
          features: originalMatch.features,
          model: originalMatch.model,
          status: 'pending',
          sources: [...originalMatch.sources, 'split'],
          firstSeen: originalMatch.firstSeen,
          lastSeen: new Date(),
          metadata: {
            ...originalMatch.metadata,
            splitFrom: matchId
          }
        });

        await newMatch.save();
        newMatchIds.push(newMatch.matchId);
      }

      // Mark original as merged
      originalMatch.status = 'merged';
      originalMatch.metadata = {
        ...originalMatch.metadata,
        splitInto: newMatchIds
      };
      await originalMatch.save();

      logger.info('Match split', {
        originalMatchId: matchId,
        newMatchCount: newMatchIds.length,
        processingTimeMs: Date.now() - startTime
      });

      return {
        originalMatchId: matchId,
        newMatchIds,
        status: 'success',
        processingTimeMs: Date.now() - startTime
      };
    } catch (error) {
      logger.error('Split failed', { error, matchId });
      return {
        originalMatchId: matchId,
        newMatchIds: [],
        status: 'failed',
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  // Get merge history for a match
  async getMergeHistory(matchId: string): Promise<{
    merges: Array<{
      mergeId: string;
      timestamp: Date;
      sourceMatchIds: string[];
      targetMatchId: string;
      reason?: string;
    }>;
    mergedInto?: string;
    mergedFrom: string[];
  }> {
    const merges: Array<{
      mergeId: string;
      timestamp: Date;
      sourceMatchIds: string[];
      targetMatchId: string;
      reason?: string;
    }> = [];

    // Find all matches that were merged into this one
    const mergedFrom = await ProbMatch.find({
      mergedInto: matchId
    });

    // Find if this match was merged into another
    const match = await ProbMatch.findByMatchId(matchId);
    const mergedInto = match?.mergedInto;

    // Get merge metadata from target match
    if (match?.metadata?.mergeId) {
      merges.push({
        mergeId: match.metadata.mergeId as string,
        timestamp: match.lastSeen,
        sourceMatchIds: match.metadata.sourceMatchIds as string[] || [],
        targetMatchId: matchId,
        reason: match.metadata.mergeReason as string
      });
    }

    return {
      merges,
      mergedInto,
      mergedFrom: mergedFrom.map(m => m.matchId)
    };
  }

  // Undo a merge
  async undoMerge(mergeId: string): Promise<boolean> {
    try {
      // Find the target match with this merge ID
      const targetMatch = await ProbMatch.findOne({
        'metadata.mergeId': mergeId
      });

      if (!targetMatch) {
        logger.warn('Merge not found for undo', { mergeId });
        return false;
      }

      // Find all source matches
      const sourceMatches = await ProbMatch.find({
        mergedInto: targetMatch.matchId
      });

      // Restore source matches
      for (const match of sourceMatches) {
        match.status = 'pending';
        match.mergedInto = undefined;
        await match.save();
      }

      // Update target match
      targetMatch.mergeCount = Math.max(0, targetMatch.mergeCount - sourceMatches.length);
      await targetMatch.save();

      logger.info('Merge undone', {
        mergeId,
        restoredMatches: sourceMatches.length
      });

      return true;
    } catch (error) {
      logger.error('Undo merge failed', { error, mergeId });
      return false;
    }
  }

  // Get merge statistics
  async getMergeStats(): Promise<{
    totalMerges: number;
    successfulMerges: number;
    partialMerges: number;
    failedMerges: number;
    avgDevicesPerMerge: number;
    avgConfidenceAfterMerge: number;
  }> {
    const stats = await MatchStats.aggregate([
      {
        $group: {
          _id: null,
          totalMerges: { $sum: '$mergeOperations' },
          totalMergedMatches: { $sum: '$mergedMatches' }
        }
      }
    ]);

    const matchStats = await ProbMatch.aggregate([
      { $match: { mergeCount: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgDevices: { $avg: { $size: '$deviceIds' } },
          avgConfidence: { $avg: '$confidence' }
        }
      }
    ]);

    return {
      totalMerges: stats[0]?.totalMerges || 0,
      successfulMerges: stats[0]?.totalMergedMatches || 0,
      partialMerges: 0,
      failedMerges: 0,
      avgDevicesPerMerge: Math.round((matchStats[0]?.avgDevices || 0) * 100) / 100,
      avgConfidenceAfterMerge: Math.round(matchStats[0]?.avgConfidence || 0)
    };
  }
}

// Export singleton instance
export const mergeService = new MergeService();