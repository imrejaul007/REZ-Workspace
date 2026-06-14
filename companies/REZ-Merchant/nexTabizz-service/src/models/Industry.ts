import mongoose, { Schema, Document } from 'mongoose';
import { IndustryType, INDUSTRY_INFO, MODULE_INFO, ModuleType, INDUSTRY_MODULES } from '../types/index.js';

export interface IIndustryConfig extends Document {
  industry: IndustryType;
  name: string;
  description: string;
  icon: string;
  color: string;
  modules: ModuleType[];
  settings: {
    defaultCurrency: string;
    defaultTimezone: string;
    supportedCurrencies: string[];
    supportedTimezones: string[];
  };
  features: {
    hasReservations: boolean;
    hasInventory: boolean;
    hasStaff: boolean;
    hasLoyalty: boolean;
    hasBookings: boolean;
    hasMembership: boolean;
    hasDelivery: boolean;
    hasTableManagement: boolean;
  };
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IndustryConfigSchema = new Schema<IIndustryConfig>(
  {
    industry: {
      type: String,
      required: true,
      unique: true,
      enum: Object.values(IndustryType)
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
    color: {
      type: String,
      required: true
    },
    modules: {
      type: [String],
      enum: Object.values(ModuleType),
      required: true
    },
    settings: {
      defaultCurrency: { type: String, default: 'INR' },
      defaultTimezone: { type: String, default: 'Asia/Kolkata' },
      supportedCurrencies: {
        type: [String],
        default: ['INR', 'USD', 'EUR', 'GBP']
      },
      supportedTimezones: {
        type: [String],
        default: ['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London']
      }
    },
    features: {
      hasReservations: { type: Boolean, default: false },
      hasInventory: { type: Boolean, default: true },
      hasStaff: { type: Boolean, default: true },
      hasLoyalty: { type: Boolean, default: true },
      hasBookings: { type: Boolean, default: false },
      hasMembership: { type: Boolean, default: false },
      hasDelivery: { type: Boolean, default: false },
      hasTableManagement: { type: Boolean, default: false }
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    isActive: {
      type: Boolean,
      default: true
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

// Static method to initialize industry configs from static data
IndustryConfigSchema.statics.initializeFromConfig = async function () {
  const count = await this.countDocuments();
  if (count > 0) {
    return;
  }

  const configs: Partial<IIndustryConfig>[] = Object.values(IndustryType).map((type) => {
    const info = INDUSTRY_INFO[type];
    const modules = INDUSTRY_MODULES[type] || [];

    // Determine features based on industry
    const features: IIndustryConfig['features'] = {
      hasReservations: ['restaurant', 'hotel', 'salon', 'spa'].includes(type),
      hasInventory: true,
      hasStaff: true,
      hasLoyalty: true,
      hasBookings: ['hotel', 'salon', 'spa'].includes(type),
      hasMembership: ['gym', 'fitness'].includes(type),
      hasDelivery: ['restaurant', 'grocery', 'retail'].includes(type),
      hasTableManagement: type === 'restaurant'
    };

    return {
      industry: type,
      name: info.name,
      description: info.description,
      icon: info.icon,
      color: info.color,
      modules,
      features
    };
  });

  await this.insertMany(configs);
};

// Static method to get all active industries with their modules
IndustryConfigSchema.statics.getAllWithModules = async function () {
  const industries = await this.find({ isActive: true })
    .select('-__v -metadata')
    .lean();

  return industries.map((industry) => ({
    ...industry,
    modulesInfo: industry.modules.map((moduleType) => MODULE_INFO[moduleType as ModuleType]).filter(Boolean)
  }));
};

// Static method to get industry by type
IndustryConfigSchema.statics.getByType = async function (type: IndustryType) {
  const industry = await this.findOne({ industry: type, isActive: true });
  if (!industry) {
    return null;
  }
  return {
    ...industry.toObject(),
    modulesInfo: industry.modules.map((moduleType) => MODULE_INFO[moduleType as ModuleType]).filter(Boolean)
  };
};

export const IndustryConfig = mongoose.model<IIndustryConfig>(
  'IndustryConfig',
  IndustryConfigSchema
);
export default IndustryConfig;
