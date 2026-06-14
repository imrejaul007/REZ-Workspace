import mongoose, { Document, Schema } from 'mongoose';
import { Benefit, BenefitType, EmployeeBenefit } from '../types';

export interface IBenefit extends Omit<Benefit, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IEmployeeBenefit extends Omit<EmployeeBenefit, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const benefitSchema = new Schema<IBenefit>(
  {
    corpPerksId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'meal_allowance',
        'meal_plan',
        'fuel_allowance',
        'transport',
        'health_insurance',
        'wellness',
        'tax_benefit',
        'corporate_discount',
        'gift_voucher',
        'other',
      ],
      required: true,
      index: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    validFrom: {
      type: Date,
    },
    validTo: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    merchantId: {
      type: String,
      index: true,
    },
    merchantProductId: {
      type: String,
    },
    category: {
      type: String,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    restrictions: {
      maxUsagePerMonth: { type: Number },
      maxTotalUsage: { type: Number },
      minOrderValue: { type: Number },
      applicableCategories: { type: [String] },
      excludeProducts: { type: [String] },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes
benefitSchema.index({ type: 1, isActive: 1 });
benefitSchema.index({ merchantId: 1, isActive: 1 });
benefitSchema.index({ validFrom: 1, validTo: 1 });

// Check if benefit is currently valid
benefitSchema.virtual('isCurrentlyValid').get(function () {
  const now = new Date();
  const fromValid = !this.validFrom || this.validFrom <= now;
  const toValid = !this.validTo || this.validTo >= now;
  return this.isActive && fromValid && toValid;
});

const employeeBenefitSchema = new Schema<IEmployeeBenefit>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    benefitId: {
      type: Schema.Types.ObjectId,
      ref: 'Benefit',
      required: true,
      index: true,
    },
    assignedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
    remainingValue: {
      type: Number,
      required: true,
      min: 0,
    },
    totalValue: {
      type: Number,
      required: true,
      min: 0,
    },
    usageHistory: [
      {
        date: { type: Date, required: true },
        amount: { type: Number, required: true, min: 0 },
        merchantOrderId: { type: String },
        description: { type: String },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes
employeeBenefitSchema.index({ employeeId: 1, isActive: 1 });
employeeBenefitSchema.index({ benefitId: 1, isActive: 1 });
employeeBenefitSchema.index({ employeeId: 1, benefitId: 1 }, { unique: true });

// Virtual for usage percentage
employeeBenefitSchema.virtual('usagePercentage').get(function () {
  if (this.totalValue === 0) return 0;
  return ((this.totalValue - this.remainingValue) / this.totalValue) * 100;
});

// Method to deduct from benefit
employeeBenefitSchema.methods.deduct = async function (
  amount: number,
  merchantOrderId: string,
  description?: string
): Promise<boolean> {
  if (amount > this.remainingValue) {
    throw new Error('Insufficient benefit balance');
  }

  this.remainingValue -= amount;
  this.usageHistory.push({
    date: new Date(),
    amount,
    merchantOrderId,
    description,
  });

  await this.save();
  return true;
};

// Static method to get employee benefits with benefit details
employeeBenefitSchema.statics.findWithBenefitDetails = async function (
  employeeId: string
): Promise<Array<IEmployeeBenefit & { benefit: IBenefit }>> {
  return this.aggregate([
    { $match: { employeeId: new mongoose.Types.ObjectId(employeeId), isActive: true } },
    {
      $lookup: {
        from: 'benefits',
        localField: 'benefitId',
        foreignField: '_id',
        as: 'benefit',
      },
    },
    { $unwind: '$benefit' },
    {
      $match: {
        'benefit.isActive': true,
        $or: [
          { 'benefit.validFrom': { $exists: false } },
          { 'benefit.validFrom': { $lte: new Date() } },
        ],
        $or: [
          { 'benefit.validTo': { $exists: false } },
          { 'benefit.validTo': { $gte: new Date() } },
        ],
      },
    },
  ]);
};

export const BenefitModel = mongoose.model<IBenefit>('Benefit', benefitSchema);
export const EmployeeBenefitModel = mongoose.model<IEmployeeBenefit>(
  'EmployeeBenefit',
  employeeBenefitSchema
);

export default { BenefitModel, EmployeeBenefitModel };
