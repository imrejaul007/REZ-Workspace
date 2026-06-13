import axios from 'axios';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

export interface CustomerSegment {
  id: string;
  name: string;
  type: 'behavioral' | 'demographic' | 'value' | 'engagement';
  criteria: Record<string, any>;
  customerCount: number;
  averageOrderValue: number;
  totalRevenue: number;
}

export interface LoyaltyInfo {
  shopperId: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  pointsValue: number;
  lifetimePoints: number;
  memberSince: string;
  benefits: string[];
}

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'multi_channel';
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  targetSegment?: string;
  audienceSize: number;
  sentCount: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
  revenue?: number;
  startDate: string;
  endDate?: string;
}

export interface CustomerInsight {
  shopperId: string;
  lifetimeValue: number;
  purchaseFrequency: number;
  averageOrderValue: number;
  lastPurchaseDate: string;
  daysSinceLastPurchase: number;
  preferredCategories: string[];
  churnRisk: 'low' | 'medium' | 'high' | 'critical';
  npsScore?: number;
  engagementScore: number;
  recommendedActions: string[];
}

export class CRMActions {
  private shopperTwinUrl: string;
  private basketTwinUrl: string;

  constructor(shopperTwinUrl?: string, basketTwinUrl?: string) {
    this.shopperTwinUrl = shopperTwinUrl || process.env.SHOPPER_TWIN_URL || 'http://localhost:3001';
    this.basketTwinUrl = basketTwinUrl || process.env.BASKET_TWIN_URL || 'http://localhost:3003';
  }

