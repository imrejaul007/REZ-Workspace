import mongoose, { Schema, Document } from 'mongoose';
import { Supplier as ISupplier } from '../types';

export interface SupplierDocument extends Omit<ISupplier, '_id'>, Document {}

const SupplierSchema = new Schema<SupplierDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    contactPerson: {
      type: String,
      required: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      maxlength: 300
    },
    city: {
      type: String,
      maxlength: 100
    },
    state: {
      type: String,
      maxlength: 100
    },
    country: {
      type: String,
      maxlength: 100,
      default: 'India'
    },
    postalCode: {
      type: String,
      maxlength: 20
    },
    gstin: {
      type: String,
      uppercase: true
    },
    paymentTerms: {
      type: String,
      maxlength: 100,
      default: 'NET 30'
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true
    },
    products: [{
      type: Schema.Types.ObjectId,
      ref: 'Product'
    }]
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

SupplierSchema.index({ name: 'text', contactPerson: 'text' });
SupplierSchema.index({ email: 1 }, { unique: true });
SupplierSchema.index({ city: 1, state: 1 });

SupplierSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

SupplierSchema.statics.findTopRated = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ rating: -1 })
    .limit(limit);
};

export const SupplierModel = mongoose.model<SupplierDocument>('Supplier', SupplierSchema);
