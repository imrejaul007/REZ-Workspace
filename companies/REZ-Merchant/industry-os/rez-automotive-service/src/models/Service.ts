import mongoose, { Schema, Document } from 'mongoose';
import { Service as IService } from '../types';

export interface ServiceDocument extends Omit<IService, '_id'>, Document {}

const ServiceSchema = new Schema<ServiceDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      maxlength: 500
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    duration: {
      type: Number,
      required: true,
      min: 15
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    isPackage: {
      type: Boolean,
      default: false
    },
    includesParts: {
      type: Boolean,
      default: false
    },
    parts: [{
      type: String
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

ServiceSchema.index({ name: 'text', description: 'text' });
ServiceSchema.index({ category: 1, isPackage: 1 });

ServiceSchema.statics.findByCategory = function(category: string) {
  return this.find({ category }).sort({ price: 1 });
};

ServiceSchema.statics.findPackages = function() {
  return this.find({ isPackage: true });
};

ServiceSchema.statics.findBasicServices = function() {
  return this.find({ isPackage: false });
};

export const ServiceModel = mongoose.model<ServiceDocument>('Service', ServiceSchema);
