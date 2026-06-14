/**
 * Split Bill Service
 *
 * Handles bill splitting logic including creation, validation,
 * payment marking, and status tracking.
 */

import mongoose, { Types } from 'mongoose';
import { SplitBill, ISplitBill, ISplitEntry, SplitMethod } from '../models/SplitBill';
import { Order } from '../models/Order';
import { logger } from '../config/logger';

/**
 * Input type for creating a split
 */
export interface SplitInput {
  userId?: string;
  amount: number;
  method: SplitMethod;
}

/**
 * Result type for fair split calculation
 */
export interface FairSplitResult {
  perPerson: number;
  remainder: number;
  splits: SplitInput[];
}

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  totalProvided: number;
  totalRequired: number;
}

/**
 * Split Bill Service Class
 */
export class SplitBillService {
  /**
   * Create a new split for an order
   *
   * @param orderId - The order ID to split
   * @param splits - Array of split entries
   * @returns Created split bill document
   * @throws Error if order not found or already split
   */
  async createSplit(orderId: string, splits: SplitInput[]): Promise<ISplitBill> {
    // Validate order exists
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Check if already split
    const existingSplit = await SplitBill.findOne({ orderId: new Types.ObjectId(orderId) });
    if (existingSplit) {
      throw new Error(`Order ${orderId} is already split`);
    }

    // Validate splits match total
    const validation = this.validateSplits(order.totals.total, splits);
    if (!validation.isValid) {
      throw new Error(`Invalid splits: ${validation.errors.join(', ')}`);
    }

    // Create split entries with default pending status
    const splitEntries: ISplitEntry[] = splits.map((split) => ({
      userId: split.userId,
      amount: split.amount,
      method: split.method,
      status: 'pending' as const,
    }));

    // Create and save split bill
    const splitBill = new SplitBill({
      orderId: new Types.ObjectId(orderId),
      splits: splitEntries,
      status: 'pending',
      totalAmount: order.totals.total,
    });

    await splitBill.save();

    logger.info('[SplitBill] Split created', {
      splitId: splitBill._id,
      orderId,
      totalAmount: order.totals.total,
      splitCount: splits.length,
    });

    return splitBill;
  }

  /**
   * Get split status for an order
   *
   * @param orderId - The order ID
   * @returns Split bill document or null if not found
   */
  async getSplitStatus(orderId: string): Promise<ISplitBill | null> {
    return SplitBill.findOne({ orderId: new Types.ObjectId(orderId) }).exec();
  }

  /**
   * Mark a specific split as paid
   *
   * @param splitId - The split bill document ID
   * @param userId - The user ID who made the payment
   * @returns Updated split bill document
   * @throws Error if split or user split not found
   */
  async markPaid(splitId: string, userId: string): Promise<ISplitBill> {
    const splitBill = await SplitBill.findById(splitId);
    if (!splitBill) {
      throw new Error(`Split not found: ${splitId}`);
    }

    // Find the split entry for this user
    const splitEntry = splitBill.splits.find((s) => s.userId === userId);
    if (!splitEntry) {
      throw new Error(`No split found for user: ${userId}`);
    }

    if (splitEntry.status === 'paid') {
      throw new Error(`Split already paid for user: ${userId}`);
    }

    // Update split entry status
    splitEntry.status = 'paid';
    splitEntry.paidAt = new Date();

    await splitBill.save();

    logger.info('[SplitBill] Payment marked', {
      splitId,
      userId,
      amount: splitEntry.amount,
      method: splitEntry.method,
    });

    return splitBill;
  }

  /**
   * Mark split as paid by split index (for anonymous splits)
   *
   * @param splitId - The split bill document ID
   * @param splitIndex - The index of the split entry
   * @returns Updated split bill document
   */
  async markPaidByIndex(splitId: string, splitIndex: number): Promise<ISplitBill> {
    const splitBill = await SplitBill.findById(splitId);
    if (!splitBill) {
      throw new Error(`Split not found: ${splitId}`);
    }

    if (splitIndex < 0 || splitIndex >= splitBill.splits.length) {
      throw new Error(`Invalid split index: ${splitIndex}`);
    }

    const splitEntry = splitBill.splits[splitIndex];
    if (splitEntry.status === 'paid') {
      throw new Error(`Split already paid`);
    }

    splitEntry.status = 'paid';
    splitEntry.paidAt = new Date();

    await splitBill.save();

    logger.info('[SplitBill] Payment marked by index', {
      splitId,
      splitIndex,
      amount: splitEntry.amount,
    });

    return splitBill;
  }

  /**
   * Calculate fair split among multiple people
   *
   * Distributes total amount equally, with remainder distributed to first N people.
   *
   * @param total - Total amount to split
   * @param people - Number of people to split between
   * @param defaultMethod - Default payment method for splits
   * @returns Fair split result with per-person amount and remainder
   */
  calculateFairSplit(
    total: number,
    people: number,
    defaultMethod: SplitMethod = 'upi'
  ): FairSplitResult {
    if (people <= 0) {
      throw new Error('Number of people must be greater than 0');
    }

    if (total < 0) {
      throw new Error('Total amount cannot be negative');
    }

    const perPerson = Math.floor(total / people);
    const remainder = total - perPerson * people;

    // Distribute remainder: give 1 extra to first 'remainder' people
    const splits: SplitInput[] = [];
    for (let i = 0; i < people; i++) {
      splits.push({
        amount: perPerson + (i < remainder ? 1 : 0),
        method: defaultMethod,
      });
    }

    return {
      perPerson,
      remainder,
      splits,
    };
  }

