/**
 * KYC Service
 *
 * Handles KYC verification flows for wallet users.
 *
 * Supported verification methods:
 * - Aadhaar eKYC (via UIDAI)
 * - Manual document review
 * - Third-party KYC provider (e.g., ClearTax, Signzy)
 */

import crypto from 'crypto';
import { KycLevel, IKycLevel, KycTier, getLimitsForTier } from '../models/KycLevel';
import mongoose from 'mongoose';
import { logger } from '../config/logger';

// ── Document Encryption ───────────────────────────────────────────────────────

const ENCRYPTION_KEY = process.env.KYC_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Encrypt sensitive document data
 */
export function encryptDocumentData(data: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt sensitive document data
 */
export function decryptDocumentData(encrypted: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ── Verification Services ────────────────────────────────────────────────────

interface KycVerificationResult {
  success: boolean;
  tier?: KycTier;
  error?: string;
  reason?: string;
}

/**
 * Submit KYC for verification
 */
export async function submitKycVerification(
  userId: string,
  data: {
    fullName: string;
    dateOfBirth: string;
    gender?: 'M' | 'F' | 'O';
    documentType: 'AADHAAR' | 'PAN' | 'PASSPORT' | 'DRIVING_LICENSE' | 'VOTER_ID';
    documentNumber: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
    };
  }
): Promise<{ success: boolean; kycId?: string; error?: string }> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check for existing KYC
  const existing = await KycLevel.findOne({ userId: userObjectId });
  if (existing && existing.status === 'approved') {
    return { success: false, error: 'KYC already verified' };
  }

  // Encrypt document number
  const encryptedDocNumber = encryptDocumentData(data.documentNumber);

  // Determine required tier based on document type
  let tier: KycTier = 'L1';
  if (data.documentType === 'PASSPORT') {
    tier = 'L2';
  }

  // Create or update KYC record
  const kyc = await KycLevel.findOneAndUpdate(
    { userId: userObjectId },
    {
      $set: {
        fullName: data.fullName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        documents: {
          type: data.documentType,
          number: encryptedDocNumber,
        },
        address: data.address ? {
          line1: data.address.line1,
          line2: data.address.line2,
          city: data.address.city,
          state: data.address.state,
          postalCode: data.address.postalCode,
          country: data.address.country || 'IN',
        } : undefined,
        tier,
        status: 'in_review',
        amlCheckStatus: 'pending',
      },
      $setOnInsert: {
        userId: userObjectId,
        createdAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  // Trigger AML check asynchronously
  runAmlCheck(kyc._id.toString()).catch(err => {
    logger.error('[KYC] AML check failed', { kycId: kyc._id.toString(), error: err instanceof Error ? err.message : String(err) });
  });

  return { success: true, kycId: kyc._id.toString() };
}

/**
 * Run AML (Anti-Money Laundering) check
 * In production, this would integrate with a compliance provider
 */
export async function runAmlCheck(kycId: string): Promise<void> {
  const kyc = await KycLevel.findById(kycId);
  if (!kyc) return;

  try {
    // In production: Call AML screening provider
    // For now: Simulate AML check
    const amlResult = await simulateAmlCheck(kyc);

    await KycLevel.findByIdAndUpdate(kycId, {
      amlCheckStatus: amlResult.passed ? 'passed' : 'flagged',
      amlCheckAt: new Date(),
      amlRiskScore: amlResult.riskScore,
    });

    // If AML passed, auto-approve L1
    if (amlResult.passed && kyc.tier === 'L1') {
      await approveKyc(kycId, undefined, 'automated');
    }
  } catch (error) {
    await KycLevel.findByIdAndUpdate(kycId, {
      amlCheckStatus: 'failed',
      amlCheckAt: new Date(),
    });
  }
}

/**
 * Simulate AML check (replace with real provider in production)
 */
async function simulateAmlCheck(kyc: IKycLevel): Promise<{ passed: boolean; riskScore: number }> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Simple risk scoring based on age and country
  const age = new Date().getFullYear() - new Date(kyc.dateOfBirth).getFullYear();
  let riskScore = 20; // Base risk

  if (age < 18) riskScore += 30;
  if (age > 70) riskScore += 20;
  if (kyc.address?.country !== 'IN') riskScore += 40;

  return {
    passed: riskScore < 60,
    riskScore,
  };
}

/**
 * Approve KYC
 */
export async function approveKyc(
  kycId: string,
  reviewerId?: string,
  method: 'manual' | 'automated' | 'ekyc' = 'manual'
): Promise<void> {
  const kyc = await KycLevel.findById(kycId);
  if (!kyc) throw new Error('KYC not found');

  const limits = getLimitsForTier(kyc.tier);

  await KycLevel.findByIdAndUpdate(kycId, {
    status: 'approved',
    verifiedAt: new Date(),
    verifiedBy: reviewerId ? new mongoose.Types.ObjectId(reviewerId) : undefined,
    verificationMethod: method,
    dailyLimit: limits.daily,
    monthlyLimit: limits.monthly,
    maxBalance: limits.maxBalance,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  });

  logger.info('[KYC] Approved', { userId: kyc.userId, tier: kyc.tier });
}

/**
 * Reject KYC
 */
export async function rejectKyc(
  kycId: string,
  reviewerId: string,
  reason: string
): Promise<void> {
  await KycLevel.findByIdAndUpdate(kycId, {
    status: 'rejected',
    verifiedAt: new Date(),
    verifiedBy: new mongoose.Types.ObjectId(reviewerId),
    verificationMethod: 'manual',
    rejectionReason: reason,
  });

  logger.info('[KYC] Rejected', { kycId, reason });
}

/**
 * Get KYC status for user
 */
export async function getKycStatus(userId: string): Promise<{
  tier: KycTier;
  status: string;
  dailyLimit: number;
  monthlyLimit: number;
  maxBalance: number;
  expiresAt?: Date;
} | null> {
  const kyc = await KycLevel.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  }).lean();

  if (!kyc) {
    return {
      tier: 'L0',
      status: 'none',
      dailyLimit: getLimitsForTier('L0').daily,
      monthlyLimit: getLimitsForTier('L0').monthly,
      maxBalance: getLimitsForTier('L0').maxBalance,
    };
  }

  return {
    tier: kyc.tier as KycTier,
    status: kyc.status,
    dailyLimit: kyc.dailyLimit || getLimitsForTier(kyc.tier as KycTier).daily,
    monthlyLimit: kyc.monthlyLimit || getLimitsForTier(kyc.tier as KycTier).monthly,
    maxBalance: kyc.maxBalance || getLimitsForTier(kyc.tier as KycTier).maxBalance,
    expiresAt: kyc.expiresAt,
  };
}
