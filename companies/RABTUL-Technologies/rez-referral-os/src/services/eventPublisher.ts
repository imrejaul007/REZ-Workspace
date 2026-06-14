import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { validateEnv } from '../config/env';
import { logger } from '../utils/logger';
import {
  ReferralEvent,
  ReferralRegisteredEvent,
  ReferralQualifiedEvent,
  ReferralRewardedEvent,
  CreatorProfileCreatedEvent,
  CreatorQRScanEvent,
  CreatorCommissionEarnedEvent,
  CampaignCreatedEvent,
  CampaignBudgetExhaustedEvent,
  AmbassadorTierUpgradedEvent,
  FraudBlockedEvent,
} from '../events/referralEvents';

// Event type constants
export const REFERRAL_EVENTS = {
  REFERRAL_REGISTERED: 'referral.registered',
  REFERRAL_QUALIFIED: 'referral.qualified',
  REFERRAL_REWARDED: 'referral.rewarded',
  CREATOR_PROFILE_CREATED: 'creator.profile_created',
  CREATOR_QR_SCANNED: 'creator.qr_scanned',
  CREATOR_COMMISSION_EARNED: 'creator.commission_earned',
  CAMPAIGN_CREATED: 'campaign.created',
  CAMPAIGN_BUDGET_EXHAUSTED: 'campaign.budget_exhausted',
  AMBASSADOR_TIER_UPGRADED: 'ambassador.tier_upgraded',
  FRAUD_BLOCKED: 'fraud.blocked',
} as const;

export type ReferralEventType = typeof REFERRAL_EVENTS[keyof typeof REFERRAL_EVENTS];

export class EventPublisher {
  private readonly eventBusUrl: string;
  private readonly source = 'rez-referral-os';

  constructor() {
    const env = validateEnv();
    this.eventBusUrl = env.EVENT_BUS_URL || 'http://localhost:4025';
  }

  /**
   * Publish an event to the REZ Event Bus
   */
  async publish<T extends { type: string; data: unknown }>(event: T): Promise<void> {
    const eventPayload = {
      id: uuidv4(),
      source: this.source,
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...event,
    };

    try {
      await axios.post(`${this.eventBusUrl}/api/events`, eventPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      logger.debug('[EventPublisher] Published event:', { eventType: event.type, eventId: eventPayload.id });
    } catch (error) {
      // Log but don't fail the operation
      logger.error('[EventPublisher] Failed to publish event:', {
        eventType: event.type,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Publish referral registered event
   */
  async publishReferralRegistered(data: Omit<ReferralRegisteredEvent, 'version' | 'timestamp' | 'service'>): Promise<void> {
    await this.publish({
      type: REFERRAL_EVENTS.REFERRAL_REGISTERED,
      data,
    });
  }

  /**
   * Publish referral qualified event
   */
  async publishReferralQualified(data: Omit<ReferralQualifiedEvent, 'version' | 'timestamp' | 'service'>): Promise<void> {
    await this.publish({
      type: REFERRAL_EVENTS.REFERRAL_QUALIFIED,
      data,
    });
  }

  /**
   * Publish referral rewarded event
   */
  async publishReferralRewarded(data: Omit<ReferralRewardedEvent, 'version' | 'timestamp' | 'service'>): Promise<void> {
    await this.publish({
      type: REFERRAL_EVENTS.REFERRAL_REWARDED,
      data,
    });
  }

  /**
   * Publish creator profile created event
   */
  async publishCreatorProfileCreated(data: Omit<CreatorProfileCreatedEvent, 'version' | 'timestamp' | 'service'>): Promise<void> {
    await this.publish({
      type: REFERRAL_EVENTS.CREATOR_PROFILE_CREATED,
      data,
    });
  }

  /**
   * Publish creator QR scanned event
   */
  async publishCreatorQRScan(data: Omit<CreatorQRScanEvent, 'version' | 'timestamp' | 'service'>): Promise<void> {
    await this.publish({
      type: REFERRAL_EVENTS.CREATOR_QR_SCANNED,
      data,
    });
  }

  /**
   * Publish creator commission earned event
   */
  async publishCreatorCommission(data: Omit<CreatorCommissionEarnedEvent, 'version' | 'timestamp' | 'service'>): Promise<void> {
    await this.publish({
      type: REFERRAL_EVENTS.CREATOR_COMMISSION_EARNED,
      data,
    });
  }

  /**
   * Publish campaign created event
   */
  async publishCampaignCreated(data: Omit<CampaignCreatedEvent, 'version' | 'timestamp' | 'service'>): Promise<void> {
    await this.publish({
      type: REFERRAL_EVENTS.CAMPAIGN_CREATED,
      data,
    });
  }

  /**
   * Publish campaign budget exhausted event
   */
  async publishCampaignBudgetExhausted(data: Omit<CampaignBudgetExhaustedEvent, 'version' | 'timestamp' | 'service'>): Promise<void> {
    await this.publish({
      type: REFERRAL_EVENTS.CAMPAIGN_BUDGET_EXHAUSTED,
      data,
    });
  }

  /**
   * Publish ambassador tier upgraded event
   */
  async publishAmbassadorTierUpgraded(data: Omit<AmbassadorTierUpgradedEvent, 'version' | 'timestamp' | 'service'>): Promise<void> {
    await this.publish({
      type: REFERRAL_EVENTS.AMBASSADOR_TIER_UPGRADED,
      data,
    });
  }

  /**
   * Publish fraud blocked event
   */
  async publishFraudBlocked(data: Omit<FraudBlockedEvent, 'version' | 'timestamp' | 'service'>): Promise<void> {
    await this.publish({
      type: REFERRAL_EVENTS.FRAUD_BLOCKED,
      data,
    });
  }
}

// Singleton export
export const eventPublisher = new EventPublisher();
