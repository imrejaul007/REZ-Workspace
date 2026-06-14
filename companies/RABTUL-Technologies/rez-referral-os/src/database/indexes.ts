/**
 * Database Indexes for REZ Referral OS
 */

import mongoose from 'mongoose';

type IndexDefinition = {
  key: Record<string, 1 | -1>;
  unique?: boolean;
  sparse?: boolean;
};

const indexes: Record<string, IndexDefinition[]> = {
  referrals: [
    { key: { referrerId: 1 } },
    { key: { refereeId: 1 } },
    { key: { referralCode: 1 } },
    { key: { status: 1, createdAt: -1 } },
    { key: { campaignId: 1 } },
    { key: { type: 1, status: 1 } },
    { key: { referrerId: 1, status: 1 } },
  ],
  referralCodes: [
    { key: { code: 1 }, unique: true },
    { key: { ownerId: 1, type: 1 } },
    { key: { companyId: 1, type: 1 } },
    { key: { tier: 1, totalReferrals: -1 } },
  ],
  creatorProfiles: [
    { key: { userId: 1 }, unique: true },
    { key: { handle: 1 }, unique: true, sparse: true },
    { key: { companyId: 1 } },
    { key: { tier: 1 } },
  ],
  creatorCollections: [
    { key: { creatorId: 1 } },
    { key: { slug: 1, creatorId: 1 }, unique: true },
  ],
  campaigns: [
    { key: { sponsorId: 1 } },
    { key: { type: 1, isActive: 1 } },
    { key: { startDate: 1, endDate: 1 } },
    { key: { isActive: 1, startDate: 1 } },
  ],
  referralRewards: [
    { key: { referralId: 1 } },
    { key: { referrerId: 1, createdAt: -1 } },
    { key: { campaignId: 1 } },
    { key: { idempotencyKey: 1 }, unique: true, sparse: true },
  ],
};

export async function createIndexes(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');

  for (const [collection, collectionIndexes] of Object.entries(indexes)) {
    console.log(`Creating indexes for ${collection}...`);
    for (const index of collectionIndexes) {
      try {
        await db.collection(collection).createIndex(index.key, index);
        console.log(`  ✓ ${Object.keys(index.key).join(', ')}`);
      } catch (err) {
        console.log(`  ✗ ${(err as Error).message}`);
      }
    }
  }
}

export default createIndexes;
