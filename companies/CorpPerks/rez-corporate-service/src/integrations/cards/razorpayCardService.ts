import { CorporateCard, CardTransaction, Employee } from '../../models';
import { CardType, CardNetwork, CardStatus } from '../../types';
import { logger } from '../../config/logger';

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com';

/**
 * RABTUL Payment Service API client
 */
async function paymentServiceRequest<T>(endpoint: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const res = await fetch(`${PAYMENT_SERVICE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || ''
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Payment service error: ${res.status} - ${error}`);
  }

  return res.json();
}

export interface RazorpayCardResponse {
  id: string;
  entity: string;
  card_token: string;
  last4: string;
  network: string;
  card_type: string;
  issuer: string;
  status: string;
}

export interface MCCMapping {
  code: string;
  category: string;
  restrictions?: string[];
}

const MCC_CATEGORIES: MCCMapping[] = [
  { code: '5812', category: 'Food & Dining' },
  { code: '5813', category: 'Bars & Nightlife' },
  { code: '5814', category: 'Food Delivery' },
  { code: '7011', category: 'Hotels' },
  { code: '4511', category: 'Airlines' },
  { code: '4121', category: 'Taxis & Rideshare' },
  { code: '5499', category: 'Groceries' },
  { code: '5912', category: 'Pharmacy' },
  { code: '5942', category: 'Books & Stationery' },
  { code: '5732', category: 'Electronics' },
  { code: '7999', category: 'Recreation' },
  { code: '8299', category: 'Education' },
  { code: '5411', category: 'Supermarkets' }
];

export class CorporateCardService {
  constructor() {
    // Using RABTUL Payment Service - no local Razorpay client needed
  }

  /**
   * Create a corporate card via RABTUL Payment Service
   */
  private async createCardOnPaymentService(params: {
    customerId: string;
    limit: number;
    currency: string;
    tags: Record<string, string>;
  }): Promise<RazorpayCardResponse> {
    return paymentServiceRequest<RazorpayCardResponse>('/api/payments/corporate-cards', 'POST', {
      action: 'create',
      customerId: params.customerId,
      limit: params.limit,
      currency: params.currency,
      tags: params.tags
    });
  }

  /**
   * Block a corporate card via RABTUL Payment Service
   */
  private async blockCardOnPaymentService(cardToken: string, reason: string): Promise<void> {
    return paymentServiceRequest('/api/payments/corporate-cards/block', 'POST', {
      cardToken,
      reason
    });
  }

  /**
   * Unblock a corporate card via RABTUL Payment Service
   */
  private async unblockCardOnPaymentService(cardToken: string): Promise<void> {
    return paymentServiceRequest('/api/payments/corporate-cards/unblock', 'POST', {
      cardToken
    });
  }

  /**
   * Update card spending limit via RABTUL Payment Service
   */
  private async updateCardLimitOnPaymentService(cardToken: string, limit: number): Promise<void> {
    return paymentServiceRequest('/api/payments/corporate-cards/limit', 'PATCH', {
      cardToken,
      limit
    });
  }

  async createVirtualCard(params: {
    companyId: string;
    employeeId: string;
    monthlyLimit?: number;
    restrictions?: {
      mccCodes?: string[];
      blockedCategories?: string[];
    };
    issuedBy: string;
  }): Promise<{
    card: any;
    cardDetails: {
      cardToken: string;
      cardLastFour: string;
      expiryMonth: string;
      expiryYear: string;
    };
  }> {
    try {
      // Get employee details
      const employee = await Employee.findById(params.employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Create card via RABTUL Payment Service
      const razorpayCard = await this.createCardOnPaymentService({
        customerId: employee.email, // Use email as customer ID
        limit: params.monthlyLimit || 50000,
        currency: 'INR',
        tags: {
          company_id: params.companyId,
          employee_id: params.employeeId
        }
      });

      // Generate expiry (3 years from now)
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 3);

      // Create local card record
      const card = new CorporateCard({
        companyId: params.companyId,
        employeeId: params.employeeId,
        cardType: CardType.VIRTUAL,
        network: this.mapNetwork(razorpayCard.network),
        status: CardStatus.ACTIVE,
        cardToken: razorpayCard.card_token,
        cardLastFour: razorpayCard.last4,
        spendingLimit: {
          monthly: params.monthlyLimit
        },
        restrictions: {
          mccCodes: params.restrictions?.mccCodes,
          blockedCategories: params.restrictions?.blockedCategories
        },
        issuedAt: new Date(),
        expiresAt: expiryDate,
        issuedBy: params.issuedBy
      });

      await card.save();

      logger.info('Virtual corporate card created', {
        cardId: card._id,
        employeeId: params.employeeId,
        razorpayCardId: razorpayCard.id
      });

      return {
        card,
        cardDetails: {
          cardToken: razorpayCard.card_token,
          cardLastFour: razorpayCard.last4,
          expiryMonth: String(expiryDate.getMonth() + 1).padStart(2, '0'),
          expiryYear: String(expiryDate.getFullYear()).slice(-2)
        }
      };
    } catch (error: any) {
      logger.error('Failed to create virtual card', { error: error.message });
      throw new Error(`Failed to create card: ${error.message}`);
    }
  }

