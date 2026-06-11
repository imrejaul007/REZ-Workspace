/**
 * Report Service - Travel Agency Analytics & Reporting
 * Part of TRIPMIND - Travel Agency AI
 */

export interface SalesReport {
  totalBookings: number;
  totalRevenue: number;
  avgBookingValue: number;
  byType: { type: string; bookings: number; revenue: number }[];
  byMonth: { month: string; bookings: number; revenue: number }[];
  topDestinations: { destination: string; bookings: number }[];
}

export interface CustomerReport {
  totalCustomers: number;
  repeatCustomers: number;
  avgBookingsPerCustomer: number;
  topCustomers: { name: string; bookings: number; totalSpent: number }[];
}

export class ReportService {
  async generateSalesReport(period: 'month' | 'quarter' | 'year'): Promise<SalesReport> {
    return {
      totalBookings: Math.floor(Math.random() * 200) + 50,
      totalRevenue: Math.floor(Math.random() * 5000000) + 1000000,
      avgBookingValue: 25000 + Math.random() * 10000,
      byType: [
        { type: 'flight', bookings: 80, revenue: 2000000 },
        { type: 'hotel', bookings: 60, revenue: 1500000 },
        { type: 'package', bookings: 40, revenue: 1200000 },
        { type: 'visa', bookings: 30, revenue: 300000 }
      ],
      byMonth: [
        { month: 'Jan', bookings: 45, revenue: 1200000 },
        { month: 'Feb', bookings: 52, revenue: 1400000 },
        { month: 'Mar', bookings: 48, revenue: 1300000 }
      ],
      topDestinations: [
        { destination: 'Goa', bookings: 35 },
        { destination: 'Kerala', bookings: 28 },
        { destination: 'Dubai', bookings: 25 }
      ]
    };
  }

  async generateCustomerReport(): Promise<CustomerReport> {
    return {
      totalCustomers: Math.floor(Math.random() * 300) + 100,
      repeatCustomers: Math.floor(Math.random() * 50) + 20,
      avgBookingsPerCustomer: 1.5 + Math.random() * 0.5,
      topCustomers: [
        { name: 'Rahul Sharma', bookings: 5, totalSpent: 250000 },
        { name: 'Priya Patel', bookings: 4, totalSpent: 180000 },
        { name: 'Amit Kumar', bookings: 3, totalSpent: 150000 }
      ]
    };
  }

  async getDashboardSummary(): Promise<{
    todayBookings: number;
    weekBookings: number;
    monthRevenue: number;
    pendingQueries: number;
    popularDestinations: string[];
  }> {
    return {
      todayBookings: Math.floor(Math.random() * 10) + 2,
      weekBookings: Math.floor(Math.random() * 50) + 10,
      monthRevenue: Math.floor(Math.random() * 2000000) + 500000,
      pendingQueries: Math.floor(Math.random() * 20) + 5,
      popularDestinations: ['Goa', 'Kerala', 'Dubai', 'Singapore', 'Thailand']
    };
  }
}

export default ReportService;