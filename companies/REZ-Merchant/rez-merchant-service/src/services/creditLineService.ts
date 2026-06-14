import mongoose, { Types } from 'mongoose';
import { CreditLine, ICreditLine } from '../models/CreditLine';
import { SupplierLedger, ILedgerEntry } from '../models/SupplierLedger';
import { AuditLog } from '../models/AuditLog';
import {
  DEFAULT_INTEREST_RATE,
  DEFAULT_GRACE_DAYS,
  MAX_INTEREST_RATE,
  MIN_INTEREST_AMOUNT,
  MAX_INTEREST_MULTIPLIER,
  calculateSimpleInterest,
  calculateCompoundInterest,
  COMPOUND_INTEREST,
  BAD_DEBT_DAYS,
  getTieredInterestRate,
} from '../config/interestConfig';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

/**
 * Credit Line Service - Core business logic for BNPL/Credit Line operations.
 * Handles credit management, ledger operations, payment allocation, and interest calculation.
 */

export interface CreateCreditLineInput {
  merchantId: string;
  supplierId: string;
  creditLimit: number;
  creditPeriodDays?: number;
  interestRate?: number;
  interestGraceDays?: number;
  minPaymentPercent?: number;
}

export interface CreditAvailabilityResult {
  available: boolean;
  availableCredit: number;
  wouldExceedBy: number;
  creditLine?: ICreditLine;
}

export interface PaymentAllocation {
  ledgerEntryId: string;
  referenceNumber: string;
  amountAllocated: number;
  remainingBalance: number;
}

export interface PaymentAllocationResult {
  success: boolean;
  totalAllocated: number;
  allocations: PaymentAllocation[];
  remainingPayment: number;
  ledgerEntryId?: string;
}

export interface InterestCalculationResult {
  entryId: string;
  referenceNumber: string;
  principalAmount: number;
  daysOverdue: number;
  graceDaysUsed: number;
  applicableRate: number;
  interestAmount: number;
  cappedAt: number;
}

export interface AgingReportEntry {
  supplierId: string;
  supplierName: string;
  current: number;
  '1-30': number;
  '31-60': number;
  '61-90': number;
  '90+': number;
  total: number;
}

export interface AgingReport {
  merchantId: string;
  generatedAt: Date;
  buckets: {
    current: number;
    '1-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
  };
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  bySupplier: AgingReportEntry[];
}

export interface SupplierStatement {
  supplierId: string;
  supplierName: string;
  periodStart: Date;
  periodEnd: Date;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  transactions: Array<{
    date: Date;
    type: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    dueDate?: Date;
    daysOverdue?: number;
  }>;
  aging: {
    current: number;
    '1-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
  };
}

/**
 * Credit Line Service class
 */
export class CreditLineService {
  /**
   * Create a new credit line for a supplier.
   */
  async createCreditLine(input: CreateCreditLineInput): Promise<ICreditLine> {
    const { merchantId, supplierId, creditLimit, creditPeriodDays, interestRate, interestGraceDays, minPaymentPercent } = input;

    // Validate inputs
    if (creditLimit < 0) {
      throw new Error('Credit limit cannot be negative');
    }
    if (creditPeriodDays && (creditPeriodDays < 1 || creditPeriodDays > 365)) {
      throw new Error('Credit period must be between 1 and 365 days');
    }
    if (interestRate && (interestRate < 0 || interestRate > MAX_INTEREST_RATE)) {
      throw new Error(`Interest rate must be between 0 and ${MAX_INTEREST_RATE}%`);
    }

    // Check if credit line already exists
    const existing = await CreditLine.findOne({
      merchantId: new Types.ObjectId(merchantId),
      supplierId: new Types.ObjectId(supplierId),
    });

    if (existing) {
      throw new Error('Credit line already exists for this supplier');
    }

    // Create credit line
    const creditLine = await CreditLine.create({
      merchantId: new Types.ObjectId(merchantId),
      supplierId: new Types.ObjectId(supplierId),
      creditLimit,
      creditPeriodDays: creditPeriodDays || 30,
      interestRate: interestRate ?? DEFAULT_INTEREST_RATE,
      interestGraceDays: interestGraceDays ?? DEFAULT_GRACE_DAYS,
      minPaymentPercent: minPaymentPercent ?? 10,
      usedAmount: 0,
      availableCredit: creditLimit,
      status: 'active',
    });

    // Audit log
    await AuditLog.create({
      merchantId: new Types.ObjectId(merchantId),
      action: 'create',
      resourceType: 'CreditLine',
      resourceId: creditLine._id.toString(),
      severity: 'info',
      details: {
        after: {
          creditLimit,
          creditPeriodDays: creditPeriodDays || 30,
          interestRate: interestRate ?? DEFAULT_INTEREST_RATE,
        },
      },
    });

    logger.info('Credit line created', {
      creditLineId: creditLine._id,
      merchantId,
      supplierId,
      creditLimit,
    });

    return creditLine;
  }

