import mongoose, { Schema, Document } from 'mongoose';
import { IndustryType, ModuleType, INDUSTRY_MODULES } from '../types/index.js';

export interface IBusiness extends Document {
  businessId: string;
  name: string;
  industry: IndustryType;
  modules: ModuleType[];
  settings: Record<string, any>;
  ownerId: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  timezone: string;
  currency: string;
  locale: string;
  isActive: boolean;
  isVerified: boolean;
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalStaff: number;
  };
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    businessId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    industry: {
      type: String,
      required: true,
      enum: Object.values(IndustryType),
      index: true
    },
    modules: {
      type: [String],
      enum: Object.values(ModuleType),
      default: function () {
        const industry = this.industry as IndustryType;
        return INDUSTRY_MODULES[industry] || [];
      }
    },
    settings: {
      type: Schema.Types.Mixed,
      default: {}
    },
    ownerId: {
      type: String,
      required: true,
      index: true
    },
    location: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zipCode: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      }
    },
    contact: {
      phone: { type: String },
      email: { type: String },
      website: { type: String }
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    currency: {
      type: String,
      default: 'INR'
    },
    locale: {
      type: String,
      default: 'en-IN'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    stats: {
      totalRevenue: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      totalCustomers: { type: Number, default: 0 },
      totalStaff: { type: Number, default: 0 }
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound indexes for common queries
BusinessSchema.index({ ownerId: 1, industry: 1 });
BusinessSchema.index({ ownerId: 1, isActive: 1 });
BusinessSchema.index({ 'location.city': 1, industry: 1 });
BusinessSchema.index({ createdAt: -1 });

// Virtual for available modules based on industry
BusinessSchema.virtual('availableModules').get(function () {
  return INDUSTRY_MODULES[this.industry] || [];
});

// Method to enable a module
BusinessSchema.methods.enableModule = function (moduleId: ModuleType): boolean {
  const availableModules = INDUSTRY_MODULES[this.industry] || [];
  if (availableModules.includes(moduleId) && !this.modules.includes(moduleId)) {
    this.modules.push(moduleId);
    return true;
  }
  return false;
};

// Method to disable a module
BusinessSchema.methods.disableModule = function (moduleId: ModuleType): boolean {
  const index = this.modules.indexOf(moduleId);
  if (index > -1) {
    this.modules.splice(index, 1);
    return true;
  }
  return false;
};

// Static method to find businesses by owner
BusinessSchema.statics.findByOwner = function (
  ownerId: string,
  options?: { industry?: IndustryType; isActive?: boolean }
) {
  const query: Record<string, any> = { ownerId };
  if (options?.industry) query.industry = options.industry;
  if (options?.isActive !== undefined) query.isActive = options.isActive;
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get industry stats
BusinessSchema.statics.getIndustryStats = async function () {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$industry',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$stats.totalRevenue' }
      }
    },
    { $sort: { count: -1 } }
  ]);
  return stats;
};

export const Business = mongoose.model<IBusiness>('Business', BusinessSchema);
export default Business;
