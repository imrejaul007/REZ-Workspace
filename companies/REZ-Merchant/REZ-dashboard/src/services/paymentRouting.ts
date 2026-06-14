/**
 * Payment Routing Service
 * Intelligent payment gateway routing and split payments
 */

import mongoose, { Schema, Document } from 'mongoose';
import axios from 'axios';

// ── Payment Gateway Configuration ───────────────────────────────────────────────

export interface GatewayConfig {
  id: string;
  name: string;
  type: 'upi' | 'card' | 'wallet' | 'netbanking' | 'emi' | 'cod';
  priority: number;
  enabled: boolean;
  credentials: {
    apiKey?: string;
    merchantId?: string;
    secret?: string;
    webhookSecret?: string;
  };
  limits: {
    minAmount: number;
    maxAmount: number;
    dailyLimit?: number;
    perTransactionLimit?: number;
  };
  fees: {
    percentage: number;
    fixed: number;
    currency: string;
  };
  successRates: {
    today: number;
    weekly: number;
    monthly: number;
  };
  regions?: string[]; // Supported regions/states
  banks?: string[]; // For netbanking
}

export interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  conditions: RoutingCondition[];
  actions: RoutingAction[];
  enabled: boolean;
}

export interface RoutingCondition {
  field: 'amount' | 'paymentMethod' | 'region' | 'customerTier' | 'timeOfDay' | 'dayOfWeek';
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
}

export interface RoutingAction {
  type: 'route_to_gateway' | 'add_fee' | 'apply_discount' | 'block';
  value: string | number;
  reason?: string;
}

// ── Split Payment Configuration ────────────────────────────────────────────────

export interface SplitRecipient {
  id: string;
  type: 'merchant' | 'vendor' | 'staff' | 'platform';
  accountId: string;
  accountType: 'bank' | 'wallet';
  bankDetails?: {
    accountNumber: string;
    ifsc?: string;
    bankName?: string;
    accountHolderName: string;
  };
  percentage: number;
  fixedAmount?: number;
  priority: number;
}

export interface SplitConfiguration {
  id: string;
  merchantId: string;
  orderId: string;
  totalAmount: number;
  recipients: SplitRecipient[];
  platformFee?: {
    percentage: number;
    fixed: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transfers: SplitTransfer[];
  createdAt: Date;
  completedAt?: Date;
}

export interface SplitTransfer {
  recipientId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  error?: string;
  completedAt?: Date;
}

// ── MongoDB Models ─────────────────────────────────────────────────────────────

const GatewayConfigSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['upi', 'card', 'wallet', 'netbanking', 'emi', 'cod'], required: true },
  priority: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true },
  'credentials.apiKey': String,
  'credentials.merchantId': String,
  'credentials.secret': String,
  'credentials.webhookSecret': String,
  'limits.minAmount': { type: Number, default: 0 },
  'limits.maxAmount': { type: Number, default: 1000000 },
  'limits.dailyLimit': Number,
  'limits.perTransactionLimit': Number,
  'fees.percentage': { type: Number, default: 0 },
  'fees.fixed': { type: Number, default: 0 },
  'fees.currency': { type: String, default: 'INR' },
  'successRates.today': { type: Number, default: 95 },
  'successRates.weekly': { type: Number, default: 95 },
  'successRates.monthly': { type: Number, default: 95 },
  regions: [String],
  banks: [String],
}, { timestamps: true });

const RoutingRuleSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  priority: { type: Number, default: 0 },
  conditions: [{
    field: { type: String, enum: ['amount', 'paymentMethod', 'region', 'customerTier', 'timeOfDay', 'dayOfWeek'] },
    operator: { type: String, enum: ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'contains'] },
    value: Schema.Types.Mixed,
  }],
  actions: [{
    type: { type: String, enum: ['route_to_gateway', 'add_fee', 'apply_discount', 'block'] },
    value: Schema.Types.Mixed,
    reason: String,
  }],
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

const SplitConfigurationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true, index: true },
  orderId: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  recipients: [{
    id: String,
    type: { type: String, enum: ['merchant', 'vendor', 'staff', 'platform'] },
    accountId: String,
    accountType: { type: String, enum: ['bank', 'wallet'] },
    bankDetails: {
      accountNumber: String,
      ifsc: String,
      bankName: String,
      accountHolderName: String,
    },
    percentage: Number,
    fixedAmount: Number,
    priority: Number,
  }],
  platformFee: {
    percentage: Number,
    fixed: Number,
  },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  transfers: [{
    recipientId: String,
    amount: Number,
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'] },
    transactionId: String,
    error: String,
    completedAt: Date,
  }],
  completedAt: Date,
}, { timestamps: true });

export const GatewayConfigModel = mongoose.models.GatewayConfig || mongoose.model('GatewayConfig', GatewayConfigSchema);
export const RoutingRuleModel = mongoose.models.RoutingRule || mongoose.model('RoutingRule', RoutingRuleSchema);
export const SplitConfigurationModel = mongoose.models.SplitConfiguration || mongoose.model('SplitConfiguration', SplitConfigurationSchema);

// ── Payment Routing Service ─────────────────────────────────────────────────────

class PaymentRoutingService {
  private gateways: Map<string, GatewayConfig> = new Map();
  private routingRules: RoutingRule[] = [];
  private isInitialized = false;

  /**
   * Initialize service with gateway configurations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Load gateway configs from database
    const configs = await GatewayConfigModel.find({ enabled: true }).lean();
    configs.forEach((config: any) => {
      this.gateways.set(config.id, config);
    });

    // Load routing rules
    this.routingRules = await RoutingRuleModel.find({ enabled: true })
      .sort({ priority: -1 })
      .lean();

    this.isInitialized = true;
    console.log(`[PaymentRouting] Initialized with ${this.gateways.size} gateways and ${this.routingRules.length} rules`);
  }

  /**
   * Select best gateway for a payment
   */
  async selectGateway(params: {
    amount: number;
    paymentMethod: string;
    merchantId: string;
    customerTier?: string;
    region?: string;
  }): Promise<GatewayConfig | null> {
    await this.initialize();

    const { amount, paymentMethod, region, customerTier } = params;

    // Find applicable rules
    const applicableRules = this.routingRules.filter((rule) => {
      return rule.conditions.every((condition) => {
        return this.evaluateCondition(condition, { amount, paymentMethod, region, customerTier });
      });
    });

    // Apply rule actions
    for (const rule of applicableRules) {
      const routeAction = rule.actions.find((a) => a.type === 'route_to_gateway');
      if (routeAction) {
        const gateway = this.gateways.get(routeAction.value as string);
        if (gateway && this.isGatewayAvailable(gateway, amount, paymentMethod)) {
          return gateway;
        }
      }

      // Check for block action
      const blockAction = rule.actions.find((a) => a.type === 'block');
      if (blockAction) {
        console.log(`[PaymentRouting] Payment blocked: ${blockAction.reason}`);
        return null;
      }
    }

    // Fallback: select best gateway based on success rate
    return this.selectBestGateway(paymentMethod, amount);
  }

