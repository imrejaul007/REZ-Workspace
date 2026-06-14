import { v4 as uuidv4 } from 'uuid';
import { CustomerPoints } from '../models/CustomerPoints';
import { PointsTransaction } from '../models/PointsTransaction';
import {
  TRANSACTION_TYPES,
  STATUS,
  POINTS_EXPIRY_MONTHS,
} from '../config/constants';

export interface ExpiryResult {
  totalExpired: number;
  transactionsExpired: number;
  customerIds: string[];
}

export class ExpiryService {
  /**
   * Process expired points - run via cron job
   */
  async processExpiredPoints(): Promise<ExpiryResult> {
    const now = new Date();
    const expiredTransactions = await PointsTransaction.find({
      type: { $in: [TRANSACTION_TYPES.EARN, TRANSACTION_TYPES.BONUS, TRANSACTION_TYPES.REFERRAL, TRANSACTION_TYPES.BIRTHDAY] },
      status: 'ACTIVE',
      expiresAt: { $lte: now },
    });

    const customerUpdates = new Map<string, { expiredPoints: number; transactionIds: string[] }>();
    let totalExpired = 0;

    // Group by customer
    for (const tx of expiredTransactions) {
      const existing = customerUpdates.get(tx.customerId) || { expiredPoints: 0, transactionIds: [] };
      existing.expiredPoints += Math.abs(tx.points);
      existing.transactionIds.push(tx.transactionId);
      customerUpdates.set(tx.customerId, existing);
      totalExpired += Math.abs(tx.points);
    }

    // Update customers and transactions
    const session = await PointsTransaction.startSession();
    session.startTransaction();

    try {
      for (const [customerId, updates] of customerUpdates) {
        // Deduct expired points from customer
        await CustomerPoints.updateOne(
          { customerId },
          {
            $inc: { currentPoints: -updates.expiredPoints },
            $set: { lastActivityDate: now },
          },
          { session }
        );

        // Mark transactions as expired
        await PointsTransaction.updateMany(
          { transactionId: { $in: updates.transactionIds } },
          { status: 'EXPIRED' },
          { session }
        );

        // Create expiry transaction record
        const customerPoints = await CustomerPoints.findOne({ customerId }).session(session);
        await PointsTransaction.create(
          [
            {
              transactionId: uuidv4(),
              customerId,
              programId: expiredTransactions[0].programId,
              type: TRANSACTION_TYPES.EXPIRE,
              points: -updates.expiredPoints,
              balanceAfter: customerPoints?.currentPoints || 0,
              description: `Expired ${updates.expiredPoints} points`,
              status: 'ACTIVE',
            },
          ],
          { session }
        );
      }

      await session.commitTransaction();

      return {
        totalExpired,
        transactionsExpired: expiredTransactions.length,
        customerIds: Array.from(customerUpdates.keys()),
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get points that will expire soon for a customer
   */
  async getExpiringPoints(
    customerId: string,
    daysAhead: number = 30
  ): Promise<{
    pointsExpiringSoon: number;
    transactions: Array<{
      transactionId: string;
      points: number;
      expiresAt: Date;
      daysUntilExpiry: number;
    }>;
  }> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const transactions = await PointsTransaction.find({
      customerId,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date(), $lte: futureDate },
      points: { $gt: 0 },
    }).sort({ expiresAt: 1 });

    const pointsExpiringSoon = transactions.reduce((sum, tx) => sum + tx.points, 0);

    return {
      pointsExpiringSoon,
      transactions: transactions.map((tx) => {
        const daysUntilExpiry = Math.ceil(
          (tx.expiresAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return {
          transactionId: tx.transactionId,
          points: tx.points,
          expiresAt: tx.expiresAt!,
          daysUntilExpiry,
        };
      }),
    };
  }

  /**
   * Preview points expiry for a customer
   */
  async previewExpiry(customerId: string): Promise<{
    totalActive: number;
    expiringThisMonth: number;
    expiringNextMonth: number;
    expiringInThreeMonths: number;
    neverExpire: number;
  }> {
    const transactions = await PointsTransaction.find({
      customerId,
      status: 'ACTIVE',
      points: { $gt: 0 },
    });

    const now = new Date();
    const oneMonthFromNow = new Date(now);
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    const twoMonthsFromNow = new Date(now);
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
    const threeMonthsFromNow = new Date(now);
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    let totalActive = 0;
    let expiringThisMonth = 0;
    let expiringNextMonth = 0;
    let expiringInThreeMonths = 0;
    let neverExpire = 0;

    for (const tx of transactions) {
      totalActive += tx.points;
      const expiresAt = tx.expiresAt;

      if (!expiresAt) {
        neverExpire += tx.points;
      } else if (expiresAt <= oneMonthFromNow) {
        expiringThisMonth += tx.points;
      } else if (expiresAt <= twoMonthsFromNow) {
        expiringNextMonth += tx.points;
      } else if (expiresAt <= threeMonthsFromNow) {
        expiringInThreeMonths += tx.points;
      } else {
        neverExpire += tx.points;
      }
    }

    return {
      totalActive,
      expiringThisMonth,
      expiringNextMonth,
      expiringInThreeMonths,
      neverExpire,
    };
  }

  /**
   * Extend expiry of specific points (admin action)
   */
  async extendExpiry(
    customerId: string,
    transactionIds: string[],
    additionalDays: number
  ): Promise<number> {
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);

    const result = await PointsTransaction.updateMany(
      {
        customerId,
        transactionId: { $in: transactionIds },
        status: 'ACTIVE',
      },
      { $set: { expiresAt: newExpiryDate } }
    );

    return result.modifiedCount;
  }
}
