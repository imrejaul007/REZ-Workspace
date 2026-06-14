import mongoose, { Types } from 'mongoose';
import { Order } from '../models/Order';
import { Settlement } from '../models/Settlement';
import { Payout } from '../models/Payout';
import { Store } from '../models/Store';

const PLATFORM_COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.05');

// FIX 10: Validate commission rate at startup.
if (!Number.isFinite(PLATFORM_COMMISSION_RATE) || PLATFORM_COMMISSION_RATE < 0 || PLATFORM_COMMISSION_RATE > 1) {
  throw new Error('PLATFORM_COMMISSION_RATE must be between 0 and 1');
}

// FIX 8: Helper functions for integer arithmetic on financial amounts (paise).
function toPaise(amount: number): number {
  return Math.round(amount * 100);
}
function fromPaise(paise: number): number {
  return paise / 100;
}

export interface SettlementCalculation {
  merchantId: Types.ObjectId;
  period: {
    startDate: Date;
    endDate: Date;
  };
  grossRevenue: number;
  platformFee: number;
  refunds: number;
  netAmount: number;
  breakdown: {
    completedOrdersCount: number;
    completedOrdersTotal: number;
    platformFeeRate: number;
    refundedOrdersCount: number;
  };
}

export interface PayoutValidation {
  valid: boolean;
  maxAmount: number;
  breakdown: {
    grossRevenue: number;
    platformFee: number;
    refunds: number;
    netAmount: number;
    reason?: string;
  };
}

export class SettlementService {
  /**
   * CRITICAL-001 FIX: Look up all store IDs for a merchant.
   * The backend monolith writes orders with `store` (not `merchant`) as the foreign key.
   * Previously this method queried by `merchant: merchantId` which matched 0 orders
   * because the backend never writes a `merchant` field to orders.
   */
  private static async getMerchantStoreIds(merchantId: Types.ObjectId, session?: mongoose.ClientSession): Promise<Types.ObjectId[]> {
    const stores = await Store.find({ merchantId }, '_id').session(session || null).lean();
    return stores.map((s) => s._id as Types.ObjectId);
  }

  /**
   * Calculate settlement for a merchant within a specific period.
   * Sums completed orders, subtracts platform commission and refunds.
   *
   * CRITICAL-001 FIX: Now queries by `store` (which the backend writes) instead of
   * `merchant` (which the backend never writes to orders).
   *
   * MERCH-AUDIT-10: When externalSession is provided, participates in that session
   * (for createSettlementRecord). When omitted, manages its own session/transaction.
   */
  static async calculateSettlement(
    merchantId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
    externalSession?: mongoose.ClientSession,
  ): Promise<SettlementCalculation> {
    const isOwnSession = !externalSession;
    const session = isOwnSession ? await mongoose.startSession() : externalSession!;
    if (isOwnSession) session.startTransaction();

    try {
      // CRITICAL-001 FIX: Resolve merchant's store IDs first, then query by store.
      const storeIds = await this.getMerchantStoreIds(merchantId, session);
      if (storeIds.length === 0) {
        // No stores found — return zero calculation (merchant has no active stores)
        if (isOwnSession) await session.abortTransaction();
        return {
          merchantId,
          period: { startDate, endDate },
          grossRevenue: 0,
          platformFee: 0,
          refunds: 0,
          netAmount: 0,
          breakdown: {
            completedOrdersCount: 0,
            completedOrdersTotal: 0,
            platformFeeRate: PLATFORM_COMMISSION_RATE,
            refundedOrdersCount: 0,
          },
        };
      }

      // Find all completed orders for this merchant's stores in the period
      const completedOrders = await Order.find({
        store: { $in: storeIds },
        status: 'delivered',
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      }).session(session).lean();

      // FIX 8: Use integer arithmetic (paise) for financial calculations.
      let grossRevenuePaise = 0;
      let completedOrdersTotalPaise = 0;
      completedOrders.forEach((order) => {
        if (order.totals?.total) {
          grossRevenuePaise += toPaise(order.totals.total);
          completedOrdersTotalPaise += toPaise(order.totals.total);
        }
      });

      // Calculate platform fee in paise
      const platformFeePaise = Math.round(grossRevenuePaise * PLATFORM_COMMISSION_RATE);

      // Find refunded orders in the period
      const refundedOrders = await Order.find({
        store: { $in: storeIds },
        status: 'refunded',
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      }).session(session).lean();

      // Sum refunded amounts in paise
      let refundsPaise = 0;
      refundedOrders.forEach((order) => {
        if (order.totals?.total) {
          refundsPaise += toPaise(order.totals.total);
        }
      });

      // Calculate net settlement amount in paise
      const netAmountPaise = grossRevenuePaise - platformFeePaise - refundsPaise;

      if (isOwnSession) await session.commitTransaction();

      return {
        merchantId,
        period: {
          startDate,
          endDate,
        },
        grossRevenue: fromPaise(grossRevenuePaise),
        platformFee: fromPaise(platformFeePaise),
        refunds: fromPaise(refundsPaise),
        netAmount: fromPaise(netAmountPaise),
        breakdown: {
          completedOrdersCount: completedOrders.length,
          completedOrdersTotal: fromPaise(completedOrdersTotalPaise),
          platformFeeRate: PLATFORM_COMMISSION_RATE,
          refundedOrdersCount: refundedOrders.length,
        },
      };
    } catch (err) {
      if (isOwnSession) await session.abortTransaction();
      throw err;
    } finally {
      if (isOwnSession) session.endSession();
    }
  }