  async blockCard(params: {
    cardId: string;
    reason: string;
    blockedBy: string;
  }): Promise<void> {
    const card = await CorporateCard.findById(params.cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    try {
      // Block via RABTUL Payment Service
      await this.blockCardOnPaymentService(card.cardToken, params.reason);

      card.status = CardStatus.BLOCKED;
      await card.save();

      logger.info('Card blocked', { cardId: params.cardId, reason: params.reason });
    } catch (error: any) {
      logger.error('Failed to block card', { error: error.message });
      throw new Error(`Failed to block card: ${error.message}`);
    }
  }

  async unblockCard(cardId: string): Promise<void> {
    const card = await CorporateCard.findById(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    try {
      await this.unblockCardOnPaymentService(card.cardToken);

      card.status = CardStatus.ACTIVE;
      await card.save();

      logger.info('Card unblocked', { cardId });
    } catch (error: any) {
      logger.error('Failed to unblock card', { error: error.message });
      throw new Error(`Failed to unblock card: ${error.message}`);
    }
  }

  async updateSpendingLimit(params: {
    cardId: string;
    monthlyLimit?: number;
    dailyLimit?: number;
    perTransactionLimit?: number;
  }): Promise<void> {
    const card = await CorporateCard.findById(params.cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    try {
      await this.updateCardLimitOnPaymentService(card.cardToken, params.monthlyLimit || 0);

      card.spendingLimit = {
        daily: params.dailyLimit || card.spendingLimit.daily,
        monthly: params.monthlyLimit || card.spendingLimit.monthly,
        perTransaction: params.perTransactionLimit || card.spendingLimit.perTransaction
      };

      await card.save();

      logger.info('Card spending limit updated', {
        cardId: params.cardId,
        limits: card.spendingLimit
      });
    } catch (error: any) {
      logger.error('Failed to update spending limit', { error: error.message });
      throw new Error(`Failed to update limit: ${error.message}`);
    }
  }

  async getCardDetails(cardId: string): Promise<any> {
    const card = await CorporateCard.findById(cardId)
      .populate('employeeId', 'firstName lastName email department');

    if (!card) {
      throw new Error('Card not found');
    }

    return {
      id: card._id,
      employee: card.employeeId,
      cardType: card.cardType,
      network: card.network,
      status: card.status,
      cardLastFour: card.cardLastFour,
      spendingLimit: card.spendingLimit,
      restrictions: card.restrictions,
      issuedAt: card.issuedAt,
      expiresAt: card.expiresAt
    };
  }

  async getEmployeeCards(employeeId: string): Promise<any[]> {
    const cards = await CorporateCard.find({
      employeeId,
      status: { $ne: CardStatus.CLOSED }
    });

    return cards.map(card => ({
      id: card._id,
      cardType: card.cardType,
      network: card.network,
      status: card.status,
      cardLastFour: card.cardLastFour,
      spendingLimit: card.spendingLimit,
      expiresAt: card.expiresAt
    }));
  }

  async getCompanyCards(params: {
    companyId: string;
    page?: number;
    limit?: number;
    status?: CardStatus;
  }): Promise<{
    cards: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = { companyId: params.companyId };
    if (params.status) {
      query.status = params.status;
    }

    const page = params.page || 1;
    const limit = params.limit || 20;

    const [cards, total] = await Promise.all([
      CorporateCard.find(query)
        .populate('employeeId', 'firstName lastName email department')
        .sort({ issuedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      CorporateCard.countDocuments(query)
    ]);

    return {
      cards: cards.map(card => ({
        id: card._id,
        employee: card.employeeId,
        cardType: card.cardType,
        network: card.network,
        status: card.status,
        cardLastFour: card.cardLastFour,
        spendingLimit: card.spendingLimit,
        issuedAt: card.issuedAt,
        expiresAt: card.expiresAt
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async recordTransaction(params: {
    cardId: string;
    amount: number;
    currency: string;
    merchantName: string;
    mcc: string;
    transactionDate: Date;
    referenceNumber: string;
    authCode?: string;
    merchantLocation?: string;
  }): Promise<void> {
    const card = await CorporateCard.findById(params.cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    // Check spending limits
    if (card.spendingLimit.perTransaction && params.amount > card.spendingLimit.perTransaction) {
      throw new Error('Transaction exceeds per-transaction limit');
    }

    // Check MCC restrictions
    if (card.restrictions.mccCodes && !card.restrictions.mccCodes.includes(params.mcc)) {
      throw new Error('Transaction not allowed for this merchant category');
    }

    if (card.restrictions.blockedCategories) {
      const mccInfo = MCC_CATEGORIES.find(m => m.code === params.mcc);
      if (mccInfo && card.restrictions.blockedCategories.includes(mccInfo.category)) {
        throw new Error('Transaction blocked for this merchant category');
      }
    }

    // Create transaction record
    const transaction = new CardTransaction({
      cardId: params.cardId,
      companyId: card.companyId,
      employeeId: card.employeeId,
      merchantName: params.merchantName,
      merchantCategory: this.getCategoryFromMCC(params.mcc),
      mcc: params.mcc,
      amount: params.amount,
      currency: params.currency,
      inrAmount: params.amount, // Assume INR for now
      transactionDate: params.transactionDate,
      referenceNumber: params.referenceNumber,
      authCode: params.authCode,
      merchantLocation: params.merchantLocation,
      status: 'pending'
    });

    await transaction.save();

    // Send notification to employee
    await this.notifyTransaction(card.employeeId.toString(), transaction);

    logger.info('Card transaction recorded', {
      transactionId: transaction._id,
      cardId: params.cardId,
      amount: params.amount
    });
  }

  async getTransactions(params: {
    cardId?: string;
    employeeId?: string;
    companyId: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    transactions: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = { companyId: params.companyId };

    if (params.cardId) {
      query.cardId = params.cardId;
    }
    if (params.employeeId) {
      query.employeeId = params.employeeId;
    }
    if (params.startDate || params.endDate) {
      query.transactionDate = {};
      if (params.startDate) {
        query.transactionDate.$gte = params.startDate;
      }
      if (params.endDate) {
        query.transactionDate.$lte = params.endDate;
      }
    }

    const page = params.page || 1;
    const limit = params.limit || 20;

    const [transactions, total] = await Promise.all([
      CardTransaction.find(query)
        .sort({ transactionDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      CardTransaction.countDocuments(query)
    ]);

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getEmployeeSpending(params: {
    employeeId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byMerchant: Record<string, number>;
    transactionCount: number;
    avgTransaction: number;
  }> {
    const transactions = await CardTransaction.aggregate([
      {
        $match: {
          employeeId: params.employeeId,
          transactionDate: { $gte: params.startDate, $lte: params.endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$inrAmount' },
          count: { $sum: 1 },
          byCategory: { $push: '$merchantCategory' },
          byMerchant: { $push: { merchant: '$merchantName', amount: '$inrAmount' } }
        }
      }
    ]);

    const result = transactions[0] || { total: 0, count: 0, byCategory: [], byMerchant: [] };

    // Count categories
    const categoryCounts: Record<string, number> = {};
    for (const cat of result.byCategory || []) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    // Sum merchant amounts
    const merchantAmounts: Record<string, number> = {};
    for (const item of result.byMerchant || []) {
      merchantAmounts[item.merchant] = (merchantAmounts[item.merchant] || 0) + item.amount;
    }

    return {
      total: result.total || 0,
      byCategory: categoryCounts,
      byMerchant: merchantAmounts,
      transactionCount: result.count || 0,
      avgTransaction: result.count > 0 ? result.total / result.count : 0
    };
  }

  private mapNetwork(network: string): CardNetwork {
    const networkMap: Record<string, CardNetwork> = {
      'VISA': CardNetwork.VISA,
      'MASTERCARD': CardNetwork.MASTERCARD,
      'RUPAY': CardNetwork.RUPAY
    };
    return networkMap[network.toUpperCase()] || CardNetwork.VISA;
  }

  private getCategoryFromMCC(mcc: string): string {
    const mccInfo = MCC_CATEGORIES.find(m => m.code === mcc);
    return mccInfo?.category || 'Other';
  }

  private async notifyTransaction(employeeId: string, transaction: any): Promise<void> {
    try {
      await fetch(`${process.env.NOTIFICATION_SERVICE_URL}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || ''
        },
        body: JSON.stringify({
          userId: employeeId,
          type: 'push',
          title: 'Card Transaction',
          body: `₹${transaction.inrAmount} spent at ${transaction.merchantName}`,
          data: {
            type: 'card_transaction',
            transactionId: transaction._id
          }
        })
      });
    } catch (error) {
      logger.error('Failed to send transaction notification', { error });
    }
  }
}

export const corporateCardService = new CorporateCardService();
