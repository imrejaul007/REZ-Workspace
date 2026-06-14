import { Reward, IReward } from '../models/reward.model';
import { Redemption } from '../models/redemption.model';
import { Inventory } from '../models/inventory.model';
import { v4 as uuidv4 } from 'uuid';
import logger from 'utils/logger.js';
import { rewardsCreated, redemptions, inventoryUsed, activeRewards } from '../utils/metrics';

export interface CreateRewardInput {
  name: string;
  description?: string;
  type: 'discount' | 'gift_card' | 'product' | 'voucher' | 'experience' | 'charity';
  category: string;
  imageUrl?: string;
  pointsCost: number;
  actualValue?: number;
  currency?: string;
  inventory?: number;
  minTier?: string;
  maxRedemptionsPerUser?: number;
  validFrom?: string;
  validUntil?: string;
  terms?: string;
  redemptionInstructions?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateRewardInput {
  name?: string;
  description?: string;
  pointsCost?: number;
  actualValue?: number;
  status?: 'active' | 'inactive' | 'out_of_stock' | 'archived';
  inventory?: number;
  minTier?: string;
  maxRedemptionsPerUser?: number;
  validFrom?: string;
  validUntil?: string;
  terms?: string;
  redemptionInstructions?: string;
}

export class RewardService {
  async create(input: CreateRewardInput, createdBy: string): Promise<IReward> {
    const rewardId = `rew-${uuidv4().slice(0, 8)}`;

    const reward = new Reward({
      rewardId,
      name: input.name,
      description: input.description,
      type: input.type,
      category: input.category,
      imageUrl: input.imageUrl,
      pointsCost: input.pointsCost,
      actualValue: input.actualValue,
      currency: input.currency || 'points',
      status: 'active',
      inventory: input.inventory,
      inventoryUsed: 0,
      minTier: input.minTier,
      maxRedemptionsPerUser: input.maxRedemptionsPerUser || 1,
      validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      terms: input.terms,
      redemptionInstructions: input.redemptionInstructions,
      metadata: input.metadata,
      createdBy
    });

    await reward.save();

    // Create inventory if applicable
    if (input.inventory !== undefined) {
      const inventory = new Inventory({
        inventoryId: `inv-${uuidv4().slice(0, 8)}`,
        rewardId,
        totalQuantity: input.inventory,
        availableQuantity: input.inventory,
        soldQuantity: 0,
        lowStockThreshold: 10,
        lastRestocked: new Date()
      });
      await inventory.save();
    }

    rewardsCreated.inc();
    activeRewards.inc();

    logger.info(`Reward created: ${rewardId}`);
    return reward;
  }

  async findById(rewardId: string): Promise<IReward | null> {
    return Reward.findOne({ rewardId });
  }

  async update(rewardId: string, input: UpdateRewardInput): Promise<IReward | null> {
    const updateData: Record<string, unknown> = {};

    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.pointsCost !== undefined) updateData.pointsCost = input.pointsCost;
    if (input.actualValue !== undefined) updateData.actualValue = input.actualValue;
    if (input.status) updateData.status = input.status;
    if (input.inventory !== undefined) updateData.inventory = input.inventory;
    if (input.minTier !== undefined) updateData.minTier = input.minTier;
    if (input.maxRedemptionsPerUser !== undefined) updateData.maxRedemptionsPerUser = input.maxRedemptionsPerUser;
    if (input.validFrom) updateData.validFrom = new Date(input.validFrom);
    if (input.validUntil) updateData.validUntil = new Date(input.validUntil);
    if (input.terms !== undefined) updateData.terms = input.terms;
    if (input.redemptionInstructions !== undefined) updateData.redemptionInstructions = input.redemptionInstructions;

    const reward = await Reward.findOneAndUpdate(
      { rewardId },
      { $set: updateData },
      { new: true }
    );

    if (reward) logger.info(`Reward updated: ${rewardId}`);
    return reward;
  }

  async list(filters?: {
    status?: string;
    type?: string;
    category?: string;
    minPoints?: number;
    maxPoints?: number;
    page?: number;
    limit?: number;
  }): Promise<{ rewards: IReward[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters?.status) query.status = filters.status;
    if (filters?.type) query.type = filters.type;
    if (filters?.category) query.category = filters.category;
    if (filters?.minPoints) query.pointsCost = { $gte: filters.minPoints };
    if (filters?.maxPoints) { query.pointsCost = { ...(query.pointsCost as object || {}), $lte: filters.maxPoints }; }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [rewards, total] = await Promise.all([
      Reward.find(query).sort({ pointsCost: 1, createdAt: -1 }).skip(skip).limit(limit),
      Reward.countDocuments(query)
    ]);

    return { rewards, total };
  }

