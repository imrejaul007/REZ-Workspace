import {
  Organization,
  IOrganization,
  PlanType,
  BillingCycle,
  IBillingInfo,
  IOrganizationSettings
} from '../models/organization.model';
import { Seat, SeatStatus } from '../models/seat.model';
import mongoose from 'mongoose';
import { logger } from 'utils/logger.js';

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: string;
  ownerId: string;
  plan?: PlanType;
  settings?: Partial<IOrganizationSettings>;
  metadata?: Record<string, unknown>;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: string;
  settings?: Partial<IOrganizationSettings>;
  metadata?: Record<string, unknown>;
}

export interface UpdateBillingInput {
  plan?: PlanType;
  billingCycle?: BillingCycle;
  seatsPurchased?: number;
  pricePerSeat?: number;
  autoRenew?: boolean;
  paymentMethod?: string;
}

export interface OrganizationSeatOverview {
  totalSeats: number;
  activeSeats: number;
  inactiveSeats: number;
  pendingSeats: number;
  suspendedSeats: number;
  plan: PlanType;
  seatsPurchased: number;
  seatsAvailable: number;
  utilizationPercentage: number;
}

export interface OrganizationBillingInfo {
  plan: PlanType;
  billingCycle: BillingCycle;
  seatsPurchased: number;
  seatsUsed: number;
  seatsAvailable: number;
  pricePerSeat: number;
  totalAmount: number;
  currency: string;
  nextBillingDate: Date | null;
  autoRenew: boolean;
  lastPaymentDate: Date | null;
  lastPaymentAmount: number | null;
  paymentMethod: string | null;
}

// Plan limits configuration
const PLAN_LIMITS: Record<PlanType, { seats: number; pricePerSeat: number }> = {
  [PlanType.FREE]: { seats: 1, pricePerSeat: 0 },
  [PlanType.STARTER]: { seats: 5, pricePerSeat: 29 },
  [PlanType.PROFESSIONAL]: { seats: 25, pricePerSeat: 49 },
  [PlanType.ENTERPRISE]: { seats: 100, pricePerSeat: 79 },
  [PlanType.CUSTOM]: { seats: -1, pricePerSeat: 0 } // Custom has no limit
};

