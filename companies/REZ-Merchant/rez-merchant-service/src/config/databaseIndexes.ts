/**
 * Database Indexes Configuration
 *
 * Additional compound indexes for B2B query optimization.
 * These indexes complement the existing per-model indexes.
 *
 * Run with: npm run db:indexes
 */

import mongoose from 'mongoose';
import { logger } from './logger';

/**
 * Index definitions for B2B queries
 */
export const B2B_INDEXES = [
  // Supplier indexes
  {
    collection: 'suppliers',
    index: { merchantId: 1, tags: 1, isActive: 1 },
    name: 'supplier_merchant_tags_active',
    description: 'Filter suppliers by merchant with tags',
  },
  {
    collection: 'suppliers',
    index: { merchantId: 1, creditLimit: -1 },
    name: 'supplier_merchant_credit_desc',
    description: 'Sort suppliers by credit limit',
  },
  {
    collection: 'suppliers',
    index: { merchantId: 1, 'address.state': 1 },
    name: 'supplier_merchant_state',
    description: 'Group suppliers by state',
  },

  // Purchase Order indexes
  {
    collection: 'purchaseorders',
    index: { merchantId: 1, paymentStatus: 1, dueDate: 1 },
    name: 'po_merchant_payment_due',
    description: 'Find overdue POs by payment status',
  },
  {
    collection: 'purchaseorders',
    index: { merchantId: 1, supplierId: 1, orderDate: -1 },
    name: 'po_merchant_supplier_date',
    description: 'PO history per supplier',
  },
  {
    collection: 'purchaseorders',
    index: { merchantId: 1, approvalHistory: 1 },
    name: 'po_merchant_approval',
    description: 'Filter by approval status',
  },
  {
    collection: 'purchaseorders',
    index: { supplierId: 1, dueDate: 1, isDeleted: 1 },
    name: 'po_supplier_due',
    description: 'Supplier overdue queries',
  },
  {
    collection: 'purchaseorders',
    index: { merchantId: 1, source: 1, createdAt: -1 },
    name: 'po_merchant_source',
    description: 'Filter POs by source (import, manual, api)',
  },

  // Supplier Ledger indexes
  {
    collection: 'supplierledgers',
    index: { merchantId: 1, supplierId: 1, entryType: 1 },
    name: 'ledger_merchant_supplier_type',
    description: 'Filter ledger by type',
  },
  {
    collection: 'supplierledgers',
    index: { merchantId: 1, isOverdue: 1, createdAt: -1 },
    name: 'ledger_merchant_overdue',
    description: 'Find overdue entries',
  },
  {
    collection: 'supplierledgers',
    index: { supplierId: 1, unallocatedAmount: 1 },
    name: 'ledger_supplier_unallocated',
    description: 'Find unallocated amounts',
  },

  // Credit Line indexes
  {
    collection: 'creditlines',
    index: { merchantId: 1, interestRate: -1 },
    name: 'creditline_merchant_interest',
    description: 'Sort by interest rate',
  },

  // Expense indexes (if exists)
  {
    collection: 'expenses',
    index: { merchantId: 1, category: 1, date: -1 },
    name: 'expense_merchant_category',
    description: 'Expense reports by category',
  },
  {
    collection: 'expenses',
    index: { merchantId: 1, date: 1, amount: -1 },
    name: 'expense_merchant_date_amount',
    description: 'Daily expense totals',
  },

  // RFQ indexes (if exists)
  {
    collection: 'rfqs',
    index: { merchantId: 1, status: 1, validUntil: 1 },
    name: 'rfq_merchant_status_valid',
    description: 'Active RFQs',
  },
  {
    collection: 'quotes',
    index: { rfqId: 1, createdAt: -1 },
    name: 'quote_rfq_date',
    description: 'Quotes by RFQ',
  },
];

/**
 * Create all B2B indexes
 */
export async function createB2BIndexes(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    logger.error('[Indexes] No database connection');
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const idx of B2B_INDEXES) {
    try {
      const collection = db.collection(idx.collection);

      // Check if index exists
      const existingIndexes = await collection.indexes();
      const exists = existingIndexes.some((i) => i.name === idx.name);

      if (exists) {
        logger.debug(`[Indexes] Skipping ${idx.name} (exists)`);
        skipped++;
        continue;
      }

      // Create index
      await collection.createIndex(idx.index, { name: idx.name, background: true });
      logger.info(`[Indexes] Created ${idx.name}: ${idx.description}`);
      created++;
    } catch (err) {
      logger.error(`[Indexes] Failed to create ${idx.name}`, { error: err });
    }
  }

  logger.info(`[Indexes] Complete: ${created} created, ${skipped} skipped`);
}

/**
 * Drop all B2B indexes (for testing/reset)
 */
export async function dropB2BIndexes(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    logger.error('[Indexes] No database connection');
    return;
  }

  for (const idx of B2B_INDEXES) {
    try {
      const collection = db.collection(idx.collection);
      await collection.dropIndex(idx.name);
      logger.info(`[Indexes] Dropped ${idx.name}`);
    } catch (err) {
      // Index might not exist
    }
  }
}

/**
 * List all indexes for a collection
 */
export async function listIndexes(collectionName: string): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    logger.error('[Indexes] No database connection');
    return;
  }

  const collection = db.collection(collectionName);
  const indexes = await collection.indexes();

  logger.info(`[Indexes] Indexes for ${collectionName}:`);
  for (const idx of indexes) {
    logger.info(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
  }
}

/**
 * Analyze query performance
 */
export async function analyzeCollection(collectionName: string): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    logger.error('[Indexes] No database connection');
    return;
  }

  try {
    const result = await db.command({
      analyze: collectionName,
    });
    logger.info(`[Indexes] Analyzed ${collectionName}`, result);
  } catch (err) {
    logger.error(`[Indexes] Failed to analyze ${collectionName}`, { error: err });
  }
}
