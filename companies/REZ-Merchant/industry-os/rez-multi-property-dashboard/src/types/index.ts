/**
 * REZ Multi-Property Dashboard Types
 */

export interface Property {
  id: string;
  name: string;
  location: string;
  chain: string;
  totalRooms: number;
  starRating: number;
  openedDate: Date;
}

export interface DailyMetrics {
  hotelId: string;
  date: Date;
  occupancyRate: number;
  adr: number;
  revpar: number;
  totalRevenue: number;
  fAndBRevenue: number;
  otherRevenue: number;
  checkIns: number;
  checkOuts: number;
  noShowCount: number;
  cancellationCount: number;
  avgLengthOfStay: number;
  totalGuests: number;
  repeatGuests: number;
  upsellRevenue: number;
  spaRevenue: number;
  laundryRevenue: number;
  totalBookings: number;
  directBookings: number;
  otaBookings: number;
  corporateBookings: number;
}

export interface DashboardOverview {
  totalHotels: number;
  totalRooms: number;
  totalRevenue: number;
  avgOccupancy: number;
  avgADR: number;
  totalGuests: number;
  totalBookings: number;
  avgGuestRating: number;
  totalFeedbackCount: number;
  totalStaff: number;
}

export interface RevenueAnalytics {
  dailyRevenue: { date: string; revenue: number; breakdown: Record<string, number> }[];
  totals: {
    totalRevenue: number;
    roomsRevenue: number;
    fAndBRevenue: number;
    spaRevenue: number;
    revenueMix: Record<string, number>;
  };
}

export interface OccupancyAnalytics {
  dailyOccupancy: { date: string; occupancyRate: number }[];
  byHotel: Record<string, { hotelName: string; avgOccupancy: number; totalRooms: number }>;
  overallAvg: number;
}

export interface BookingAnalytics {
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

export interface GuestAnalytics {
  totalGuests: number;
  repeatGuests: number;
  newGuests: number;
  repeatRate: number;
  avgLengthOfStay: number;
  totalNights: number;
  guestsByCountry: Record<string, number>;
  peakCheckInDays: { date: string; count: number }[];
}

export interface StaffPerformance {
  totalStaff: number;
  byDepartment: Record<string, { count: number; avgRating: number; totalUpsells: number }>;
  topPerformers: {
    name: string;
    role: string;
    hotel: string;
    rating: number;
    upsellsGenerated: number;
  }[];
}

export interface FeedbackData {
  id: string;
  hotelId: string;
  guestName: string;
  roomNumber: string;
  rating: number;
  categories: {
    cleanliness: number;
    service: number;
    amenities: number;
    location: number;
    value: number;
  };
  comments: string;
  stayDate: Date;
  createdAt: Date;
}
