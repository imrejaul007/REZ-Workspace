// MW-FIX-001: IMerchantWalletTransaction moved to MerchantWalletTransaction.ts (separate collection)
// Re-exported here for backward compatibility with any existing imports.
export type { IMerchantWalletTransaction } from './MerchantWalletTransaction';

import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';
import { logger } from '../config/logger';

// TODO: Migrate to import from '@rez/shared-types'
// Example: import { IMerchantWallet } from '@rez/shared-types/entities/wallet';

export interface IMerchantWallet extends Document {
  merchant: Types.ObjectId;
  store: Types.ObjectId;
  balance: {
    total: number;
    available: number;
    pending: number;
    withdrawn: number;
    held: number;
  };
  statistics: {
    totalSales: number;
    totalPlatformFees: number;
    netSales: number;
    totalOrders: number;
    averageOrderValue: number;
    totalRefunds: number;
    totalWithdrawals: number;
  };
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
    upiId?: string;
    isVerified: boolean;
  };
  settlementCycle: string;
  minWithdrawalAmount: number;
  // MW-FIX-001: transactions array removed — stored in MerchantWalletTransaction collection
  isActive: boolean;
  lastSettlementAt?: Date;
  // WAL-XXX FIX: Added version field for optimistic locking to prevent race conditions
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// HIGH FIX: Bank Details Encryption
// Encrypt sensitive bankDetails fields at pre-save using AES-256-CBC.
// Decryption happens at post-find/post-findOne via middleware below.
// Requires MERCHANT_WALLET_ENCRYPTION_KEY env var (32-byte hex key).
const encryptionKey = (() => {
  const key = process.env.MERCHANT_WALLET_ENCRYPTION_KEY;
  if (!key) {
    logger.warn('[MerchantWallet] MERCHANT_WALLET_ENCRYPTION_KEY not set — bank details will be stored in plaintext');
    return null;
  }
  try {
    return Buffer.from(key, 'hex');
  } catch (err) {
    logger.warn('[MerchantWallet] Invalid MERCHANT_WALLET_ENCRYPTION_KEY — must be 64-char hex string (32 bytes)');
    return null;
  }
})();