  /**
   * Update credit line settings.
   */
  async updateCreditLine(
    merchantId: string,
    creditLineId: string,
    updates: Partial<{
      creditLimit: number;
      creditPeriodDays: number;
      interestRate: number;
      interestGraceDays: number;
      minPaymentPercent: number;
    }>
  ): Promise<ICreditLine> {
    const creditLine = await CreditLine.findOne({
      _id: new Types.ObjectId(creditLineId),
      merchantId: new Types.ObjectId(merchantId),
    });

    if (!creditLine) {
      throw new Error('Credit line not found');
    }

    if (creditLine.status === 'closed') {
      throw new Error('Cannot update a closed credit line');
    }

    const beforeState = {
      creditLimit: creditLine.creditLimit,
      creditPeriodDays: creditLine.creditPeriodDays,
      interestRate: creditLine.interestRate,
    };

    // Apply updates
    if (updates.creditLimit !== undefined) {
      if (updates.creditLimit < creditLine.usedAmount) {
        throw new Error('Credit limit cannot be less than used amount');
      }
      creditLine.creditLimit = updates.creditLimit;
    }
    if (updates.creditPeriodDays !== undefined) {
      creditLine.creditPeriodDays = updates.creditPeriodDays;
    }
    if (updates.interestRate !== undefined) {
      if (updates.interestRate < 0 || updates.interestRate > MAX_INTEREST_RATE) {
        throw new Error(`Interest rate must be between 0 and ${MAX_INTEREST_RATE}%`);
      }
      creditLine.interestRate = updates.interestRate;
    }
    if (updates.interestGraceDays !== undefined) {
      creditLine.interestGraceDays = updates.interestGraceDays;
    }
    if (updates.minPaymentPercent !== undefined) {
      creditLine.minPaymentPercent = updates.minPaymentPercent;
    }

    await creditLine.save();

    // Audit log
    await AuditLog.create({
      merchantId: new Types.ObjectId(merchantId),
      merchantUserId: new Types.ObjectId((updates as unknown).merchantUserId || '0'.repeat(24)),
      action: 'update',
      resourceType: 'CreditLine',
      resourceId: creditLineId,
      severity: 'info',
      details: {
        before: beforeState,
        after: {
          creditLimit: creditLine.creditLimit,
          creditPeriodDays: creditLine.creditPeriodDays,
          interestRate: creditLine.interestRate,
        },
      },
    });

    logger.info('Credit line updated', {
      creditLineId,
      merchantId,
      updates,
    });

    return creditLine;
  }

  /**
   * Check if a supplier has sufficient credit for a given amount.
   */
  async checkCreditAvailability(supplierId: string, amount: number): Promise<CreditAvailabilityResult> {
    const creditLine = await CreditLine.findOne({
      supplierId: new Types.ObjectId(supplierId),
      status: 'active',
    });

    if (!creditLine) {
      return {
        available: false,
        availableCredit: 0,
        wouldExceedBy: amount,
      };
    }

    const availableCredit = Math.max(0, creditLine.creditLimit - creditLine.usedAmount);
    const wouldExceedBy = Math.max(0, amount - availableCredit);

    return {
      available: wouldExceedBy === 0,
      availableCredit,
      wouldExceedBy,
      creditLine,
    };
  }

  /**
   * Record a purchase (debit entry) against a credit line.
   */
  async recordPurchase(
    merchantId: string,
    supplierId: string,
    poId: string,
    poNumber: string,
    amount: number,
    creditPeriodDays?: number
  ): Promise<ILedgerEntry> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const creditLine = await CreditLine.findOne({
        merchantId: new Types.ObjectId(merchantId),
        supplierId: new Types.ObjectId(supplierId),
        status: 'active',
      }).session(session);

