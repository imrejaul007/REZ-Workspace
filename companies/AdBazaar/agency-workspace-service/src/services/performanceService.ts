import { Agency, Client, TeamMember, CampaignTemplate } from '../models';
import { logger } from '../utils/logger';

export interface PerformanceMetrics {
  agencyId: string;
  period: { start: Date; end: Date };
  summary: {
    totalClients: number;
    activeClients: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
    totalSpend: number;
    spendUtilization: number;
    revenue: number;
    roi: number;
  };
  clientBreakdown: Array<{
    clientId: string;
    name: string;
    budget: number;
    spend: number;
    utilization: number;
    campaigns: number;
  }>;
  teamPerformance: Array<{
    memberId: string;
    name: string;
    role: string;
    clientsManaged: number;
    activeCampaigns: number;
  }>;
  templateUsage: Array<{
    templateId: string;
    name: string;
    usageCount: number;
  }>;
}

export interface RevenueAnalytics {
  agencyId: string;
  period: { start: Date; end: Date };
  totalRevenue: number;
  revenueByClient: Array<{
    clientId: string;
    name: string;
    revenue: number;
    percentage: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    growth: number;
  }>;
  projectedRevenue: number;
  revenueGrowth: number;
}

export class PerformanceService {
  /**
   * Get agency performance metrics
   */
  async getAgencyPerformance(
    agencyId: string,
    options: { startDate?: Date; endDate?: Date } = {}
  ): Promise<PerformanceMetrics | null> {
    try {
      const agency = await Agency.findById(agencyId);
      if (!agency) {
        return null;
      }

      const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = options.endDate || new Date();

      // Get clients with campaigns
      const clients = await Client.find({ agencyId }).lean();

      let totalBudget = 0;
      let totalSpend = 0;
      let activeCampaigns = 0;
      let totalCampaigns = 0;

      const clientBreakdown = clients.map(client => {
        const budget = client.budget.total;
        const spend = client.totalSpend;
        totalBudget += budget;
        totalSpend += spend;

        const active = client.campaigns.filter(c => c.status === 'active').length;
        const total = client.campaigns.length;
        activeCampaigns += active;
        totalCampaigns += total;

        return {
          clientId: client._id.toString(),
          name: client.name,
          budget,
          spend,
          utilization: budget > 0 ? (spend / budget) * 100 : 0,
          campaigns: total
        };
      });

      // Get team performance
      const teamMembers = await TeamMember.find({ agencyId }).lean();

      const teamPerformance = await Promise.all(
        teamMembers.map(async member => {
          const memberClients = clients.filter(c => c.contactPerson?.email === member.email);
          const memberCampaigns = clients.reduce((acc, client) => {
            return acc + client.campaigns.filter(c => c.status === 'active').length;
          }, 0);

          return {
            memberId: member._id.toString(),
            name: member.name,
            role: member.role,
            clientsManaged: memberClients.length,
            activeCampaigns: memberCampaigns
          };
        })
      );

      // Get template usage
      const templates = await CampaignTemplate.find({ agencyId })
        .sort({ usageCount: -1 })
        .limit(10)
        .lean();

      const templateUsage = templates.map(t => ({
        templateId: t._id.toString(),
        name: t.name,
        usageCount: t.usageCount
      }));

      const spendUtilization = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;
      const revenue = agency.stats.totalRevenue;
      const roi = totalSpend > 0 ? ((revenue - totalSpend) / totalSpend) * 100 : 0;

      return {
        agencyId,
        period: { start: startDate, end: endDate },
        summary: {
          totalClients: agency.stats.totalClients,
          activeClients: agency.stats.activeClients,
          totalCampaigns,
          activeCampaigns,
          totalBudget,
          totalSpend,
          spendUtilization,
          revenue,
          roi
        },
        clientBreakdown,
        teamPerformance,
        templateUsage
      };
    } catch (error) {
      logger.error('Failed to get agency performance', { agencyId, error });
      throw error;
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(
    agencyId: string,
    options: { startDate?: Date; endDate?: Date; groupBy?: 'day' | 'week' | 'month' } = {}
  ): Promise<RevenueAnalytics | null> {
    try {
      const agency = await Agency.findById(agencyId);
      if (!agency) {
        return null;
      }

      const startDate = options.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const endDate = options.endDate || new Date();

      // Get clients
      const clients = await Client.find({ agencyId }).lean();

      // Calculate revenue by client
      const totalRevenue = agency.stats.totalRevenue || 0;
      const revenueByClient = clients.map(client => ({
        clientId: client._id.toString(),
        name: client.name,
        revenue: client.totalSpend * 0.15, // Assuming 15% agency fee
        percentage: totalRevenue > 0 ? (client.totalSpend / totalRevenue) * 100 : 0
      })).sort((a, b) => b.revenue - a.revenue);

      // Generate monthly revenue data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();

      const revenueByMonth = months.slice(0, currentMonth + 1).map((month, idx) => {
        // Simulate revenue data - in production, this would come from actual data
        const baseRevenue = totalRevenue / (currentMonth + 1);
        const variance = Math.random() * 0.2 - 0.1; // -10% to +10%
        const revenue = baseRevenue * (1 + variance);

        return {
          month,
          revenue: Math.round(revenue * 100) / 100,
          growth: idx > 0 ? Math.round((Math.random() * 40 - 10) * 100) / 100 : 0
        };
      });

      // Calculate growth
      const revenueGrowth = revenueByMonth.length > 1
        ? ((revenueByMonth[revenueByMonth.length - 1].revenue - revenueByMonth[0].revenue) / revenueByMonth[0].revenue) * 100
        : 0;

      // Project next month revenue (simple average)
      const avgRevenue = revenueByMonth.reduce((sum, m) => sum + m.revenue, 0) / revenueByMonth.length;
      const projectedRevenue = avgRevenue * (1 + (revenueGrowth / 100));

      return {
        agencyId,
        period: { start: startDate, end: endDate },
        totalRevenue,
        revenueByClient,
        revenueByMonth,
        projectedRevenue,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100
      };
    } catch (error) {
      logger.error('Failed to get revenue analytics', { agencyId, error });
      throw error;
    }
  }

  /**
   * Get agency dashboard data
   */
  async getDashboard(agencyId: string): Promise<any> {
    try {
      const agency = await Agency.findById(agencyId);
      if (!agency) {
        return null;
      }

      const [clients, teamMembers, templates] = await Promise.all([
        Client.find({ agencyId }).lean(),
        TeamMember.find({ agencyId }).lean(),
        CampaignTemplate.find({ agencyId }).lean()
      ]);

      // Calculate summary metrics
      const activeClients = clients.filter(c => c.status === 'active').length;
      const totalCampaigns = clients.reduce((sum, c) => sum + c.campaigns.length, 0);
      const activeCampaigns = clients.reduce(
        (sum, c) => sum + c.campaigns.filter(camp => camp.status === 'active').length,
        0
      );
      const totalSpend = clients.reduce((sum, c) => sum + c.totalSpend, 0);
      const totalBudget = clients.reduce((sum, c) => sum + c.budget.total, 0);

      // Top clients by spend
      const topClients = clients
        .sort((a, b) => b.totalSpend - a.totalSpend)
        .slice(0, 5)
        .map(c => ({
          id: c._id,
          name: c.name,
          company: c.company,
          spend: c.totalSpend,
          campaigns: c.campaigns.length
        }));

      // Recent activity (last 10 campaigns)
      const recentCampaigns = clients
        .flatMap(c => c.campaigns.map(camp => ({ ...camp, clientName: c.name })))
        .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
        .slice(0, 10);

      // Template stats
      const popularTemplates = templates
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)
        .map(t => ({
          id: t._id,
          name: t.name,
          type: t.type,
          usageCount: t.usageCount
        }));

      return {
        agency: {
          id: agency._id,
          name: agency.name,
          tier: agency.tier,
          status: agency.status
        },
        summary: {
          clients: { total: clients.length, active: activeClients },
          campaigns: { total: totalCampaigns, active: activeCampaigns },
          budget: { total: totalBudget, spent: totalSpend, utilization: totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0 },
          revenue: agency.stats.totalRevenue,
          teamSize: teamMembers.length
        },
        topClients,
        recentCampaigns,
        popularTemplates,
        performance: {
          roi: totalSpend > 0 ? ((agency.stats.totalRevenue - totalSpend) / totalSpend) * 100 : 0,
          avgCampaignPerformance: 75.5, // Placeholder
          clientSatisfaction: 4.2 // Placeholder
        }
      };
    } catch (error) {
      logger.error('Failed to get dashboard', { agencyId, error });
      throw error;
    }
  }

  /**
   * Get client campaigns for agency
   */
  async getAgencyCampaigns(agencyId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<{ campaigns: any[]; total: number }> {
    try {
      const { page = 1, limit = 20, status } = options;

      const clients = await Client.find({ agencyId }).lean();

      let allCampaigns = clients.flatMap(client =>
        client.campaigns.map(campaign => ({
          ...campaign,
          clientId: client._id,
          clientName: client.name,
          clientCompany: client.company
        }))
      );

      if (status) {
        allCampaigns = allCampaigns.filter(c => c.status === status);
      }

      // Sort by start date
      allCampaigns.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

      const total = allCampaigns.length;
      const campaigns = allCampaigns.slice((page - 1) * limit, page * limit);

      return { campaigns, total };
    } catch (error) {
      logger.error('Failed to get agency campaigns', { agencyId, error });
      throw error;
    }
  }
}

export const performanceService = new PerformanceService();