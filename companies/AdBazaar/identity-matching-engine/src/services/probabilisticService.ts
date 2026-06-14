import { Identity } from '../models/identity.js';
import { logger } from '../utils/logger.js';

export interface ProbabilisticFeatures {
  emailHash?: string;
  phoneHash?: string;
  deviceHash?: string;
  ipHash?: string;
  userAgent?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  cookies?: string[];
  pixelData?: Record<string, any>;
  [key: string]: any;
}

export interface ProbabilisticResult {
  matchFound: boolean;
  canonicalId?: string;
  confidence?: number;
  matchedFeatures?: string[];
  isNew?: boolean;
}

// Feature weights for probabilistic matching
const FEATURE_WEIGHTS: Record<string, number> = {
  emailHash: 0.25,
  phoneHash: 0.20,
  deviceHash: 0.25,
  ipHash: 0.05,
  userAgent: 0.05,
  screenResolution: 0.05,
  timezone: 0.03,
  language: 0.02,
  cookies: 0.10
};

// Minimum weight for a feature to contribute to the match
const MIN_FEATURE_WEIGHT = 0.01;

export async function probabilisticMatch(
  features: ProbabilisticFeatures,
  threshold: number = 0.7,
  source?: string
): Promise<ProbabilisticResult> {
  logger.info('Starting probabilistic match', { features, threshold });

  const normalizedFeatures = normalizeFeatures(features);
  const featureScores: Map<string, { score: number; identityId: string }> = new Map();

  // Score each candidate identity
  const candidates = await getCandidateIdentities(normalizedFeatures);

  for (const candidate of candidates) {
    const score = calculateMatchScore(normalizedFeatures, candidate);
    if (score > 0) {
      const existing = featureScores.get(candidate.canonicalId);
      if (!existing || score > existing.score) {
        featureScores.set(candidate.canonicalId, { score, identityId: candidate.canonicalId });
      }
    }
  }

  // Find the best match
  let bestMatch: { canonicalId: string; score: number } | null = null;
  for (const [canonicalId, data] of featureScores.entries()) {
    if (!bestMatch || data.score > bestMatch.score) {
      bestMatch = { canonicalId, score: data.score };
    }
  }

  if (bestMatch && bestMatch.score >= threshold) {
    // Update the matched identity
    await updateIdentityWithFeatures(bestMatch.canonicalId, normalizedFeatures, source);

    logger.info('Probabilistic match found', {
      canonicalId: bestMatch.canonicalId,
      score: bestMatch.score,
      threshold
    });

    return {
      matchFound: true,
      canonicalId: bestMatch.canonicalId,
      confidence: bestMatch.score,
      matchedFeatures: getMatchedFeatures(normalizedFeatures, bestMatch.score),
      isNew: false
    };
  }

  // No match found - create new identity
  const newCanonicalId = `canonical_prob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await createProbabilisticIdentity(newCanonicalId, normalizedFeatures, source, bestMatch?.score || 0);

  logger.info('Created new identity via probabilistic match', {
    canonicalId: newCanonicalId,
    score: bestMatch?.score || 0
  });

  return {
    matchFound: false,
    canonicalId: newCanonicalId,
    confidence: bestMatch?.score || 0,
    isNew: true
  };
}

function normalizeFeatures(features: ProbabilisticFeatures): Record<string, any> {
  const normalized: Record<string, any> = {};

  // Hash-based features (already hashed, just normalize)
  if (features.emailHash) normalized.emailHash = features.emailHash.toLowerCase().trim();
  if (features.phoneHash) normalized.phoneHash = features.phoneHash.toLowerCase().trim();
  if (features.deviceHash) normalized.deviceHash = features.deviceHash.toLowerCase().trim();
  if (features.ipHash) normalized.ipHash = features.ipHash.toLowerCase().trim();

  // Browser features
  if (features.userAgent) normalized.userAgent = features.userAgent.toLowerCase().trim();
  if (features.screenResolution) normalized.screenResolution = features.screenResolution.toLowerCase().trim();
  if (features.timezone) normalized.timezone = features.timezone.toLowerCase().trim();
  if (features.language) normalized.language = features.language.toLowerCase().trim();

  // Cookie fingerprints
  if (features.cookies && Array.isArray(features.cookies)) {
    normalized.cookies = features.cookies.map(c => c.toLowerCase().trim()).sort();
    normalized.cookieCount = features.cookies.length;
  }

  // Additional pixel data
  if (features.pixelData) {
    normalized.pixelData = features.pixelData;
  }

  return normalized;
}

async function getCandidateIdentities(features: Record<string, any>): Promise<any[]> {
  const queries: any[] = [];

  // Build candidate queries based on available features
  if (features.emailHash) {
    queries.push({ 'identifiers.email': { $exists: true, $ne: '' } });
  }
  if (features.phoneHash) {
    queries.push({ 'identifiers.phone': { $exists: true, $ne: '' } });
  }
  if (features.deviceHash) {
    queries.push({ 'identifiers.deviceId': { $exists: true, $ne: '' } });
  }

  if (queries.length === 0) {
    // If no specific identifiers, get recent identities
    return await Identity.find({ isActive: true })
      .sort({ lastSeen: -1 })
      .limit(1000);
  }

  return await Identity.find({
    $or: queries,
    isActive: true
  }).limit(1000);
}

function calculateMatchScore(features: Record<string, any>, candidate: any): number {
  let totalWeight = 0;
  let weightedScore = 0;

  // Check email hash match
  if (features.emailHash && candidate.identifiers.email) {
    const emailScore = hashMatchScore(features.emailHash, candidate.identifiers.email);
    if (emailScore > 0) {
      weightedScore += emailScore * FEATURE_WEIGHTS.emailHash;
      totalWeight += FEATURE_WEIGHTS.emailHash;
    }
  }

  // Check phone hash match
  if (features.phoneHash && candidate.identifiers.phone) {
    const phoneScore = hashMatchScore(features.phoneHash, candidate.identifiers.phone);
    if (phoneScore > 0) {
      weightedScore += phoneScore * FEATURE_WEIGHTS.phoneHash;
      totalWeight += FEATURE_WEIGHTS.phoneHash;
    }
  }

  // Check device hash match
  if (features.deviceHash && candidate.identifiers.deviceId) {
    const deviceScore = hashMatchScore(features.deviceHash, candidate.identifiers.deviceId);
    if (deviceScore > 0) {
      weightedScore += deviceScore * FEATURE_WEIGHTS.deviceHash;
      totalWeight += FEATURE_WEIGHTS.deviceHash;
    }
  }

  // Check IP hash match
  if (features.ipHash && candidate.identifiers.ipAddress) {
    const ipScore = hashMatchScore(features.ipHash, candidate.identifiers.ipAddress);
    if (ipScore > 0) {
      weightedScore += ipScore * FEATURE_WEIGHTS.ipHash;
      totalWeight += FEATURE_WEIGHTS.ipHash;
    }
  }

  // Check user agent match
  if (features.userAgent && candidate.metadata?.userAgent) {
    const uaScore = fuzzyStringMatch(features.userAgent, candidate.metadata.userAgent);
    if (uaScore > 0) {
      weightedScore += uaScore * FEATURE_WEIGHTS.userAgent;
      totalWeight += FEATURE_WEIGHTS.userAgent;
    }
  }

  // Check screen resolution match
  if (features.screenResolution && candidate.metadata?.screenResolution) {
    const srScore = features.screenResolution === candidate.metadata.screenResolution ? 1.0 : 0;
    if (srScore > 0) {
      weightedScore += srScore * FEATURE_WEIGHTS.screenResolution;
      totalWeight += FEATURE_WEIGHTS.screenResolution;
    }
  }

  // Check timezone match
  if (features.timezone && candidate.metadata?.timezone) {
    const tzScore = features.timezone === candidate.metadata.timezone ? 1.0 : 0.5;
    if (tzScore > 0) {
      weightedScore += tzScore * FEATURE_WEIGHTS.timezone;
      totalWeight += FEATURE_WEIGHTS.timezone;
    }
  }

  // Check language match
  if (features.language && candidate.metadata?.language) {
    const langScore = features.language === candidate.metadata.language ? 1.0 : 0.5;
    if (langScore > 0) {
      weightedScore += langScore * FEATURE_WEIGHTS.language;
      totalWeight += FEATURE_WEIGHTS.language;
    }
  }

  // Check cookie fingerprint overlap
  if (features.cookies && candidate.metadata?.cookies) {
    const cookieScore = calculateCookieSimilarity(features.cookies, candidate.metadata.cookies);
    if (cookieScore > 0) {
      weightedScore += cookieScore * FEATURE_WEIGHTS.cookies;
      totalWeight += FEATURE_WEIGHTS.cookies;
    }
  }

  // Normalize score
  if (totalWeight === 0) return 0;
  return weightedScore / totalWeight;
}

function hashMatchScore(hash1: string, value2: string): number {
  // Simple comparison - in production, use proper fuzzy matching
  if (hash1 === value2) return 1.0;
  if (hash1.length === value2.length) return 0.9;
  if (hash1.substring(0, 8) === value2.substring(0, 8)) return 0.7;
  return 0;
}

function fuzzyStringMatch(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;

  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1.0;

  // Simple Levenshtein distance ratio
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function calculateCookieSimilarity(cookies1: string[], cookies2: string[]): number {
  const set1 = new Set(cookies1);
  const set2 = new Set(cookies2);

  let intersection = 0;
  for (const cookie of set1) {
    if (set2.has(cookie)) intersection++;
  }

  const union = set1.size + set2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function getMatchedFeatures(features: Record<string, any>, score: number): string[] {
  const matched: string[] = [];

  // All features contribute to the score
  for (const key of Object.keys(FEATURE_WEIGHTS)) {
    if (features[key]) {
      matched.push(key);
    }
  }

  return matched;
}

async function updateIdentityWithFeatures(
  canonicalId: string,
  features: Record<string, any>,
  source?: string
): Promise<void> {
  const updateFields: Record<string, any> = {
    lastSeen: new Date()
  };

  // Store browser fingerprints in metadata
  if (features.userAgent) updateFields['metadata.userAgent'] = features.userAgent;
  if (features.screenResolution) updateFields['metadata.screenResolution'] = features.screenResolution;
  if (features.timezone) updateFields['metadata.timezone'] = features.timezone;
  if (features.language) updateFields['metadata.language'] = features.language;
  if (features.cookies) updateFields['metadata.cookies'] = features.cookies;
  if (features.pixelData) updateFields['metadata.pixelData'] = features.pixelData;

  const update: any = { $set: updateFields };
  if (source) {
    update.$addToSet = { sources: source };
  }

  await Identity.findOneAndUpdate({ canonicalId }, update);
}

async function createProbabilisticIdentity(
  canonicalId: string,
  features: Record<string, any>,
  source?: string,
  confidence?: number
): Promise<void> {
  const metadata: Record<string, any> = {};

  if (features.userAgent) metadata.userAgent = features.userAgent;
  if (features.screenResolution) metadata.screenResolution = features.screenResolution;
  if (features.timezone) metadata.timezone = features.timezone;
  if (features.language) metadata.language = features.language;
  if (features.cookies) metadata.cookies = features.cookies;
  if (features.pixelData) metadata.pixelData = features.pixelData;

  const identity = new Identity({
    canonicalId,
    identifiers: {
      email: features.emailHash,
      phone: features.phoneHash,
      deviceId: features.deviceHash,
      ipAddress: features.ipHash
    },
    sources: source ? [source] : [],
    confidence: confidence || 0.5,
    firstSeen: new Date(),
    lastSeen: new Date(),
    isActive: true,
    metadata
  });

  await identity.save();
}

export async function calculateIdentityConfidence(canonicalId: string): Promise<number> {
  const identity = await Identity.findOne({ canonicalId });
  if (!identity) return 0;

  let totalWeight = 0;
  let totalScore = 0;

  const identifiers = identity.identifiers as Map<string, string>;
  for (const [type, value] of Object.entries(Object.fromEntries(identifiers))) {
    if (value) {
      const weight = FEATURE_WEIGHTS[type] || MIN_FEATURE_WEIGHT;
      totalWeight += weight;
      totalScore += weight;
    }
  }

  // Factor in recency
  const daysSinceLastSeen = (Date.now() - identity.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0.5, 1 - daysSinceLastSeen / 365);

  return totalWeight > 0 ? (totalScore / totalWeight) * recencyFactor : 0;
}