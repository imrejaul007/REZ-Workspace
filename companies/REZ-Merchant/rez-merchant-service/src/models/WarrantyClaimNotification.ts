/**
 * Warranty Claim Notification Model
 * Tracks warranty claims from verify-qr service
 */

import mongoose from 'mongoose';

const warrantyClaimNotificationSchema = new mongoose.Schema({
  warrantyId: { type: String, required: true, index: true },
  serialNumber: { type: String, required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', index: true },

  // Customer info
  customerName: String,
  customerPhone: String,
  customerEmail: String,

  // Claim details
  claimType: { type: String, required: true },
  claimDescription: String,
  claimDate: { type: Date, default: Date.now },

  // Status tracking
  status: {
    type: String,
    enum: ['PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED'],
    default: 'PENDING_REVIEW'
  },

  // Resolution
  resolution: String,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'MerchantUser' },
  resolvedAt: Date,

  // Source
  source: { type: String, enum: ['verify-qr', 'support-portal', 'api'], default: 'verify-qr' }
}, { timestamps: true });

// Indexes
warrantyClaimNotificationSchema.index({ merchantId: 1, status: 1 });
warrantyClaimNotificationSchema.index({ merchantId: 1, claimDate: -1 });

export const WarrantyClaimNotification = mongoose.model('WarrantyClaimNotification', warrantyClaimNotificationSchema);
