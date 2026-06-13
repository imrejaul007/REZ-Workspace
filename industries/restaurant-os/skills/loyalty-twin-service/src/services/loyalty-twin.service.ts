import { v4 as uuidv4 } from 'uuid';
import { LoyaltyTwin } from '../models/loyalty-twin.model';
import { CreateLoyaltyTwinRequest, CreateLoyaltyTwinResponse, EarnPointsRequest, RedeemPointsRequest, GetLoyaltyStatusResponse, LoyaltyTier, TIER_THRESHOLDS, TIER_BENEFITS } from '../schemas/loyalty-twin.schema';
import { logger } from '../utils/logger';
import { messageBroker } from '../utils/message-broker';

export class LoyaltyTwinService {
  async createLoyaltyTwin(request: CreateLoyaltyTwinRequest): Promise<CreateLoyaltyTwinResponse> {
    const loyaltyId = uuidv4();
    const twinId = `twin.restaurant.loyalty.${loyaltyId}`;
    logger.info('Creating Loyalty Twin', { customerId: request.customerId });

    const existingTwin = await LoyaltyTwin.findByCustomerId(request.customerId);
    if (existingTwin) {
      throw new Error(`Loyalty Twin already exists for customerId: ${request.customerId}`);
    }

    const loyaltyTwin = new LoyaltyTwin({
      twinId,
      loyaltyId,
      merchantId: request.merchantId,
      customerId: request.customerId,
      currentTier: LoyaltyTier.BRONZE,
      pointsBalance: 0,
      lifetimePoints: 0,
      tierProgress: 0,
      transactions: [],
      rewards: [],
      tierBenefits: TIER_BENEFITS
    });

    await loyaltyTwin.save();
    await messageBroker.publish('restaurant.loyalty.created', { twinId, loyaltyId, customerId: request.customerId, twinOsEntityId: twinId, timestamp: new Date().toISOString() });

    return { twinId, loyaltyId, customerId: request.customerId, twinOsEntityId: twinId, currentTier: LoyaltyTier.BRONZE, pointsBalance: 0, createdAt: loyaltyTwin.createdAt.toISOString() };
  }

  async earnPoints(request: EarnPointsRequest): Promise<{ transactionId: string; newBalance: number; pointsEarned: number }> {
    logger.info('Earning points', { customerId: request.customerId, points: request.points });
    const loyaltyTwin = await LoyaltyTwin.findByCustomerId(request.customerId);
    if (!loyaltyTwin) {
      throw new Error(`Loyalty Twin not found for customerId: ${request.customerId}`);
    }

    // Apply tier multiplier
    const benefit = TIER_BENEFITS.find(b => b.tier === loyaltyTwin.currentTier);
    const pointsEarned = Math.floor(request.points * (benefit?.earnMultiplier || 1));

    const transactionId = uuidv4();
    loyaltyTwin.transactions.push({
      transactionId,
      customerId: request.customerId,
      type: 'earn',
      points: pointsEarned,
      orderId: request.orderId,
      description: request.description || 'Points earned',
      timestamp: new Date().toISOString()
    });

    loyaltyTwin.pointsBalance += pointsEarned;
    loyaltyTwin.lifetimePoints += pointsEarned;

    // Check for tier upgrade
    const newTier = loyaltyTwin.calculateTier();
    if (newTier !== loyaltyTwin.currentTier) {
      loyaltyTwin.currentTier = newTier;
      await messageBroker.publish('restaurant.loyalty.tier.upgraded', { twinId: loyaltyTwin.twinId, customerId: request.customerId, newTier, timestamp: new Date().toISOString() });
    }

    loyaltyTwin.tierProgress = loyaltyTwin.calculateTierProgress();
    await loyaltyTwin.save();

    await messageBroker.publish('restaurant.loyalty.points.earned', { twinId: loyaltyTwin.twinId, customerId: request.customerId, points: pointsEarned, newBalance: loyaltyTwin.pointsBalance, timestamp: new Date().toISOString() });

    return { transactionId, newBalance: loyaltyTwin.pointsBalance, pointsEarned };
  }

  async redeemPoints(request: RedeemPointsRequest): Promise<{ transactionId: string; newBalance: number; success: boolean }> {
    logger.info('Redeeming points', { customerId: request.customerId, points: request.points });
    const loyaltyTwin = await LoyaltyTwin.findByCustomerId(request.customerId);
    if (!loyaltyTwin) {
      throw new Error(`Loyalty Twin not found for customerId: ${request.customerId}`);
    }

    if (loyaltyTwin.pointsBalance < request.points) {
      throw new Error(`Insufficient points. Balance: ${loyaltyTwin.pointsBalance}, Requested: ${request.points}`);
    }

    const transactionId = uuidv4();
    loyaltyTwin.transactions.push({
      transactionId,
      customerId: request.customerId,
      type: 'redeem',
      points: -request.points,
      description: request.description || 'Points redeemed',
      timestamp: new Date().toISOString()
    });

    loyaltyTwin.pointsBalance -= request.points;
    await loyaltyTwin.save();

    await messageBroker.publish('restaurant.loyalty.points.redeemed', { twinId: loyaltyTwin.twinId, customerId: request.customerId, points: request.points, newBalance: loyaltyTwin.pointsBalance, timestamp: new Date().toISOString() });

    return { transactionId, newBalance: loyaltyTwin.pointsBalance, success: true };
  }

  async getLoyaltyStatus(customerId: string): Promise<GetLoyaltyStatusResponse> {
    logger.info('Getting loyalty status', { customerId });
    const loyaltyTwin = await LoyaltyTwin.findByCustomerId(customerId);
    if (!loyaltyTwin) {
      throw new Error(`Loyalty Twin not found for customerId: ${customerId}`);
    }

    const tierOrder = [LoyaltyTier.BRONZE, LoyaltyTier.SILVER, LoyaltyTier.GOLD, LoyaltyTier.PLATINUM];
    const currentIndex = tierOrder.indexOf(loyaltyTwin.currentTier);
    const nextTier = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;
    const pointsToNextTier = nextTier ? TIER_THRESHOLDS[nextTier] - loyaltyTwin.lifetimePoints : 0;

    return {
      twinId: loyaltyTwin.twinId,
      customerId: loyaltyTwin.customerId,
      currentTier: loyaltyTwin.currentTier,
      pointsBalance: loyaltyTwin.pointsBalance,
      lifetimePoints: loyaltyTwin.lifetimePoints,
      tierProgress: loyaltyTwin.tierProgress,
      nextTier: nextTier || undefined,
      pointsToNextTier: Math.max(0, pointsToNextTier)
    };
  }

  async deleteLoyaltyTwin(customerId: string): Promise<void> {
    logger.info('Deleting Loyalty Twin', { customerId });
    const result = await LoyaltyTwin.deleteOne({ customerId });
    if (result.deletedCount === 0) {
      throw new Error(`Loyalty Twin not found for customerId: ${customerId}`);
    }
    await messageBroker.publish('restaurant.loyalty.deleted', { customerId, timestamp: new Date().toISOString() });
  }
}

export const loyaltyTwinService = new LoyaltyTwinService();