import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver } from '../models/driver.model';

export interface DriverBenefit {
  id: string;
  driverId: string;
  type: BENEFIT_TYPE;
  status: BENEFIT_STATUS;
  amount?: number;
  limit?: number;
  used?: number;
  remaining?: number;
  startDate: Date;
  endDate?: Date;
  details: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export enum BENEFIT_TYPE {
  BONUS = 'bonus',
  INSURANCE = 'insurance',
  HEALTH_CHECKUP = 'health_checkup',
  VEHICLE_SERVICE = 'vehicle_service',
  FUEL_CARD = 'fuel_card',
  LEARNING = 'learning',
  WELLNESS = 'wellness',
  ACCIDENT_COVER = 'accident_cover',
  LIFE_INSURANCE = 'life_insurance',
  EDUCATION = 'education',
  REWARD = 'reward',
}

export enum BENEFIT_STATUS {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  USED = 'used',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
}

export interface HealthBenefit {
  freeCheckups: number;
  usedCheckups: number;
  nextCheckupDate?: Date;
  hospitalNetwork: string[];
}

export interface VehicleBenefit {
  freeServices: number;
  usedServices: number;
  nextServiceDueKm?: number;
  nextServiceDueDate?: Date;
  fuelDiscount: number; // percentage
}

export interface AccidentCover {
  coverAmount: number;
  premiumPaid: boolean;
  activeUntil: Date;
  claimLimit: number;
}

@Injectable()
export class DriverBenefitsService {
  private readonly logger = new Logger(DriverBenefitsService.name);

  // In-memory benefit tracking
  private benefits: Map<string, DriverBenefit[]> = new Map();

  constructor(
    @InjectModel(Driver.name) private driverModel: Model<Driver>,
  ) {
    // Initialize benefits for new drivers
  }

  // ===========================================
  // BENEFIT PROGRAMS
  // ===========================================

  /**
   * Get driver benefits summary
   */
  async getDriverBenefits(driverId: string): Promise<{
    active: DriverBenefit[];
    totalBenefits: number;
    totalValue: number;
    upcoming: DriverBenefit[];
  }> {
    const driverBenefits = this.benefits.get(driverId) || [];

    const active = driverBenefits.filter(b => b.status === BENEFIT_STATUS.ACTIVE);
    const upcoming = driverBenefits.filter(b => b.status === BENEFIT_STATUS.PENDING);

    const totalValue = active.reduce((sum, b) => sum + (b.amount || 0), 0);

    return {
      active,
      totalBenefits: active.length,
      totalValue,
      upcoming,
    };
  }

  /**
   * Award bonus to driver
   */
  async awardBonus(
    driverId: string,
    amount: number,
    reason: string,
    type: 'signup' | 'referral' | 'milestone' | 'promotion' | 'incentive'
  ): Promise<DriverBenefit> {
    const benefit: DriverBenefit = {
      id: `BEN_${Date.now()}`,
      driverId,
      type: BENEFIT_TYPE.BONUS,
      status: BENEFIT_STATUS.ACTIVE,
      amount,
      startDate: new Date(),
      createdAt: new Date(),
      details: {
        reason,
        type,
        released: false,
      },
    };

    this.addBenefit(driverId, benefit);

    this.logger.log(`Bonus awarded to driver ${driverId}: ₹${amount} (${reason})`);

    return benefit;
  }

  /**
   * Award milestone bonus (based on rides completed)
   */
  async checkMilestoneBonus(driverId: string, totalRides: number): Promise<DriverBenefit | null> {
    const milestones = [100, 500, 1000, 5000, 10000];

    for (const milestone of milestones) {
      if (totalRides === milestone) {
        const bonusAmount = milestone === 100 ? 500 :
                           milestone === 500 ? 1500 :
                           milestone === 1000 ? 3000 :
                           milestone === 5000 ? 10000 : 25000;

        return this.awardBonus(
          driverId,
          bonusAmount,
          `${milestone} rides completed!`,
          'milestone'
        );
      }
    }

    return null;
  }

