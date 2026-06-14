/**
 * Revenue Service
 */

export class RevenueService {
  /**
   * Get revenue data
   */
  async getRevenueData(
    hotelId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const dailyRevenue = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const baseRevenue = 30000 + Math.random() * 40000;
      dailyRevenue.push({
        date: currentDate.toISOString().split('T')[0],
        revenue: Math.round(baseRevenue),
        breakdown: {
          rooms: Math.round(baseRevenue * 0.65),
          fAndB: Math.round(baseRevenue * 0.2),
          spa: Math.round(baseRevenue * 0.1),
          other: Math.round(baseRevenue * 0.05),
        },
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const totalRevenue = dailyRevenue.reduce((sum, d) => sum + d.revenue, 0);
    const roomsRevenue = dailyRevenue.reduce((sum, d) => sum + d.breakdown.rooms, 0);
    const fAndBRevenue = dailyRevenue.reduce((sum, d) => sum + d.breakdown.fAndB, 0);
    const spaRevenue = dailyRevenue.reduce((sum, d) => sum + d.breakdown.spa, 0);

    return {
      hotelId,
      period: { start: start.toISOString(), end: end.toISOString() },
      dailyRevenue,
      totals: {
        totalRevenue: Math.round(totalRevenue),
        roomsRevenue: Math.round(roomsRevenue),
        fAndBRevenue: Math.round(fAndBRevenue),
        spaRevenue: Math.round(spaRevenue),
        revenueMix: {
          rooms: Math.round((roomsRevenue / totalRevenue) * 100),
          fAndB: Math.round((fAndBRevenue / totalRevenue) * 100),
          spa: Math.round((spaRevenue / totalRevenue) * 100),
          other: Math.round(((totalRevenue - roomsRevenue - fAndBRevenue - spaRevenue) / totalRevenue) * 100),
        },
      },
    };
  }

  /**
   * Get revenue trend
   */
  async getRevenueTrend(hotelId: string, days: number = 30): Promise<any[]> {
    const trend = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      trend.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.round(30000 + Math.random() * 40000),
        adr: Math.round(3000 + Math.random() * 1500),
        revpar: Math.round(2000 + Math.random() * 1000),
      });
    }

    return trend;
  }

  /**
   * Get revenue breakdown
   */
  async getRevenueBreakdown(
    hotelId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const revenueData = await this.getRevenueData(hotelId, startDate, endDate);

    return {
      byCategory: [
        { category: 'Rooms', amount: revenueData.totals.roomsRevenue, percentage: revenueData.totals.revenueMix.rooms },
        { category: 'Food & Beverage', amount: revenueData.totals.fAndBRevenue, percentage: revenueData.totals.revenueMix.fAndB },
        { category: 'Spa & Wellness', amount: revenueData.totals.spaRevenue, percentage: revenueData.totals.revenueMix.spa },
        { category: 'Other', amount: revenueData.totals.totalRevenue - revenueData.totals.roomsRevenue - revenueData.totals.fAndBRevenue - revenueData.totals.spaRevenue, percentage: revenueData.totals.revenueMix.other },
      ],
      bySource: [
        { source: 'Direct', amount: Math.round(revenueData.totals.totalRevenue * 0.35), percentage: 35 },
        { source: 'OTA', amount: Math.round(revenueData.totals.totalRevenue * 0.45), percentage: 45 },
        { source: 'Corporate', amount: Math.round(revenueData.totals.totalRevenue * 0.15), percentage: 15 },
        { source: 'Walk-in', amount: Math.round(revenueData.totals.totalRevenue * 0.05), percentage: 5 },
      ],
    };
  }
}

export const revenueService = new RevenueService();
