import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Voucher, VoucherType, VoucherStatus } from '../models/voucher.model';
import { Campaign, CampaignType } from '../models/campaign.model';
import { WalletService } from './wallet.service';

export interface ServiceCompletedEvent {
  event: 'service.completed' | 'order.placed' | 'booking.confirmed';
  source: 'restaurant' | 'retail' | 'salon' | 'hotel' | 'healthcare' | 'education';
  merchantId: string;
  userId: string;
  orderId: string;
  amount: number;
  timestamp: string;
}

export interface RideCompletedEvent {
  rideId: string;
  userId: string;
  fare: number;
  drop: { lat: number; lng: number; address: string };
  destinationMerchantId?: string;
}

@Injectable()
export class VoucherService {
  private readonly logger = new Logger(VoucherService.name);

  constructor(
    @InjectModel(Voucher.name) private voucherModel: Model<Voucher>,
    @InjectModel(Campaign.name) private campaignModel: Model<Campaign>,
    private walletService: WalletService,
  ) {}

  /**
   * Handle service completion - issue ride voucher
   */
  async handleServiceCompleted(event: ServiceCompletedEvent): Promise<Voucher | null> {
    // Find eligible campaigns
    const campaigns = await this.findEligibleCampaigns(event);
    if (campaigns.length === 0) {
      return null;
    }

    // Use the best matching campaign (highest reward)
    const campaign = campaigns.sort((a, b) => b.reward.value - a.reward.value)[0];

    // Check eligibility
    const eligibility = campaign.canIssueVoucher(event.userId, event.amount);
    if (!eligibility.canIssue) {
      this.logger.debug(`Campaign not eligible: ${eligibility.reason}`);
      return null;
    }

    // Check if user already redeemed
    const existing = await this.hasUserRedeemed(campaign._id.toString(), event.userId);
    if (existing) {
      this.logger.debug('User already redeemed this campaign');
      return null;
    }

    // Issue voucher
    const voucher = await this.issueVoucher(campaign, event);
    return voucher;
  }

  /**
   * Handle ride completion - issue service voucher (Ride → Service)
   */
  async handleRideCompleted(event: RideCompletedEvent): Promise<Voucher | null> {
    // Find Ride → Service campaigns
    const campaigns = await this.findRideToServiceCampaigns(event);
    if (campaigns.length === 0) {
      return null;
    }

    const campaign = campaigns[0];

    const eligibility = campaign.canIssueVoucher(event.userId, event.fare);
    if (!eligibility.canIssue) {
      return null;
    }

    const existing = await this.hasUserRedeemed(campaign._id.toString(), event.userId);
    if (existing) {
      return null;
    }

    const voucher = await this.issueRideToServiceVoucher(campaign, event);
    return voucher;
  }

  /**
   * Apply voucher to a ride
   */
  async applyVoucher(
    userId: string,
    voucherId: string,
    rideAmount: number,
    rideType: 'auto' | 'cab' | 'suv',
  ): Promise<{ applied: boolean; amount: number; type: string }> {
    const voucher = await this.voucherModel.findOne({
      _id: new Types.ObjectId(voucherId),
      userId,
      used: false,
      status: VoucherStatus.ISSUED,
      validUntil: { $gt: new Date() },
    });

    if (!voucher) {
      return { applied: false, amount: 0, type: '' };
    }

    // Check eligibility
    const canRedeem = voucher.canRedeem(rideType, rideAmount);
    if (!canRedeem.canRedeem) {
      return { applied: false, amount: 0, type: '' };
    }

    // Calculate discount
    const discount = voucher.calculateDiscount(rideAmount);

    // Mark as used (for this ride)
    // We'll mark it fully used only when ride completes

    return {
      applied: true,
      amount: discount,
      type: voucher.type,
    };
  }

  /**
   * Redeem voucher (mark as used)
   */
  async redeemVoucher(voucherId: string, rideId: string): Promise<boolean> {
    const voucher = await this.voucherModel.findById(voucherId);
    if (!voucher) return false;

    voucher.used = true;
    voucher.usedAt = new Date();
    voucher.usedForRideId = new Types.ObjectId(rideId);
    voucher.status = VoucherStatus.REDEEMED;
    await voucher.save();

    return true;
  }

  /**
   * Refund voucher (make it available again)
   */
  async refundVoucher(voucherId: string): Promise<boolean> {
    const voucher = await this.voucherModel.findById(voucherId);
    if (!voucher) return false;

    voucher.used = false;
    voucher.usedAt = undefined;
    voucher.usedForRideId = undefined;
    voucher.status = VoucherStatus.ISSUED;
    await voucher.save();

    return true;
  }

  /**
   * Get user's valid vouchers
   */
  async getUserVouchers(userId: string, type?: VoucherType): Promise<Voucher[]> {
    const query: any = {
      userId,
      used: false,
      status: VoucherStatus.ISSUED,
      validUntil: { $gt: new Date() },
    };

    if (type) {
      query.type = type;
    }

    return this.voucherModel.find(query).sort({ validUntil: 1 });
  }