  /**
   * Award referral bonus
   */
  async awardReferralBonus(
    referrerId: string,
    refereeId: string,
    refereeCompletedRides: number
  ): Promise<{ referrerBonus: DriverBenefit; refereeBonus?: DriverBenefit }> {
    // Referrer gets ₹500 when referee completes first ride
    const referrerBonus = await this.awardBonus(
      referrerId,
      500,
      'Referral bonus - Friend took first ride',
      'referral'
    );

    let refereeBonus: DriverBenefit | undefined;

    // Referee gets ₹200 signup bonus
    if (refereeCompletedRides === 1) {
      refereeBonus = await this.awardBonus(
        refereeId,
        200,
        'Welcome bonus - Thanks for joining!',
        'signup'
      );
    }

    return { referrerBonus, refereeBonus };
  }

  // ===========================================
  // INSURANCE BENEFITS
  // ===========================================

  /**
   * Enroll driver in accident cover
   */
  async enrollAccidentCover(driverId: string): Promise<AccidentCover> {
    const cover: AccidentCover = {
      coverAmount: 500000, // ₹5 lakhs
      premiumPaid: true,
      activeUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      claimLimit: 500000,
    };

    const benefit: DriverBenefit = {
      id: `INS_${Date.now()}`,
      driverId,
      type: BENEFIT_TYPE.ACCIDENT_COVER,
      status: BENEFIT_STATUS.ACTIVE,
      amount: cover.coverAmount,
      startDate: new Date(),
      createdAt: new Date(),
      endDate: cover.activeUntil,
      details: cover,
    };

    this.addBenefit(driverId, benefit);

    this.logger.log(`Accident cover enrolled for driver ${driverId}`);

    return cover;
  }

  /**
   * Get accident cover status
   */
  async getAccidentCover(driverId: string): Promise<AccidentCover | null> {
    const benefits = this.benefits.get(driverId) || [];
    const cover = benefits.find(
      b => b.type === BENEFIT_TYPE.ACCIDENT_COVER && b.status === BENEFIT_STATUS.ACTIVE
    );

    return cover?.details as AccidentCover || null;
  }

  /**
   * File accident claim
   */
  async fileAccidentClaim(
    driverId: string,
    incidentDetails: {
      rideId: string;
      date: Date;
      description: string;
      hospitalName?: string;
      medicalExpenses?: number;
    }
  ): Promise<{ claimId: string; status: string }> {
    const claimId = `CLM_${Date.now()}`;

    this.logger.log(`Accident claim filed: ${claimId} for driver ${driverId}`);

    // In production, integrate with insurance provider

    return {
      claimId,
      status: 'submitted',
    };
  }

  /**
   * Enroll driver in life insurance
   */
  async enrollLifeInsurance(driverId: string): Promise<{
    coverAmount: number;
    activeUntil: Date;
  }> {
    const benefit: DriverBenefit = {
      id: `LIFE_${Date.now()}`,
      driverId,
      type: BENEFIT_TYPE.LIFE_INSURANCE,
      status: BENEFIT_STATUS.ACTIVE,
      amount: 1000000, // ₹10 lakhs
      startDate: new Date(),
      createdAt: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      details: {
        type: 'term_life',
        nominee: 'Pending',
      },
    };

    this.addBenefit(driverId, benefit);

    return {
      coverAmount: 1000000,
      activeUntil: benefit.endDate!,
    };
  }

  // ===========================================
  // HEALTH BENEFITS
  // ===========================================

  /**
   * Enroll in health checkup program
   */
  async enrollHealthCheckup(driverId: string): Promise<HealthBenefit> {
    const benefit: HealthBenefit = {
      freeCheckups: 2,
      usedCheckups: 0,
      hospitalNetwork: [
        'Apollo Hospitals',
        'Fortis',
        'Manipal Hospitals',
        'Narayana Health',
      ],
    };

    const driverBenefit: DriverBenefit = {
      id: `HLTH_${Date.now()}`,
      driverId,
      type: BENEFIT_TYPE.HEALTH_CHECKUP,
      status: BENEFIT_STATUS.ACTIVE,
      startDate: new Date(),
      createdAt: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      details: benefit,
    };

    this.addBenefit(driverId, driverBenefit);

    this.logger.log(`Health checkup enrolled for driver ${driverId}`);

    return benefit;
  }

  /**
   * Book health checkup
   */
  async bookHealthCheckup(
    driverId: string,
    hospitalId: string,
    date: Date
  ): Promise<{ appointmentId: string; hospital: string }> {
    const appointmentId = `APT_${Date.now()}`;

    this.logger.log(`Health checkup booked for driver ${driverId}: ${appointmentId}`);

    return {
      appointmentId,
      hospital: hospitalId,
    };
  }

