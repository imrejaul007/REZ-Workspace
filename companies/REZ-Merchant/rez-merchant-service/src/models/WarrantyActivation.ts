/**
 * Warranty Activation Model
 * Tracks warranty activations from verify-qr service
 */

import mongoose from 'mongoose';

const warrantyActivationSchema = new mongoose.Schema({
  serialNumber: { type: String, required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', index: true },
  userId: { type: String, required: true, index: true },

  // Activation details
  activatedAt: { type: Date, default: Date.now },
  expiryDate: { type: Date },

  // Source tracking
  source: { type: String, enum: ['verify-qr', 'manual', 'api'], default: 'verify-qr' },

  // Customer info
  customerName: String,
  customerPhone: String,
  customerEmail: String,

  // Purchase details
  purchaseDate: Date,
  pricePaid: Number,
  invoiceUrl: String,

  // Analytics
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'India' }
  }
}, { timestamps: true });

// Indexes
warrantyActivationSchema.index({ merchantId: 1, activatedAt: -1 });
warrantyActivationSchema.index({ userId: 1, activatedAt: -1 });
warrantyActivationSchema.index({ source: 1, activatedAt: -1 });

export const WarrantyActivation = mongoose.model('WarrantyActivation', warrantyActivationSchema);