function encryptField(plaintext: string): string {
  if (!encryptionKey) return plaintext;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptField(ciphertext: string): string {
  if (!encryptionKey) return ciphertext;
  const [ivHex, encryptedHex] = ciphertext.split(':');
  if (!ivHex || !encryptedHex) return ciphertext; // Legacy plaintext
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

const MerchantWalletSchema = new Schema<IMerchantWallet>(
  {
    merchant: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    balance: {
      total: { type: Number, default: 0, min: 0 },
      available: { type: Number, default: 0, min: 0 },
      pending: { type: Number, default: 0, min: 0 },
      withdrawn: { type: Number, default: 0, min: 0 },
      held: { type: Number, default: 0, min: 0 },
    },
    statistics: {
      totalSales: { type: Number, default: 0 },
      totalPlatformFees: { type: Number, default: 0 },
      netSales: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      averageOrderValue: { type: Number, default: 0 },
      totalRefunds: { type: Number, default: 0 },
      totalWithdrawals: { type: Number, default: 0 },
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      bankName: String,
      upiId: String,
      isVerified: { type: Boolean, default: false },
    },
    settlementCycle: { type: String, default: 'instant' },
    minWithdrawalAmount: { type: Number, default: 100 },
    // MW-FIX-001: transactions array removed — use MerchantWalletTransaction collection
    isActive: { type: Boolean, default: true },
    lastSettlementAt: Date,
    // WAL-XXX FIX: Added version field for optimistic locking
    version: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Pre-save hook: encrypt ALL bankDetails fields before saving
MerchantWalletSchema.pre('save', function (next) {
  if (this.bankDetails) {
    // Encrypt accountNumber
    if (this.bankDetails.accountNumber && !this.bankDetails.accountNumber.includes(':')) {
      this.bankDetails.accountNumber = encryptField(this.bankDetails.accountNumber);
    }
    // Encrypt IFSC code
    if (this.bankDetails.ifscCode && !this.bankDetails.ifscCode.includes(':')) {
      this.bankDetails.ifscCode = encryptField(this.bankDetails.ifscCode);
    }
    // Encrypt account holder name
    if (this.bankDetails.accountHolderName && !this.bankDetails.accountHolderName.includes(':')) {
      this.bankDetails.accountHolderName = encryptField(this.bankDetails.accountHolderName);
    }
    // Encrypt bank name
    if (this.bankDetails.bankName && !this.bankDetails.bankName.includes(':')) {
      this.bankDetails.bankName = encryptField(this.bankDetails.bankName);
    }
    // Encrypt UPI ID
    if (this.bankDetails.upiId && !this.bankDetails.upiId.includes(':')) {
      this.bankDetails.upiId = encryptField(this.bankDetails.upiId);
    }
  }
  next();
});

// Helper function to decrypt if needed
function decryptIfNeeded(value: string | undefined): string | undefined {
  if (!value) return value;
  if (value.includes(':')) {
    return decryptField(value);
  }
  return value;
}

// Post-find hooks: decrypt ALL bankDetails fields after retrieval
MerchantWalletSchema.post('find', function (docs) {
  if (Array.isArray(docs)) {
    docs.forEach((doc) => {
      if (doc?.bankDetails) {
        doc.bankDetails.accountNumber = decryptIfNeeded(doc.bankDetails.accountNumber);
        doc.bankDetails.ifscCode = decryptIfNeeded(doc.bankDetails.ifscCode);
        doc.bankDetails.accountHolderName = decryptIfNeeded(doc.bankDetails.accountHolderName);
        doc.bankDetails.bankName = decryptIfNeeded(doc.bankDetails.bankName);
        doc.bankDetails.upiId = decryptIfNeeded(doc.bankDetails.upiId);
      }
    });
  }
});

MerchantWalletSchema.post('findOne', function (doc) {
  if (doc?.bankDetails) {
    doc.bankDetails.accountNumber = decryptIfNeeded(doc.bankDetails.accountNumber);
    doc.bankDetails.ifscCode = decryptIfNeeded(doc.bankDetails.ifscCode);
    doc.bankDetails.accountHolderName = decryptIfNeeded(doc.bankDetails.accountHolderName);
    doc.bankDetails.bankName = decryptIfNeeded(doc.bankDetails.bankName);
    doc.bankDetails.upiId = decryptIfNeeded(doc.bankDetails.upiId);
  }
});

MerchantWalletSchema.post('findOneAndUpdate', function (doc) {
  if (doc?.bankDetails) {
    doc.bankDetails.accountNumber = decryptIfNeeded(doc.bankDetails.accountNumber);
    doc.bankDetails.ifscCode = decryptIfNeeded(doc.bankDetails.ifscCode);
    doc.bankDetails.accountHolderName = decryptIfNeeded(doc.bankDetails.accountHolderName);
    doc.bankDetails.bankName = decryptIfNeeded(doc.bankDetails.bankName);
    doc.bankDetails.upiId = decryptIfNeeded(doc.bankDetails.upiId);
  }
});

MerchantWalletSchema.index({ merchant: 1 }, { unique: true });
MerchantWalletSchema.index({ store: 1 });
MerchantWalletSchema.index({ isActive: 1 });
MerchantWalletSchema.index({ createdAt: -1 });
MerchantWalletSchema.index({ merchant: 1, isActive: 1 });

// SCHEMA FIX: Validate balance invariants on save
MerchantWalletSchema.pre('save', function (next) {
  const { total, available, pending, withdrawn, held } = this.balance;

  // Validate that all balance sub-fields are non-negative
  if (available < 0) {
    return next(new Error('Available balance cannot be negative'));
  }
  if (pending < 0) {
    return next(new Error('Pending balance cannot be negative'));
  }
  if (withdrawn < 0) {
    return next(new Error('Withdrawn balance cannot be negative'));
  }
  if (held < 0) {
    return next(new Error('Held balance cannot be negative'));
  }

  // Validate that total >= available
  if (total < available) {
    return next(new Error(`Total balance (${total}) cannot be less than available (${available})`));
  }

  next();
});

export const MerchantWallet = mongoose.model<IMerchantWallet>('MerchantWallet', MerchantWalletSchema);