  /**
   * Create a settlement record in the database.
   * MERCH-AUDIT-10: Both calculateSettlement reads and Settlement.create write
   * are wrapped in the same transaction for atomicity.
   */
  static async createSettlementRecord(
    merchantId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<unknown> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // calculateSettlement participates in the external session (does not start/commit)
      const calculation = await this.calculateSettlement(merchantId, startDate, endDate, session);

      const settlementData = {
        merchantId: calculation.merchantId,
        period: calculation.period,
        grossRevenue: calculation.grossRevenue,
        platformFee: calculation.platformFee,
        refunds: calculation.refunds,
        netAmount: calculation.netAmount,
        status: 'calculated' as const,
        breakdown: calculation.breakdown,
      };

      const [settlement] = await (Settlement as unknown).create([settlementData], { session });

      await session.commitTransaction();
      return settlement;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * Validate a payout request against calculated settlement.
   * Returns validation result and max allowable payout amount.
   */
  static async validatePayoutAmount(
    merchantId: Types.ObjectId,
    requestedAmount: number,
  ): Promise<PayoutValidation> {
    // Calculate current settlement for the current month/period
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const calculation = await this.calculateSettlement(merchantId, startDate, endDate);

    const valid = requestedAmount <= calculation.netAmount && requestedAmount > 0;

    return {
      valid,
      maxAmount: calculation.netAmount,
      breakdown: {
        grossRevenue: calculation.grossRevenue,
        platformFee: calculation.platformFee,
        refunds: calculation.refunds,
        netAmount: calculation.netAmount,
        reason: valid
          ? 'Payout amount is valid'
          : `Requested amount (${requestedAmount}) exceeds net settlement (${calculation.netAmount})`,
      },
    };
  }

  /**
   * Get settlement history for a merchant.
   */
  static async getSettlementHistory(
    merchantId: Types.ObjectId,
    limit: number = 20,
    skip: number = 0,
  ): Promise<{ settlements: unknown[]; total: number }> {
    const [settlements, total] = await Promise.all([
      (Settlement as unknown).find({ merchantId }).sort({ createdAt: -1 }).limit(limit).skip(skip).lean(),
      (Settlement as unknown).countDocuments({ merchantId }),
    ]);

    return { settlements, total };
  }

  /**
   * Link a settlement to a payout and update status.
   */
  static async linkPayoutToSettlement(settlementId: string, payoutId: string): Promise<unknown> {
    return await (Settlement as unknown).findByIdAndUpdate(
      settlementId,
      {
        $set: {
          payoutId,
          status: 'approved',
        },
      },
      { new: true },
    );
  }
}