  /**
   * Evaluate a routing condition
   */
  private evaluateCondition(condition: RoutingCondition, context: any): boolean {
    const fieldValue = context[condition.field];

    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'neq':
        return fieldValue !== condition.value;
      case 'gt':
        return fieldValue > condition.value;
      case 'lt':
        return fieldValue < condition.value;
      case 'gte':
        return fieldValue >= condition.value;
      case 'lte':
        return fieldValue <= condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      default:
        return false;
    }
  }

  /**
   * Check if gateway is available for the transaction
   */
  private isGatewayAvailable(gateway: GatewayConfig, amount: number, paymentMethod: string): boolean {
    // Check amount limits
    if (amount < gateway.limits.minAmount || amount > gateway.limits.maxAmount) {
      return false;
    }

    // Check per-transaction limit
    if (gateway.limits.perTransactionLimit && amount > gateway.limits.perTransactionLimit) {
      return false;
    }

    // Check payment method support
    if (gateway.type !== paymentMethod && gateway.type !== 'upi' && gateway.type !== 'card') {
      return false;
    }

    // Check success rate
    if (gateway.successRates.today < 90) {
      return false;
    }

    return true;
  }

  /**
   * Select best gateway based on success rate
   */
  private selectBestGateway(paymentMethod: string, amount: number): GatewayConfig | null {
    let candidates: GatewayConfig[] = [];

    this.gateways.forEach((gateway) => {
      if (gateway.type === paymentMethod && this.isGatewayAvailable(gateway, amount, paymentMethod)) {
        candidates.push(gateway);
      }
    });

    if (candidates.length === 0) {
      // Try generic (accepts all methods)
      this.gateways.forEach((gateway) => {
        if (gateway.type === 'upi' && this.isGatewayAvailable(gateway, amount, paymentMethod)) {
          candidates.push(gateway);
        }
      });
    }

    if (candidates.length === 0) return null;

    // Sort by priority (higher first), then by success rate
    candidates.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.successRates.today - a.successRates.today;
    });

    return candidates[0];
  }

  /**
   * Calculate fees for a payment
   */
  calculateFees(gateway: GatewayConfig, amount: number): {
    gatewayFee: number;
    platformFee: number;
    totalFee: number;
    netAmount: number;
  } {
    const gatewayFee = (amount * gateway.fees.percentage / 100) + gateway.fees.fixed;
    const platformFee = 0; // Platform fee calculated separately
    const totalFee = gatewayFee + platformFee;
    const netAmount = amount - totalFee;

    return {
      gatewayFee,
      platformFee,
      totalFee,
      netAmount,
    };
  }

  // ── Split Payments ──────────────────────────────────────────────────────────

  /**
   * Create split payment configuration
   */
  async createSplitPayment(params: {
    merchantId: string;
    orderId: string;
    totalAmount: number;
    recipients: Omit<SplitRecipient, 'id'>[];
    platformFee?: { percentage: number; fixed: number };
  }): Promise<SplitConfiguration> {
    const { merchantId, orderId, totalAmount, recipients, platformFee } = params;

    // Validate percentages
    const totalPercentage = recipients.reduce((sum, r) => sum + (r.percentage || 0), 0);
    if (totalPercentage > 100) {
      throw new Error('Total recipient percentage exceeds 100%');
    }

    // Add platform fee recipient if specified
    const finalRecipients: SplitRecipient[] = recipients.map((r, index) => ({
      ...r,
      id: `recipient_${index + 1}`,
    }));

    if (platformFee) {
      finalRecipients.push({
        id: 'platform',
        type: 'platform',
        accountId: 'platform_account',
        accountType: 'bank',
        percentage: platformFee.percentage,
        fixedAmount: platformFee.fixed,
        priority: 999,
      });
    }

    // Calculate amounts
    const transfers: SplitTransfer[] = finalRecipients.map((r) => {
      let amount: number;
      if (r.fixedAmount) {
        amount = r.fixedAmount;
      } else {
        amount = (totalAmount * r.percentage) / 100;
      }
      return {
        recipientId: r.id,
        amount,
        status: 'pending',
      };
    });

    const splitConfig: SplitConfiguration = {
      id: `split_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      merchantId,
      orderId,
      totalAmount,
      recipients: finalRecipients,
      platformFee,
      status: 'pending',
      transfers,
      createdAt: new Date(),
    };

    // Save to database
    const model = new SplitConfigurationModel(splitConfig);
    await model.save();

    return splitConfig;
  }

  /**
   * Process split payment transfers
   */
  async processSplitPayment(splitId: string): Promise<SplitConfiguration> {
    const split = await SplitConfigurationModel.findOne({ id: splitId });
    if (!split) throw new Error('Split configuration not found');

    split.status = 'processing';

    for (const transfer of split.transfers) {
      const recipient = split.recipients.find((r) => r.id === transfer.recipientId);
      if (!recipient) continue;

      try {
        // Initiate transfer based on recipient type
        if (recipient.type === 'merchant' || recipient.type === 'vendor') {
          await this.initiateBankTransfer(recipient, transfer.amount);
        } else if (recipient.type === 'platform') {
          // Platform keeps their fee
          transfer.status = 'completed';
          transfer.completedAt = new Date();
        }

        transfer.status = 'completed';
      } catch (error) {
        transfer.status = 'failed';
        transfer.error = error instanceof Error ? error.message : 'Transfer failed';
      }
    }

    // Check if all completed
    const allCompleted = split.transfers.every((t) => t.status === 'completed');
    const anyFailed = split.transfers.some((t) => t.status === 'failed');

    if (allCompleted) {
      split.status = 'completed';
      split.completedAt = new Date();
    } else if (anyFailed) {
      split.status = 'failed';
    }

    await split.save();
    return split;
  }

  /**
   * Initiate bank transfer
   */
  private async initiateBankTransfer(recipient: SplitRecipient, amount: number): Promise<string> {
    // This would integrate with banking APIs (NEFT/RTGS/UPI)
    // For now, return a mock transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In production, call actual bank/UPI API
    console.log(`[PaymentRouting] Initiating transfer: ${amount} to ${recipient.bankDetails?.accountNumber}`);

    return transactionId;
  }

  /**
   * Get split payment status
   */
  async getSplitPaymentStatus(splitId: string): Promise<SplitConfiguration | null> {
    return SplitConfigurationModel.findOne({ id: splitId });
  }

  /**
   * Update gateway success rate (called after each transaction)
   */
  async updateGatewaySuccessRate(gatewayId: string, success: boolean): Promise<void> {
    const gateway = await GatewayConfigModel.findOne({ id: gatewayId });
    if (!gateway) return;

    // Update today's rate
    const todayWeight = 1;
    const currentWeight = 0;
    const newRate = success ? 100 : 0;

    gateway.successRates.today = (gateway.successRates.today * currentWeight + newRate * todayWeight) / (currentWeight + todayWeight);
    if (gateway.successRates.today < 0) gateway.successRates.today = 0;
    if (gateway.successRates.today > 100) gateway.successRates.today = 100;

    // Recalculate weekly/monthly
    gateway.successRates.weekly = (gateway.successRates.weekly * 6 + gateway.successRates.today) / 7;
    gateway.successRates.monthly = (gateway.successRates.monthly * 29 + gateway.successRates.today) / 30;

    await gateway.save();

    // Update local cache
    this.gateways.set(gatewayId, gateway as unknown as GatewayConfig);
  }

  /**
   * Get gateway health status
   */
  async getGatewayHealth(): Promise<Array<{ gateway: string; status: string; successRate: number; issues: string[] }>> {
    const health: Array<{ gateway: string; status: string; successRate: number; issues: string[] }> = [];

    this.gateways.forEach((gateway) => {
      const issues: string[] = [];

      if (gateway.successRates.today < 90) {
        issues.push(`Low success rate: ${gateway.successRates.today.toFixed(1)}%`);
      }
      if (!gateway.enabled) {
        issues.push('Gateway disabled');
      }

      health.push({
        gateway: gateway.name,
        status: issues.length === 0 ? 'healthy' : 'degraded',
        successRate: gateway.successRates.today,
        issues,
      });
    });

    return health;
  }
}

export const paymentRoutingService = new PaymentRoutingService();
export default paymentRoutingService;
