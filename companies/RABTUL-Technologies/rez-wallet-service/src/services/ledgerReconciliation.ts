import { LedgerEntry } from '../models/LedgerEntry';
import { Wallet } from '../models/Wallet';
import { createServiceLogger } from '../config/logger';
import mongoose, { Types } from 'mongoose';

const logger = createServiceLogger('ledger-reconciliation');

export interface OrphanedEntry {
  pairId: string;
  accountType: string;
  accountId: string;
  direction: string;
  amount: number;
  operationType: string;
  referenceId: string;
  createdAt: Date;
}

export interface OrphanReport {
  orphanedCount: number;
  totalPairIds: number;
  details: OrphanedEntry[];
}

export interface BalanceMismatch {
  userId: string;
  walletBalance: number;
  ledgerSum: number;
  difference: number;
  coinType?: string;
}

export interface BalanceMismatchReport {
  mismatchCount: number;
  totalUsersChecked: number;
  details: BalanceMismatch[];
}

export interface FullReconciliationReport {
  timestamp: Date;
  orphanReport: OrphanReport;
  balanceMismatchReport: BalanceMismatchReport;
  summary: {
    status: 'healthy' | 'issues_found';
    totalIssues: number;
  };
}

class LedgerReconciliationService {
  /**
   * Find all ledger entries with unpaired debits/credits
   * A proper pair has exactly 2 entries with the same pairId (1 debit, 1 credit)
   */
  async findOrphanedEntries(): Promise<OrphanReport> {
    const logger_fn = createServiceLogger('findOrphanedEntries');

    try {
      // Get all unique pairIds and count their entries
      const pairResults = await LedgerEntry.aggregate([
        {
          $group: {
            _id: '$pairId',
            count: { $sum: 1 },
            directions: { $push: '$direction' },
            entries: {
              $push: {
                direction: '$direction',
                amount: '$amount',
                accountType: '$accountType',
                accountId: '$accountId',
                operationType: '$operationType',
                referenceId: '$referenceId',
                createdAt: '$createdAt',
              },
            },
          },
        },
        {
          $match: {
            // Orphaned pairs: either count != 2, or don't have exactly 1 debit and 1 credit
            $or: [
              { count: { $ne: 2 } },
              { directions: { $ne: ['debit', 'credit'] } },
            ],
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      const orphanedCount = pairResults.length;
      const details: OrphanedEntry[] = [];

      for (const pairResult of pairResults) {
        for (const entry of pairResult.entries) {
          details.push({
            pairId: pairResult._id,
            accountType: entry.accountType,
            accountId: String(entry.accountId),
            direction: entry.direction,
            amount: entry.amount,
            operationType: entry.operationType,
            referenceId: entry.referenceId,
            createdAt: entry.createdAt,
          });
        }
      }

      // Total count of pairIds
      const totalPairsResult = await LedgerEntry.distinct('pairId');
      const totalPairIds = totalPairsResult.length;

      logger_fn.info('Orphaned entries found', {
        orphanedCount,
        totalPairIds,
        detailCount: details.length,
      });

      return {
        orphanedCount,
        totalPairIds,
        details,
      };
    } catch (err) {
      logger_fn.error('Error finding orphaned entries', { error: err.message });
      throw err;
    }
  }

  /**
   * Check wallet balance vs ledger sum for a specific user
   * Compares wallet.balance.total against SUM of all user's ledger credits - debits
   */
  async findBalanceMismatches(userId?: string): Promise<BalanceMismatchReport> {
    const logger_fn = createServiceLogger('findBalanceMismatches');

    try {
      // Get list of wallets to check
      let walletQuery: unknown = {};
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        walletQuery = { user: new Types.ObjectId(userId) };
      }

      // M6 FIX: Batch all ledger lookups in a single aggregate instead of N queries.
      // Previously this loop ran one LedgerEntry.aggregate() per wallet (N+1 problem).
      // Now we fetch all wallet-user balances in one pass.
      const wallets = await Wallet.find(walletQuery).lean();
      const walletMap = new Map<string, number>(); // userId → walletBalance
      for (const wallet of wallets) {
        walletMap.set(String(wallet.user), wallet.balance.total);
      }

      const userIds = Array.from(walletMap.keys()).map((id) => new Types.ObjectId(id));

      // Single aggregate: group ledger entries by accountId, compute sum per user
      let ledgerSums: Array<{ _id: Types.ObjectId; totalCredits: number; totalDebits: number }> = [];
      if (userIds.length > 0) {
        ledgerSums = await LedgerEntry.aggregate([
          {
            $match: {
              accountId: { $in: userIds },
              accountType: 'user_wallet',
            },
          },
          {
            $group: {
              _id: '$accountId',
              totalCredits: {
                $sum: {
                  $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0],
                },
              },
              totalDebits: {
                $sum: {
                  $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0],
                },
              },
            },
          },
        ]);
      }

      // Build lookup map: ObjectId string → ledger sum
      const ledgerMap = new Map<string, number>();
      for (const entry of ledgerSums) {
        ledgerMap.set(entry._id.toString(), entry.totalCredits - entry.totalDebits);
      }

      // Compare wallet balance vs ledger sum
      const mismatches: BalanceMismatch[] = [];
      for (const [userId, walletBalance] of walletMap) {
        const ledgerSum = ledgerMap.get(userId) ?? 0;
        const difference = walletBalance - ledgerSum;
        // Flag any mismatch (even small rounding differences)
        if (difference !== 0) {
          mismatches.push({ userId, walletBalance, ledgerSum, difference });
        }
      }

      logger_fn.info('Balance mismatches found', {
        mismatchCount: mismatches.length,
        totalUsersChecked: wallets.length,
      });

      return {
        mismatchCount: mismatches.length,
        totalUsersChecked: wallets.length,
        details: mismatches,
      };
    } catch (err) {
      logger_fn.error('Error finding balance mismatches', { error: err.message });
      throw err;
    }
  }

  /**
   * Generate a full reconciliation report with all checks
   */
  async generateReconciliationReport(): Promise<FullReconciliationReport> {
    const logger_fn = createServiceLogger('generateReconciliationReport');

    try {
      logger_fn.info('Starting full reconciliation report generation');

      // Run both checks in parallel
      const [orphanReport, balanceMismatchReport] = await Promise.all([
        this.findOrphanedEntries(),
        this.findBalanceMismatches(),
      ]);

      const totalIssues = orphanReport.orphanedCount + balanceMismatchReport.mismatchCount;
      const status = totalIssues > 0 ? 'issues_found' : 'healthy';

      const report: FullReconciliationReport = {
        timestamp: new Date(),
        orphanReport,
        balanceMismatchReport,
        summary: {
          status,
          totalIssues,
        },
      };

      logger_fn.info('Reconciliation report generated', {
        status,
        totalIssues,
        orphanedCount: orphanReport.orphanedCount,
        mismatchCount: balanceMismatchReport.mismatchCount,
      });

      return report;
    } catch (err) {
      logger_fn.error('Error generating reconciliation report', {
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Check balance for a specific user
   * Returns the mismatch for that user only
   */
  async checkUserBalance(userId: string): Promise<BalanceMismatch | null> {
    const logger_fn = createServiceLogger('checkUserBalance');

    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error(`Invalid userId: ${userId}`);
      }

      const userObjectId = new Types.ObjectId(userId);
      const wallet = await Wallet.findOne({ user: userObjectId }).lean();

      if (!wallet) {
        logger_fn.warn('Wallet not found for user');
        return null;
      }

      const walletBalance = wallet.balance.total;

      const ledgerResult = await LedgerEntry.aggregate([
        {
          $match: {
            accountId: userObjectId,
            accountType: 'user_wallet',
          },
        },
        {
          $group: {
            _id: null,
            totalCredits: {
              $sum: {
                $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0],
              },
            },
            totalDebits: {
              $sum: {
                $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0],
              },
            },
          },
        },
      ]);

      const ledgerSum =
        ledgerResult.length > 0
          ? ledgerResult[0].totalCredits - ledgerResult[0].totalDebits
          : 0;

      const difference = walletBalance - ledgerSum;

      if (difference !== 0) {
        const mismatch: BalanceMismatch = {
          userId,
          walletBalance,
          ledgerSum,
          difference,
        };

        logger_fn.warn('Balance mismatch detected', mismatch);
        return mismatch;
      }

      logger_fn.info('User balance check passed');
      return null;
    } catch (err) {
      logger_fn.error('Error checking user balance', { error: err.message });
      throw err;
    }
  }
}

export const ledgerReconciliationService = new LedgerReconciliationService();
