import mongoose, { Document, Schema } from 'mongoose';
import { BusinessRuleError } from '../common/exceptions';

// ===========================================
// VOUCHER STATICS INTERFACE
// ===========================================
export interface IVoucherStatics extends mongoose.Model<IVoucher> {
  findValidForUser(
    userId: string,
    options?: {
      rideType?: 'auto' | 'cab' | 'suv';
      minAmount?: number;
      type?: VoucherType;
    }
  ): Promise<IVoucher[]>;
  findBestForRide(
    userId: string,
    rideType: 'auto' | 'cab' | 'suv',
    rideAmount: number
  ): Promise<IVoucher | null>;
}

// ===========================================
// VOUCHER INTERFACE
// ===========================================
export interface IVoucher extends Document {
  // Methods
  canRedeem(rideType?: 'auto' | 'cab' | 'suv', rideAmount?: number): { canRedeem: boolean; reason?: string };
  redeem(rideId: mongoose.Types.ObjectId): void;
  expire(): void;
  calculateDiscount(amount: number): number;

  // Campaign link
  campaignId: mongoose.Types.ObjectId;
  merchantId: string;

  // User
  userId: string;

  // Voucher details
  type: VoucherType;
  value: number;
  maxValue?: number;

  // Validity
  validFrom: Date;
  validUntil: Date;

  // Usage
  used: boolean;
  usedAt?: Date;
  usedForRideId?: mongoose.Types.ObjectId;
  usedForOrderId?: string;

  // Restrictions
  rideTypes?: ('auto' | 'cab' | 'suv')[];
  applicableMerchants?: string[];
  minOrderValue?: number;

  // Attribution
  triggerEvent?: {
    type: string;
    source: string;
    merchantId: string;
    orderId?: string;
    amount?: number;
  };

