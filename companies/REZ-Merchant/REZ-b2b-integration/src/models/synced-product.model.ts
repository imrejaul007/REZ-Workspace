import mongoose, { Schema, Document, Model } from 'mongoose';
import { SyncedProduct, SupplierCategory } from '../types';

export interface ISyncedProductDocument extends Omit<SyncedProduct, 'createdAt' | 'updatedAt'>, Document {
  _id: mongoose.Types.ObjectId;
  lastSyncedAt: Date;
}

const SyncedProductSchema = new Schema<ISyncedProductDocument>(
  {
    syncedProductId: {
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
    supplierProductId: {
      type: String,
      required: true,
      index: true,
    },
    catalogProductId: String,
    supplierSku: String,
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    category: {
      type: String,
      enum: ['groceries', 'beverages', 'dairy', 'meat', 'produce', 'bakery', 'frozen', 'packaged', 'household', 'personal_care', 'other'] as SupplierCategory[],
      required: true,
      index: true,
    },
    brand: String,
    mrp: Number,
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    suggestedSellingPrice: Number,
    inventory: {
      type: Number,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      default: 'piece',
    },
    barcode: String,
    imageUrl: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    syncError: String,
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: false },
    collection: 'syncedproducts',
  }
);

// Compound indexes for efficient queries
SyncedProductSchema.index({ merchantId: 1, supplierId: 1 });
SyncedProductSchema.index({ merchantId: 1, category: 1 });
SyncedProductSchema.index({ merchantId: 1, isActive: 1 });
SyncedProductSchema.index({ supplierProductId: 1, supplierId: 1 }, { unique: true });
SyncedProductSchema.index({ supplierSku: 1 }, { sparse: true });
SyncedProductSchema.index({ lastSyncedAt: 1 });

// Virtual for margin calculation
SyncedProductSchema.virtual('calculatedMargin').get(function () {
  if (this.mrp && this.costPrice) {
    return ((this.mrp - this.costPrice) / this.mrp) * 100;
  }
  if (this.suggestedSellingPrice && this.costPrice) {
    return ((this.suggestedSellingPrice - this.costPrice) / this.suggestedSellingPrice) * 100;
  }
  return null;
});

// Static method to find products by merchant
SyncedProductSchema.statics.findByMerchant = function (
  merchantId: string,
  options: {
    supplierId?: string;
    category?: SupplierCategory;
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<ISyncedProductDocument[]> {
  const query: Record<string, unknown> = { merchantId };

  if (options.supplierId) query.supplierId = options.supplierId;
  if (options.category) query.category = options.category;
  if (typeof options.isActive === 'boolean') query.isActive = options.isActive;

  return this.find(query)
    .sort({ name: 1 })
    .skip(((options.page ?? 1) - 1) * (options.limit ?? 20))
    .limit(options.limit ?? 20)
    .exec();
};

// Static method to find by supplier product ID
SyncedProductSchema.statics.findBySupplierProduct = function (
  supplierId: string,
  supplierProductId: string
): Promise<ISyncedProductDocument | null> {
  return this.findOne({ supplierId, supplierProductId }).exec();
};

// Static method to bulk upsert products
SyncedProductSchema.statics.bulkUpsert = async function (
  products: Array<{
    supplierId: string;
    supplierProductId: string;
    merchantId: string;
    name: string;
    costPrice: number;
    [key: string]: unknown;
  }>
): Promise<{ upserted: number; updated: number }> {
  const operations = products.map((product) => ({
    updateOne: {
      filter: {
        supplierId: product.supplierId,
        supplierProductId: product.supplierProductId,
        merchantId: product.merchantId,
      },
      update: {
        $set: {
          ...product,
          lastSyncedAt: new Date(),
          syncError: null,
        },
      },
      upsert: true,
    },
  }));

  const result = await this.bulkWrite(operations);
  return {
    upserted: result.upsertedCount,
    updated: result.modifiedCount,
  };
};

// Static method to get products with sync errors
SyncedProductSchema.statics.findSyncErrors = function (
  merchantId: string
): Promise<ISyncedProductDocument[]> {
  return this.find({
    merchantId,
    syncError: { $ne: null },
  })
    .sort({ lastSyncedAt: -1 })
    .exec();
};

// Static method to deactivate stale products
SyncedProductSchema.statics.deactivateStale = async function (
  merchantId: string,
  supplierId: string,
  staleThreshold: Date
): Promise<number> {
  const result = await this.updateMany(
    {
      merchantId,
      supplierId,
      lastSyncedAt: { $lt: staleThreshold },
      isActive: true,
    },
    {
      $set: {
        isActive: false,
        syncError: 'Product sync expired - no update received within threshold',
      },
    }
  );
  return result.modifiedCount;
};

export const SyncedProductModel: Model<ISyncedProductDocument> = mongoose.model<ISyncedProductDocument>(
  'SyncedProduct',
  SyncedProductSchema
);
