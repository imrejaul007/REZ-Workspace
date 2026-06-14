import { Broker, IBroker, Team, ITeam, BrokerStatus } from '../models/Broker';
import { logger } from '../config/logger';

export interface CreateBrokerInput {
  userId: string;
  name: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  companyName?: string;
  license?: {
    number?: string;
    type?: string;
    state?: string;
    reraNumber?: string;
  };
  coverage?: {
    countries?: string[];
    cities?: string[];
    localities?: string[];
  };
  specializations?: string[];
  languages?: string[];
}

export interface UpdateBrokerInput {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  companyName?: string;
  coverage?: {
    countries?: string[];
    cities?: string[];
    localities?: string[];
  };
  specializations?: string[];
  languages?: string[];
}

export interface CommissionCalculation {
  dealValue: number;
  propertyType?: string;
  listingType?: string;
  commissionRate: number;
  commissionAmount: number;
  brokerShare: number;
  companyShare: number;
}

export class BrokerService {
  /**
   * Register new broker
   */
  async register(input: CreateBrokerInput): Promise<IBroker> {
    const broker = new Broker({
      ...input,
      status: BrokerStatus.PENDING_VERIFICATION,
      stats: {
        totalListings: 0,
        activeListings: 0,
        totalLeads: 0,
        convertedLeads: 0,
        conversionRate: 0,
        totalDeals: 0,
        totalVolume: 0,
        avgDealSize: 0,
        rating: 0,
        reviewCount: 0
      },
      walletBalance: {
        available: 0,
        pending: 0,
        currency: 'INR'
      },
      verification: {
        documentsSubmitted: false,
        documentsVerified: false
      }
    });

    await broker.save();
    logger.info('Broker registered', { brokerId: broker._id, userId: broker.userId });

    return broker;
  }

  /**
   * Get broker by ID
   */
  async getById(id: string): Promise<IBroker | null> {
    return Broker.findOne({ _id: id, deletedAt: null });
  }

  /**
   * Get broker by user ID
   */
  async getByUserId(userId: string): Promise<IBroker | null> {
    return Broker.findOne({ userId, deletedAt: null });
  }

