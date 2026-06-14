import { Report } from '../models';
import { logger } from '../utils/logger';

export interface AttendanceMetrics {
  overall: {
    totalDays: number;
    workingDays: number;
    averageAttendance: number;
    punctualityRate: number;
  };
  summary: {
    present: number;
    absent: number;
    onLeave: number;
    workFromHome: number;
    lateArrivals: number;
    earlyLeaves: number;
  };
  trend: {
    date: string;
    present: number;
    absent: number;
    wfh: number;
  }[];
  departmentWise: {
    department: string;
    attendanceRate: number;
    punctualityRate: number;
    avgWorkHours: number;
  }[];
  employeeWise: {
    employeeId: string;
    name: string;
    department: string;
    present: number;
    absent: number;
    lateArrivals: number;
    workHours: number;
    attendanceRate: number;
  }[];
  leaveBreakdown: {
    type: string;
    count: number;
    days: number;
  }[];
  peakHours: {
    hour: number;
    checkInCount: number;
  }[];
  lateArrivalPatterns: {
    department: string;
    lateCount: number;
    avgMinutesLate: number;
  }[];
  generatedAt: Date;
}

export class AttendanceAnalyticsService {
  /**
   * Get attendance analytics
   */
  async getAttendanceMetrics(params: {
    startDate: string;
    endDate: string;
    department?: string;
    employeeId?: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<AttendanceMetrics> {
    logger.info('Generating attendance metrics', { params });

    // Generate comprehensive mock data
    const metrics: AttendanceMetrics = {
      overall: {
        totalDays: 22,
        workingDays: 20,
        averageAttendance: 94.5,
        punctualityRate: 87.2,
      },
      summary: {
        present: 4675,
        absent: 245,
        onLeave: 180,
        workFromHome: 892,
        lateArrivals: 312,
        earlyLeaves: 145,
      },
      trend: this.generateTrendData(),
      departmentWise: [
        {
          department: 'Engineering',
          attendanceRate: 96.2,
          punctualityRate: 89.5,
          avgWorkHours: 8.4,
        },
        {
          department: 'Sales',
          attendanceRate: 93.1,
          punctualityRate: 85.2,
          avgWorkHours: 8.2,
        },
        {
          department: 'Marketing',
          attendanceRate: 95.5,
          punctualityRate: 91.0,
          avgWorkHours: 8.3,
        },
        {
          department: 'Operations',
          attendanceRate: 92.8,
          punctualityRate: 82.5,
          avgWorkHours: 8.1,
        },
        {
          department: 'HR',
          attendanceRate: 97.0,
          punctualityRate: 94.0,
          avgWorkHours: 8.5,
        },
        {
          department: 'Finance',
          attendanceRate: 96.5,
          punctualityRate: 92.0,
          avgWorkHours: 8.4,
        },
      ],
      employeeWise: [
        {
          employeeId: 'EMP101',
          name: 'Arjun Nair',
          department: 'Engineering',
          present: 20,
          absent: 2,
          lateArrivals: 1,
          workHours: 168,
          attendanceRate: 90.9,
        },
        {
          employeeId: 'EMP205',
          name: 'Sneha Reddy',
          department: 'Sales',
          present: 19,
          absent: 1,
          lateArrivals: 3,
          workHours: 162,
          attendanceRate: 95.0,
        },
      ],
      leaveBreakdown: [
        { type: 'Casual Leave', count: 45, days: 89 },
        { type: 'Sick Leave', count: 38, days: 52 },
        { type: 'Earned Leave', count: 22, days: 66 },
        { type: 'Maternity Leave', count: 5, days: 120 },
        { type: 'Paternity Leave', count: 3, days: 15 },
        { type: 'Unpaid Leave', count: 12, days: 24 },
      ],
      peakHours: [
        { hour: 9, checkInCount: 185 },
        { hour: 10, checkInCount: 42 },
        { hour: 11, checkInCount: 15 },
        { hour: 8, checkInCount: 5 },
      ],
      lateArrivalPatterns: [
        { department: 'Operations', lateCount: 85, avgMinutesLate: 12 },
        { department: 'Sales', lateCount: 78, avgMinutesLate: 10 },
        { department: 'Engineering', lateCount: 65, avgMinutesLate: 8 },
        { department: 'Marketing', lateCount: 45, avgMinutesLate: 7 },
        { department: 'HR', lateCount: 22, avgMinutesLate: 5 },
        { department: 'Finance', lateCount: 17, avgMinutesLate: 6 },
      ],
      generatedAt: new Date(),
    };

    // Save report
    try {
      const report = new Report({
        name: 'Attendance Analytics Report',
        type: 'attendance',
        data: metrics,
        generatedAt: new Date(),
        filters: params,
      });
      await report.save();
    } catch (error) {
      logger.error('Failed to save attendance report:', error);
    }

    return metrics;
  }

  private generateTrendData(): { date: string; present: number; absent: number; wfh: number }[] {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const present = Math.floor(Math.random() * 20) + 210;
      const absent = Math.floor(Math.random() * 10) + 5;
      const wfh = Math.floor(Math.random() * 30) + 20;

      data.push({
        date: date.toISOString().split('T')[0],
        present,
        absent,
        wfh,
      });
    }

    return data.slice(-10);
  }
}

export const attendanceAnalyticsService = new AttendanceAnalyticsService();
