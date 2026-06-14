import mongoose, { Schema, Document } from 'mongoose';
import { ModuleType, MODULE_INFO, IndustryType } from '../types/index.js';

export interface IModule extends Document {
  moduleId: string;
  type: ModuleType;
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'operations' | 'customer' | 'management';
  industries: IndustryType[];
  features: {
    isEnabled: boolean;
    isConfigurable: boolean;
    hasAnalytics: boolean;
    hasReports: boolean;
  };
  config: Record<string, any>;
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema = new Schema<IModule>(
  {
    moduleId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(ModuleType),
      index: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['core', 'operations', 'customer', 'management'],
      index: true
    },
    industries: {
      type: [String],
      enum: Object.values(IndustryType),
      default: Object.values(IndustryType)
    },
    features: {
      isEnabled: { type: Boolean, default: true },
      isConfigurable: { type: Boolean, default: true },
      hasAnalytics: { type: Boolean, default: true },
      hasReports: { type: Boolean, default: true }
    },
    config: {
      type: Schema.Types.Mixed,
      default: {}
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
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

// Compound indexes
ModuleSchema.index({ type: 1, industries: 1 });
ModuleSchema.index({ category: 1, isActive: 1 });

// Static method to initialize modules from static config
ModuleSchema.statics.initializeFromConfig = async function () {
  const count = await this.countDocuments();
  if (count > 0) {
    return;
  }

  const modules: Partial<IModule>[] = Object.values(MODULE_INFO).map((info) => ({
    moduleId: info.id,
    type: info.id,
    name: info.name,
    description: info.description,
    icon: info.icon,
    category: info.category,
    features: {
      isEnabled: true,
      isConfigurable: true,
      hasAnalytics: true,
      hasReports: true
    }
  }));

  await this.insertMany(modules);
};

// Static method to get modules by category
ModuleSchema.statics.getByCategory = function (category: IModule['category']) {
  return this.find({ category, isActive: true }).sort({ name: 1 });
};

// Static method to get modules for an industry
ModuleSchema.statics.getForIndustry = function (industry: IndustryType) {
  return this.find({
    industries: industry,
    isActive: true
  }).sort({ category: 1, name: 1 });
};

// Static method to get module details by type
ModuleSchema.statics.getByType = function (type: ModuleType) {
  return this.findOne({ type, isActive: true });
};

export const Module = mongoose.model<IModule>('Module', ModuleSchema);
export default Module;
