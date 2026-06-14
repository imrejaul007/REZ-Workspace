import { Coupon, ICoupon } from '../models/coupon.model';
import { Validation } from '../models/validation.model';
import { Usage } from '../models/usage.model';
import { v4 as uuidv4 } from 'uuid';
import logger from 'utils/logger.js';
import { couponsCreated, couponsRedeemed, discountGiven, activeCoupons } from '../utils/metrics';

export interface CreateCouponInput {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  currency?: string;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom: string;
  validUntil: string;
  applicableCategories?: string[];
  excludedCategories?: string[];
  applicableProducts?: string[];
  excludedProducts?: string[];
  targetSegments?: string[];
  channel?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateCouponInput {
  name?: string;
  description?: string;
  value?: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom?: string;
  validUntil?: string;
  status?: 'active' | 'inactive';
  applicableCategories?: string[];
  excludedCategories?: string[];
}

export class CouponService {
  async create(input: CreateCouponInput, createdBy: string): Promise<ICoupon> {
    const couponId = `cpn-${uuidv4().slice(0, 8)}`;

    const coupon = new Coupon({
      couponId,
      code: input.code.toUpperCase(),
      name: input.name,
      description: input.description,
      type: input.type,
      value: input.value,
      minOrderValue: input.minOrderValue || 0,
      maxDiscount: input.maxDiscount,
      currency: input.currency || 'INR',
      status: 'active',
      usageLimit: input.usageLimit,
      usageCount: 0,
      perUserLimit: input.perUserLimit || 1,
      validFrom: new Date(input.validFrom),
      validUntil: new Date(input.validUntil),
      applicableCategories: input.applicableCategories,
      excludedCategories: input.excludedCategories,
      applicableProducts: input.applicableProducts,
      excludedProducts: input.excludedProducts,
      targetSegments: input.targetSegments,
      channel: input.channel,
      metadata: input.metadata,
      createdBy
    });

    await coupon.save();
    couponsCreated.inc();
    activeCoupons.inc();

    logger.info(`Coupon created: ${couponId} (${coupon.code})`);
    return coupon;
  }

  async findById(couponId: string): Promise<ICoupon | null> {
    return Coupon.findOne({ couponId });
  }

  async findByCode(code: string): Promise<ICoupon | null> {
    return Coupon.findOne({ code: code.toUpperCase() });
  }

  async update(couponId: string, input: UpdateCouponInput): Promise<ICoupon | null> {
    const updateData: Record<string, unknown> = {};

    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.value !== undefined) updateData.value = input.value;
    if (input.minOrderValue !== undefined) updateData.minOrderValue = input.minOrderValue;
    if (input.maxDiscount !== undefined) updateData.maxDiscount = input.maxDiscount;
    if (input.usageLimit !== undefined) updateData.usageLimit = input.usageLimit;
    if (input.perUserLimit !== undefined) updateData.perUserLimit = input.perUserLimit;
    if (input.status) updateData.status = input.status;
    if (input.validFrom) updateData.validFrom = new Date(input.validFrom);
    if (input.validUntil) updateData.validUntil = new Date(input.validUntil);
    if (input.applicableCategories) updateData.applicableCategories = input.applicableCategories;
    if (input.excludedCategories) updateData.excludedCategories = input.excludedCategories;

    const coupon = await Coupon.findOneAndUpdate(
      { couponId },
      { $set: updateData },
      { new: true }
    );

    if (coupon) logger.info(`Coupon updated: ${couponId}`);
    return coupon;
  }

  async list(filters?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ coupons: ICoupon[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters?.status) query.status = filters.status;
    if (filters?.type) query.type = filters.type;

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Coupon.countDocuments(query)
    ]);

    return { coupons, total };
  }

  async validate(couponCode: string, userId: string, orderValue: number): Promise<{
    isValid: boolean;
    discount: number;
    errorMessage?: string;
    coupon: ICoupon | null;
  }> {
    const coupon = await this.findByCode(couponCode);
    if (!coupon) {
      return { isValid: false, discount: 0, errorMessage: 'Coupon not found', coupon: null };
    }

    // Check status
    if (coupon.status !== 'active') {
      return { isValid: false, discount: 0, errorMessage: `Coupon is ${coupon.status}`, coupon };
    }

    // Check validity dates
    const now = new Date();
    if (now < coupon.validFrom) {
      return { isValid: false, discount: 0, errorMessage: 'Coupon is not yet valid', coupon };
    }
    if (now > coupon.validUntil) {
      return { isValid: false, discount: 0, errorMessage: 'Coupon has expired', coupon };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { isValid: false, discount: 0, errorMessage: 'Coupon usage limit reached', coupon };
    }

    // Check per-user limit
    const userUsageCount = await Usage.countDocuments({ couponId: coupon.couponId, userId, status: 'applied' });
    if (coupon.perUserLimit && userUsageCount >= coupon.perUserLimit) {
      return { isValid: false, discount: 0, errorMessage: 'You have already used this coupon', coupon };
    }

    // Check minimum order value
    if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
      return {
        isValid: false,
        discount: 0,
        errorMessage: `Minimum order value is Rs.${coupon.minOrderValue}`,
        coupon
      };
    }

    // Calculate discount
    let discount = 0;
    switch (coupon.type) {
      case 'percentage':
        discount = (orderValue * coupon.value) / 100;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        break;
      case 'fixed':
        discount = coupon.value;
        break;
      case 'free_shipping':
        discount = 0; // Shipping cost handled separately
        break;
      case 'buy_x_get_y':
        // Buy X get Y logic would be more complex
        discount = 0;
        break;
    }

    // Don't allow discount greater than order value
    discount = Math.min(discount, orderValue);

    // Record validation
    const validation = new Validation({
      validationId: `val-${uuidv4().slice(0, 8)}`,
      couponId: coupon.couponId,
      userId,
      orderValue,
      isValid: true,
      discount
    });
    await validation.save();

    return { isValid: true, discount, coupon };
  }

  async redeem(couponCode: string, userId: string, orderId: string, orderValue: number): Promise<{
    success: boolean;
    discount: number;
    errorMessage?: string;
  }> {
    const validation = await this.validate(couponCode, userId, orderValue);

    if (!validation.isValid) {
      return { success: false, discount: 0, errorMessage: validation.errorMessage };
    }

    const coupon = validation.coupon!;

    // Create usage record
    const usage = new Usage({
      usageId: `use-${uuidv4().slice(0, 8)}`,
      couponId: coupon.couponId,
      userId,
      orderId,
      discount: validation.discount,
      orderValue,
      status: 'applied'
    });

    await usage.save();

    // Update coupon usage count
    await Coupon.updateOne({ couponId: coupon.couponId }, { $inc: { usageCount: 1 } });

    couponsRedeemed.inc({ coupon_id: coupon.couponId });
    discountGiven.inc({ currency: coupon.currency || 'INR' }, validation.discount);

    logger.info(`Coupon redeemed: ${coupon.code} by user ${userId}, discount: ${validation.discount}`);

    return { success: true, discount: validation.discount };
  }

  async delete(couponId: string): Promise<boolean> {
    const result = await Coupon.findOneAndUpdate(
      { couponId },
      { $set: { status: 'expired' } }
    );

    if (result) {
      activeCoupons.dec();
      logger.info(`Coupon expired: ${couponId}`);
      return true;
    }
    return false;
  }
}

export const couponService = new CouponService();