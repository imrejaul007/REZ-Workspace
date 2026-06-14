import { Identity } from '../models/identity.js';
import { MatchResult } from '../models/matchResult.js';
import { logger } from '../utils/logger.js';

export interface ResolutionResult {
  canonicalId: string;
  isNew: boolean;
  confidence: number;
  resolutionMethod: 'exact_match' | 'inferred' | 'merged' | 'created';
  matchedIdentifiers: string[];
}

export interface IdentifierSet {
  email?: string;
  phone?: string;
  deviceId?: string;
  userId?: string;
  cookieId?: string;
  ipAddress?: string;
  browserFingerprint?: string;
  [key: string]: string | undefined;
}

export async function resolveToCanonical(
  identifiers: IdentifierSet,
  preferExisting: boolean = true
): Promise<ResolutionResult> {
  logger.info('Resolving to canonical ID', { identifiers, preferExisting });

  // First, try exact match (deterministic)
  const exactMatch = await findExactMatch(identifiers);

  if (exactMatch) {
    logger.info('Found exact match', { canonicalId: exactMatch.canonicalId });
    return {
      canonicalId: exactMatch.canonicalId,
      isNew: false,
      confidence: exactMatch.confidence,
      resolutionMethod: 'exact_match',
      matchedIdentifiers: getMatchedIdentifiers(identifiers, exactMatch)
    };
  }

  // Try to find via probabilistic matching
  const probabilisticMatch = await findProbabilisticMatch(identifiers);

  if (probabilisticMatch && preferExisting) {
    logger.info('Found probabilistic match', { canonicalId: probabilisticMatch.canonicalId });
    return {
      canonicalId: probabilisticMatch.canonicalId,
      isNew: false,
      confidence: probabilisticMatch.confidence,
      resolutionMethod: 'inferred',
      matchedIdentifiers: probabilisticMatch.matchedIdentifiers
    };
  }

  // Check if we can merge with existing identity
  const mergeCandidate = await findMergeCandidate(identifiers);

  if (mergeCandidate && preferExisting) {
    // Merge the identifiers with existing identity
    await mergeIdentifiers(identifiers, mergeCandidate.canonicalId);
    logger.info('Merged with existing identity', { canonicalId: mergeCandidate.canonicalId });

    return {
      canonicalId: mergeCandidate.canonicalId,
      isNew: false,
      confidence: mergeCandidate.confidence,
      resolutionMethod: 'merged',
      matchedIdentifiers: getMatchedIdentifiers(identifiers, mergeCandidate)
    };
  }

  // Create new identity
  const newCanonicalId = `canonical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await createIdentity(newCanonicalId, identifiers);

  logger.info('Created new canonical identity', { canonicalId: newCanonicalId });

  return {
    canonicalId: newCanonicalId,
    isNew: true,
    confidence: 1.0,
    resolutionMethod: 'created',
    matchedIdentifiers: []
  };
}

async function findExactMatch(identifiers: IdentifierSet): Promise<typeof Identity.prototype | null> {
  const query: any[] = [];

  for (const [type, value] of Object.entries(identifiers)) {
    if (value) {
      query.push({ [`identifiers.${type}`]: normalizeValue(type, value) });
    }
  }

  if (query.length === 0) return null;

  // Find identity matching all identifiers
  const identity = await Identity.findOne({ $and: query });

  if (identity) return identity;

  // If no full match, find identity matching any identifier (prefer strongest)
  const matchPriority = ['userId', 'email', 'phone', 'deviceId', 'cookieId', 'browserFingerprint', 'ipAddress'];

  for (const type of matchPriority) {
    const value = identifiers[type];
    if (!value) continue;

    const normalized = normalizeValue(type, value);
    const match = await Identity.findOne({ [`identifiers.${type}`]: normalized });

    if (match) return match;
  }

  return null;
}

async function findProbabilisticMatch(identifiers: IdentifierSet): Promise<{
  canonicalId: string;
  confidence: number;
  matchedIdentifiers: string[];
} | null> {
  // Build feature vector
  const features: Record<string, number> = {};

  if (identifiers.email) features.email = 1;
  if (identifiers.phone) features.phone = 1;
  if (identifiers.deviceId) features.device = 1;
  if (identifiers.ipAddress) features.ip = 0.5;
  if (identifiers.browserFingerprint) features.fingerprint = 0.8;

  const totalFeatures = Object.keys(features).length;
  if (totalFeatures < 2) return null;

  // Get candidate identities
  const candidates = await Identity.find({ isActive: true })
    .sort({ lastSeen: -1 })
    .limit(100);

  let bestMatch: { canonicalId: string; confidence: number; matchedIdentifiers: string[] } | null = null;

  for (const candidate of candidates) {
    const score = calculateMatchScore(identifiers, candidate);
    if (score >= 0.7 && (!bestMatch || score > bestMatch.confidence)) {
      bestMatch = {
        canonicalId: candidate.canonicalId,
        confidence: score,
        matchedIdentifiers: getMatchedIdentifiers(identifiers, candidate)
      };
    }
  }

  return bestMatch;
}

function calculateMatchScore(identifiers: IdentifierSet, identity: any): number {
  let matches = 0;
  const identifiersMap = identity.identifiers as Map<string, string>;

  const matchPriority = [
    { type: 'email', weight: 0.3 },
    { type: 'phone', weight: 0.25 },
    { type: 'deviceId', weight: 0.2 },
    { type: 'cookieId', weight: 0.1 },
    { type: 'browserFingerprint', weight: 0.1 },
    { type: 'ipAddress', weight: 0.05 }
  ];

  for (const { type, weight } of matchPriority) {
    const inputValue = identifiers[type];
    const identityValue = identifiersMap.get(type);

    if (inputValue && identityValue) {
      const normalizedInput = normalizeValue(type, inputValue);
      const normalizedIdentity = normalizeValue(type, identityValue);

      if (normalizedInput === normalizedIdentity) {
        matches += weight;
      }
    }
  }

  return matches;
}

async function findMergeCandidate(identifiers: IdentifierSet): Promise<typeof Identity.prototype | null> {
  // Find identities with partial overlap
  const query: any[] = [];

  for (const [type, value] of Object.entries(identifiers)) {
    if (value && ['email', 'phone', 'deviceId'].includes(type)) {
      query.push({ [`identifiers.${type}`]: normalizeValue(type, value) });
    }
  }

  if (query.length === 0) return null;

  return await Identity.findOne({ $or: query, isActive: true });
}

async function mergeIdentifiers(
  identifiers: IdentifierSet,
  canonicalId: string
): Promise<void> {
  const updateFields: Record<string, any> = {
    lastSeen: new Date()
  };

  for (const [type, value] of Object.entries(identifiers)) {
    if (value) {
      updateFields[`identifiers.${type}`] = normalizeValue(type, value);
    }
  }

  await Identity.findOneAndUpdate(
    { canonicalId },
    { $set: updateFields }
  );
}

async function createIdentity(
  canonicalId: string,
  identifiers: IdentifierSet
): Promise<void> {
  const normalized: Record<string, string> = {};

  for (const [type, value] of Object.entries(identifiers)) {
    if (value) {
      normalized[type] = normalizeValue(type, value);
    }
  }

  const identity = new Identity({
    canonicalId,
    identifiers: normalized,
    sources: ['resolution_service'],
    confidence: 1.0,
    firstSeen: new Date(),
    lastSeen: new Date(),
    isActive: true,
    metadata: {}
  });

  await identity.save();
}

function normalizeValue(type: string, value: string): string {
  const normalized = value.toLowerCase().trim();

  if (type === 'phone') {
    return normalizePhone(normalized);
  }

  return normalized;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.startsWith('91') && digits.length > 10) {
    return `+${digits}`;
  }

  return phone;
}

function getMatchedIdentifiers(
  inputIdentifiers: IdentifierSet,
  identity: any
): string[] {
  const matched: string[] = [];
  const identifiersMap = identity.identifiers as Map<string, string>;

  for (const [type, value] of Object.entries(inputIdentifiers)) {
    if (!value) continue;

    const identityValue = identifiersMap.get(type);
    if (identityValue && normalizeValue(type, value) === normalizeValue(type, identityValue)) {
      matched.push(type);
    }
  }

  return matched;
}

export async function getCanonicalIdHistory(
  canonicalId: string
): Promise<{
  current: typeof Identity.prototype;
  previous: typeof Identity[];
  merges: typeof MatchResult[];
}> {
  const current = await Identity.findOne({ canonicalId });

  if (!current) {
    return { current: null as any, previous: [], merges: [] };
  }

  // Find previous merges involving this canonical ID
  const merges = await MatchResult.find({
    targetId: canonicalId,
    method: 'merge'
  }).sort({ createdAt: -1 });

  // Get identities that were merged into this one
  const mergedIds = merges.flatMap(m => m.sourceIds);
  const previous = await Identity.find({
    canonicalId: { $in: mergedIds }
  });

  return { current, previous, merges };
}

export async function splitIdentity(
  canonicalId: string,
  identifiersToSplit: string[]
): Promise<{
  originalId: string;
  newId: string;
  splitIdentifiers: string[];
}> {
  const identity = await Identity.findOne({ canonicalId });

  if (!identity) {
    throw new Error('Identity not found');
  }

  // Create new identity for split identifiers
  const newCanonicalId = `canonical_split_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newIdentifiers: Record<string, string> = {};
  const identifiersMap = identity.identifiers as Map<string, string>;

  for (const type of identifiersToSplit) {
    const value = identifiersMap.get(type);
    if (value) {
      newIdentifiers[type] = value;
      delete identity.identifiers[type];
    }
  }

  // Update original identity
  identity.lastSeen = new Date();
  await identity.save();

  // Create new identity
  await createIdentity(newCanonicalId, newIdentifiers);

  logger.info('Split identity', { originalId: canonicalId, newId: newCanonicalId, splitIdentifiers: identifiersToSplit });

  return {
    originalId: canonicalId,
    newId: newCanonicalId,
    splitIdentifiers: identifiersToSplit
  };
}