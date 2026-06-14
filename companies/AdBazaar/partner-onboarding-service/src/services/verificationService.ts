import { v4 as uuidv4 } from 'uuid';
import { Verification, IVerification, VerificationType, VerificationStatus } from '../models/Verification';
import { Partner } from '../models/Partner';
import logger from 'utils/logger.js';

export interface CreateVerificationInput {
  partnerId: string;
  type: VerificationType;
  data: {
    value: string;
    referenceNumber?: string;
  };
  verificationMethod?: 'automated' | 'manual' | 'third_party' | 'otp';
}

class VerificationService {
  /**
   * Create a new verification request
   */
  async createVerification(input: CreateVerificationInput): Promise<IVerification> {
    const verificationId = `ver-${uuidv4().slice(0, 12)}`;

    const verification = new Verification({
      verificationId,
      partnerId: input.partnerId,
      type: input.type,
      status: 'pending',
      data: {
        value: input.data.value,
        referenceNumber: input.data.referenceNumber,
      },
      verificationMethod: input.verificationMethod || 'automated',
      attempts: {
        count: 0,
        lastAttempt: new Date(),
        maxAttempts: 3,
      },
      result: {
        success: false,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await verification.save();
    logger.info('Verification created', { verificationId, partnerId: input.partnerId, type: input.type });

    return verification;
  }

  /**
   * Get verification by ID
   */
  async getVerification(verificationId: string): Promise<IVerification | null> {
    return Verification.findOne({ verificationId });
  }

  /**
   * Get verifications by partner
   */
  async getVerificationsByPartner(
    partnerId: string,
    options: { type?: VerificationType; status?: VerificationStatus } = {}
  ): Promise<IVerification[]> {
    const query: Record<string, unknown> = { partnerId };
    if (options.type) query.type = options.type;
    if (options.status) query.status = options.status;

    return Verification.find(query).sort({ createdAt: -1 });
  }

  /**
   * Start verification process
   */
  async startVerification(verificationId: string): Promise<IVerification | null> {
    const verification = await Verification.findOneAndUpdate(
      { verificationId, status: 'pending' },
      {
        $set: {
          status: 'in_progress',
          'attempts.lastAttempt': new Date(),
        },
        $inc: { 'attempts.count': 1 },
      },
      { new: true }
    );

    if (verification) {
      logger.info('Verification started', { verificationId });
    }

    return verification;
  }

  /**
   * Complete verification
   */
  async completeVerification(
    verificationId: string,
    result: {
      success: boolean;
      message?: string;
      details?: Record<string, unknown>;
      verifiedBy?: string;
    }
  ): Promise<IVerification | null> {
    const verification = await Verification.findOneAndUpdate(
      { verificationId },
      {
        $set: {
          status: result.success ? 'verified' : 'failed',
          'result.success': result.success,
          'result.message': result.message,
          'result.details': result.details,
          'result.verifiedAt': result.success ? new Date() : undefined,
          'result.verifiedBy': result.verifiedBy,
        },
      },
      { new: true }
    );

    if (verification) {
      logger.info('Verification completed', {
        verificationId,
        success: result.success,
        type: verification.type,
      });

      // If verified, update partner status if all verifications are complete
      if (result.success) {
        await this.checkPartnerVerificationComplete(verification.partnerId);
      }
    }

    return verification;
  }

  /**
   * Check if partner has all required verifications complete
   */
  private async checkPartnerVerificationComplete(partnerId: string): Promise<void> {
    const verifications = await Verification.find({
      partnerId,
      status: { $in: ['pending', 'in_progress', 'failed'] },
    });

    if (verifications.length === 0) {
      // All verifications complete, update partner status
      await Partner.findOneAndUpdate(
        { partnerId, status: 'under_review' },
        { $set: { status: 'approved' } }
      );
      logger.info('Partner approved after verification complete', { partnerId });
    }
  }

  /**
   * Send OTP for verification
   */
  async sendOTP(verificationId: string): Promise<{ success: boolean; message: string }> {
    const verification = await Verification.findOne({ verificationId });
    if (!verification) {
      return { success: false, message: 'Verification not found' };
    }

    // In production, integrate with SMS/Email provider
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    logger.info('OTP sent', { verificationId, type: verification.type });

    return {
      success: true,
      message: `OTP sent to ${verification.data.value}`,
    };
  }

  /**
   * Verify OTP
   */
  async verifyOTP(
    verificationId: string,
    otp: string
  ): Promise<{ success: boolean; message: string }> {
    // In production, validate OTP against stored value
    // For now, accept any 6-digit OTP
    if (otp.length === 6 && /^\d+$/.test(otp)) {
      await this.completeVerification(verificationId, {
        success: true,
        message: 'OTP verified successfully',
      });
      return { success: true, message: 'OTP verified successfully' };
    }

    return { success: false, message: 'Invalid OTP' };
  }

  /**
   * Resend verification
   */
  async resendVerification(verificationId: string): Promise<IVerification | null> {
    const verification = await Verification.findOne({ verificationId });
    if (!verification) return null;

    if (verification.attempts.count >= verification.attempts.maxAttempts) {
      logger.warn('Max verification attempts reached', { verificationId });
      return null;
    }

    return this.startVerification(verificationId);
  }

  /**
   * Expire verification
   */
  async expireVerification(verificationId: string): Promise<IVerification | null> {
    return Verification.findOneAndUpdate(
      { verificationId },
      { $set: { status: 'expired' } },
      { new: true }
    );
  }

  /**
   * Get verification summary for partner
   */
  async getVerificationSummary(partnerId: string): Promise<{
    total: number;
    verified: number;
    pending: number;
    failed: number;
    requiredTypes: VerificationType[];
    missingTypes: VerificationType[];
  }> {
    const verifications = await Verification.find({ partnerId });

    const summary = {
      total: verifications.length,
      verified: 0,
      pending: 0,
      failed: 0,
      requiredTypes: ['email', 'phone', 'gstin', 'pan', 'bank'] as VerificationType[],
      missingTypes: [] as VerificationType[],
    };

    for (const v of verifications) {
      if (v.status === 'verified') summary.verified++;
      else if (v.status === 'pending' || v.status === 'in_progress') summary.pending++;
      else if (v.status === 'failed') summary.failed++;
    }

    const verifiedTypes = verifications.filter((v) => v.status === 'verified').map((v) => v.type);
    summary.missingTypes = summary.requiredTypes.filter((t) => !verifiedTypes.includes(t));

    return summary;
  }
}

export const verificationService = new VerificationService();
export default verificationService;