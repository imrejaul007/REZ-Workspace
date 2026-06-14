/**
 * Migration: rename 'nuqta' → 'rez' in rez-wallet-service DB
 * Run ONCE before removing 'nuqta' from Mongoose enum arrays.
 * Safe to run multiple times (idempotent).
 */
import mongoose from 'mongoose';
import { logger } from '../config/logger';

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';

async function migrate() {
  if (!MONGO_URI) throw new Error('MONGODB_URI env var not set');

  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db!;

  logger.debug('Starting rez-wallet-service nuqta→rez migration...');

  // 1. CoinTransactions: coinType field
  const ctResult = await db.collection('cointransactions').updateMany(
    { coinType: 'nuqta' },
    { $set: { coinType: 'rez' } }
  );
  logger.debug(`CoinTransactions: updated ${ctResult.modifiedCount} docs`);

  // 2. Wallets: coins array elements
  const wResult = await db.collection('wallets').updateMany(
    { 'coins.type': 'nuqta' },
    { $set: { 'coins.$[elem].type': 'rez' } },
    { arrayFilters: [{ 'elem.type': 'nuqta' }] }
  );
  logger.debug(`Wallets coins[].type: updated ${wResult.modifiedCount} docs`);

  // 3. LedgerEntries: coinType field
  const leResult = await db.collection('ledgerentries').updateMany(
    { coinType: 'nuqta' },
    { $set: { coinType: 'rez' } }
  );
  logger.debug(`LedgerEntries: updated ${leResult.modifiedCount} docs`);

  logger.debug('Migration complete!');
  await mongoose.disconnect();
}

migrate().catch(err => {
  logger.error('Migration failed:', err);
  process.exit(1);
});
