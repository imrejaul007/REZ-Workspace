/**
 * Property Service
 */

import { v4 as uuidv4 } from 'uuid';
import { PropertyModel } from '../models/Property';

export class PropertyService {
  /**
   * Get all properties
   */
  async getAllProperties(chain?: string): Promise<any[]> {
    const filter: any = { isActive: true };
    if (chain) filter.chain = chain;

    return PropertyModel.find(filter).sort({ name: 1 }).lean();
  }

  /**
   * Get property by ID
   */
  async getPropertyById(propertyId: string): Promise<any | null> {
    return PropertyModel.findOne({ propertyId, isActive: true }).lean();
  }

  /**
   * Create property
   */
  async createProperty(data: {
    name: string;
    location: string;
    chain: string;
    totalRooms: number;
    starRating: number;
  }): Promise<any> {
    const property = new PropertyModel({
      propertyId: `PROP-${uuidv4().slice(0, 8).toUpperCase()}`,
      ...data,
      openedDate: new Date(),
      isActive: true,
    });

    await property.save();
    return property.toObject();
  }

  /**
   * Update property
   */
  async updateProperty(
    propertyId: string,
    updates: Partial<{
      name: string;
      location: string;
      chain: string;
      totalRooms: number;
      starRating: number;
    }>
  ): Promise<any | null> {
    const property = await PropertyModel.findOneAndUpdate(
      { propertyId, isActive: true },
      { $set: updates },
      { new: true }
    ).lean();

    return property;
  }

  /**
   * Get property metrics
   */
  async getPropertyMetrics(
    propertyId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const metrics = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      metrics.push({
        date: currentDate.toISOString().split('T')[0],
        occupancyRate: Math.round((65 + Math.random() * 25) * 10) / 10,
        adr: Math.round(4500 + Math.random() * 2000),
        revpar: Math.round(3000 + Math.random() * 1500),
        totalRevenue: Math.round(35000 + Math.random() * 50000),
        checkIns: Math.floor(15 + Math.random() * 25),
        checkOuts: Math.floor(15 + Math.random() * 25),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      propertyId,
      period: { start: start.toISOString(), end: end.toISOString() },
      metrics,
      summary: {
        avgOccupancy: Math.round(metrics.reduce((s, m) => s + m.occupancyRate, 0) / metrics.length * 10) / 10,
        avgADR: Math.round(metrics.reduce((s, m) => s + m.adr, 0) / metrics.length),
        totalRevenue: metrics.reduce((s, m) => s + m.totalRevenue, 0),
        totalCheckIns: metrics.reduce((s, m) => s + m.checkIns, 0),
        totalCheckOuts: metrics.reduce((s, m) => s + m.checkOuts, 0),
      },
    };
  }

  /**
   * Get chain overview
   */
  async getChainOverview(startDate?: string, endDate?: string): Promise<any> {
    return {
      totalHotels: 3,
      totalRooms: 630,
      totalRevenue: Math.round(1491000),
      avgOccupancy: 72.5,
      avgADR: 3500,
      totalGuests: 4250,
      totalBookings: 426,
      avgGuestRating: 4.4,
      totalFeedbackCount: 156,
      totalStaff: 189,
    };
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(
    startDate?: string,
    endDate?: string,
    hotelIds?: string
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

    const totalRevenue = dailyRevenue.reduce((s, d) => s + d.revenue, 0);

    return {
      dailyRevenue,
      totals: {
        totalRevenue,
        roomsRevenue: dailyRevenue.reduce((s, d) => s + d.breakdown.rooms, 0),
        fAndBRevenue: dailyRevenue.reduce((s, d) => s + d.breakdown.fAndB, 0),
        spaRevenue: dailyRevenue.reduce((s, d) => s + d.breakdown.spa, 0),
        revenueMix: {
          rooms: 65,
          fAndB: 20,
          spa: 10,
          other: 5,
        },
      },
    };
  }

  /**
   * Get occupancy analytics
   */
  async getOccupancyAnalytics(
    startDate?: string,
    endDate?: string,
    hotelIds?: string
  ): Promise<any> {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const dailyOccupancy = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      dailyOccupancy.push({
        date: currentDate.toISOString().split('T')[0],
        occupancyRate: Math.round((65 + Math.random() * 25) * 10) / 10,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      dailyOccupancy,
      byHotel: {
        'hotel-001': { hotelName: 'Grand Plaza Mumbai', avgOccupancy: 78.5, totalRooms: 250 },
        'hotel-002': { hotelName: 'Grand Plaza Delhi', avgOccupancy: 72.3, totalRooms: 180 },
        'hotel-003': { hotelName: 'Grand Plaza Bangalore', avgOccupancy: 68.7, totalRooms: 200 },
      },
      overallAvg: Math.round(dailyOccupancy.reduce((s, d) => s + d.occupancyRate, 0) / dailyOccupancy.length * 10) / 10,
    };
  }

  /**
   * Get booking analytics
   */
  async getBookingAnalytics(
    startDate?: string,
    endDate?: string,
    hotelIds?: string
  ): Promise<any> {
    return {
      totalBookings: 426,
      bySource: { direct: 142, ota: 170, corporate: 85, walkin: 29 },
      byStatus: { upcoming: 85, 'checked-in': 156, 'checked-out': 170, cancelled: 15 },
      totalRevenue: 1491000,
      avgBookingValue: 3500,
      cancellationRate: 8.5,
      noShowRate: 3.2,
      advanceBookings: 312,
      revenueBySource: { direct: 497000, ota: 670950, corporate: 297000, walkin: 26050 },
      sourceMix: { direct: 33, ota: 45, corporate: 20, walkin: 2 },
    };
  }

  /**
   * Get guest analytics
   */
  async getGuestAnalytics(
    startDate?: string,
    endDate?: string,
    hotelIds?: string
  ): Promise<any> {
    return {
      totalGuests: 4250,
      repeatGuests: 997,
      newGuests: 3253,
      repeatRate: 23.5,
      avgLengthOfStay: 2.3,
      totalNights: 9775,
      guestsByCountry: {
        'India': 2762,
        'USA': 510,
        'UK': 340,
        'UAE': 213,
        'Singapore': 170,
        'Others': 255,
      },
      peakCheckInDays: [
        { date: '2026-06-15', count: 45 },
        { date: '2026-06-22', count: 52 },
      ],
    };
  }

  /**
   * Get staff performance
   */
  async getStaffPerformance(hotelIds?: string): Promise<any> {
    return {
      totalStaff: 189,
      byDepartment: {
        'Front Office': { count: 45, avgRating: 4.5, totalUpsells: 892 },
        'Housekeeping': { count: 62, avgRating: 4.2, totalUpsells: 156 },
        'Food & Beverage': { count: 48, avgRating: 4.3, totalUpsells: 567 },
        'Maintenance': { count: 18, avgRating: 4.4, totalUpsells: 45 },
        'Management': { count: 16, avgRating: 4.6, totalUpsells: 234 },
      },
      topPerformers: [
        { name: 'Anita Desai', role: 'Concierge', hotel: 'Grand Plaza Mumbai', rating: 4.8, upsellsGenerated: 45 },
        { name: 'Vikram Singh', role: 'Front Desk Manager', hotel: 'Grand Plaza Mumbai', rating: 4.5, upsellsGenerated: 28 },
        { name: 'Priya Sharma', role: 'Guest Relations', hotel: 'Grand Plaza Delhi', rating: 4.7, upsellsGenerated: 38 },
      ],
    };
  }
}

export const propertyService = new PropertyService();
