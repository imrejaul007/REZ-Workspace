import mongoose, { Schema, Model } from 'mongoose';
import {
  ICreator,
  ICreatorDocument,
  CreatorStatus,
  ISocialLinks,
  IBankDetails
} from '../types';

const SocialLinksSchema = new Schema<ISocialLinks>(
  {
    instagram: { type: String },
    twitter: { type: String },
    youtube: { type: String },
    tiktok: { type: String },
    website: { type: String },
    linkedin: { type: String },
    facebook: { type: String },
  },
  { _id: false }
);

const BankDetailsSchema = new Schema<IBankDetails>(
  {
    accountNumber: { type: String, required: true },
    ifsc: { type: String, required: true },
    bankName: { type: String, required: true },
    accountHolder: { type: String, required: true },
    upiId: { type: String },
  },
  { _id: false }
);

const CreatorSchema = new Schema<ICreator>(
  {
    name: {
      type: String,
      required: [true, 'Creator name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    bio: {
      type: String,
      default: '',
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    avatar: {
      type: String,
      default: '',
    },
    socialLinks: {
      type: SocialLinksSchema,
      default: () => ({}),
    },
    categories: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalProducts: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingPayout: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(CreatorStatus),
      default: CreatorStatus.ACTIVE,
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    bankDetails: {
      type: BankDetailsSchema,
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
CreatorSchema.index({ email: 1 }, { unique: true });
CreatorSchema.index({ status: 1 });
CreatorSchema.index({ categories: 1 });
CreatorSchema.index({ rating: -1 });
CreatorSchema.index({ totalEarnings: -1 });
CreatorSchema.index({ createdAt: -1 });

// Virtual for full profile URL
CreatorSchema.virtual('profileUrl').get(function () {
  return `/api/creators/${this._id}`;
});

// Static methods
CreatorSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

CreatorSchema.statics.findActive = function () {
  return this.find({ status: CreatorStatus.ACTIVE });
};

CreatorSchema.statics.findByCategory = function (category: string) {
  return this.find({
    categories: category.toLowerCase(),
    status: CreatorStatus.ACTIVE,
  });
};

// Instance method to increment stats
CreatorSchema.methods.incrementStats = async function (
  orderAmount: number,
  commissionAmount: number
) {
  this.totalOrders += 1;
  this.totalEarnings += orderAmount - commissionAmount;
  this.pendingPayout += orderAmount - commissionAmount;
  return this.save();
};

// Instance method to add pending payout
CreatorSchema.methods.addPendingPayout = async function (amount: number) {
  this.pendingPayout += amount;
  return this.save();
};

// Instance method to deduct pending payout
CreatorSchema.methods.deductPendingPayout = async function (amount: number) {
  this.pendingPayout = Math.max(0, this.pendingPayout - amount);
  return this.save();
};

// Instance method to increment product count
CreatorSchema.methods.incrementProductCount = async function () {
  this.totalProducts += 1;
  return this.save();
};

// Instance method to decrement product count
CreatorSchema.methods.decrementProductCount = async function () {
  this.totalProducts = Math.max(0, this.totalProducts - 1);
  return this.save();
};

export const Creator: Model<ICreatorDocument> = mongoose.model<ICreatorDocument>(
  'Creator',
  CreatorSchema
);

export default Creator;