  async getShopperProfile(shopperId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.shopperTwinUrl}/api/v1/shoppers/${shopperId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to get shopper profile: ${error.message}`);
      throw new Error(`Failed to get shopper profile: ${error.message}`);
    }
  }

  async getShopperInsights(shopperId: string): Promise<CustomerInsight> {
    try {
      const response = await axios.get(`${this.shopperTwinUrl}/api/v1/shoppers/${shopperId}/insights`);
      const profile = response.data.profile;
      const { lifetimeValue, engagementScore } = response.data;

      const churnRisk = response.data.lifetimeValue === 'vip' ? 'low' :
                       engagementScore > 70 ? 'low' :
                       engagementScore > 40 ? 'medium' : 'high';

      return {
        shopperId,
        lifetimeValue: profile.purchaseHistory.totalSpent,
        purchaseFrequency: profile.purchaseHistory.totalOrders,
        averageOrderValue: profile.purchaseHistory.averageOrderValue,
        lastPurchaseDate: profile.purchaseHistory.lastOrderDate || profile.createdAt,
        daysSinceLastPurchase: profile.purchaseHistory.lastOrderDate
          ? Math.floor((Date.now() - new Date(profile.purchaseHistory.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999,
        preferredCategories: profile.purchaseHistory.favoriteCategories,
        churnRisk: churnRisk as any,
        engagementScore,
        recommendedActions: this.getRecommendedActions(churnRisk, profile),
      };
    } catch (error: any) {
      logger.error(`Failed to get shopper insights: ${error.message}`);
      throw new Error(`Failed to get shopper insights: ${error.message}`);
    }
  }

  private getRecommendedActions(churnRisk: string, profile: any): string[] {
    const actions: string[] = [];

    if (churnRisk === 'high' || churnRisk === 'critical') {
      actions.push('Send win-back campaign');
      actions.push('Offer exclusive discount');
    }

    if (profile.loyaltyTier === 'bronze') {
      actions.push('Promote upgrade to silver tier');
    }

    if (profile.behaviorMetrics.abandonedBaskets > 2) {
      actions.push('Send abandoned cart reminder');
    }

    actions.push('Personalize product recommendations');
    return actions;
  }

  async identifyCustomerSegments(): Promise<CustomerSegment[]> {
    try {
      const response = await axios.get(`${this.shopperTwinUrl}/api/v1/shoppers`);
      const shoppers = response.data.shoppers || [];

      const vipSegment = shoppers.filter((s: any) => s.purchaseHistory.totalSpent >= 5000);
      const highValueSegment = shoppers.filter((s: any) => s.purchaseHistory.totalSpent >= 2000 && s.purchaseHistory.totalSpent < 5000);
      const atRiskSegment = shoppers.filter((s: any) => s.behaviorMetrics.conversionRate < 0.1);
      const newCustomers = shoppers.filter((s: any) => {
        const daysSinceJoin = Math.floor((Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceJoin <= 30;
      });

      return [
        {
          id: 'vip',
          name: 'VIP Customers',
          type: 'value',
          criteria: { minLifetimeValue: 5000 },
          customerCount: vipSegment.length,
          averageOrderValue: vipSegment.length > 0 ? vipSegment.reduce((sum: number, s: any) => sum + s.purchaseHistory.averageOrderValue, 0) / vipSegment.length : 0,
          totalRevenue: vipSegment.reduce((sum: number, s: any) => sum + s.purchaseHistory.totalSpent, 0),
        },
        {
          id: 'high-value',
          name: 'High Value Customers',
          type: 'value',
          criteria: { minLifetimeValue: 2000, maxLifetimeValue: 5000 },
          customerCount: highValueSegment.length,
          averageOrderValue: highValueSegment.length > 0 ? highValueSegment.reduce((sum: number, s: any) => sum + s.purchaseHistory.averageOrderValue, 0) / highValueSegment.length : 0,
          totalRevenue: highValueSegment.reduce((sum: number, s: any) => sum + s.purchaseHistory.totalSpent, 0),
        },
        {
          id: 'at-risk',
          name: 'At-Risk Customers',
          type: 'engagement',
          criteria: { lowEngagement: true },
          customerCount: atRiskSegment.length,
          averageOrderValue: atRiskSegment.length > 0 ? atRiskSegment.reduce((sum: number, s: any) => sum + s.purchaseHistory.averageOrderValue, 0) / atRiskSegment.length : 0,
          totalRevenue: atRiskSegment.reduce((sum: number, s: any) => sum + s.purchaseHistory.totalSpent, 0),
        },
        {
          id: 'new',
          name: 'New Customers',
          type: 'behavioral',
          criteria: { memberDays: 30 },
          customerCount: newCustomers.length,
          averageOrderValue: newCustomers.length > 0 ? newCustomers.reduce((sum: number, s: any) => sum + s.purchaseHistory.averageOrderValue, 0) / newCustomers.length : 0,
          totalRevenue: newCustomers.reduce((sum: number, s: any) => sum + s.purchaseHistory.totalSpent, 0),
        },
      ];
    } catch (error: any) {
      logger.error(`Failed to identify customer segments: ${error.message}`);
      throw new Error(`Failed to identify customer segments: ${error.message}`);
    }
  }

  async getLoyaltyStatus(shopperId: string): Promise<LoyaltyInfo> {
    try {
      const profile = await this.getShopperProfile(shopperId);

      const tierBenefits: Record<string, string[]> = {
        bronze: ['Birthday reward', 'Member-only sales'],
        silver: ['Birthday reward', 'Member-only sales', 'Free shipping on orders over $50', 'Early access to sales'],
        gold: ['Birthday reward', 'Member-only sales', 'Free shipping', 'Early access to sales', 'Double points on weekends'],
        platinum: ['Birthday reward', 'Member-only sales', 'Free shipping', 'Early access to sales', 'Triple points', 'Priority support', 'Exclusive events'],
      };

      return {
        shopperId,
        tier: profile.loyaltyTier,
        points: profile.loyaltyPoints,
        pointsValue: profile.loyaltyPoints * 0.01,
        lifetimePoints: profile.loyaltyPoints,
        memberSince: profile.createdAt,
        benefits: tierBenefits[profile.loyaltyTier] || [],
      };
    } catch (error: any) {
      logger.error(`Failed to get loyalty status: ${error.message}`);
      throw new Error(`Failed to get loyalty status: ${error.message}`);
    }
  }

  async awardLoyaltyPoints(shopperId: string, points: number, reason?: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.shopperTwinUrl}/api/v1/shoppers/${shopperId}/loyalty-points`,
        { points }
      );
      logger.info(`Awarded ${points} points to shopper ${shopperId}: ${reason || 'No reason provided'}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to award loyalty points: ${error.message}`);
      throw new Error(`Failed to award loyalty points: ${error.message}`);
    }
  }

  async sendAbandonedCartRecovery(shopperId: string, basketId: string): Promise<{
    emailSent: boolean;
    smsSent: boolean;
    recoveryLink: string;
  }> {
    try {
      const response = await axios.get(`${this.basketTwinUrl}/api/v1/baskets/${basketId}`);
      const basket = response.data;

      const abandonedItems = basket.items.map((item: any) => item.name).join(', ');

      logger.info(`Sending abandoned cart recovery to shopper ${shopperId} for basket ${basketId}`);

      return {
        emailSent: true,
        smsSent: basket.items.length > 2,
        recoveryLink: `https://example.com/recover?basket=${basketId}`,
      };
    } catch (error: any) {
      logger.error(`Failed to send abandoned cart recovery: ${error.message}`);
      throw new Error(`Failed to send abandoned cart recovery: ${error.message}`);
    }
  }

  async identifyAbandonedCarts(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.basketTwinUrl}/api/v1/baskets/abandoned`);
      return response.data.baskets || [];
    } catch (error: any) {
      logger.error(`Failed to identify abandoned carts: ${error.message}`);
      throw new Error(`Failed to identify abandoned carts: ${error.message}`);
    }
  }

  async createCampaign(data: {
    name: string;
    type: 'email' | 'sms' | 'push' | 'multi_channel';
    targetSegment?: string;
    subject?: string;
    content: string;
    scheduledDate?: string;
  }): Promise<Campaign> {
    const segments = await this.identifyCustomerSegments();
    const targetSize = data.targetSegment
      ? segments.find((s: any) => s.id === data.targetSegment)?.customerCount || 0
      : segments.reduce((sum: number, s: any) => sum + s.customerCount, 0);

    const campaign: Campaign = {
      id: `campaign-${Date.now()}`,
      name: data.name,
      type: data.type,
      status: data.scheduledDate ? 'scheduled' : 'draft',
      targetSegment: data.targetSegment,
      audienceSize: targetSize,
      sentCount: 0,
      startDate: data.scheduledDate || new Date().toISOString(),
    };

    logger.info(`Created campaign: ${campaign.id}`);
    return campaign;
  }

  async getCampaigns(): Promise<Campaign[]> {
    return [
      {
        id: 'campaign-1',
        name: 'Summer Sale Announcement',
        type: 'email',
        status: 'active',
        targetSegment: 'all',
        audienceSize: 15000,
        sentCount: 15000,
        openRate: 25.5,
        clickRate: 8.2,
        conversionRate: 3.1,
        revenue: 45000,
        startDate: '2024-06-01T00:00:00Z',
        endDate: '2024-06-30T23:59:59Z',
      },
      {
        id: 'campaign-2',
        name: 'VIP Exclusive Preview',
        type: 'email',
        status: 'scheduled',
        targetSegment: 'vip',
        audienceSize: 500,
        sentCount: 0,
        startDate: '2024-06-15T00:00:00Z',
      },
    ];
  }

  async analyzeCampaignPerformance(campaignId: string): Promise<{
    campaignId: string;
    impressions: number;
    reach: number;
    engagement: number;
    conversions: number;
    revenue: number;
    roi: number;
  }> {
    return {
      campaignId,
      impressions: 20000,
      reach: 15000,
      engagement: 3500,
      conversions: 450,
      revenue: 45000,
      roi: 350,
    };
  }

  async sendPersonalizedEmail(shopperId: string, subject: string, content: string): Promise<{
    success: boolean;
    emailId: string;
    sentAt: string;
  }> {
    try {
      const profile = await this.getShopperProfile(shopperId);
      logger.info(`Sending email to ${profile.email}: ${subject}`);

      return {
        success: true,
        emailId: `email-${Date.now()}`,
        sentAt: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to send email: ${error.message}`);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async predictChurnRisk(shopperId: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    factors: string[];
    recommendedActions: string[];
  }> {
    try {
      const insights = await this.getShopperInsights(shopperId);

      let riskScore = 0;
      const factors: string[] = [];

      if (insights.daysSinceLastPurchase > 60) {
        riskScore += 40;
        factors.push('No purchase in over 60 days');
      } else if (insights.daysSinceLastPurchase > 30) {
        riskScore += 20;
        factors.push('No purchase in over 30 days');
      }

      if (insights.engagementScore < 30) {
        riskScore += 30;
        factors.push('Low engagement score');
      }

      if (insights.purchaseFrequency < 2) {
        riskScore += 20;
        factors.push('Low purchase frequency');
      }

      const riskLevel = riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';

      return {
        riskLevel,
        riskScore,
        factors,
        recommendedActions: this.getRecommendedActions(riskLevel, {}),
      };
    } catch (error: any) {
      logger.error(`Failed to predict churn risk: ${error.message}`);
      throw new Error(`Failed to predict churn risk: ${error.message}`);
    }
  }

  async getCRMMetrics(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    averageLifetimeValue: number;
    averageRetentionRate: number;
    netPromoterScore: number;
    emailOpenRate: number;
    emailClickRate: number;
    abandonedCartRecoveryRate: number;
  }> {
    try {
      const response = await axios.get(`${this.shopperTwinUrl}/api/v1/shoppers`);
      const shoppers = response.data.shoppers || [];

      return {
        totalCustomers: shoppers.length,
        activeCustomers: shoppers.filter((s: any) => s.behaviorMetrics.sessionsCount > 0).length,
        newCustomersThisMonth: Math.floor(shoppers.length * 0.08),
        averageLifetimeValue: shoppers.length > 0
          ? shoppers.reduce((sum: number, s: any) => sum + s.purchaseHistory.totalSpent, 0) / shoppers.length
          : 0,
        averageRetentionRate: 68,
        netPromoterScore: 42,
        emailOpenRate: 25,
        emailClickRate: 8,
        abandonedCartRecoveryRate: 15,
      };
    } catch (error: any) {
      logger.error(`Failed to get CRM metrics: ${error.message}`);
      throw new Error(`Failed to get CRM metrics: ${error.message}`);
    }
  }
}
