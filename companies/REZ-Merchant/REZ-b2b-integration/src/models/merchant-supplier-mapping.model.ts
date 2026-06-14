import mongoose, { Schema, Document, Model } from 'mongoose';
import { MerchantSupplierMapping } from '../types';

export interface IMerchantSupplierMappingDocument extends Omit<MerchantSupplierMapping, 'createdAt' | 'updatedAt'>, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSupplierMappingSchema = new Schema<IMerchantSupplierMappingDocument>(
  {
    mappingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    supplierId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    marginTier: {
      type: String,
      enum: ['standard', 'premium', 'wholesale'],
      default: 'standard',
    },
    customMarkup: {
      type: Number,
      min: 0,
    },
    syncEnabled: {
      type: Boolean,
      default: true,
    },
    lastSyncAt: Date,
    syncStatus: {
      type: String,
      enum: ['synced', 'pending', 'error', 'never_synced'],
      default: 'never_synced',
    },
    errorMessage: String,
  },
  {
    timestamps: true,
    collection: 'merchantsuppliermappings',
  }
);

// Compound indexes for efficient queries
MerchantSupplierMappingSchema.index({ merchantId: 1, status: 1 });
MerchantSupplierMappingSchema.index({ supplierId: 1, status: 1 });
MerchantSupplierMappingSchema.index({ merchantId: 1, supplierId: 1 }, { unique: true });
MerchantSupplierMappingSchema.index({ syncStatus: 1, updatedAt: 1 });

// Static method to get all suppliers for a merchant
MerchantSupplierMappingSchema.statics.findByMerchant = function (
  merchantId: string,
  activeOnly: boolean = true
): Promise<IMerchantSupplierMappingDocument[]> {
  const query: Record<string, unknown> = { merchantId };
  if (activeOnly) {
    query.status = 'active';
    query.syncEnabled = true;
  }
  return this.find(query).exec();
};

// Static method to get all merchants for a supplier
MerchantSupplierMappingSchema.statics.findBySupplier = function (
  supplierId: string,
  activeOnly: boolean = true
): Promise<IMerchantSupplierMappingDocument[]> {
  const query: Record<string, unknown> = { supplierId };
  if (activeOnly) {
    query.status = 'active';
  }
  return this.find(query).exec();
};

// Static method to update sync status
MerchantSupplierMappingSchema.statics.updateSyncStatus = async function (
  merchantId: string,
  supplierId: string,
  status: 'synced' | 'pending' | 'error',
  errorMessage?: string
): Promise<IMerchantSupplierMappingDocument | null> {
  return this.findOneAndUpdate(
    { merchantId, supplierId },
    {
      $set: {
        syncStatus: status,
        errorMessage,
        lastSyncAt: status === 'synced' ? new Date() : undefined,
      },
    },
    { new: true }
  );
};

// Static method to get sync statistics for a merchant
MerchantSupplierMappingSchema.statics.getSyncStats = async function (
  merchantId: string
): Promise<{ synced: number; pending: number; error: number; total: number }> {
  const mappings = await this.find({ merchantId }).exec();
  return {
    synced: mappings.filter((m) => m.syncStatus === 'synced').length,
    pending: mappings.filter((m) => m.syncStatus === 'pending').length,
    error: mappings.filter((m) => m.syncStatus === 'error').length,
    total: mappings.length,
  };
};

export const MerchantSupplierMappingModel: Model<IMerchantSupplierMappingDocument> = mongoose.model<IMerchantSupplierMappingDocument>(
  'MerchantSupplierMapping',
  MerchantSupplierMappingSchema
);