  /**
   * Validate that splits sum to the total amount
   *
   * @param total - Expected total amount
   * @param splits - Array of split entries to validate
   * @returns Validation result with unknown errors
   */
  validateSplits(total: number, splits: SplitInput[]): ValidationResult {
    const errors: string[] = [];

    if (!splits || splits.length === 0) {
      errors.push('At least one split is required');
      return {
        isValid: false,
        errors,
        totalProvided: 0,
        totalRequired: total,
      };
    }

    // Validate individual splits
    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];

      if (split.amount <= 0) {
        errors.push(`Split ${i + 1}: Amount must be greater than 0`);
      }

      const validMethods: SplitMethod[] = ['upi', 'card', 'wallet', 'cash'];
      if (!validMethods.includes(split.method)) {
        errors.push(`Split ${i + 1}: Invalid payment method "${split.method}"`);
      }
    }

    // Check total
    const totalProvided = splits.reduce((sum, s) => sum + s.amount, 0);
    const tolerance = 0.01; // Allow for floating point errors
    if (Math.abs(totalProvided - total) > tolerance) {
      errors.push(
        `Split total (${totalProvided.toFixed(2)}) does not match order total (${total.toFixed(2)})`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      totalProvided,
      totalRequired: total,
    };
  }

  /**
   * Get split statistics for an order
   *
   * @param orderId - The order ID
   * @returns Object with split statistics
   */
  async getSplitStatistics(orderId: string): Promise<{
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    totalSplits: number;
    paidSplits: number;
    pendingSplits: number;
    completionPercentage: number;
  } | null> {
    const splitBill = await this.getSplitStatus(orderId);
    if (!splitBill) {
      return null;
    }

    const paidSplits = splitBill.splits.filter((s) => s.status === 'paid');
    const pendingSplits = splitBill.splits.filter((s) => s.status === 'pending');
    const paidAmount = paidSplits.reduce((sum, s) => sum + s.amount, 0);
    const remainingAmount = splitBill.totalAmount - paidAmount;
    const completionPercentage = splitBill.totalAmount > 0
      ? (paidAmount / splitBill.totalAmount) * 100
      : 0;

    return {
      totalAmount: splitBill.totalAmount,
      paidAmount,
      remainingAmount,
      totalSplits: splitBill.splits.length,
      paidSplits: paidSplits.length,
      pendingSplits: pendingSplits.length,
      completionPercentage,
    };
  }

  /**
   * Cancel a split bill (mark all as unpaid and delete)
   *
   * @param orderId - The order ID
   * @throws Error if split not found
   */
  async cancelSplit(orderId: string): Promise<void> {
    const result = await SplitBill.deleteOne({ orderId: new Types.ObjectId(orderId) });
    if (result.deletedCount === 0) {
      throw new Error(`Split not found for order: ${orderId}`);
    }

    logger.info('[SplitBill] Split cancelled', { orderId });
  }

  /**
   * Update split entry details
   *
   * @param orderId - The order ID
   * @param userId - The user ID to update
   * @param updates - Fields to update
   * @returns Updated split bill document
   */
  async updateSplitEntry(
    orderId: string,
    userId: string,
    updates: Partial<SplitInput>
  ): Promise<ISplitBill> {
    const splitBill = await this.getSplitStatus(orderId);
    if (!splitBill) {
      throw new Error(`Split not found for order: ${orderId}`);
    }

    const splitEntry = splitBill.splits.find((s) => s.userId === userId);
    if (!splitEntry) {
      throw new Error(`No split found for user: ${userId}`);
    }

    if (updates.amount !== undefined) {
      splitEntry.amount = updates.amount;
    }
    if (updates.method !== undefined) {
      splitEntry.method = updates.method;
    }

    // Re-validate totals
    const totalProvided = splitBill.splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalProvided - splitBill.totalAmount) > 0.01) {
      throw new Error('Updated splits do not match total amount');
    }

    await splitBill.save();

    logger.info('[SplitBill] Split entry updated', {
      orderId,
      userId,
      updates,
    });

    return splitBill;
  }

  /**
   * Get all splits for a specific user
   *
   * @param userId - The user ID
   * @returns Array of split bills containing this user
   */
  async getSplitsByUser(userId: string): Promise<ISplitBill[]> {
    return SplitBill.findByUserId(userId);
  }

  /**
   * Get pending splits for a specific user
   *
   * @param userId - The user ID
   * @returns Array of pending split bills for this user
   */
  async getPendingSplitsForUser(userId: string): Promise<ISplitBill[]> {
    return SplitBill.findPendingByUserId(userId);
  }
}

// Factory function for creating service instances
export function createSplitBillService(): SplitBillService {
  return new SplitBillService();
}
