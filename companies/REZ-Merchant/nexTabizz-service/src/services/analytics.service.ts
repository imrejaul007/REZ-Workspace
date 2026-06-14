import { Business, IBusiness } from '../models/Business.js';
import { BusinessAnalytics, ApiResponse, IndustryType, ModuleType } from '../types/index.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export class AnalyticsService {
  /**
   * Get analytics for a business
   */
  async getBusinessAnalytics(businessId: string, period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<BusinessAnalytics>> {
    try {
      const business = await Business.findOne({ businessId });

      if (!business) {
        return {
          success: false,
          error: 'Business not found'
        };
      }

      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      let previousStartDate = new Date();

      switch (period) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          previousStartDate.setDate(previousStartDate.getDate() - 1);
          previousStartDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          previousStartDate.setDate(previousStartDate.getDate() - 14);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          previousStartDate.setMonth(previousStartDate.getMonth() - 2);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          previousStartDate.setFullYear(previousStartDate.getFullYear() - 2);
          break;
      }

      // Generate mock analytics data based on business stats
      // In production, this would come from actual transaction/order data
      const analytics = this.generateAnalyticsData(business, startDate, previousStartDate);

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      logger.error('Failed to get business analytics', { error, businessId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get analytics'
      };
    }
  }

  /**
   * Generate analytics data based on business stats
   * In production, this would fetch real data from orders, transactions, etc.
   */
  private generateAnalyticsData(
    business: IBusiness,
    currentStart: Date,
    previousStart: Date
  ): BusinessAnalytics {
    const stats = business.stats;
    const now = new Date();

    // Calculate growth percentages based on stats
    // In production, these would be calculated from actual historical data
    const revenueGrowth = this.calculateGrowth(stats.totalRevenue, 30);
    const orderGrowth = this.calculateGrowth(stats.totalOrders, 25);
    const customerGrowth = this.calculateGrowth(stats.totalCustomers, 15);

    // Generate daily sales data for the current period
    const salesByDay = this.generateDailySales(currentStart, now, stats.totalRevenue);

    // Calculate average order value
    const averageOrderValue = stats.totalOrders > 0
      ? stats.totalRevenue / stats.totalOrders
      : 0;

    // Generate top products (mock data based on industry)
    const topProducts = this.generateTopProducts(business.industry);

    // Generate revenue by module
    const revenueByModule = this.generateRevenueByModule(business.modules);

    return {
      totalRevenue: stats.totalRevenue,
      totalOrders: stats.totalOrders,
      totalCustomers: stats.totalCustomers,
      averageOrderValue,
      revenueGrowth,
      orderGrowth,
      customerGrowth,
      topProducts,
      salesByDay,
      revenueByModule
    };
  }

  /**
   * Calculate growth percentage
   */
  private calculateGrowth(current: number, basePercentage: number): number {
    // In production, compare with previous period
    // For now, return a reasonable growth estimate
    if (current === 0) return 0;
    const randomVariation = (Math.random() - 0.5) * 10; // -5% to +5%
    return Math.max(0, basePercentage + randomVariation);
  }

  /**
   * Generate daily sales data
   */
  private generateDailySales(startDate: Date, endDate: Date, totalRevenue: number): Array<{ date: string; revenue: number; orders: number }> {
    const salesByDay: Array<{ date: string; revenue: number; orders: number }> = [];
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const avgDailyRevenue = days > 0 ? totalRevenue / days : 0;

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Add some variation to make data look realistic
      const dayOfWeek = currentDate.getDay();
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1;
      const randomVariation = 0.7 + Math.random() * 0.6; // 70% to 130%

      const dayRevenue = avgDailyRevenue * weekendMultiplier * randomVariation;
      const dayOrders = Math.round(dayRevenue / (100 + Math.random() * 50)); // Assume average order of 100-150

      salesByDay.push({
        date: currentDate.toISOString().split('T')[0],
        revenue: Math.round(dayRevenue * 100) / 100,
        orders: dayOrders
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return salesByDay;
  }

  /**
   * Generate top products based on industry
   */
  private generateTopProducts(industry: IndustryType): Array<{ name: string; quantity: number; revenue: number }> {
    const productTemplates: Record<IndustryType, Array<{ name: string; basePrice: number }>> = {
      [IndustryType.RESTAURANT]: [
        { name: 'Butter Chicken', basePrice: 250 },
        { name: 'Biryani', basePrice: 200 },
        { name: 'Naan', basePrice: 40 },
        { name: 'Lassi', basePrice: 80 },
        { name: 'Dessert', basePrice: 150 }
      ],
      [IndustryType.HOTEL]: [
        { name: 'Deluxe Room', basePrice: 3500 },
        { name: 'Suite', basePrice: 5500 },
        { name: 'Standard Room', basePrice: 2500 },
        { name: 'Breakfast', basePrice: 450 },
        { name: 'Spa Treatment', basePrice: 2000 }
      ],
      [IndustryType.SALON]: [
        { name: 'Haircut', basePrice: 300 },
        { name: 'Hair Coloring', basePrice: 1500 },
        { name: 'Facial', basePrice: 800 },
        { name: 'Manicure', basePrice: 400 },
        { name: 'Pedicure', basePrice: 500 }
      ],
      [IndustryType.RETAIL]: [
        { name: 'Product A', basePrice: 500 },
        { name: 'Product B', basePrice: 750 },
        { name: 'Product C', basePrice: 300 },
        { name: 'Product D', basePrice: 1200 },
        { name: 'Product E', basePrice: 200 }
      ],
      [IndustryType.GYM]: [
        { name: 'Monthly Membership', basePrice: 1500 },
        { name: 'Personal Training', basePrice: 800 },
        { name: 'Group Class', basePrice: 200 },
        { name: 'Yoga Session', basePrice: 300 },
        { name: 'Supplement', basePrice: 500 }
      ],
      [IndustryType.SPA]: [
        { name: 'Full Body Massage', basePrice: 1500 },
        { name: 'Aromatherapy', basePrice: 1200 },
        { name: 'Facial Treatment', basePrice: 1000 },
        { name: 'Body Wrap', basePrice: 1800 },
        { name: 'Foot Massage', basePrice: 600 }
      ],
      [IndustryType.HEALTHCARE]: [
        { name: 'Consultation', basePrice: 500 },
        { name: 'Lab Test', basePrice: 800 },
        { name: 'X-Ray', basePrice: 1500 },
        { name: 'Procedure', basePrice: 5000 },
        { name: 'Medicine', basePrice: 300 }
      ],
      [IndustryType.EDUCATION]: [
        { name: 'Course Fee', basePrice: 10000 },
        { name: 'Material', basePrice: 2000 },
        { name: 'Exam Fee', basePrice: 500 },
        { name: 'Workshop', basePrice: 3000 },
        { name: 'Certification', basePrice: 5000 }
      ],
      [IndustryType.REAL_ESTATE]: [
        { name: 'Property Sale', basePrice: 5000000 },
        { name: 'Property Rent', basePrice: 25000 },
        { name: 'Consultation', basePrice: 5000 },
        { name: 'Documentation', basePrice: 10000 },
        { name: 'Valuation', basePrice: 8000 }
      ],
      [IndustryType.AUTOMOTIVE]: [
        { name: 'Service', basePrice: 3000 },
        { name: 'Parts', basePrice: 2000 },
        { name: 'Oil Change', basePrice: 800 },
        { name: 'Tire Change', basePrice: 2500 },
        { name: 'Accessory', basePrice: 1500 }
      ],
      [IndustryType.GROCERY]: [
        { name: 'Groceries', basePrice: 500 },
        { name: 'Fresh Produce', basePrice: 300 },
        { name: 'Dairy', basePrice: 200 },
        { name: 'Beverages', basePrice: 150 },
        { name: 'Snacks', basePrice: 100 }
      ],
      [IndustryType.PHARMACY]: [
        { name: 'Prescription', basePrice: 300 },
        { name: 'OTC Medicine', basePrice: 150 },
        { name: 'Health Supplement', basePrice: 500 },
        { name: 'First Aid', basePrice: 200 },
        { name: 'Personal Care', basePrice: 250 }
      ],
      [IndustryType.FASHION]: [
        { name: 'Shirt', basePrice: 800 },
        { name: 'Trousers', basePrice: 1200 },
        { name: 'Dress', basePrice: 2500 },
        { name: 'Accessory', basePrice: 400 },
        { name: 'Footwear', basePrice: 1500 }
      ],
      [IndustryType.FITNESS]: [
        { name: 'Yoga Mat', basePrice: 500 },
        { name: 'Dumbbells', basePrice: 1500 },
        { name: 'Resistance Band', basePrice: 300 },
        { name: 'Fitness Program', basePrice: 2000 },
        { name: 'Protein Powder', basePrice: 800 }
      ],
      [IndustryType.OTHER]: [
        { name: 'Service A', basePrice: 500 },
        { name: 'Service B', basePrice: 1000 },
        { name: 'Product A', basePrice: 750 },
        { name: 'Product B', basePrice: 1200 },
        { name: 'Consultation', basePrice: 800 }
      ]
    };

    const templates = productTemplates[industry] || productTemplates[IndustryType.OTHER];

    return templates.map((template) => {
      const quantity = Math.round(50 + Math.random() * 200);
      return {
        name: template.name,
        quantity,
        revenue: Math.round(quantity * template.basePrice * (0.8 + Math.random() * 0.4) * 100) / 100
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Generate revenue by module
   */
  private generateRevenueByModule(modules: ModuleType[]): Array<{ module: string; revenue: number }> {
    // Generate revenue distribution across enabled modules
    const totalRevenue = 100000; // Base revenue to distribute
    const moduleCount = modules.length || 1;
    const baseRevenue = totalRevenue / moduleCount;

    return modules.map((module) => ({
      module: module.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      revenue: Math.round(baseRevenue * (0.5 + Math.random()) * 100) / 100
    })).sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Get overall platform analytics (admin use)
   */
  async getPlatformAnalytics(): Promise<ApiResponse<{
    totalBusinesses: number;
    totalRevenue: number;
    businessesByIndustry: Array<{ industry: string; count: number; revenue: number }>;
    topBusinesses: Array<{ businessId: string; name: string; revenue: number }>;
    recentGrowth: number;
  }>> {
    try {
      const [aggregatedStats, industryStats, topBusinesses] = await Promise.all([
        Business.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              totalBusinesses: { $sum: 1 },
              totalRevenue: { $sum: '$stats.totalRevenue' }
            }
          }
        ]),
        Business.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: '$industry',
              count: { $sum: 1 },
              revenue: { $sum: '$stats.totalRevenue' }
            }
          },
          { $sort: { count: -1 } }
        ]),
        Business.find({ isActive: true })
          .sort({ 'stats.totalRevenue': -1 })
          .limit(10)
          .select('businessId name stats.totalRevenue')
          .lean()
      ]);

      const totalStats = aggregatedStats[0] || { totalBusinesses: 0, totalRevenue: 0 };

      return {
        success: true,
        data: {
          totalBusinesses: totalStats.totalBusinesses,
          totalRevenue: totalStats.totalRevenue,
          businessesByIndustry: industryStats.map((stat) => ({
            industry: stat._id,
            count: stat.count,
            revenue: stat.revenue
          })),
          topBusinesses: topBusinesses.map((b) => ({
            businessId: b.businessId,
            name: b.name,
            revenue: (b.stats as any).totalRevenue || 0
          })),
          recentGrowth: this.calculateGrowth(totalStats.totalRevenue, 20)
        }
      };
    } catch (error) {
      logger.error('Failed to get platform analytics', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get platform analytics'
      };
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
