import { v4 as uuidv4 } from 'uuid';
import { Agreement, IAgreement, IPaymentSchedule } from '../models/agreement.model.js';
import {
  CreateAgreementInput,
  UpdateAgreementInput,
  AddPaymentInput,
  ESignInput,
  RegisterAgreementInput,
  QueryAgreementsInput
} from '../schemas/agreement.schema.js';
import {
  NotFoundError,
  AgreementError,
  SigningError,
  PaymentError,
  ValidationError
} from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { cacheSet, cacheGet, cacheDelete } from '../config/redis.js';

export class AgreementService {
  private readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Generate a unique agreement ID
   */
  private generateAgreementId(): string {
    const timestamp = Date.now().toString(36);
    const random = uuidv4().split('-')[0];
    return `AGR-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Create a new agreement
   */
  async createAgreement(data: CreateAgreementInput, userId: string): Promise<IAgreement> {
    try {
      logger.info('Creating new agreement', { userId, dealId: data.dealId });

      const agreement = new Agreement({
        ...data,
        agreementId: this.generateAgreementId(),
        status: 'draft',
        createdBy: userId
      });

      await agreement.save();
      logger.info('Agreement created successfully', { agreementId: agreement.agreementId });

      return agreement;
    } catch (error) {
      logger.error('Failed to create agreement', { error, data });
      throw new AgreementError('Failed to create agreement');
    }
  }

  /**
   * Get agreement by ID
   */
  async getAgreementById(agreementId: string): Promise<IAgreement> {
    const cacheKey = `agreement:${agreementId}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      logger.debug('Agreement found in cache', { agreementId });
      return JSON.parse(cached);
    }

    const agreement = await Agreement.findOne({
      agreementId,
      deletedAt: { $exists: false }
    });

    if (!agreement) {
      throw new NotFoundError('Agreement', agreementId);
    }