      if (!creditLine) {
        throw new Error('No active credit line found for this supplier');
      }

      // Check credit availability
      const newUsedAmount = creditLine.usedAmount + amount;
      if (newUsedAmount > creditLine.creditLimit) {
        throw new Error(
          `Credit limit exceeded. Available: ${creditLine.creditLimit - creditLine.usedAmount}, Requested: ${amount}`
        );
      }

      // Calculate due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (creditPeriodDays || creditLine.creditPeriodDays));

      // Get current balance
      const currentBalance = await SupplierLedger.getCurrentBalance(merchantId, supplierId);
      const newBalance = currentBalance + amount;

      // Create ledger entry
      const ledgerEntry = await SupplierLedger.create(
        [
          {
            merchantId: new Types.ObjectId(merchantId),
            supplierId: new Types.ObjectId(supplierId),
            entryType: 'debit',
            amount,
            balance: newBalance,
            reference: 'po',
            referenceId: new Types.ObjectId(poId),
            referenceNumber: poNumber,
            description: `Purchase order ${poNumber}`,
            dueDate,
            isOverdue: false,
            daysOverdue: 0,
            unallocatedAmount: amount,
          },
        ],
        { session }
      );

      // Update credit line used amount
      creditLine.usedAmount = newUsedAmount;
      await creditLine.save({ session });

      await session.commitTransaction();

      // Audit log
      await AuditLog.create({
        merchantId: new Types.ObjectId(merchantId),
        action: 'create',
        resourceType: 'SupplierLedger',
        resourceId: ledgerEntry[0]._id.toString(),
        severity: 'info',
        details: {
          after: {
            poNumber,
            amount,
            dueDate,
            newBalance,
          },
        },
      });

      logger.info('Purchase recorded', {
        merchantId,
        supplierId,
        poNumber,
        amount,
        dueDate,
        newBalance,
      });

