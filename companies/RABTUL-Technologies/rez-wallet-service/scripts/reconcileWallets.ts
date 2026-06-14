/**
 * Wallet Reconciliation Script
 *
 * For every wallet in MongoDB this script:
 *   1. Reads wallet.balance.available (the canonical on-chain balance)
 *   2. Sums all CoinTransaction credits and debits for the same userId
 *   3. Flags wallets where |walletBalance - ledgerBalance| > DISCREPANCY_THRESHOLD
 *
 * Usage:
 *   ts-node --skip-project scripts/reconcileWallets.ts              # full run
 *   ts-node --skip-project scripts/reconcileWallets.ts --dry-run    # report only, no writes
 *
 * Output:
 *   - Logs DISCREPANCY rows to stdout (JSON)
 *   - Writes a summary line at the end
 *   - Exit code 0 = clean, 1 = discrepancies found, 2 = fatal error
 *
 * Env vars:
 *   MONGODB_URI              — MongoDB connection string (required)
 *   RECONCILE_BATCH_SIZE     — Wallets processed per cursor batch (default: 200)
 *   RECONCILE_THRESHOLD      — Tolerance in coins before flagging (default: 0.01)
 */

import 'dotenv/config';
import mongoose, { Types } from 'mongoose';

// ── Minimal inline schemas to avoid importing full model files ───────────────
// We only access the fields we need; strict: false lets us read extra fields.

const WalletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    balance: {
      available: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    isFrozen: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { strict: false, collection: 'wallets' },
);

const CoinTxSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, required: true },         // 'credit' | 'debit'
    coinType: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { strict: false, collection: 'cointransactions' },
);

// Guard against model re-registration in tests
const WalletModel =
  mongoose.models['WalletRecon'] ??
  mongoose.model('WalletRecon', WalletSchema);

const CoinTxModel =
  mongoose.models['CoinTxRecon'] ??
  mongoose.model('CoinTxRecon', CoinTxSchema);

// ── Configuration ────────────────────────────────────────────────────────────
const DISCREPANCY_THRESHOLD = parseFloat(process.env.RECONCILE_THRESHOLD ?? '0.01');
const BATCH_SIZE = parseInt(process.env.RECONCILE_BATCH_SIZE ?? '200', 10);
const DRY_RUN = process.argv.includes('--dry-run');

// ── Types ────────────────────────────────────────────────────────────────────
interface DiscrepancyRecord {
  walletId: string;
  userId: string;
  walletBalance: number;
  ledgerBalance: number;
  diff: number;
  isFrozen: boolean;
}

interface ReconciliationSummary {
  walletsChecked: number;
  discrepanciesFound: number;
  totalDiff: number;
  dryRun: boolean;
  completedAt: string;
}

// ── Core reconciliation logic ────────────────────────────────────────────────

/**
 * Compute the expected balance for a user by summing their CoinTransaction records.
 * Returns credits − debits (rez coinType only, as that maps to balance.available).
 */
async function computeLedgerBalance(userId: Types.ObjectId): Promise<number> {
  const result = await CoinTxModel.aggregate([
    {
      $match: {
        user: userId,
        coinType: 'rez',
      },
    },
    {
      $group: {
        _id: null,
        credits: {
          $sum: {
            $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0],
          },
        },
        debits: {
          $sum: {
            $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0],
          },
        },
      },
    },
  ]);

  if (result.length === 0) return 0;
  return result[0].credits - result[0].debits;
}

async function runReconciliation(): Promise<ReconciliationSummary> {
  const discrepancies: DiscrepancyRecord[] = [];
  let walletsChecked = 0;
  let totalDiff = 0;

  // Use a MongoDB cursor so we never load the entire wallets collection into RAM.
  const cursor = WalletModel.find({}).batchSize(BATCH_SIZE).cursor();

  for await (const wallet of cursor) {
    walletsChecked++;
    const userId: Types.ObjectId = wallet.user as Types.ObjectId;
    const walletBalance: number = (wallet.balance as unknown)?.available ?? 0;

    const ledgerBalance = await computeLedgerBalance(userId);
    const diff = Math.abs(walletBalance - ledgerBalance);

    if (diff > DISCREPANCY_THRESHOLD) {
      const record: DiscrepancyRecord = {
        walletId: (wallet._id as Types.ObjectId).toString(),
        userId: userId.toString(),
        walletBalance,
        ledgerBalance,
        diff: parseFloat(diff.toFixed(4)),
        isFrozen: (wallet as unknown).isFrozen ?? false,
      };

      discrepancies.push(record);
      totalDiff += diff;

      // Emit immediately so ops can tail the output in real time
      console.log(JSON.stringify({ type: 'DISCREPANCY', ...record }));
    }

    // Progress tick every 500 wallets
    if (walletsChecked % 500 === 0) {
      console.log(
        JSON.stringify({ type: 'PROGRESS', walletsChecked, discrepanciesFound: discrepancies.length }),
      );
    }
  }

  const summary: ReconciliationSummary = {
    walletsChecked,
    discrepanciesFound: discrepancies.length,
    totalDiff: parseFloat(totalDiff.toFixed(4)),
    dryRun: DRY_RUN,
    completedAt: new Date().toISOString(),
  };

  console.log(JSON.stringify({ type: 'SUMMARY', ...summary }));
  return summary;
}

// ── Entry point ──────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    logger.error('[FATAL] MONGODB_URI env var is required');
    process.exit(2);
  }

  console.log(
    JSON.stringify({
      type: 'START',
      dryRun: DRY_RUN,
      threshold: DISCREPANCY_THRESHOLD,
      batchSize: BATCH_SIZE,
      startedAt: new Date().toISOString(),
    }),
  );

  try {
    await mongoose.connect(mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 60_000,
    });

    const summary = await runReconciliation();

    process.exit(summary.discrepanciesFound > 0 ? 1 : 0);
  } catch (err) {
    logger.error(JSON.stringify({ type: 'FATAL', error: err.message }));
    process.exit(2);
  } finally {
    await mongoose.disconnect();
  }
}

main();
