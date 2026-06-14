import { v4 as uuidv4 } from 'uuid';
import { Identity } from '../models/identity.js';
import { MatchResult } from '../models/matchResult.js';
import { logger } from '../utils/logger.js';
import { mergeGraphs } from './graphService.js';

export interface MergeResult {
  mergeId: string;
  canonicalId: string;
  mergedIds: string[];
}

export type MergeStrategy = 'prefer_latest' | 'prefer_highest_confidence' | 'manual';

export async function mergeIdentities(
  sourceIds: string[],
  targetId?: string,
  strategy: MergeStrategy = 'prefer_latest',
  metadata?: Record<string, any>
): Promise<MergeResult> {
  logger.info('Starting identity merge', { sourceIds, targetId, strategy });

  // Validate source IDs
  if (sourceIds.length < 2) {
    throw new Error('At least 2 source IDs are required for merge');
  }

  // Find or validate target identity
  let targetIdentity: typeof Identity.prototype | null = null;

  if (targetId) {
    targetIdentity = await Identity.findOne({ canonicalId: targetId });
    if (!targetIdentity) {
      throw new Error(`Target identity ${targetId} not found`);
    }
  } else {
    // Determine target based on strategy
    targetIdentity = await determineTargetIdentity(sourceIds, strategy);
  }

  if (!targetIdentity) {
    throw new Error('Could not determine target identity');
  }

  const finalTargetId = targetIdentity.canonicalId;
  const mergedIds: string[] = [finalTargetId];

  // Get all source identities
  const identities = await Identity.find({
    canonicalId: { $in: sourceIds }
  });

  if (identities.length === 0) {
    throw new Error('No matching identities found for the provided source IDs');
  }

  // Merge all source identities into target
  for (const identity of identities) {
    if (identity.canonicalId === finalTargetId) continue;

    await mergeIntoTarget(identity, targetIdentity, metadata);
    mergedIds.push(identity.canonicalId);
  }

  // Update target identity metadata
  await updateTargetMetadata(finalTargetId, metadata);

  // Merge identity graphs
  for (const sourceId of sourceIds) {
    if (sourceId !== finalTargetId) {
      await mergeGraphs(sourceId, finalTargetId);
    }
  }

  // Create merge result record
  const mergeResult = new MatchResult({
    sourceIds: mergedIds,
    targetId: finalTargetId,
    method: 'merge',
    confidence: calculateMergeConfidence(identities, targetIdentity),
    features: {
      strategy,
      mergedCount: identities.length,
      ...metadata
    },
    createdAt: new Date()
  });

  await mergeResult.save();

  logger.info('Identity merge completed', { mergeId: mergeResult._id.toString(), mergedIds });

  return {
    mergeId: mergeResult._id.toString(),
    canonicalId: finalTargetId,
    mergedIds
  };
}

async function determineTargetIdentity(
  sourceIds: string[],
  strategy: MergeStrategy
): Promise<typeof Identity.prototype | null> {
  const identities = await Identity.find({
    canonicalId: { $in: sourceIds }
  });

  if (identities.length === 0) return null;
  if (identities.length === 1) return identities[0];

  switch (strategy) {
    case 'prefer_latest':
      // Return identity with most recent lastSeen
      return identities.reduce((latest, current) => {
        return current.lastSeen > latest.lastSeen ? current : latest;
      });

    case 'prefer_highest_confidence':
      // Return identity with highest confidence score
      return identities.reduce((highest, current) => {
        return current.confidence > highest.confidence ? current : highest;
      });

    case 'manual':
      // For manual, return the first identity (caller must specify target)
      return identities[0];

    default:
      return identities[0];
  }
}

async function mergeIntoTarget(
  sourceIdentity: typeof Identity.prototype,
  targetIdentity: typeof Identity.prototype,
  metadata?: Record<string, any>
): Promise<void> {
  const sourceIdentifiers = sourceIdentity.identifiers as Map<string, string>;
  const targetIdentifiers = targetIdentity.identifiers as Map<string, string>;

  const updateFields: Record<string, any> = {
    lastSeen: new Date()
  };

  // Merge identifiers (only add missing ones)
  for (const [type, value] of Object.entries(Object.fromEntries(sourceIdentifiers))) {
    if (!targetIdentifiers.get(type) && value) {
      updateFields[`identifiers.${type}`] = value;
    }
  }

  // Merge sources
  for (const source of sourceIdentity.sources) {
    if (!targetIdentity.sources.includes(source)) {
      if (!updateFields.$addToSet) {
        updateFields.$addToSet = {};
      }
      if (!updateFields.$addToSet.sources) {
        updateFields.$addToSet.sources = [];
      }
      updateFields.$addToSet.sources.push(source);
    }
  }

  // Merge metadata
  if (sourceIdentity.metadata) {
    const sourceMetadata = sourceIdentity.metadata as Map<string, any>;
    for (const [key, value] of Object.entries(Object.fromEntries(sourceMetadata))) {
      if (!targetIdentity.metadata?.get(key)) {
        updateFields[`metadata.${key}`] = value;
      }
    }
  }

  // Update target
  await Identity.findOneAndUpdate(
    { canonicalId: targetIdentity.canonicalId },
    { $set: updateFields }
  );

  // Mark source as inactive (merged)
  await Identity.findOneAndUpdate(
    { canonicalId: sourceIdentity.canonicalId },
    {
      $set: {
        isActive: false,
        metadata: {
          ...sourceIdentity.metadata,
          mergedInto: targetIdentity.canonicalId,
          mergedAt: new Date(),
          ...metadata
        }
      }
    }
  );
}

