// Events export extends ExportService
import { ExportService } from '@rez/base-services/export';

export interface SalesReport {
  eventId: string;
  eventName: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalTickets: number;
    totalRevenue: number;
    averagePrice: number;
    refundCount: number;
    refundAmount: number;
  };
  byTier: {
    tier: string;
    tickets: number;
    revenue: number;
  }[];
  byPaymentMethod: {
    method: string;
    count: number;
    amount: number;
  }[];
  timeline: {
    date: string;
    tickets: number;
    revenue: number;
  }[];
  generatedAt: Date;
}

export interface AttendanceReport {
  eventId: string;
  eventName: string;
  eventDate: Date;
  venue: string;
  capacity: {
    total: number;
    sold: number;
    checkedIn: number;
    noShow: number;
    attendanceRate: number;
  };
  demographics: {
    ageGroups: {
      group: string;
      count: number;
      percentage: number;
    }[];
    locations: {
      city: string;
      count: number;
      percentage: number;
    }[];
  };
  timeline: {
    time: string;
    checkedIn: number;
    cumulative: number;
  }[];
  generatedAt: Date;
}

export interface RevenueBreakdown {
  eventId: string;
  eventName: string;
  grossRevenue: number;
  deductions: {
    name: string;
    amount: number;
    percentage: number;
  }[];
  netRevenue: number;
  byCategory: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  byTier: {
    tier: string;
    gross: number;
    fees: number;
    net: number;
  }[];
  comparison: {
    vsBudget: number;
    vsLastEvent: number;
  };
  generatedAt: Date;
}

export class EventsExportService extends ExportService {
  /**
   * Generate sales report for an event
   */
  async getSalesReport(eventId: string): Promise<SalesReport> {
    const salesData = await this.export(eventId, {
      type: 'sales',
      format: 'detailed',
    });

    return {
      eventId,
      eventName: salesData.eventName,
      period: {
        start: new Date(salesData.startDate),
        end: new Date(salesData.endDate),
      },
      summary: {
        totalTickets: salesData.ticketsSold || 0,
        totalRevenue: salesData.revenue || 0,
        averagePrice: salesData.averagePrice || 0,
        refundCount: salesData.refunds || 0,
        refundAmount: salesData.refundAmount || 0,
      },
      byTier: salesData.byTier || [],
      byPaymentMethod: salesData.paymentMethods || [],
      timeline: salesData.timeline || [],
      generatedAt: new Date(),
    };
  }

  /**
   * Generate attendance report for an event
   */
  async getAttendanceReport(eventId: string): Promise<AttendanceReport> {
    const attendanceData = await this.export(eventId, {
      type: 'attendance',
      format: 'detailed',
    });

    const total = attendanceData.capacity?.total || 0;
    const checkedIn = attendanceData.checkedIn || 0;

    return {
      eventId,
      eventName: attendanceData.eventName,
      eventDate: new Date(attendanceData.eventDate),
      venue: attendanceData.venue,
      capacity: {
        total,
        sold: attendanceData.sold || 0,
        checkedIn,
        noShow: total - checkedIn,
        attendanceRate: total > 0 ? (checkedIn / total) * 100 : 0,
      },
      demographics: {
        ageGroups: attendanceData.ageGroups || [],
        locations: attendanceData.locations || [],
      },
      timeline: attendanceData.checkInTimeline || [],
      generatedAt: new Date(),
    };
  }

  /**
   * Generate revenue breakdown report
   */
  async getRevenueBreakdown(eventId: string): Promise<RevenueBreakdown> {
    const revenueData = await this.export(eventId, {
      type: 'revenue',
      format: 'detailed',
    });

    const grossRevenue = revenueData.gross || 0;
    const deductions = revenueData.deductions || [];
    const netRevenue = grossRevenue - deductions.reduce(
      (sum: number, d) => sum + d.amount, 0
    );

    return {
      eventId,
      eventName: revenueData.eventName,
      grossRevenue,
      deductions: deductions.map((d) => ({
        name: d.name,
        amount: d.amount,
        percentage: grossRevenue > 0 ? (d.amount / grossRevenue) * 100 : 0,
      })),
      netRevenue,
      byCategory: revenueData.byCategory || [],
      byTier: revenueData.byTier || [],
      comparison: {
        vsBudget: revenueData.budgetVariance || 0,
        vsLastEvent: revenueData.lastEventVariance || 0,
      },
      generatedAt: new Date(),
    };
  }
}