  /**
   * Update broker
   */
  async update(id: string, updates: UpdateBrokerInput): Promise<IBroker | null> {
    const broker = await Broker.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updates },
      { new: true }
    );
    if (broker) {
      logger.info('Broker updated', { brokerId: id });
    }
    return broker;
  }

  /**
   * Verify broker
   */
  async verify(id: string, verifiedBy: string): Promise<IBroker | null> {
    const broker = await Broker.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $set: {
          status: BrokerStatus.ACTIVE,
          'verification.documentsVerified': true,
          'verification.verifiedAt': new Date(),
          'verification.verifiedBy': verifiedBy
        }
      },
      { new: true }
    );
    if (broker) {
      logger.info('Broker verified', { brokerId: id, verifiedBy });
    }
    return broker;
  }

  /**
   * Suspend broker
   */
  async suspend(id: string, reason?: string): Promise<IBroker | null> {
    const broker = await Broker.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: BrokerStatus.SUSPENDED } },
      { new: true }
    );
    if (broker) {
      logger.info('Broker suspended', { brokerId: id, reason });
    }
    return broker;
  }

  /**
   * Search brokers
   */
  async search(options: {
    page?: number;
    limit?: number;
    country?: string;
    city?: string;
    specialization?: string;
    status?: BrokerStatus;
    minRating?: number;
  }): Promise<{ brokers: IBroker[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      country,
      city,
      specialization,
      status = BrokerStatus.ACTIVE,
      minRating
    } = options;

    const query: Record<string, any> = { deletedAt: null };

    if (status) query.status = status;
    if (country) query['coverage.countries'] = country;
    if (city) query['coverage.cities'] = city;
    if (specialization) query.specializations = specialization;
    if (minRating) query['stats.rating'] = { $gte: minRating };

    const skip = (page - 1) * limit;
    const [brokers, total] = await Promise.all([
      Broker.find(query).sort({ 'stats.rating': -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Broker.countDocuments(query)
    ]);

    return { brokers: brokers as IBroker[], total };
  }

  /**
   * Get broker stats
   */
  async getStats(id: string): Promise<IBroker['stats'] | null> {
    const broker = await Broker.findById(id).select('stats');
    return broker?.stats || null;
  }

  /**
   * Update broker stats
   */
  async updateStats(id: string, updates: Partial<IBroker['stats']>): Promise<IBroker | null> {
    const broker = await Broker.findByIdAndUpdate(
      id,
      { $set: { stats: updates } },
      { new: true }
    );
    return broker;
  }

  /**
   * Calculate commission
   */
  calculateCommission(
    broker: IBroker,
    dealValue: number,
    propertyType?: string,
    listingType?: string
  ): CommissionCalculation {
    // Find custom rate or use default
    let commissionRate = broker.commission?.defaultRate || 2; // Default 2%

    if (broker.commission?.customRates) {
      const customRate = broker.commission.customRates.find(
        r => r.propertyType === propertyType && r.listingType === listingType
      );
      if (customRate) commissionRate = customRate.rate;
    }

    const commissionAmount = (dealValue * commissionRate) / 100;
    const companyShare = (commissionAmount * (broker.commission?.splitWithCompany || 30)) / 100;
    const brokerShare = commissionAmount - companyShare;

    return {
      dealValue,
      propertyType,
      listingType,
      commissionRate,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      brokerShare: Math.round(brokerShare * 100) / 100,
      companyShare: Math.round(companyShare * 100) / 100
    };
  }

  /**
   * Add commission to broker wallet
   */
  async addCommission(id: string, amount: number): Promise<IBroker | null> {
    const broker = await Broker.findByIdAndUpdate(
      id,
      {
        $inc: {
          'walletBalance.available': amount,
          'stats.totalDeals': 1,
          'stats.totalVolume': amount
        },
        $set: {
          'stats.avgDealSize': (await this.getStats(id))?.avgDealSize || 0 // Update separately
        }
      },
      { new: true }
    );
    if (broker) {
      logger.info('Commission added to broker wallet', { brokerId: id, amount });
    }
    return broker;
  }

  /**
   * Create team
   */
  async createTeam(name: string, managerId: string): Promise<ITeam> {
    const team = new Team({
      name,
      managerId,
      memberCount: 0,
      stats: {
        totalLeads: 0,
        convertedLeads: 0,
        conversionRate: 0,
        totalVolume: 0
      },
      commissionPool: {
        total: 0,
        distributed: 0
      },
      active: true
    });
    await team.save();
    logger.info('Team created', { teamId: team._id, name });
    return team;
  }

  /**
   * Get team
   */
  async getTeam(teamId: string): Promise<ITeam | null> {
    return Team.findOne({ _id: teamId, deletedAt: null });
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<IBroker[]> {
    return Broker.find({ teamId, deletedAt: null });
  }

  /**
   * Add agent to team
   */
  async addToTeam(brokerId: string, teamId: string): Promise<IBroker | null> {
    const [broker, team] = await Promise.all([
      Broker.findById(brokerId),
      Team.findById(teamId)
    ]);

    if (!broker || !team) return null;

    broker.teamId = teamId;
    await broker.save();

    team.memberCount += 1;
    await team.save();

    logger.info('Broker added to team', { brokerId, teamId });
    return broker;
  }

  /**
   * Get dashboard stats
   */
  async getDashboard(brokerId?: string): Promise<{
    totalBrokers: number;
    activeBrokers: number;
    pendingVerification: number;
    topPerformers: IBroker[];
    avgRating: number;
  }> {
    const stats = await Broker.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending_verification'] }, 1, 0] } },
          avgRating: { $avg: '$stats.rating' }
        }
      }
    ]);

    const topPerformers = await Broker.find({ status: BrokerStatus.ACTIVE, deletedAt: null })
      .sort({ 'stats.totalVolume': -1 })
      .limit(5)
      .lean();

    return {
      totalBrokers: stats[0]?.total || 0,
      activeBrokers: stats[0]?.active || 0,
      pendingVerification: stats[0]?.pending || 0,
      topPerformers: topPerformers as IBroker[],
      avgRating: Math.round((stats[0]?.avgRating || 0) * 10) / 10
    };
  }
}

export const brokerService = new BrokerService();
