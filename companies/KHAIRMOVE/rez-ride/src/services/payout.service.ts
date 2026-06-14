import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver } from '../models/driver.model';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DriverNotFoundError, AppError, ValidationError } from '../common/exceptions';

export interface PayoutRequest {
  driverId: string;
  amount: number;
  method: 'upi' | 'bank_transfer';
  utr?: string;
}

export interface PayoutStatus {
  payoutId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: number;
  method: string;
  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;
}

export interface DriverPayoutSummary {
  driverId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  lastPayout?: {
    amount: number;
    date: Date;
  };
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
    upiId?: string;
  };
}

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);
  private readonly razorpayKeyId: string;
  private readonly razorpayKeySecret: string;
  private readonly walletServiceUrl: string;
  private readonly internalToken: string;

  // In-memory payout tracking (use DB in production)
  private payouts: Map<string, PayoutStatus> = new Map();

  constructor(
    @InjectModel(Driver.name) private driverModel: Model<Driver>,
    private configService: ConfigService,
  ) {
    this.razorpayKeyId = configService.get('RAZORPAY_KEY_ID', '');
    this.razorpayKeySecret = configService.get('RAZORPAY_KEY_SECRET', '');
    this.walletServiceUrl = configService.get('REZ_WALLET_SERVICE_URL', 'http://localhost:4004');
    this.internalToken = configService.get('INTERNAL_SERVICE_TOKEN', '');
  }

  /**
   * Get driver's payout summary
   */
  async getDriverPayoutSummary(driverId: string): Promise<DriverPayoutSummary> {
    const driver = await this.driverModel.findById(driverId);

    if (!driver) {
      throw new DriverNotFoundError(driverId);
    }

    return {
      driverId,
      availableBalance: driver.walletBalance - driver.pendingPayout,
      pendingBalance: driver.pendingPayout,
      totalEarnings: driver.totalEarnings,
      bankDetails: driver.bankDetails ? {
        accountNumber: this.maskAccountNumber(driver.bankDetails.accountNumber),
        ifsc: driver.bankDetails.ifsc,
        accountHolderName: driver.bankDetails.accountHolderName,
        upiId: driver.bankDetails.upiId,
      } : undefined,
    };
  }

  /**
   * Request payout
   */
  async requestPayout(params: PayoutRequest): Promise<{
    success: boolean;
    payoutId?: string;
    message?: string;
  }> {
    const { driverId, amount, method } = params;

    // Get driver
    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      return { success: false, message: 'Driver not found' };
    }

    // Check balance
    const availableBalance = driver.walletBalance - driver.pendingPayout;
    if (amount > availableBalance) {
      return {
        success: false,
        message: `Insufficient balance. Available: ₹${availableBalance.toFixed(2)}`,
      };
    }

    // Check bank details
    if (!driver.bankDetails && method === 'bank_transfer') {
      return { success: false, message: 'Bank details not configured' };
    }

    if (!driver.bankDetails?.upiId && method === 'upi') {
      return { success: false, message: 'UPI ID not configured' };
    }

    // Create payout record
    const payoutId = `PO_${Date.now()}_${driverId}`;

    const payout: PayoutStatus = {
      payoutId,
      status: 'pending',
      amount,
      method,
      createdAt: new Date(),
    };

    this.payouts.set(payoutId, payout);

    // Update pending balance
    driver.pendingPayout += amount;
    await driver.save();

    // Process payout asynchronously
    this.processPayout(payoutId, driver, amount, method).catch(err => {
      this.logger.error(`Payout processing failed: ${err.message}`);
    });

    return {
      success: true,
      payoutId,
      message: 'Payout requested successfully',
    };
  }

  /**
   * Process payout via Razorpay
   */
  private async processPayout(
    payoutId: string,
    driver: any,
    amount: number,
    method: 'upi' | 'bank_transfer'
  ): Promise<void> {
    try {
      // Update status to processing
      this.updatePayoutStatus(payoutId, 'processing');

      // Use Razorpay if configured
      if (this.razorpayKeyId && this.razorpayKeySecret) {
        await this.processRazorpayPayout(payoutId, driver, amount, method);
      } else {
        // Mock payout for development
        await this.processMockPayout(payoutId, driver, amount);
      }
    } catch (error) {
      this.logger.error(`Payout failed: ${error.message}`);
      this.updatePayoutStatus(payoutId, 'failed', error.message);

      // Refund to pending balance
      const driverDoc = await this.driverModel.findById(driver._id);
      if (driverDoc) {
        driverDoc.pendingPayout -= amount;
        await driverDoc.save();
      }
    }
  }

  /**
   * Process via Razorpay
   */
  private async processRazorpayPayout(
    payoutId: string,
    driver: any,
    amount: number,
    method: 'upi' | 'bank_transfer'
  ): Promise<void> {
    const fundAccountId = await this.createFundAccount(driver, method);

    const payload = {
      account_id: fundAccountId,
      amount: Math.round(amount * 100), // Razorpay uses paise
      currency: 'INR',
      mode: method === 'upi' ? 'UPI' : 'IMPS',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: payoutId,
    };

    const auth = Buffer.from(`${this.razorpayKeyId}:${this.razorpayKeySecret}`).toString('base64');

    const response = await axios.post('https://api.razorpay.com/v1/payouts', payload, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.status === 'processed') {
      this.updatePayoutStatus(payoutId, 'completed');

      // Update driver balance
      await this.driverModel.findByIdAndUpdate(driver._id, {
        $inc: {
          walletBalance: -amount,
          pendingPayout: -amount,
        },
      });

      this.logger.log(`Payout ${payoutId} completed: ₹${amount}`);
    } else {
      throw new AppError(`Unexpected payout status: ${response.data.status}`, 'PAYOUT_STATUS_ERROR');
    }
  }

  /**
   * Create fund account on Razorpay
   */
  private async createFundAccount(
    driver: any,
    method: 'upi' | 'bank_transfer'
  ): Promise<string> {
    const fundAccountPayload = {
      contact: {
        name: driver.name,
        email: driver.email || `${driver.phone}@rezride.com`,
        phone: driver.phone,
        type: 'vendor',
      },
      account_type: 'bank_account',
      bank_account: {
        name: driver.bankDetails.accountHolderName,
        ifsc: driver.bankDetails.ifsc,
        account_number: driver.bankDetails.accountNumber,
      },
    };

    if (method === 'upi' && driver.bankDetails.upiId) {
      fundAccountPayload.account_type = 'vpa';
      (fundAccountPayload as any).vpa = {
        address: driver.bankDetails.upiId,
      };
      (fundAccountPayload as any).bank_account = undefined;
    }

    const auth = Buffer.from(`${this.razorpayKeyId}:${this.razorpayKeySecret}`).toString('base64');

    const response = await axios.post('https://api.razorpay.com/v1/fund_accounts', fundAccountPayload, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.id;
  }

  /**
   * Mock payout for development
   */
  private async processMockPayout(
    payoutId: string,
    driver: any,
    amount: number
  ): Promise<void> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    this.updatePayoutStatus(payoutId, 'completed');

    // Update driver balance
    await this.driverModel.findByIdAndUpdate(driver._id, {
      $inc: {
        walletBalance: -amount,
        pendingPayout: -amount,
      },
    });

    this.logger.log(`Mock payout ${payoutId} completed: ₹${amount}`);
  }

  /**
   * Update payout status
   */
  private updatePayoutStatus(
    payoutId: string,
    status: PayoutStatus['status'],
    failureReason?: string
  ): void {
    const payout = this.payouts.get(payoutId);
    if (payout) {
      payout.status = status;
      payout.processedAt = new Date();
      if (failureReason) {
        payout.failureReason = failureReason;
      }
      this.payouts.set(payoutId, payout);
    }
  }

  /**
   * Get payout status
   */
  async getPayoutStatus(payoutId: string): Promise<PayoutStatus | null> {
    return this.payouts.get(payoutId) || null;
  }

  /**
   * Get driver's payout history
   */
  async getDriverPayoutHistory(driverId: string): Promise<PayoutStatus[]> {
    const payouts: PayoutStatus[] = [];

    this.payouts.forEach(payout => {
      if (payout.payoutId.includes(driverId)) {
        payouts.push(payout);
      }
    });

    return payouts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get all pending payouts (admin)
   */
  async getPendingPayouts(): Promise<{
    total: number;
    count: number;
    payouts: PayoutStatus[];
  }> {
    const pending: PayoutStatus[] = [];

    this.payouts.forEach(payout => {
      if (payout.status === 'pending' || payout.status === 'processing') {
        pending.push(payout);
      }
    });

    const total = pending.reduce((sum, p) => sum + p.amount, 0);

    return {
      total,
      count: pending.length,
      payouts: pending,
    };
  }

  /**
   * Auto-payout for drivers with high balance
   */
  async processAutoPayouts(): Promise<{
    processed: number;
    totalAmount: number;
  }> {
    const threshold = 1000; // ₹1000 threshold

    const drivers = await this.driverModel.find({
      walletBalance: { $gte: threshold },
      pendingPayout: 0,
      status: { $ne: 'suspended' },
    });

    let processed = 0;
    let totalAmount = 0;

    for (const driver of drivers) {
      const availableBalance = driver.walletBalance;

      if (availableBalance >= threshold) {
        const result = await this.requestPayout({
          driverId: driver._id.toString(),
          amount: availableBalance,
          method: driver.bankDetails?.upiId ? 'upi' : 'bank_transfer',
        });

        if (result.success) {
          processed++;
          totalAmount += availableBalance;
        }
      }
    }

    this.logger.log(`Auto-payout processed: ${processed} drivers, ₹${totalAmount}`);

    return { processed, totalAmount };
  }

  /**
   * Mask account number for display
   */
  private maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) {
      return accountNumber;
    }
    return '****' + accountNumber.slice(-4);
  }
}
