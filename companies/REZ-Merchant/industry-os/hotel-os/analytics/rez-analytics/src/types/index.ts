/**
 * REZ Hotel Analytics Types
 */

export interface DashboardMetrics {
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
  avgStay: number;
  cancellationRate: number;
}

export interface ChannelPerformance {
  channel: string;
  bookings: number;
  revenue: number;
  percentage: number;
}

export interface RevPARTrend {
  date: string;
  revpar: number;
  adr: number;
  occupancy: number;
}

export interface BookingTrend {
  date: string;
  bookings: number;
  cancellations: number;
  revenue: number;
  leadTime: number;
}

export interface GuestAnalytics {
  guestMix: { type: string; percentage: number; avgSpend: number }[];
  repeatGuestRate: number;
  avgSatisfaction: number;
  guestOrigins: { city: string; guests: number; percentage: number }[];
  avgLengthOfStay: number;
  avgGroupSize: number;
}

export interface CompetitorAnalysis {
  name: string;
  adr: number;
  occupancy: number;
  revpar: number;
  rating: number;
  distance: string;
}

export interface DemandForecast {
  date: string;
  expectedOccupancy: number;
  expectedAdr: number;
  expectedDemand: number;
  recommendation: string;
}

export interface OccupancyData {
  dailyOccupancy: { date: string; occupancyRate: number }[];
  byHotel: Record<string, { hotelName: string; avgOccupancy: number; totalRooms: number }>;
  overallAvg: number;
}

export interface RevenueData {
  dailyRevenue: { date: string; revenue: number; breakdown: Record<string, number> }[];
  totals: {
    totalRevenue: number;
    roomsRevenue: number;
    fAndBRevenue: number;
    spaRevenue: number;
    revenueMix: Record<string, number>;
  };
}

export interface BookingStats {
  totalBookings: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  totalRevenue: number;
  avgBookingValue: number;
  cancellationRate: number;
  noShowRate: number;
  advanceBookings: number;
  revenueBySource: Record<string, number>;
  sourceMix: Record<string, number>;
}