  /**
   * Get best voucher for a ride
   */
  async getBestVoucher(
    userId: string,
    rideType: 'auto' | 'cab' | 'suv',
    rideAmount: number,
  ): Promise<Voucher | null> {
    return (this.voucherModel as any).findBestForRide(userId, rideType, rideAmount);
  }

  /**
   * Find eligible campaigns for service completion
   */
  private async findEligibleCampaigns(event: ServiceCompletedEvent): Promise<Campaign[]> {
    const now = new Date();

    const query: any = {
      status: 'active',
      type: { $in: [CampaignType.SERVICE_TO_RIDE, CampaignType.SHOP_TO_RIDE] },
      'trigger.action': event.event,
      'schedule.startDate': { $lte: now },
      'schedule.endDate': { $gte: now },
      'limits.remainingBudget': { $gt: 0 },
    };

    if (event.source) {
      query['trigger.source'] = event.source;
    }

    const campaigns = await this.campaignModel.find(query);

    // Filter by amount threshold
    return campaigns.filter(c =>
      !c.trigger.minAmount || event.amount >= c.trigger.minAmount
    );
  }

  /**
   * Find Ride → Service campaigns
   */
  private async findRideToServiceCampaigns(event: RideCompletedEvent): Promise<Campaign[]> {
    const now = new Date();

    const query: any = {
      status: 'active',
      type: CampaignType.RIDE_TO_SERVICE,
      'trigger.action': 'ride_completed',
      'schedule.startDate': { $lte: now },
      'schedule.endDate': { $gte: now },
      'limits.remainingBudget': { $gt: 0 },
    };

    // If user went to a specific merchant
    if (event.destinationMerchantId) {
      query.merchantId = event.destinationMerchantId;
    }

    return this.campaignModel.find(query);
  }

  /**
   * Check if user has already redeemed this campaign
   */
  private async hasUserRedeemed(campaignId: string, userId: string): Promise<boolean> {
    const count = await this.voucherModel.countDocuments({
      campaignId: new Types.ObjectId(campaignId),
      userId,
      used: true,
    });
    return count >= 1;
  }

  /**
   * Issue voucher for Service → Ride
   */
  private async issueVoucher(campaign: Campaign, event: ServiceCompletedEvent): Promise<Voucher> {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + campaign.reward.validityDays);

    // Create voucher
    const voucher = new this.voucherModel({
      campaignId: campaign._id,
      merchantId: campaign.merchantId,
      userId: event.userId,
      type: VoucherType.RIDE_CREDIT,
      value: campaign.reward.value,
      maxValue: campaign.reward.maxValue,
      validFrom: new Date(),
      validUntil,
      rideTypes: campaign.reward.rideTypes,
      status: VoucherStatus.ISSUED,
      triggerEvent: {
        type: event.event,
        source: event.source,
        merchantId: event.merchantId,
        orderId: event.orderId,
        amount: event.amount,
      },
    });

    await voucher.save();

    // Credit to wallet
    await (this.walletService as any).creditVoucher({
      userId: event.userId,
      amount: campaign.reward.value,
      voucherId: voucher._id.toString(),
      campaignId: campaign._id.toString(),
      type: 'ride_credit',
      expiresAt: validUntil,
      fundedBy: campaign.merchantId,
    });

    // Update campaign stats
    campaign.incrementIssued();
    campaign.decrementBudget(campaign.reward.value);
    await campaign.save();

    this.logger.log(`Voucher issued: ${voucher._id} to user: ${event.userId}`);

    return voucher;
  }

  /**
   * Issue voucher for Ride → Service
   */
  private async issueRideToServiceVoucher(campaign: Campaign, event: RideCompletedEvent): Promise<Voucher> {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + campaign.reward.validityDays);

    const voucher = new this.voucherModel({
      campaignId: campaign._id,
      merchantId: campaign.merchantId,
      userId: event.userId,
      type: VoucherType.SERVICE_CREDIT,
      value: campaign.reward.value,
      maxValue: campaign.reward.maxValue,
      validFrom: new Date(),
      validUntil,
      applicableMerchants: campaign.reward.applicableMerchants,
      status: VoucherStatus.ISSUED,
      triggerEvent: {
        type: 'ride_completed',
        source: 'rez_ride',
        merchantId: campaign.merchantId,
        amount: event.fare,
      },
    });

    await voucher.save();

    // Credit to wallet
    await (this.walletService as any).creditVoucher({
      userId: event.userId,
      amount: campaign.reward.value,
      voucherId: voucher._id.toString(),
      campaignId: campaign._id.toString(),
      type: 'service_credit',
      expiresAt: validUntil,
      fundedBy: campaign.merchantId,
    });

    campaign.incrementIssued();
    campaign.decrementBudget(campaign.reward.value);
    await campaign.save();

    this.logger.log(`Ride→Service voucher issued: ${voucher._id} to user: ${event.userId}`);

    return voucher;
  }

  /**
   * Expire old vouchers (cleanup job)
   */
  async expireOldVouchers(): Promise<number> {
    const result = await this.voucherModel.updateMany(
      {
        used: false,
        status: VoucherStatus.ISSUED,
        validUntil: { $lt: new Date() },
      },
      {
        $set: { status: VoucherStatus.EXPIRED },
      }
    );

    return result.modifiedCount;
  }
}