      return ledgerEntry[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Record a payment and auto-allocate to oldest due entries (FIFO).
   */
  async recordPayment(
    merchantId: string,
    supplierId: string,
    amount: number,
    paymentRef: string,
    method: 'bank_transfer' | 'upi' | 'neft' | 'rtgs' | 'cash' | 'adjustment' | 'credit_note',
    notes?: string
  ): Promise<PaymentAllocationResult> {
    const idempotencyKey = `payment:${supplierId}:${paymentRef}`;

    // Check idempotency
    try {
      const existingPayment = await redis.get(`idempotency:${idempotencyKey}`);
      if (existingPayment) {
        const result = JSON.parse(existingPayment);
        return result;
      }
    } catch (error) {
      logger.warn('Idempotency check failed', { error });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Allocate payment using FIFO
      const allocationResult = await this.allocatePayment(merchantId, supplierId, amount, session);

      // Get current balance after allocation
      const currentBalance = await SupplierLedger.getCurrentBalance(merchantId, supplierId);
      const newBalance = Math.max(0, currentBalance - allocationResult.totalAllocated);

      // Create credit entry
      const creditEntry = await SupplierLedger.create(
        [
          {
            merchantId: new Types.ObjectId(merchantId),
            supplierId: new Types.ObjectId(supplierId),
            entryType: 'credit',
            amount: allocationResult.totalAllocated,
            balance: newBalance,
            reference: method === 'credit_note' ? 'credit_note' : 'payment',
            referenceNumber: paymentRef,
            description: `Payment received: ${paymentRef}`,
            metadata: { method, notes, allocations: allocationResult.allocations },
          },
        ],
        { session }
      );

      // Update credit line
      const creditLine = await CreditLine.findOne({
        merchantId: new Types.ObjectId(merchantId),
        supplierId: new Types.ObjectId(supplierId),
      }).session(session);

      if (creditLine) {
        creditLine.usedAmount = Math.max(0, creditLine.usedAmount - allocationResult.totalAllocated);
        creditLine.lastPaymentDate = new Date();
        creditLine.lastPaymentAmount = amount;
        creditLine.paymentHistory.push({
          date: new Date(),
          amount: allocationResult.totalAllocated,
          reference: paymentRef,
          method,
          appliedTo: allocationResult.allocations.map((a) => a.ledgerEntryId),
          notes,
        });
        await creditLine.save({ session });
      }

      await session.commitTransaction();

      const result: PaymentAllocationResult = {
        success: true,
        totalAllocated: allocationResult.totalAllocated,
        allocations: allocationResult.allocations,
        remainingPayment: allocationResult.remainingPayment,
        ledgerEntryId: creditEntry[0]._id.toString(),
      };

      // Store idempotency
      try {
        await redis.set(`idempotency:${idempotencyKey}`, JSON.stringify(result), 'EX', 86400 * 7);
      } catch (error) {
        logger.warn('Failed to store idempotency key', { error });
      }

      // Audit log
      await AuditLog.create({
        merchantId: new Types.ObjectId(merchantId),
        action: 'create',
        resourceType: 'SupplierLedger',
        resourceId: creditEntry[0]._id.toString(),
        severity: 'info',
        details: {
          after: {
            paymentRef,
            amount,
            allocated: allocationResult.totalAllocated,
            allocations: allocationResult.allocations.length,
          },
        },
      });

      logger.info('Payment recorded', {
        merchantId,
        supplierId,
        paymentRef,
        amount,
        allocated: allocationResult.totalAllocated,
        remaining: allocationResult.remainingPayment,
      });

      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Allocate payment to oldest due entries (FIFO).
   */
  async allocatePayment(
    merchantId: string,
    supplierId: string,
    paymentAmount: number,
    session?: mongoose.ClientSession
  ): Promise<{
    totalAllocated: number;
    allocations: PaymentAllocation[];
    remainingPayment: number;
  }> {
    const allocations: PaymentAllocation[] = [];
    let remainingPayment = paymentAmount;

    // Get unallocated debit entries sorted by due date (FIFO)
    const unallocatedEntries = await SupplierLedger.getUnallocatedEntries(merchantId, supplierId);

    for (const entry of unallocatedEntries) {
      if (remainingPayment <= 0) break;

      const unallocated = entry.unallocatedAmount;
      const toAllocate = Math.min(remainingPayment, unallocated);

      if (toAllocate > 0) {
        // Update ledger entry
        await SupplierLedger.updateOne(
          { _id: entry._id },
          {
            $inc: {
              allocatedAmount: toAllocate,
              unallocatedAmount: -toAllocate,
            },
          },
          { session }
        );

        allocations.push({
          ledgerEntryId: entry._id.toString(),
          referenceNumber: entry.referenceNumber,
          amountAllocated: toAllocate,
          remainingBalance: unallocated - toAllocate,
        });

        remainingPayment -= toAllocate;
      }
    }

    return {
      totalAllocated: paymentAmount - remainingPayment,
      allocations,
      remainingPayment,
    };
  }

  /**
   * Calculate interest for overdue entries.
   */
  async calculateInterest(merchantId: string, supplierId: string): Promise<InterestCalculationResult[]> {
    const creditLine = await CreditLine.findOne({
      merchantId: new Types.ObjectId(merchantId),
      supplierId: new Types.ObjectId(supplierId),
    });

    if (!creditLine) {
      throw new Error('Credit line not found');
    }

    const overdueEntries = await SupplierLedger.getOverdueEntries(merchantId, supplierId);
    const calculations: InterestCalculationResult[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const entry of overdueEntries) {
      if (entry.interestApplied) continue;
      if (entry.daysOverdue <= creditLine.interestGraceDays) continue;

      const effectiveDays = entry.daysOverdue - creditLine.interestGraceDays;
      const applicableRate = getTieredInterestRate(effectiveDays, creditLine.interestRate / 100);
      const monthlyRate = applicableRate / 100;

      let interestAmount: number;
      if (COMPOUND_INTEREST) {
        interestAmount = calculateCompoundInterest(entry.unallocatedAmount, monthlyRate, effectiveDays);
      } else {
        interestAmount = calculateSimpleInterest(entry.unallocatedAmount, monthlyRate, effectiveDays);
      }

      // Apply cap (max interest is original amount * multiplier)
      const maxInterest = entry.amount * MAX_INTEREST_MULTIPLIER;
      const cappedAmount = Math.min(interestAmount, maxInterest);
      const finalInterest = Math.max(MIN_INTEREST_AMOUNT, Math.round(cappedAmount * 100) / 100);

      calculations.push({
        entryId: entry._id.toString(),
        referenceNumber: entry.referenceNumber,
        principalAmount: entry.unallocatedAmount,
        daysOverdue: effectiveDays,
        graceDaysUsed: creditLine.interestGraceDays,
        applicableRate: applicableRate * 100,
        interestAmount: finalInterest,
        cappedAt: maxInterest,
      });
    }

    return calculations;
  }

  /**
   * Apply calculated interest to overdue entries.
   */
  async applyInterest(merchantId: string, supplierId: string): Promise<ILedgerEntry[]> {
    const calculations = await this.calculateInterest(merchantId, supplierId);
    if (calculations.length === 0) return [];

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const creditLine = await CreditLine.findOne({
        merchantId: new Types.ObjectId(merchantId),
        supplierId: new Types.ObjectId(supplierId),
      }).session(session);

      if (!creditLine) {
        throw new Error('Credit line not found');
      }

      const ledgerEntries: ILedgerEntry[] = [];
      const currentBalance = await SupplierLedger.getCurrentBalance(merchantId, supplierId);
      let runningBalance = currentBalance;

      for (const calc of calculations) {
        runningBalance += calc.interestAmount;

        const entry = await SupplierLedger.create(
          [
            {
              merchantId: new Types.ObjectId(merchantId),
              supplierId: new Types.ObjectId(supplierId),
              entryType: 'debit',
              amount: calc.interestAmount,
              balance: runningBalance,
              reference: 'interest',
              referenceId: new Types.ObjectId(calc.entryId),
              referenceNumber: `INT-${calc.referenceNumber}`,
              description: `Interest on ${calc.referenceNumber} (${calc.daysOverdue} days @ ${calc.applicableRate}%/month)`,
              dueDate: new Date(),
              isOverdue: false,
              daysOverdue: 0,
              interestApplied: false,
              interestAmount: calc.interestAmount,
              unallocatedAmount: calc.interestAmount,
              metadata: {
                parentEntryId: calc.entryId,
                principalAmount: calc.principalAmount,
                daysOverdue: calc.daysOverdue,
              },
            },
          ],
          { session }
        );

        // Mark original entry as having interest applied
        await SupplierLedger.updateOne(
          { _id: new Types.ObjectId(calc.entryId) },
          {
            $set: { interestApplied: true },
            $inc: { interestAmount: calc.interestAmount },
          },
          { session }
        );

        // Update credit line used amount and total interest
        creditLine.usedAmount += calc.interestAmount;
        creditLine.totalInterestCharged += calc.interestAmount;

        ledgerEntries.push(entry[0]);
      }

      await creditLine.save({ session });
      await session.commitTransaction();

      logger.info('Interest applied', {
        merchantId,
        supplierId,
        entries: calculations.length,
        totalInterest: calculations.reduce((sum, c) => sum + c.interestAmount, 0),
      });

      return ledgerEntries;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get aging report for all suppliers.
   */
  async getAgingReport(merchantId: string): Promise<AgingReport> {
    const creditLines = await CreditLine.find({
      merchantId: new Types.ObjectId(merchantId),
      status: { $in: ['active', 'suspended'] },
    }).populate('supplierId', 'name');

    const bySupplier: AgingReportEntry[] = [];
    const buckets = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    };

    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueCount = 0;

    for (const creditLine of creditLines) {
      const aging = await SupplierLedger.getAgingReport(merchantId, creditLine.supplierId._id.toString());

      const supplierEntry: AgingReportEntry = {
        supplierId: creditLine.supplierId._id.toString(),
        supplierName: (creditLine.supplierId as unknown).name || 'Unknown',
        current: aging.current,
        '1-30': aging['1-30'],
        '31-60': aging['31-60'],
        '61-90': aging['61-90'],
        '90+': aging['90+'],
        total: aging.total,
      };

      bySupplier.push(supplierEntry);

      buckets.current += aging.current;
      buckets['1-30'] += aging['1-30'];
      buckets['31-60'] += aging['31-60'];
      buckets['61-90'] += aging['61-90'];
      buckets['90+'] += aging['90+'];

      totalOutstanding += aging.total;
      const overdue = aging['1-30'] + aging['31-60'] + aging['61-90'] + aging['90+'];
      totalOverdue += overdue;
      if (overdue > 0) overdueCount++;
    }

    return {
      merchantId,
      generatedAt: new Date(),
      buckets,
      totalOutstanding,
      totalOverdue,
      overdueCount,
      bySupplier,
    };
  }

  /**
   * Get supplier statement for a period.
   */
  async getSupplierStatement(
    merchantId: string,
    supplierId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SupplierStatement> {
    // Get supplier info
    const Supplier = mongoose.models.Supplier;
    const supplier = await Supplier.findById(supplierId).lean();
    const supplierName = supplier?.name || 'Unknown';

    // Get opening balance (balance before start date)
    const beforeEntries = await SupplierLedger.find({
      merchantId: new Types.ObjectId(merchantId),
      supplierId: new Types.ObjectId(supplierId),
      createdAt: { $lt: startDate },
    })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean();

    const openingBalance = beforeEntries.length > 0 ? (beforeEntries[0] as unknown).balance : 0;

    // Get transactions in period
    const transactions = await SupplierLedger.find({
      merchantId: new Types.ObjectId(merchantId),
      supplierId: new Types.ObjectId(supplierId),
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .lean();

    // Calculate totals
    let totalDebits = 0;
    let totalCredits = 0;
    let closingBalance = openingBalance;

    const formattedTransactions = transactions.map((t) => {
      if (t.entryType === 'debit') {
        totalDebits += t.amount;
        closingBalance += t.amount;
      } else {
        totalCredits += t.amount;
        closingBalance -= t.amount;
      }

      return {
        date: t.createdAt,
        type: t.entryType,
        reference: t.referenceNumber,
        description: t.description,
        debit: t.entryType === 'debit' ? t.amount : 0,
        credit: t.entryType === 'credit' ? t.amount : 0,
        balance: Math.round(closingBalance * 100) / 100,
        dueDate: t.dueDate,
        daysOverdue: t.daysOverdue,
      };
    });

    // Get aging as of end date
    const aging = await SupplierLedger.getAgingReport(merchantId, supplierId);

    return {
      supplierId,
      supplierName,
      periodStart: startDate,
      periodEnd: endDate,
      openingBalance: Math.round(openingBalance * 100) / 100,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      closingBalance: Math.round(closingBalance * 100) / 100,
      transactions: formattedTransactions,
      aging,
    };
  }

  /**
   * Suspend a credit line.
   */
  async suspendCreditLine(
    merchantId: string,
    creditLineId: string,
    reason: string,
    merchantUserId?: string
  ): Promise<ICreditLine> {
    const creditLine = await CreditLine.findOne({
      _id: new Types.ObjectId(creditLineId),
      merchantId: new Types.ObjectId(merchantId),
    });

    if (!creditLine) {
      throw new Error('Credit line not found');
    }

    if (creditLine.status === 'closed') {
      throw new Error('Cannot suspend a closed credit line');
    }

    creditLine.suspend(reason);
    await creditLine.save();

    await AuditLog.create({
      merchantId: new Types.ObjectId(merchantId),
      merchantUserId: merchantUserId ? new Types.ObjectId(merchantUserId) : undefined,
      action: 'update',
      resourceType: 'CreditLine',
      resourceId: creditLineId,
      severity: 'warning',
      details: {
        after: { status: 'suspended', reason },
      },
    });

    logger.info('Credit line suspended', { creditLineId, merchantId, reason });

    return creditLine;
  }

  /**
   * Reactivate a suspended credit line.
   */
  async reactivateCreditLine(
    merchantId: string,
    creditLineId: string,
    merchantUserId?: string
  ): Promise<ICreditLine> {
    const creditLine = await CreditLine.findOne({
      _id: new Types.ObjectId(creditLineId),
      merchantId: new Types.ObjectId(merchantId),
    });

    if (!creditLine) {
      throw new Error('Credit line not found');
    }

    if (creditLine.status === 'closed') {
      throw new Error('Cannot reactivate a closed credit line');
    }

    creditLine.reactivate();
    await creditLine.save();

    await AuditLog.create({
      merchantId: new Types.ObjectId(merchantId),
      merchantUserId: merchantUserId ? new Types.ObjectId(merchantUserId) : undefined,
      action: 'update',
      resourceType: 'CreditLine',
      resourceId: creditLineId,
      severity: 'info',
      details: {
        after: { status: 'active' },
      },
    });

    logger.info('Credit line reactivated', { creditLineId, merchantId });

    return creditLine;
  }

  /**
   * Close a credit line.
   */
  async closeCreditLine(
    merchantId: string,
    creditLineId: string,
    reason: string,
    merchantUserId?: string
  ): Promise<ICreditLine> {
    const creditLine = await CreditLine.findOne({
      _id: new Types.ObjectId(creditLineId),
      merchantId: new Types.ObjectId(merchantId),
    });

    if (!creditLine) {
      throw new Error('Credit line not found');
    }

    creditLine.close(reason);
    await creditLine.save();

    await AuditLog.create({
      merchantId: new Types.ObjectId(merchantId),
      merchantUserId: merchantUserId ? new Types.ObjectId(merchantUserId) : undefined,
      action: 'update',
      resourceType: 'CreditLine',
      resourceId: creditLineId,
      severity: 'info',
      details: {
        after: { status: 'closed', reason },
      },
    });

    logger.info('Credit line closed', { creditLineId, merchantId, reason });

    return creditLine;
  }

  /**
   * Get credit line by ID.
   */
  async getCreditLineById(merchantId: string, creditLineId: string): Promise<ICreditLine | null> {
    return CreditLine.findOne({
      _id: new Types.ObjectId(creditLineId),
      merchantId: new Types.ObjectId(merchantId),
    }).populate('supplierId', 'name email phone gstNumber');
  }

  /**
   * Get credit line by supplier ID.
   */
  async getCreditLineBySupplier(merchantId: string, supplierId: string): Promise<ICreditLine | null> {
    return CreditLine.findOne({
      merchantId: new Types.ObjectId(merchantId),
      supplierId: new Types.ObjectId(supplierId),
    }).populate('supplierId', 'name email phone gstNumber');
  }

  /**
   * List all credit lines for a merchant.
   */
  async listCreditLines(
    merchantId: string,
    options: {
      status?: 'active' | 'suspended' | 'closed';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    items: ICreditLine[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { status, page = 1, limit = 20 } = options;

    const query: unknown = { merchantId: new Types.ObjectId(merchantId) };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      CreditLine.find(query)
        .populate('supplierId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CreditLine.countDocuments(query),
    ]);

    return {
      items: items as unknown as ICreditLine[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Verify ledger balance integrity.
   */
  async verifyLedgerIntegrity(merchantId: string, supplierId: string): Promise<{
    isValid: boolean;
    calculatedBalance: number;
    storedBalance: number;
    discrepancy: number;
  }> {
    return SupplierLedger.verifyBalanceIntegrity(merchantId, supplierId);
  }

  /**
   * Export ledger as CSV data.
   */
  async exportLedgerAsCSV(
    merchantId: string,
    supplierId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const query: unknown = {
      merchantId: new Types.ObjectId(merchantId),
      supplierId: new Types.ObjectId(supplierId),
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const entries = await SupplierLedger.find(query)
      .sort({ createdAt: 1 })
      .lean();

    const headers = [
      'Date',
      'Type',
      'Reference',
      'Description',
      'Debit',
      'Credit',
      'Balance',
      'Due Date',
      'Days Overdue',
      'Overdue',
    ];

    const rows = entries.map((e) => [
      new Date(e.createdAt).toISOString().split('T')[0],
      e.entryType.toUpperCase(),
      e.referenceNumber,
      `"${e.description.replace(/"/g, '""')}"`,
      e.entryType === 'debit' ? e.amount.toFixed(2) : '0.00',
      e.entryType === 'credit' ? e.amount.toFixed(2) : '0.00',
      e.balance.toFixed(2),
      e.dueDate ? new Date(e.dueDate).toISOString().split('T')[0] : '',
      e.daysOverdue.toString(),
      e.isOverdue ? 'Yes' : 'No',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

// Export singleton instance
export const creditLineService = new CreditLineService();
export default creditLineService;