  /**
   * Use health benefit
   */
  async useHealthBenefit(driverId: string): Promise<{
    success: boolean;
    remaining: number;
  }> {
    const benefits = this.benefits.get(driverId) || [];
    const healthBenefit = benefits.find(
      b => b.type === BENEFIT_TYPE.HEALTH_CHECKUP && b.status === BENEFIT_STATUS.ACTIVE
    );

    if (!healthBenefit) {
      return { success: false, remaining: 0 };
    }

    const health = healthBenefit.details as HealthBenefit;

    if (health.usedCheckups >= health.freeCheckups) {
      return { success: false, remaining: 0 };
    }

    health.usedCheckups++;
    health.nextCheckupDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months

    return {
      success: true,
      remaining: health.freeCheckups - health.usedCheckups,
    };
  }

  // ===========================================
  // VEHICLE BENEFITS
  // ===========================================

  /**
   * Enroll in vehicle maintenance program
   */
  async enrollVehicleMaintenance(driverId: string): Promise<VehicleBenefit> {
    const benefit: VehicleBenefit = {
      freeServices: 2,
      usedServices: 0,
      nextServiceDueKm: 5000,
      nextServiceDueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      fuelDiscount: 5, // 5% fuel discount
    };

    const driverBenefit: DriverBenefit = {
      id: `VEH_${Date.now()}`,
      driverId,
      type: BENEFIT_TYPE.VEHICLE_SERVICE,
      status: BENEFIT_STATUS.ACTIVE,
      startDate: new Date(),
      createdAt: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      details: benefit,
    };

    this.addBenefit(driverId, driverBenefit);

    this.logger.log(`Vehicle maintenance enrolled for driver ${driverId}`);

    return benefit;
  }

  /**
   * Get vehicle benefit status
   */
  async getVehicleBenefit(driverId: string): Promise<VehicleBenefit | null> {
    const benefits = this.benefits.get(driverId) || [];
    const benefit = benefits.find(
      b => b.type === BENEFIT_TYPE.VEHICLE_SERVICE && b.status === BENEFIT_STATUS.ACTIVE
    );

    return benefit?.details as VehicleBenefit || null;
  }

  /**
   * Use free service
   */
  async useFreeService(driverId: string): Promise<{
    success: boolean;
    remaining: number;
    serviceId: string;
  }> {
    const benefits = this.benefits.get(driverId) || [];
    const benefit = benefits.find(
      b => b.type === BENEFIT_TYPE.VEHICLE_SERVICE && b.status === BENEFIT_STATUS.ACTIVE
    );

    if (!benefit) {
      return { success: false, remaining: 0, serviceId: '' };
    }

    const vehicle = benefit.details as VehicleBenefit;

    if (vehicle.usedServices >= vehicle.freeServices) {
      return { success: false, remaining: 0, serviceId: '' };
    }

    vehicle.usedServices++;
    const serviceId = `SVC_${Date.now()}`;

    this.logger.log(`Free service used: ${serviceId} for driver ${driverId}`);

    return {
      success: true,
      remaining: vehicle.freeServices - vehicle.usedServices,
      serviceId,
    };
  }

  /**
   * Get fuel discount
   */
  async getFuelDiscount(driverId: string): Promise<number> {
    const vehicle = await this.getVehicleBenefit(driverId);
    return vehicle?.fuelDiscount || 0;
  }

  // ===========================================
  // WELLNESS BENEFITS
  // ===========================================

  /**
   * Enroll in wellness program
   */
  async enrollWellness(driverId: string): Promise<{
    yogaClasses: number;
    usedClasses: number;
    mentalHealthSupport: boolean;
  }> {
    const wellness = {
      yogaClasses: 12,
      usedClasses: 0,
      mentalHealthSupport: true,
    };

    const benefit: DriverBenefit = {
      id: `WLN_${Date.now()}`,
      driverId,
      type: BENEFIT_TYPE.WELLNESS,
      status: BENEFIT_STATUS.ACTIVE,
      startDate: new Date(),
      createdAt: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      details: wellness,
    };

    this.addBenefit(driverId, benefit);

    return wellness;
  }