  async redeem(rewardId: string, userId: string, programId?: string, deliveryDetails?: {
    email?: string;
    address?: string;
  }): Promise<{
    success: boolean;
    redemption?: IRedemption;
    errorMessage?: string;
  }> {
    const reward = await Reward.findOne({ rewardId, status: 'active' });
    if (!reward) {
      return { success: false, errorMessage: 'Reward not found or inactive' };
    }

    // Check validity dates
    const now = new Date();
    if (reward.validFrom && now < reward.validFrom) {
      return { success: false, errorMessage: 'Reward is not yet available' };
    }
    if (reward.validUntil && now > reward.validUntil) {
      return { success: false, errorMessage: 'Reward has expired' };
    }

    // Check per-user redemption limit
    const userRedemptions = await Redemption.countDocuments({
      rewardId,
      userId,
      status: { $nin: ['cancelled', 'failed', 'expired'] }
    });
    if (reward.maxRedemptionsPerUser && userRedemptions >= reward.maxRedemptionsPerUser) {
      return { success: false, errorMessage: 'Maximum redemptions reached for this reward' };
    }

    // Check inventory
    if (reward.inventory !== undefined && reward.inventory - reward.inventoryUsed <= 0) {
      await Reward.updateOne({ rewardId }, { $set: { status: 'out_of_stock' } });
      return { success: false, errorMessage: 'Reward is out of stock' };
    }

    const redemptionId = `rdm-${uuidv4().slice(0, 8)}`;

    const redemption = new Redemption({
      redemptionId,
      rewardId,
      userId,
      programId,
      pointsSpent: reward.pointsCost,
      status: 'pending',
      deliveryMethod: reward.type === 'digital' || reward.type === 'voucher' ? 'digital' :
                      reward.type === 'product' ? 'physical' : 'instant',
      deliveryDetails: deliveryDetails ? {
        ...deliveryDetails,
        voucherCode: reward.type === 'voucher' ? `V${uuidv4().slice(0, 8).toUpperCase()}` : undefined,
        redeemUrl: `https://rez.money/redeem/${redemptionId}`
      } : undefined,
      expiresAt: reward.validUntil
    });

    await redemption.save();

    // Update reward inventory
    await Reward.updateOne(
      { rewardId },
      { $inc: { inventoryUsed: 1 } }
    );

    // Update inventory if applicable
    await Inventory.updateOne(
      { rewardId },
      {
        $inc: { availableQuantity: -1, soldQuantity: 1 },
        $set: { lastRestocked: new Date() }
      }
    );

    // Check if out of stock
    const updatedReward = await Reward.findOne({ rewardId });
    if (updatedReward && updatedReward.inventory !== undefined &&
        updatedReward.inventory - updatedReward.inventoryUsed <= 0) {
      await Reward.updateOne({ rewardId }, { $set: { status: 'out_of_stock' } });
    }

    redemptions.inc({ reward_id: rewardId });
    if (updatedReward) inventoryUsed.inc({ reward_id: rewardId });

    logger.info(`Reward redeemed: ${rewardId} by user ${userId}`);

    return { success: true, redemption };
  }

  async getRedemption(redemptionId: string): Promise<IRedemption | null> {
    return Redemption.findOne({ redemptionId });
  }

  async getUserRedemptions(userId: string, page = 1, limit = 20): Promise<{ redemptions: IRedemption[]; total: number }> {
    const skip = (page - 1) * limit;

    const [redemptions, total] = await Promise.all([
      Redemption.find({ userId }).sort({ redeemedAt: -1 }).skip(skip).limit(limit),
      Redemption.countDocuments({ userId })
    ]);

    return { redemptions, total };
  }

  async getInventory(rewardId: string): Promise<{
    rewardId: string;
    available: number;
    total: number;
    sold: number;
    isLowStock: boolean;
  } | null> {
    const reward = await Reward.findOne({ rewardId });
    if (!reward) return null;

    const inventory = await Inventory.findOne({ rewardId });

    return {
      rewardId,
      available: inventory?.availableQuantity || (reward.inventory || 0) - reward.inventoryUsed,
      total: inventory?.totalQuantity || reward.inventory || 0,
      sold: inventory?.soldQuantity || reward.inventoryUsed,
      isLowStock: (inventory?.availableQuantity || 0) <= (inventory?.lowStockThreshold || 10)
    };
  }

  async delete(rewardId: string): Promise<boolean> {
    const result = await Reward.findOneAndUpdate(
      { rewardId },
      { $set: { status: 'archived' } }
    );

    if (result) {
      activeRewards.dec();
      logger.info(`Reward archived: ${rewardId}`);
      return true;
    }
    return false;
  }
}

export const rewardService = new RewardService();