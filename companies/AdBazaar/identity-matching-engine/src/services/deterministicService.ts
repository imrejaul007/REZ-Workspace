import { v4 as uuidv4 } from 'uuid';
import { Identity } from '../models/identity.js';
import { logger } from '../utils/logger.js';

export interface DeterministicIdentifiers {
  email?: string;
  phone?: string;
  deviceId?: string;
  userId?: string;
  cookieId?: string;
  ipAddress?: string;
  browserFingerprint?: string;
  [key: string]: string | undefined;
}

export interface DeterministicResult {
  canonicalId: string;
  confidence: number;
  matchedIdentifiers: string[];
  isNew: boolean;
}

// Deterministic matching weights
const IDENTIFIER_WEIGHTS: Record<string, number> = {
  email: 1.0,
  userId: 1.0,
  phone: 0.95,
  deviceId: 0.9,
  cookieId: 0.85,
  browserFingerprint: 0.8,
  ipAddress: 0.6
};

export async function deterministicMatch(
  identifiers: DeterministicIdentifiers,
  source?: string,
  metadata?: Record<string, any>
): Promise<DeterministicResult> {
  logger.info('Starting deterministic match', { identifiers, source });

  const normalizedIdentifiers = normalizeIdentifiers(identifiers);
  const matchedIds: string[] = [];
  let canonicalId: string | null = null;
  let highestConfidence = 0;
  let existingIdentity = null;

  // Priority order for matching
  const matchPriority = ['userId', 'email', 'phone', 'deviceId', 'cookieId', 'browserFingerprint', 'ipAddress'];

  for (const identifierType of matchPriority) {
    const value = normalizedIdentifiers[identifierType];
    if (!value) continue;

    const existing = await findByIdentifier(identifierType, value);
    if (existing) {
      matchedIds.push(`${identifierType}:${value}`);
      if (existing.confidence > highestConfidence) {
        highestConfidence = existing.confidence;
        canonicalId = existing.canonicalId;
        existingIdentity = existing;
      }
    }
  }

  // Calculate final confidence based on matched identifiers
  let finalConfidence = 0;
  let matchedCount = 0;

  for (const identifierType of matchPriority) {
    const value = normalizedIdentifiers[identifierType];
    if (!value) continue;

    const weight = IDENTIFIER_WEIGHTS[identifierType] || 0.5;
    matchedIds.push(`${identifierType}:${value}`);
    finalConfidence += weight;
    matchedCount++;
  }

  if (matchedCount > 0) {
    finalConfidence = finalConfidence / matchedCount;
  }

  if (canonicalId && existingIdentity) {
    // Update existing identity with new identifiers
    await updateIdentityWithNewIdentifiers(canonicalId, normalizedIdentifiers, source);
    logger.info('Deterministic match found existing identity', { canonicalId, confidence: finalConfidence });

    return {
      canonicalId,
      confidence: finalConfidence,
      matchedIdentifiers: matchedIds,
      isNew: false
    };
  }

  // Create new identity
  const newCanonicalId = `canonical_${uuidv4()}`;
  await createNewIdentity(newCanonicalId, normalizedIdentifiers, source, finalConfidence, metadata);

  logger.info('Created new identity via deterministic match', { canonicalId: newCanonicalId, confidence: finalConfidence });

  return {
    canonicalId: newCanonicalId,
    confidence: finalConfidence,
    matchedIdentifiers: matchedIds,
    isNew: true
  };
}

function normalizeIdentifiers(identifiers: DeterministicIdentifiers): Record<string, string> {
  const normalized: Record<string, string> = {};

  if (identifiers.email) {
    normalized.email = identifiers.email.toLowerCase().trim();
  }

  if (identifiers.phone) {
    normalized.phone = normalizePhone(identifiers.phone);
  }

  if (identifiers.deviceId) {
    normalized.deviceId = identifiers.deviceId.toLowerCase().trim();
  }

  if (identifiers.userId) {
    normalized.userId = identifiers.userId.toLowerCase().trim();
  }

  if (identifiers.cookieId) {
    normalized.cookieId = identifiers.cookieId.toLowerCase().trim();
  }

  if (identifiers.ipAddress) {
    normalized.ipAddress = identifiers.ipAddress.trim();
  }

  if (identifiers.browserFingerprint) {
    normalized.browserFingerprint = identifiers.browserFingerprint.toLowerCase().trim();
  }

  return normalized;
}

function normalizePhone(phone: string): string {
  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\d+]/g, '');

  // If it's an Indian number (starts with +91), normalize to 10 digits
  if (normalized.startsWith('91') && normalized.length > 10) {
    normalized = normalized.slice(2);
  }

  // If 10 digits, add +91 prefix
  if (normalized.length === 10) {
    normalized = '+91' + normalized;
  }

  return normalized;
}

async function findByIdentifier(type: string, value: string): Promise<typeof Identity.prototype | null> {
  const query: Record<string, string> = {};
  query[`identifiers.${type}`] = value;

  return await Identity.findOne(query);
}

async function updateIdentityWithNewIdentifiers(
  canonicalId: string,
  identifiers: Record<string, string>,
  source?: string
): Promise<void> {
  const updateFields: Record<string, any> = {
    lastSeen: new Date()
  };

  for (const [key, value] of Object.entries(identifiers)) {
    updateFields[`identifiers.${key}`] = value;
  }

  if (source) {
    updateFields.$addToSet = { sources: source };
  }

  await Identity.findOneAndUpdate(
    { canonicalId },
    { $set: updateFields }
  );
}

async function createNewIdentity(
  canonicalId: string,
  identifiers: Record<string, string>,
  source?: string,
  confidence?: number,
  metadata?: Record<string, any>
): Promise<void> {
  const identity = new Identity({
    canonicalId,
    identifiers,
    sources: source ? [source] : [],
    confidence: confidence || 1.0,
    firstSeen: new Date(),
    lastSeen: new Date(),
    isActive: true,
    metadata: metadata || {}
  });

  await identity.save();
}

export async function findIdentityByCanonicalId(canonicalId: string): Promise<typeof Identity.prototype | null> {
  return await Identity.findOne({ canonicalId });
}

export async function findIdentitiesByIdentifier(type: string, value: string): Promise<typeof Identity[]> {
  const query: Record<string, string> = {};
  query[`identifiers.${type}`] = value;

  return await Identity.find(query);
}