  /**
   * Book yoga class
   */
  async bookYogaClass(
    driverId: string,
    classId: string,
    date: Date
  ): Promise<{ success: boolean; className: string }> {
    this.logger.log(`Yoga class booked for driver ${driverId}: ${classId}`);

    return {
      success: true,
      className: classId,
    };
  }

  // ===========================================
  // LEARNING BENEFITS
  // ===========================================

  /**
   * Enroll in learning program
   */
  async enrollLearning(driverId: string): Promise<{
    courses: string[];
    certificates: string[];
  }> {
    const learning = {
      courses: [
        'Defensive Driving',
        'Customer Service Excellence',
        'Road Safety',
        'English Communication',
      ],
      certificates: [],
    };

    const benefit: DriverBenefit = {
      id: `LRN_${Date.now()}`,
      driverId,
      type: BENEFIT_TYPE.LEARNING,
      status: BENEFIT_STATUS.ACTIVE,
      startDate: new Date(),
      createdAt: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      details: learning,
    };

    this.addBenefit(driverId, benefit);

    return learning;
  }

  /**
   * Get available courses
   */
  async getAvailableCourses(): Promise<{
    id: string;
    name: string;
    duration: string;
    type: string;
  }[]> {
    return [
      { id: 'defensive_driving', name: 'Defensive Driving', duration: '4 hours', type: 'safety' },
      { id: 'customer_service', name: 'Customer Service Excellence', duration: '6 hours', type: 'soft_skills' },
      { id: 'road_safety', name: 'Road Safety & First Aid', duration: '8 hours', type: 'safety' },
      { id: 'english', name: 'English Communication', duration: '10 hours', type: 'language' },
      { id: 'digital_literacy', name: 'Digital Literacy', duration: '3 hours', type: 'technical' },
    ];
  }

  /**
   * Complete a course
   */
  async completeCourse(
    driverId: string,
    courseId: string
  ): Promise<{
    success: boolean;
    certificate: string;
    bonus?: number;
  }> {
    const certificateId = `CERT_${Date.now()}`;

    // Award ₹200 bonus for completing course
    await this.awardBonus(
      driverId,
      200,
      `Course completion: ${courseId}`,
      'milestone'
    );

    return {
      success: true,
      certificate: certificateId,
      bonus: 200,
    };
  }

  // ===========================================
  // REWARDS & RECOGNITION
  // ===========================================

  /**
   * Get driver rank & badges
   */
  async getDriverRewards(driverId: string): Promise<{
    rank: number;
    tier: string;
    points: number;
    badges: string[];
    achievements: string[];
  }> {
    // In production, calculate from driver metrics
    return {
      rank: 1,
      tier: 'gold',
      points: 5000,
      badges: ['Top Driver', 'Safety Champion', 'Customer Favorite'],
      achievements: [
        '100% Acceptance Rate (Month)',
        '500+ 5-Star Ratings',
        'Zero Cancellation',
      ],
    };
  }

  /**
   * Award achievement badge
   */
  async awardBadge(
    driverId: string,
    badge: string,
    description: string
  ): Promise<void> {
    this.logger.log(`Badge awarded to driver ${driverId}: ${badge}`);

    // In production, add to driver profile
  }

  // ===========================================
  // HELPERS
  // ===========================================

  private addBenefit(driverId: string, benefit: DriverBenefit): void {
    const existing = this.benefits.get(driverId) || [];
    existing.push(benefit);
    this.benefits.set(driverId, existing);
  }

  /**
   * Get benefit by ID
   */
  async getBenefit(driverId: string, benefitId: string): Promise<DriverBenefit | null> {
    const benefits = this.benefits.get(driverId) || [];
    return benefits.find(b => b.id === benefitId) || null;
  }

  /**
   * Expire old benefits
   */
  async expireOldBenefits(): Promise<number> {
    let expired = 0;
    const now = new Date();

    for (const [driverId, benefits] of this.benefits.entries()) {
      const updated = benefits.filter(b => {
        if (b.endDate && b.endDate < now && b.status === BENEFIT_STATUS.ACTIVE) {
          b.status = BENEFIT_STATUS.EXPIRED;
          expired++;
          return true;
        }
        return true;
      });
      this.benefits.set(driverId, updated);
    }

    return expired;
  }
}
