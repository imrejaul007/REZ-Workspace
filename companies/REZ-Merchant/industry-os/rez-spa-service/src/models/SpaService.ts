import mongoose, { Schema, Document } from 'mongoose';
import { SpaService as ISpaService, ServiceCategory, ServiceStatus } from '../types';

export interface SpaServiceDocument extends Omit<ISpaService, '_id'>, Document {}

const SpaServiceSchema = new Schema<SpaServiceDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000
    },
    category: {
      type: String,
      required: true,
      enum: ['massage', 'facial', 'body', 'nail', 'hair', 'wellness', 'other'],
      index: true
    },
    duration: {
      type: Number,
      required: true,
      min: 15,
      max: 480
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    images: [{
      type: String,
      url: String
    }],
    benefits: [{
      type: String
    }],
    contraindications: [{
      type: String
    }],
    products: [{
      type: Schema.Types.ObjectId,
      ref: 'Product'
    }],
    therapists: [{
      type: Schema.Types.ObjectId,
      ref: 'Therapist'
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active',
      index: true
    },
    isPopular: {
      type: Boolean,
      default: false,
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    tags: [{
      type: String,
      index: true
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

// Indexes
SpaServiceSchema.index({ name: 'text', description: 'text', tags: 'text' });
SpaServiceSchema.index({ category: 1, status: 1 });
SpaServiceSchema.index({ price: 1, duration: 1 });
SpaServiceSchema.index({ isPopular: 1, isFeatured: 1 });

// Static methods
SpaServiceSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

SpaServiceSchema.statics.findByCategory = function(category: ServiceCategory) {
  return this.find({ category, status: 'active' });
};

SpaServiceSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isPopular: true, status: 'active' }).limit(limit);
};

SpaServiceSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ isFeatured: true, status: 'active' }).limit(limit);
};

export const SpaServiceModel = mongoose.model<SpaServiceDocument>('SpaService', SpaServiceSchema);
