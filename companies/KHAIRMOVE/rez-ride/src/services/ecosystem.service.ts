/**
 * Ecosystem Integration Hub
 *
 * Orchestrates all external service integrations:
 * - ReZ Intelligence
 * - RABTUL
 * - ReZ Media
 * - CorpPerks
 */

import { intelligenceService } from './intelligence.service';
import { rabtulService } from './rabtul.service';
import { mediaService } from './media.service';
import { corporateService } from './corporate.service';
import { CommerceIntegrationService } from './commerce-integration.service';
import { Logger } from '@nestjs/common';

export interface RideContext {
  userId: string;
  pickup: { lat: number; lng: number; address: string };
  drop: { lat: number; lng: number; address: string };
  vehicleType: string;
}

export interface EnhancedRideResponse {
  // Core ride data
  ride: any;

  // Intelligence
  intentPrediction?: any;
  surgePrediction?: any;
  recommendations?: any;

  // User context
  userSegment?: any;
  karmaPoints?: any;
  walletBalance?: any;

  // Promotions
  ads?: any[];
  karmaRewards?: any[];
  cashbackOffers?: any[];
  referralInfo?: any;

  // Corporate
  corporateEmployee?: any;
  policyCheck?: any;
}

export class EcosystemService {
  private readonly logger = new Logger('EcosystemService');
  private readonly commerceService: CommerceIntegrationService;

  constructor() {
    // Initialize Commerce Integration Service
    this.commerceService = new CommerceIntegrationService({
      get: (key: string, defaultValue?: string) => process.env[key] || defaultValue,
    } as any);
  }

  /**
   * Enrich ride booking with all ecosystem data
   */
  async enrichRideBooking(context: RideContext): Promise<EnhancedRideResponse> {
    const response: EnhancedRideResponse = { ride: {} };

    // Run all enrichment in parallel
    const [
      segmentResult,
      intentResult,
      karmaResult,
      walletResult,
      surgeResult,
      recommendationsResult,
    ] = await Promise.allSettled([
      // ReZ Intelligence
      intelligenceService.getUserSegment(context.userId),
      intelligenceService.predictIntent(context.userId, {
        lat: context.pickup.lat,
        lng: context.pickup.lng,
        time: new Date(),
      }),

      // ReZ Media (Karma)
      mediaService.getKarmaPoints(context.userId),
      mediaService.getRewards(context.userId),

      // RABTUL
      rabtulService.getWalletBalance(context.userId),

      // Surge prediction
      intelligenceService.predictSurge(context.pickup.lat, context.pickup.lng),

      // Recommendations
      intelligenceService.getRecommendations(context.userId, {
        lat: context.pickup.lat,
        lng: context.pickup.lng,
        time: new Date(),
      }),
    ]);

    // Process results
    if (segmentResult.status === 'fulfilled') {
      response.userSegment = segmentResult.value;
    }

    if (intentResult.status === 'fulfilled') {
      response.intentPrediction = intentResult.value;
    }

    if (karmaResult.status === 'fulfilled') {
      response.karmaPoints = karmaResult.value;
    }

    if (surgeResult.status === 'fulfilled') {
      response.surgePrediction = surgeResult.value;
    }

    if (recommendationsResult.status === 'fulfilled') {
      response.recommendations = recommendationsResult.value;
    }

    if (walletResult.status === 'fulfilled') {
      response.walletBalance = walletResult.value;
    }

    return response;
  }

  /**
   * Process completed ride with all integrations
   */
  async processRideCompletion(ride: {
    id: string;
    userId: string;
    driverId: string;
    pickup: { lat: number; lng: number; address: string };
    drop: { lat: number; lng: number; address: string };
    fare: number;
    cashback: number;
    distance: number;
    duration: number;
    vehicleType: string;
    rating?: number;
  }): Promise<{ crossSells: any[]; moments: any[] }> {
    // Run all post-completion tasks in parallel
    await Promise.allSettled([
      // RABTUL: Credit cashback
      rabtulService.addCashback(ride.userId, ride.id, ride.fare),

      // ReZ Intelligence: Update LTV
      intelligenceService.updateLTV(ride.userId, {
        fare: ride.fare,
        distance: ride.distance,
        vehicleType: 'cab',
      }),

      // ReZ Intelligence: Track event
      intelligenceService.trackEvent({
        type: 'ride_completed',
        userId: ride.userId,
        data: { rideId: ride.id, fare: ride.fare },
        timestamp: new Date(),
      }),

      // ReZ Media: Award karma points
      mediaService.awardKarmaPoints(ride.userId, {
        rideId: ride.id,
        fare: ride.fare,
        distance: ride.distance,
        rating: ride.rating,
      }),

      // RABTUL: Notify user
      rabtulService.notifyRideCompleted(ride.userId, ride.fare, ride.cashback),

      // ReZ Intelligence: Check churn risk
      intelligenceService.predictChurn(ride.userId).then(churn => {
        if (churn.risk !== 'low') {
          intelligenceService.triggerRetention(ride.userId, churn);
        }
      }),

      // RABTUL: Track analytics
      rabtulService.trackEvent({
        name: 'ride_completed',
        userId: ride.userId,
        properties: {
          rideId: ride.id,
          fare: ride.fare,
          distance: ride.distance,
        },
      }),
    ]);

    // Commerce Graph integration (sequential after other tasks)
    try {
      // Record transaction in Commerce Graph
      await this.commerceService.recordRideTransaction({
        rideId: ride.id,
        userId: ride.userId,
        driverId: ride.driverId,
        pickup: ride.pickup,
        drop: ride.drop,
        fare: ride.fare,
        vehicleType: ride.vehicleType,
        distance: ride.distance,
        duration: ride.duration,
      });

      // Get cross-sell recommendations
      const crossSells = await this.commerceService.getCrossSellRecommendations(ride.userId);

      // Get moment triggers
      const moments = await this.commerceService.getMomentTriggers(ride.userId);

      this.logger.log(`Commerce Graph synced for ride ${ride.id}`);

      return {
        crossSells: crossSells.recommendations,
        moments: moments.moments,
      };
    } catch (error) {
      this.logger.error(`Commerce Graph sync failed: ${error.message}`);
      return { crossSells: [], moments: [] };
    }
  }