class OrganizationService {
  /**
   * Create a new organization
   */
  async createOrganization(input: CreateOrganizationInput): Promise<IOrganization> {
    try {
      // Check if slug is unique
      const existingOrg = await Organization.findOne({ slug: input.slug });
      if (existingOrg) {
        throw new Error('Organization slug already exists');
      }

      const plan = input.plan || PlanType.FREE;
      const planLimits = PLAN_LIMITS[plan];

      const organization = new Organization({
        ...input,
        billing: {
          plan,
          billingCycle: BillingCycle.MONTHLY,
          seatsPurchased: planLimits.seats,
          seatsUsed: 0,
          seatsAvailable: planLimits.seats,
          pricePerSeat: planLimits.pricePerSeat,
          totalAmount: planLimits.pricePerSeat * planLimits.seats,
          currency: 'USD',
          nextBillingDate: this.getNextBillingDate(BillingCycle.MONTHLY),
          autoRenew: true
        },
        settings: {
          allowGuestSeats: false,
          requireApprovalForSeats: true,
          defaultSeatRole: 'member',
          seatExpirationDays: 30,
          enforceMfa: false,
          ssoEnabled: false,
          ...input.settings
        },
        totalSeats: 0,
        activeSeats: 0
      });

      await organization.save();

      logger.info(`Organization created: ${organization._id} with slug ${organization.slug}`);

      return organization;
    } catch (error) {
      logger.error('Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(organizationId: string): Promise<IOrganization | null> {
    try {
      return await Organization.findById(organizationId).populate('seats');
    } catch (error) {
      logger.error(`Error getting organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Get organization by slug
   */
  async getOrganizationBySlug(slug: string): Promise<IOrganization | null> {
    try {
      return await Organization.findOne({ slug }).populate('seats');
    } catch (error) {
      logger.error(`Error getting organization with slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(organizationId: string, input: UpdateOrganizationInput): Promise<IOrganization | null> {
    try {
      const organization = await Organization.findByIdAndUpdate(
        organizationId,
        { $set: input },
        { new: true, runValidators: true }
      );

      if (organization) {
        logger.info(`Organization updated: ${organizationId}`);
      }

      return organization;
    } catch (error) {
      logger.error(`Error updating organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Delete organization
   */
  async deleteOrganization(organizationId: string): Promise<boolean> {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Check if there are active seats
      if (organization.activeSeats > 0) {
        throw new Error('Cannot delete organization with active seats');
      }

      // Delete all seats
      await Seat.deleteMany({ organizationId });

      // Delete organization
      await Organization.findByIdAndDelete(organizationId);

      logger.info(`Organization deleted: ${organizationId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Get seat overview for an organization
   */
  async getSeatOverview(organizationId: string): Promise<OrganizationSeatOverview> {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Get seat counts by status
      const seatCounts = await Seat.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const counts: Record<string, number> = {
        [SeatStatus.ACTIVE]: 0,
        [SeatStatus.INACTIVE]: 0,
        [SeatStatus.PENDING]: 0,
        [SeatStatus.SUSPENDED]: 0,
        [SeatStatus.EXPIRED]: 0
      };

      seatCounts.forEach(item => {
        counts[item._id] = item.count;
      });

      const totalSeats = Object.values(counts).reduce((a, b) => a + b, 0);
      const utilizationPercentage = organization.billing.seatsPurchased > 0
        ? (organization.billing.seatsUsed / organization.billing.seatsPurchased) * 100
        : 0;

      return {
        totalSeats,
        activeSeats: counts[SeatStatus.ACTIVE],
        inactiveSeats: counts[SeatStatus.INACTIVE],
        pendingSeats: counts[SeatStatus.PENDING],
        suspendedSeats: counts[SeatStatus.SUSPENDED],
        plan: organization.billing.plan,
        seatsPurchased: organization.billing.seatsPurchased,
        seatsAvailable: organization.billing.seatsAvailable,
        utilizationPercentage
      };
    } catch (error) {
      logger.error(`Error getting seat overview for org ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Get billing info for an organization
   */
  async getBillingInfo(organizationId: string): Promise<OrganizationBillingInfo> {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      return {
        plan: organization.billing.plan,
        billingCycle: organization.billing.billingCycle,
        seatsPurchased: organization.billing.seatsPurchased,
        seatsUsed: organization.billing.seatsUsed,
        seatsAvailable: organization.billing.seatsAvailable,
        pricePerSeat: organization.billing.pricePerSeat,
        totalAmount: organization.billing.totalAmount,
        currency: organization.billing.currency,
        nextBillingDate: organization.billing.nextBillingDate,
        autoRenew: organization.billing.autoRenew,
        lastPaymentDate: organization.billing.lastPaymentDate || null,
        lastPaymentAmount: organization.billing.lastPaymentAmount || null,
        paymentMethod: organization.billing.paymentMethod || null
      };
    } catch (error) {
      logger.error(`Error getting billing info for org ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Update billing information
   */
  async updateBilling(organizationId: string, input: UpdateBillingInput): Promise<IOrganization | null> {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // If plan is changing, update seat limits
      if (input.plan && input.plan !== organization.billing.plan) {
        const newPlanLimits = PLAN_LIMITS[input.plan];
        const currentSeats = organization.billing.seatsUsed;

        if (newPlanLimits.seats !== -1 && currentSeats > newPlanLimits.seats) {
          throw new Error(`Cannot downgrade to ${input.plan}: organization has ${currentSeats} seats but plan only allows ${newPlanLimits.seats}`);
        }

        input.seatsPurchased = input.seatsPurchased ?? newPlanLimits.seats;
        input.pricePerSeat = input.pricePerSeat ?? newPlanLimits.pricePerSeat;
      }

      // Calculate new total
      const seatsPurchased = input.seatsPurchased ?? organization.billing.seatsPurchased;
      const pricePerSeat = input.pricePerSeat ?? organization.billing.pricePerSeat;
      const totalAmount = seatsPurchased * pricePerSeat;

      const billingUpdate: Partial<IBillingInfo> = {
        ...input,
        totalAmount,
        seatsAvailable: seatsPurchased - organization.billing.seatsUsed
      };

      const updatedOrg = await Organization.findByIdAndUpdate(
        organizationId,
        {
          $set: {
            'billing': { ...organization.billing.toObject(), ...billingUpdate }
          }
        },
        { new: true }
      );

      if (updatedOrg) {
        logger.info(`Billing updated for organization ${organizationId}`);
      }

      return updatedOrg;
    } catch (error) {
      logger.error(`Error updating billing for org ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Add seats to organization (purchase more seats)
   */
  async addSeats(organizationId: string, additionalSeats: number): Promise<IOrganization | null> {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      if (organization.billing.plan === PlanType.CUSTOM) {
        throw new Error('Custom plan has unlimited seats');
      }

      const newSeatsPurchased = organization.billing.seatsPurchased + additionalSeats;
      const totalAmount = newSeatsPurchased * organization.billing.pricePerSeat;

      const updatedOrg = await Organization.findByIdAndUpdate(
        organizationId,
        {
          $set: {
            'billing.seatsPurchased': newSeatsPurchased,
            'billing.seatsAvailable': newSeatsPurchased - organization.billing.seatsUsed,
            'billing.totalAmount': totalAmount
          }
        },
        { new: true }
      );

      if (updatedOrg) {
        logger.info(`Added ${additionalSeats} seats to organization ${organizationId}`);
      }

      return updatedOrg;
    } catch (error) {
      logger.error(`Error adding seats to org ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Sync seat counts with actual data
   */
  async syncSeatCounts(organizationId: string): Promise<void> {
    try {
      const seatCounts = await Seat.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      let totalSeats = 0;
      let activeSeats = 0;

      seatCounts.forEach(item => {
        totalSeats += item.count;
        if (item._id === SeatStatus.ACTIVE) {
          activeSeats = item.count;
        }
      });

      await Organization.findByIdAndUpdate(organizationId, {
        $set: {
          totalSeats,
          activeSeats,
          'billing.seatsUsed': totalSeats,
          'billing.seatsAvailable': undefined // Will be calculated in pre-save
        }
      });

      logger.info(`Seat counts synced for organization ${organizationId}`);
    } catch (error) {
      logger.error(`Error syncing seat counts for org ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Get next billing date based on cycle
   */
  private getNextBillingDate(cycle: BillingCycle): Date {
    const now = new Date();
    switch (cycle) {
      case BillingCycle.MONTHLY:
        return new Date(now.getFullYear(), now.getMonth() + 1,1);
      case BillingCycle.QUARTERLY:
        return new Date(now.getFullYear(), now.getMonth() + 3, 1);
      case BillingCycle.ANNUAL:
        return new Date(now.getFullYear() + 1, now.getMonth(), 1);
    }
  }

  /**
   * Get all organizations (for admin)
   */
  async listOrganizations(
    page: number = 1,
    limit: number = 20,
    plan?: PlanType
  ): Promise<{ organizations: IOrganization[]; total: number }> {
    try {
      const query: Record<string, unknown> = {};
      if (plan) {
        query['billing.plan'] = plan;
      }

      const skip = (page - 1) * limit;

      const [organizations, total] = await Promise.all([
        Organization.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Organization.countDocuments(query)
      ]);

      return { organizations, total };
    } catch (error) {
      logger.error('Error listing organizations:', error);
      throw error;
    }
  }
}

export const organizationService = new OrganizationService();