    await cacheSet(cacheKey, JSON.stringify(agreement), this.CACHE_TTL);
    return agreement;
  }

  /**
   * Get agreement by MongoDB ID
   */
  async getAgreementByMongoId(id: string): Promise<IAgreement> {
    const agreement = await Agreement.findById(id);

    if (!agreement || agreement.deletedAt) {
      throw new NotFoundError('Agreement', id);
    }

    return agreement;
  }

  /**
   * List agreements with filters
   */
  async listAgreements(query: QueryAgreementsInput): Promise<{
    agreements: IAgreement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      status,
      type,
      dealId,
      propertyId,
      buyerId,
      sellerId,
      brokerId,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (dealId) filter.dealId = dealId;
    if (propertyId) filter.propertyId = propertyId;
    if (buyerId) filter.buyerId = buyerId;
    if (sellerId) filter.sellerId = sellerId;
    if (brokerId) filter.brokerId = brokerId;

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) (filter.createdAt as Record<string, Date>).$gte = new Date(fromDate);
      if (toDate) (filter.createdAt as Record<string, Date>).$lte = new Date(toDate);
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [agreements, total] = await Promise.all([
      Agreement.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Agreement.countDocuments(filter)
    ]);

    return {
      agreements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update agreement
   */
  async updateAgreement(
    agreementId: string,
    data: UpdateAgreementInput,
    userId: string
  ): Promise<IAgreement> {
    const agreement = await Agreement.findOne({
      agreementId,
      deletedAt: { $exists: false }
    });

    if (!agreement) {
      throw new NotFoundError('Agreement', agreementId);
    }

    // Cannot update completed or registered agreements
    if (['completed', 'registered'].includes(agreement.status)) {
      throw new AgreementError('Cannot update completed or registered agreement');
    }

    Object.assign(agreement, data);
    await agreement.save();

    await cacheDelete(`agreement:${agreementId}`);
    logger.info('Agreement updated', { agreementId, userId });

    return agreement;
  }

  /**
   * Soft delete agreement
   */
  async deleteAgreement(agreementId: string, userId: string): Promise<void> {
    const agreement = await Agreement.findOne({
      agreementId,
      deletedAt: { $exists: false }
    });

    if (!agreement) {
      throw new NotFoundError('Agreement', agreementId);
    }

    // Cannot delete completed or registered agreements
    if (['completed', 'registered'].includes(agreement.status)) {
      throw new AgreementError('Cannot delete completed or registered agreement');
    }

    agreement.deletedAt = new Date();
    agreement.updatedAt = new Date();
    await agreement.save();

    await cacheDelete(`agreement:${agreementId}`);
    logger.info('Agreement deleted', { agreementId, userId });
  }

  /**
   * Sign agreement (buyer)
   */
  async signBuyer(
    agreementId: string,
    signatureData: ESignInput,
    userId: string
  ): Promise<IAgreement> {
    return this.sign(agreementId, 'buyer', signatureData, userId);
  }

  /**
   * Sign agreement (seller)
   */
  async signSeller(
    agreementId: string,
    signatureData: ESignInput,
    userId: string
  ): Promise<IAgreement> {
    return this.sign(agreementId, 'seller', signatureData, userId);
  }

  /**
   * Sign agreement (witness)
   */
  async signWitness(
    agreementId: string,
    signatureData: ESignInput,
    userId: string,
    witnessNumber: 1 | 2 = 1
  ): Promise<IAgreement> {
    return this.sign(agreementId, `witness${witnessNumber}`, signatureData, userId);
  }

  /**
   * Generic sign method
   */
  private async sign(
    agreementId: string,
    role: 'buyer' | 'seller' | 'witness1' | 'witness2',
    signatureData: ESignInput,
    userId: string
  ): Promise<IAgreement> {
    const agreement = await Agreement.findOne({
      agreementId,
      deletedAt: { $exists: false }
    });

    if (!agreement) {
      throw new NotFoundError('Agreement', agreementId);
    }

    // Validate signer
    if (role === 'buyer' && agreement.buyerId !== userId) {
      throw new SigningError('Only the buyer can sign as buyer');
    }
    if (role === 'seller' && agreement.sellerId !== userId) {
      throw new SigningError('Only the seller can sign as seller');
    }

    // Check if already signed
    const signedAtField = `${role}SignedAt` as keyof IAgreement;
    if (agreement[signedAtField] as Date) {
      throw new SigningError(`Agreement already signed by ${role}`);
    }

    // Set signature and timestamp
    const signatureField = `${role}Signature` as keyof IAgreement;
    (agreement as any)[signatureField] = signatureData.signature;
    (agreement as any)[signedAtField] = new Date();

    // Update status
    agreement.updateSigningStatus();
    await agreement.save();

    await cacheDelete(`agreement:${agreementId}`);
    logger.info(`Agreement signed by ${role}`, { agreementId, userId, role });

    return agreement;
  }

  /**
   * Get signature status
   */
  async getSignatureStatus(agreementId: string): Promise<{
    buyer: { signed: boolean; signedAt?: Date; name?: string };
    seller: { signed: boolean; signedAt?: Date; name?: string };
    witness1: { signed: boolean; signedAt?: Date; name?: string };
    witness2: { signed: boolean; signedAt?: Date; name?: string };
    allSigned: boolean;
    status: string;
  }> {
    const agreement = await this.getAgreementById(agreementId);

    return {
      buyer: {
        signed: !!agreement.buyerSignedAt,
        signedAt: agreement.buyerSignedAt,
        name: 'Buyer'
      },
      seller: {
        signed: !!agreement.sellerSignedAt,
        signedAt: agreement.sellerSignedAt,
        name: 'Seller'
      },
      witness1: {
        signed: !!agreement.witness1SignedAt,
        signedAt: agreement.witness1SignedAt,
        name: 'Witness 1'
      },
      witness2: {
        signed: !!agreement.witness2SignedAt,
        signedAt: agreement.witness2SignedAt,
        name: 'Witness 2'
      },
      allSigned: agreement.allSigned,
      status: agreement.status
    };
  }

  /**
   * Add payment to schedule
   */
  async addPayment(
    agreementId: string,
    payment: AddPaymentInput
  ): Promise<IAgreement> {
    const agreement = await Agreement.findOne({
      agreementId,
      deletedAt: { $exists: false }
    });

    if (!agreement) {
      throw new NotFoundError('Agreement', agreementId);
    }

    agreement.paymentSchedule.push({
      milestone: payment.milestone,
      amount: payment.amount,
      dueDate: new Date(payment.dueDate),
      status: 'pending',
      notes: payment.notes
    } as IPaymentSchedule);

    await agreement.save();
    logger.info('Payment added to schedule', { agreementId, milestone: payment.milestone });

    return agreement;
  }

  /**
   * Get payment schedule
   */
  async getPaymentSchedule(agreementId: string): Promise<IPaymentSchedule[]> {
    const agreement = await this.getAgreementById(agreementId);
    return agreement.paymentSchedule;
  }

  /**
   * Confirm payment
   */
  async confirmPayment(
    agreementId: string,
    paymentId: string,
    notes?: string
  ): Promise<IAgreement> {
    const agreement = await Agreement.findOne({
      agreementId,
      deletedAt: { $exists: false }
    });

    if (!agreement) {
      throw new NotFoundError('Agreement', agreementId);
    }

    const payment = agreement.paymentSchedule.find(
      (p) => (p as any)._id?.toString() === paymentId
    );

    if (!payment) {
      throw new PaymentError('Payment milestone not found');
    }

    if (payment.status === 'paid') {
      throw new PaymentError('Payment already confirmed');
    }

    payment.status = 'paid';
    payment.paidAt = new Date();
    if (notes) payment.notes = notes;

    await agreement.save();
    logger.info('Payment confirmed', { agreementId, paymentId });

    return agreement;
  }

  /**
   * Submit for registration
   */
  async submitForRegistration(agreementId: string): Promise<IAgreement> {
    const agreement = await Agreement.findOne({
      agreementId,
      deletedAt: { $exists: false }
    });

    if (!agreement) {
      throw new NotFoundError('Agreement', agreementId);
    }

    if (agreement.status !== 'completed') {
      throw new AgreementError('Agreement must be completed before registration');
    }

    agreement.status = 'pending_buyer_sign'; // Placeholder status for registration in progress
    await agreement.save();

    logger.info('Agreement submitted for registration', { agreementId });
    return agreement;
  }

  /**
   * Mark as registered
   */
  async markAsRegistered(
    agreementId: string,
    data: RegisterAgreementInput
  ): Promise<IAgreement> {
    const agreement = await Agreement.findOne({
      agreementId,
      deletedAt: { $exists: false }
    });

    if (!agreement) {
      throw new NotFoundError('Agreement', agreementId);
    }

    agreement.registrationNumber = data.registrationNumber;
    agreement.registeredAtOffice = data.registeredAtOffice;
    agreement.registeredAt = data.registrationDate
      ? new Date(data.registrationDate)
      : new Date();
    agreement.status = 'registered';
    agreement.agreementPdfUrl = agreement.agreementPdfUrl; // Keep existing PDF

    await agreement.save();
    await cacheDelete(`agreement:${agreementId}`);

    logger.info('Agreement registered', { agreementId, registrationNumber: data.registrationNumber });
    return agreement;
  }

  /**
   * Get registration status
   */
  async getRegistrationStatus(agreementId: string): Promise<{
    isRegistered: boolean;
    registrationNumber?: string;
    registeredAt?: Date;
    registeredAtOffice?: string;
    status: string;
  }> {
    const agreement = await this.getAgreementById(agreementId);

    return {
      isRegistered: agreement.status === 'registered',
      registrationNumber: agreement.registrationNumber,
      registeredAt: agreement.registeredAt,
      registeredAtOffice: agreement.registeredAtOffice,
      status: agreement.status
    };
  }

  /**
   * Update agreement PDF URL
   */
  async updatePdfUrl(agreementId: string, pdfUrl: string): Promise<IAgreement> {
    const agreement = await Agreement.findOne({ agreementId });

    if (!agreement) {
      throw new NotFoundError('Agreement', agreementId);
    }

    agreement.agreementPdfUrl = pdfUrl;
    await agreement.save();

    await cacheDelete(`agreement:${agreementId}`);
    return agreement;
  }

  /**
   * Get agreements by buyer
   */
  async getAgreementsByBuyer(buyerId: string): Promise<IAgreement[]> {
    return Agreement.find({
      buyerId,
      deletedAt: { $exists: false }
    }).sort({ createdAt: -1 });
  }

  /**
   * Get agreements by seller
   */
  async getAgreementsBySeller(sellerId: string): Promise<IAgreement[]> {
    return Agreement.find({
      sellerId,
      deletedAt: { $exists: false }
    }).sort({ createdAt: -1 });
  }

  /**
   * Get agreements by broker
   */
  async getAgreementsByBroker(brokerId: string): Promise<IAgreement[]> {
    return Agreement.find({
      brokerId,
      deletedAt: { $exists: false }
    }).sort({ createdAt: -1 });
  }

  /**
   * Get agreement statistics
   */
  async getStatistics(brokerId?: string): Promise<{
    total: number;
    draft: number;
    pendingSign: number;
    completed: number;
    registered: number;
    totalValue: number;
  }> {
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };
    if (brokerId) filter.brokerId = brokerId;

    const [agreements, stats] = await Promise.all([
      Agreement.find(filter).lean(),
      Agreement.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            draft: {
              $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
            },
            pendingSign: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$status',
                      ['pending_buyer_sign', 'pending_seller_sign', 'pending_witness']
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            registered: {
              $sum: { $cond: [{ $eq: ['$status', 'registered'] }, 1, 0] }
            },
            totalValue: { $sum: '$totalPrice' }
          }
        }
      ])
    ]);

    const result = stats[0] || {
      total: 0,
      draft: 0,
      pendingSign: 0,
      completed: 0,
      registered: 0,
      totalValue: 0
    };

    return {
      total: result.total,
      draft: result.draft,
      pendingSign: result.pendingSign,
      completed: result.completed,
      registered: result.registered,
      totalValue: result.totalValue
    };
  }
}

export const agreementService = new AgreementService();
export default agreementService;