import { v4 as uuidv4 } from 'uuid';
import { Partner, IPartner, PartnerType, PartnerStatus, PartnerTier } from '../models/Partner';
import logger from 'utils/logger.js';

export interface CreatePartnerInput {
  userId: string;
  type: PartnerType;
  companyDetails: {
    name: string;
    legalName?: string;
    website?: string;
    industry: string;
    employeeCount?: string;
    annualRevenue?: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    designation: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country?: string;
    pincode: string;
  };
  taxInfo?: {
    gstin?: string;
    pan?: string;
    tan?: string;
  };
  bankDetails?: {
    accountHolder: string;
    accountNumber: string;
    bankName: string;
    branch: string;
    ifscCode: string;
    upiId?: string;
  };
  referralCode?: string;
  referredBy?: string;
}

class PartnerService {
  /**
   * Create a new partner
   */
  async createPartner(input: CreatePartnerInput): Promise<IPartner> {
    const partnerId = `partner-${uuidv4().slice(0, 8)}`;

    // Generate unique referral code
    const referralCode = this.generateReferralCode(input.companyDetails.name);

    const partner = new Partner({
      partnerId,
      userId: input.userId,
      type: input.type,
      tier: 'bronze',
      companyDetails: input.companyDetails,
      contact: {
        ...input.contact,
        email: input.contact.email.toLowerCase(),
      },
      address: {
        ...input.address,
        country: input.address.country || 'India',
      },
      taxInfo: input.taxInfo || {},
      bankDetails: input.bankDetails || {
        accountHolder: '',
        accountNumber: '',
        bankName: '',
        branch: '',
        ifscCode: '',
      },
      status: 'pending',
      onboardingProgress: {
        step: 1,
        completedSteps: [],
        currentStep: 'basic_info',
      },
      agreement: {
        signed: false,
      },
      referralCode,
      referredBy: input.referredBy,
      stats: {
        totalRevenue: 0,
        totalClients: 0,
        activeCampaigns: 0,
        joinedAt: new Date(),
      },
    });

    await partner.save();
    logger.info('Partner created', { partnerId, type: input.type, name: input.companyDetails.name });

    return partner;
  }

  /**
   * Generate unique referral code
   */
  private generateReferralCode(companyName: string): string {
    const prefix = companyName.slice(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${random}`;
  }

  /**
   * Get partner by ID
   */
  async getPartner(partnerId: string): Promise<IPartner | null> {
    return Partner.findOne({ partnerId });
  }

  /**
   * Get partner by user ID
   */
  async getPartnerByUserId(userId: string): Promise<IPartner | null> {
    return Partner.findOne({ userId });
  }

  /**
   * Update partner
   */
  async updatePartner(
    partnerId: string,
    updates: Partial<CreatePartnerInput>
  ): Promise<IPartner | null> {
    const partner = await Partner.findOneAndUpdate(
      { partnerId },
      { $set: updates },
      { new: true }
    );

    if (partner) {
      logger.info('Partner updated', { partnerId });
    }

    return partner;
  }

  /**
   * Update partner status
   */
  async updatePartnerStatus(
    partnerId: string,
    status: PartnerStatus
  ): Promise<IPartner | null> {
    const partner = await Partner.findOneAndUpdate(
      { partnerId },
      { $set: { status } },
      { new: true }
    );

    if (partner) {
      logger.info('Partner status updated', { partnerId, status });
    }

    return partner;
  }

  /**
   * Update partner tier
   */
  async updatePartnerTier(
    partnerId: string,
    tier: PartnerTier
  ): Promise<IPartner | null> {
    const partner = await Partner.findOneAndUpdate(
      { partnerId },
      { $set: { tier } },
      { new: true }
    );

    if (partner) {
      logger.info('Partner tier updated', { partnerId, tier });
    }

    return partner;
  }

  /**
   * Update onboarding progress
   */
  async updateOnboardingProgress(
    partnerId: string,
    step: number,
    currentStep: string
  ): Promise<IPartner | null> {
    const partner = await Partner.findOneAndUpdate(
      { partnerId },
      {
        $set: {
          'onboardingProgress.step': step,
          'onboardingProgress.currentStep': currentStep,
        },
        $addToSet: {
          'onboardingProgress.completedSteps': currentStep,
        },
      },
      { new: true }
    );

    return partner;
  }

  /**
   * Get all partners with pagination
   */
  async getAllPartners(options: {
    page?: number;
    limit?: number;
    status?: PartnerStatus;
    type?: PartnerType;
    tier?: PartnerTier;
  }): Promise<{ partners: IPartner[]; total: number }> {
    const { page = 1, limit = 20, status, type, tier } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (tier) query.tier = tier;

    const [partners, total] = await Promise.all([
      Partner.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Partner.countDocuments(query),
    ]);

    return { partners, total };
  }

  /**
   * Get partner status details
   */
  async getPartnerStatus(partnerId: string): Promise<{
    status: PartnerStatus;
    onboardingProgress: IPartner['onboardingProgress'];
    agreement: IPartner['agreement'];
    requiredDocuments: string[];
    missingDocuments: string[];
  } | null> {
    const partner = await Partner.findOne({ partnerId });
    if (!partner) return null;

    const requiredDocs = this.getRequiredDocuments(partner.type);
    const uploadedDocTypes = await this.getUploadedDocumentTypes(partnerId);

    return {
      status: partner.status,
      onboardingProgress: partner.onboardingProgress,
      agreement: partner.agreement,
      requiredDocuments: requiredDocs,
      missingDocuments: requiredDocs.filter((d) => !uploadedDocTypes.includes(d)),
    };
  }

  /**
   * Get required documents for partner type
   */
  private getRequiredDocuments(type: PartnerType): string[] {
    const baseDocs = ['gst_certificate', 'pan_card', 'address_proof', 'bank_statement'];

    switch (type) {
      case 'agency':
        return [...baseDocs, 'agreement'];
      case 'publisher':
        return [...baseDocs, 'logo'];
      case 'reseller':
        return [...baseDocs, 'agreement'];
      case 'technology':
        return ['pan_card', 'logo'];
      case 'influencer':
        return ['pan_card'];
      default:
        return baseDocs;
    }
  }

  /**
   * Get uploaded document types for a partner
   */
  private async getUploadedDocumentTypes(partnerId: string): Promise<string[]> {
    const { DocumentModel } = await import('../models/Document');
    const docs = await DocumentModel.find({ partnerId, status: { $ne: 'rejected' } });
    return docs.map((d) => d.type);
  }

  /**
   * Delete partner
   */
  async deletePartner(partnerId: string): Promise<boolean> {
    const result = await Partner.deleteOne({ partnerId });
    return result.deletedCount > 0;
  }
}

export const partnerService = new PartnerService();
export default partnerService;