  // Status
  status: VoucherStatus;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// VOUCHER TYPE ENUM
// ===========================================
export enum VoucherType {
  RIDE_CREDIT = 'ride_credit',
  SERVICE_CREDIT = 'service_credit',
  DISCOUNT = 'discount',
  CASHBACK = 'cashback',
}

// ===========================================
// VOUCHER STATUS ENUM
// ===========================================
export enum VoucherStatus {
  PENDING = 'pending',
  ISSUED = 'issued',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// ===========================================
// VOUCHER SCHEMA
// ===========================================
const VoucherSchema = new Schema<IVoucher>({
  // Campaign link
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  merchantId: { type: String, required: true, index: true },

  // User
  userId: { type: String, required: true, index: true },

  // Voucher details
  type: {
    type: String,
    enum: Object.values(VoucherType),
    required: true
  },
  value: { type: Number, required: true },
  maxValue: Number,

  // Validity
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true, index: true },

  // Usage
  used: { type: Boolean, default: false, index: true },
  usedAt: Date,
  usedForRideId: { type: Schema.Types.ObjectId, ref: 'Ride' },
  usedForOrderId: String,

  // Restrictions
  rideTypes: [{ type: String, enum: ['auto', 'cab', 'suv'] }],
  applicableMerchants: [String],
  minOrderValue: Number,

  // Attribution
  triggerEvent: {
    type: String,
    source: String,
    merchantId: String,
    orderId: String,
    amount: Number,
  },

  // Status
  status: {
    type: String,
    enum: Object.values(VoucherStatus),
    default: VoucherStatus.ISSUED,
    index: true
  },
}, {
  timestamps: true,
});

// ===========================================
// INDEXES
// ===========================================
VoucherSchema.index({ campaignId: 1, userId: 1 });
VoucherSchema.index({ userId: 1, used: 1, validUntil: 1 });
VoucherSchema.index({ merchantId: 1, status: 1 });
VoucherSchema.index({ validUntil: 1, status: 1 });

// ===========================================
// VIRTUALS
// ===========================================
VoucherSchema.virtual('isValid').get(function() {
  const now = new Date();
  return !this.used &&
         this.status === VoucherStatus.ISSUED &&
         this.validUntil > now;
});

VoucherSchema.virtual('isExpired').get(function() {
  return this.validUntil < new Date();
});

VoucherSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const diff = this.validUntil.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

VoucherSchema.virtual('formattedValue').get(function() {
  if (this.type === VoucherType.DISCOUNT) {
    return `${this.value}% off`;
  }
  return `₹${this.value}`;
});

// ===========================================
// METHODS
// ===========================================
VoucherSchema.methods.canRedeem = function(
  rideType?: 'auto' | 'cab' | 'suv',
  rideAmount?: number
): { canRedeem: boolean; reason?: string } {
  // Check if already used
  if (this.used) {
    return { canRedeem: false, reason: 'Voucher already used' };
  }

  // Check if expired
  if (this.validUntil < new Date()) {
    return { canRedeem: false, reason: 'Voucher expired' };
  }

  // Check status
  if (this.status !== VoucherStatus.ISSUED) {
    return { canRedeem: false, reason: 'Voucher not active' };
  }

  // Check ride type
  if (this.rideTypes && rideType && !this.rideTypes.includes(rideType)) {
    return { canRedeem: false, reason: `Not valid for ${rideType}` };
  }

  // Check minimum order
  if (this.minOrderValue && rideAmount && rideAmount < this.minOrderValue) {
    return {
      canRedeem: false,
      reason: `Minimum order ₹${this.minOrderValue} required`
    };
  }

  return { canRedeem: true };
};

VoucherSchema.methods.redeem = function(rideId: mongoose.Types.ObjectId) {
  if (!this.canRedeem().canRedeem) {
    throw new BusinessRuleError('Cannot redeem voucher', 'VOUCHER_CANNOT_REDEEM');
  }

  this.used = true;
  this.usedAt = new Date();
  this.usedForRideId = rideId;
  this.status = VoucherStatus.REDEEMED;
};

VoucherSchema.methods.expire = function() {
  this.status = VoucherStatus.EXPIRED;
};

VoucherSchema.methods.calculateDiscount = function(amount: number): number {
  if (this.type === VoucherType.RIDE_CREDIT || this.type === VoucherType.SERVICE_CREDIT) {
    return Math.min(this.value, amount);
  }

  if (this.type === VoucherType.DISCOUNT) {
    const discount = (amount * this.value) / 100;
    return Math.min(discount, this.maxValue || discount);
  }

  return 0;
};

// ===========================================
// STATICS
// ===========================================
VoucherSchema.statics.findValidForUser = async function(
  userId: string,
  options?: {
    rideType?: 'auto' | 'cab' | 'suv';
    minAmount?: number;
    type?: VoucherType;
  }
) {
  const now = new Date();

  const query: any = {
    userId,
    used: false,
    status: VoucherStatus.ISSUED,
    validUntil: { $gt: now },
  };

  if (options?.type) {
    query.type = options.type;
  }

  const vouchers = await this.find(query).exec();

  // Filter by ride type and minimum amount
  return vouchers.filter((v: IVoucher) => {
    const check = v.canRedeem(options?.rideType, options?.minAmount);
    return check.canRedeem;
  });
};

VoucherSchema.statics.findBestForRide = async function(
  this: IVoucherStatics,
  userId: string,
  rideType: 'auto' | 'cab' | 'suv',
  rideAmount: number
): Promise<IVoucher | null> {
  const vouchers = await this.findValidForUser(userId, { rideType, minAmount: rideAmount });

  if (vouchers.length === 0) return null;

  // Sort by discount value (highest first)
  return vouchers.sort((a: IVoucher, b: IVoucher) => {
    const discountA = a.calculateDiscount(rideAmount);
    const discountB = b.calculateDiscount(rideAmount);
    return discountB - discountA;
  })[0];
};

export const Voucher = mongoose.model<IVoucher, IVoucherStatics>('Voucher', VoucherSchema);

// Type alias for TypeScript - use this for type annotations
export type Voucher = IVoucher;