async function updateTargetMetadata(
  canonicalId: string,
  metadata?: Record<string, any>
): Promise<void> {
  if (!metadata) return;

  const updateFields: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    updateFields[`metadata.${key}`] = value;
  }

  await Identity.findOneAndUpdate(
    { canonicalId },
    { $set: updateFields }
  );
}

function calculateMergeConfidence(
  sources: typeof Identity[],
  target: typeof Identity.prototype
): number {
  if (sources.length === 0) return 0;

  let totalConfidence = target.confidence;
  let count = 1;

  for (const source of sources) {
    totalConfidence += source.confidence;
    count++;
  }

  // Average confidence
  const avgConfidence = totalConfidence / count;

  // Bonus for multiple identifiers
  const targetIdentifiers = target.identifiers as Map<string, string>;
  const identifierBonus = Math.min(0.1, (targetIdentifiers.size - 1) * 0.02);

  return Math.min(1, avgConfidence + identifierBonus);
}

export async function unmergeIdentity(
  canonicalId: string,
  sourceId: string
): Promise<{
  originalId: string;
  extractedId: string;
  extractedIdentifiers: string[];
}> {
  const targetIdentity = await Identity.findOne({ canonicalId });
  const sourceIdentity = await Identity.findOne({ canonicalId: sourceId });

  if (!targetIdentity) {
    throw new Error('Target identity not found');
  }

  // Create new identity from source
  const newCanonicalId = `canonical_unmerged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const extractedIdentifiers: Record<string, string> = {};
  const targetIdentifiers = targetIdentity.identifiers as Map<string, string>;

  if (sourceIdentity) {
    const sourceIdentifiers = sourceIdentity.identifiers as Map<string, string>;

    // Extract identifiers that were from the source
    for (const [type, value] of Object.entries(Object.fromEntries(sourceIdentifiers))) {
      if (value) {
        extractedIdentifiers[type] = value;
        // Remove from target
        delete targetIdentifiers[type as string];
      }
    }

    // Restore source identity
    sourceIdentity.isActive = true;
    delete sourceIdentity.metadata?.mergedInto;
    await sourceIdentity.save();
  } else {
    // Create new identity with half the identifiers
    const types = Array.from(targetIdentifiers.keys());
    const midPoint = Math.floor(types.length / 2);

    for (let i = midPoint; i < types.length; i++) {
      const type = types[i];
      const value = targetIdentifiers.get(type);
      if (value) {
        extractedIdentifiers[type] = value;
        delete targetIdentifiers[type];
      }
    }

    // Create new identity
    const newIdentity = new Identity({
      canonicalId: newCanonicalId,
      identifiers: extractedIdentifiers,
      sources: ['unmerge'],
      confidence: 0.8,
      firstSeen: new Date(),
      lastSeen: new Date(),
      isActive: true,
      metadata: {
        unmergedFrom: canonicalId,
        unmergedAt: new Date()
      }
    });

    await newIdentity.save();
  }

  // Update target
  targetIdentity.lastSeen = new Date();
  await targetIdentity.save();

  logger.info('Identity unmerged', { originalId: canonicalId, extractedId: newCanonicalId || sourceId });

  return {
    originalId: canonicalId,
    extractedId: newCanonicalId || sourceId,
    extractedIdentifiers: Object.keys(extractedIdentifiers)
  };
}

export async function getMergeHistory(canonicalId: string): Promise<{
  mergesInto: typeof MatchResult[];
  mergedFrom: typeof MatchResult[];
}> {
  const mergesInto = await MatchResult.find({
    sourceIds: canonicalId,
    method: 'merge'
  }).sort({ createdAt: -1 });

  const mergedFrom = await MatchResult.find({
    targetId: canonicalId,
    method: 'merge'
  }).sort({ createdAt: -1 });

  return { mergesInto, mergedFrom };
}

export async function validateMerge(
  sourceIds: string[],
  targetId?: string
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (sourceIds.length < 2) {
    errors.push('At least 2 source IDs are required for merge');
  }

  // Check if all source IDs exist
  const identities = await Identity.find({
    canonicalId: { $in: sourceIds }
  });

  const foundIds = new Set(identities.map(i => i.canonicalId));
  for (const sourceId of sourceIds) {
    if (!foundIds.has(sourceId)) {
      errors.push(`Source identity ${sourceId} not found`);
    }
  }

  // Check target if specified
  if (targetId) {
    const target = await Identity.findOne({ canonicalId: targetId });
    if (!target) {
      errors.push(`Target identity ${targetId} not found`);
    } else if (!sourceIds.includes(targetId)) {
      errors.push('Target must be one of the source IDs');
    }
  }

  // Check for conflicts
  if (identities.length >= 2) {
    for (let i = 0; i < identities.length; i++) {
      for (let j = i + 1; j < identities.length; j++) {
        const identifiers1 = identities[i].identifiers as Map<string, string>;
        const identifiers2 = identities[j].identifiers as Map<string, string>;

        for (const [type, value1] of Object.entries(Object.fromEntries(identifiers1))) {
          const value2 = identifiers2.get(type);
          if (value1 && value2 && value1 !== value2) {
            warnings.push(
              `Conflict: ${type} differs between ${identities[i].canonicalId} and ${identities[j].canonicalId}`
            );
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}