  /**
   * Process driver metrics update
   */
  async processDriverMetrics(driverId: string, metrics: {
    rating: number;
    acceptanceRate: number;
    cancellationRate: number;
  }): Promise<void> {
    await Promise.allSettled([
      // Update driver score in Intelligence
      intelligenceService.updateDriverScore(driverId, {
        rideRating: metrics.rating,
        acceptanceRate: metrics.acceptanceRate,
        cancellationRate: metrics.cancellationRate,
        completionRate: 1 - metrics.cancellationRate,
      }),

      // Track for analytics
      rabtulService.trackEvent({
        name: 'driver_metrics_updated',
        properties: metrics,
      }),
    ]);
  }

  /**
   * Handle corporate ride booking
   */
  async handleCorporateBooking(context: {
    employeeId: string;
    ride: RideContext;
    companyId: string;
  }): Promise<{
    allowed: boolean;
    ride?: any;
    violations?: string[];
    approvalRequired?: boolean;
    approvalId?: string;
  }> {
    // Verify employee
    const employee = await corporateService.verifyEmployee(context.employeeId, '');
    if (!employee) {
      return { allowed: false, violations: ['Employee not verified'] };
    }

    // Get policy
    const policy = await corporateService.getCompanyPolicy(context.companyId);
    if (!policy) {
      return { allowed: false, violations: ['Company policy not found'] };
    }

    // Check budget
    const budget = await corporateService.getRemainingBudget(context.employeeId);

    // Check compliance
    const compliance = await corporateService.checkPolicyCompliance(employee, {
      employeeId: context.employeeId,
      companyId: context.companyId,
      pickup: context.ride.pickup,
      drop: context.ride.drop,
      vehicleType: context.ride.vehicleType as any,
      purpose: 'Business travel',
    });

    if (!compliance.allowed) {
      return { allowed: false, violations: compliance.violations };
    }

    if (compliance.requiresApproval) {
      // Request approval
      const approval = await corporateService.requestApproval({
        requestId: '',
        employeeId: context.employeeId,
        employeeName: employee.name,
        managerId: 'manager_1', // Would come from employee data
        rideDetails: {
          employeeId: context.employeeId,
          companyId: context.companyId,
          pickup: context.ride.pickup,
          drop: context.ride.drop,
          vehicleType: context.ride.vehicleType as any,
          purpose: 'Business travel',
        },
        estimatedFare: 0, // Would calculate
        reason: 'Policy approval required',
        status: 'pending',
        createdAt: new Date(),
      });
      return { allowed: true, approvalRequired: true, approvalId: approval.requestId };
    }

    return { allowed: true, ride: {} };
  }

  /**
   * Get personalized experience for user
   */
  async getPersonalizedExperience(userId: string): Promise<{
    segment: any;
    recommendations: any;
    karma: any;
    promotions: any[];
    referralCode: string;
  }> {
    const [segment, karma, referrals, rewards] = await Promise.all([
      intelligenceService.getUserSegment(userId),
      mediaService.getKarmaPoints(userId),
      mediaService.getReferralStats(userId),
      mediaService.getRewards(userId),
    ]);

    return {
      segment,
      recommendations: await intelligenceService.getRecommendations(userId, {
        lat: 12.9716,
        lng: 77.5946,
        time: new Date(),
      }),
      karma,
      promotions: rewards,
      referralCode: referrals.code,
    };
  }

  /**
   * Get DOOH screen content for driver
   */
  async getDOOHScreenContent(screenId: string): Promise<{
    ads: any[];
    campaignInfo: any;
  }> {
    const ads = await mediaService.getDOOHAds(screenId);

    return {
      ads,
      campaignInfo: {
        totalImpressions: 0,
        earnings: 0,
      },
    };
  }
}

export const ecosystemService = new EcosystemService();
