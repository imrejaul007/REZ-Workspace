import { Report } from '../models';
import { logger } from '../utils/logger';

export interface DashboardMetrics {
  totalEmployees: number;
  activeEmployees: number;
  newHiresThisMonth: number;
  attritionRate: number;
  averageTenure: number;
  departmentBreakdown: {
    department: string;
    count: number;
    percentage: number;
  }[];
  recentHires: {
    employeeId: string;
    name: string;
    department: string;
    joinDate: string;
  }[];
  upcomingBirthdays: {
    employeeId: string;
    name: string;
    birthDate: string;
    department: string;
  }[];
  pendingTasks: {
    type: string;
    count: number;
  }[];
  attendanceSummary: {
    present: number;
    absent: number;
    onLeave: number;
    wfh: number;
  };
  payrollSummary: {
    totalPayroll: number;
    pendingPayments: number;
    completedPayments: number;
  };
  generatedAt: Date;
}

export class DashboardService {
  /**
   * Get main dashboard metrics
   */
  async getDashboardMetrics(filters?: {
    startDate?: string;
    endDate?: string;
    department?: string;
  }): Promise<DashboardMetrics> {
    logger.info('Generating dashboard metrics', { filters });

    // Generate mock data - in production, this would query actual services
    const metrics: DashboardMetrics = {
      totalEmployees: 247,
      activeEmployees: 235,
      newHiresThisMonth: 12,
      attritionRate: 2.4,
      averageTenure: 2.8,
      departmentBreakdown: [
        { department: 'Engineering', count: 85, percentage: 34.4 },
        { department: 'Sales', count: 52, percentage: 21.1 },
        { department: 'Marketing', count: 38, percentage: 15.4 },
        { department: 'Operations', count: 35, percentage: 14.2 },
        { department: 'HR', count: 20, percentage: 8.1 },
        { department: 'Finance', count: 17, percentage: 6.9 },
      ],
      recentHires: [
        {
          employeeId: 'EMP001',
          name: 'Priya Sharma',
          department: 'Engineering',
          joinDate: '2026-05-15',
        },
        {
          employeeId: 'EMP002',
          name: 'Rahul Verma',
          department: 'Sales',
          joinDate: '2026-05-12',
        },
        {
          employeeId: 'EMP003',
          name: 'Anita Desai',
          department: 'Marketing',
          joinDate: '2026-05-08',
        },
      ],
      upcomingBirthdays: [
        {
          employeeId: 'EMP004',
          name: 'Vikram Singh',
          birthDate: '1992-06-05',
          department: 'Engineering',
        },
        {
          employeeId: 'EMP005',
          name: 'Meera Patel',
          birthDate: '1990-06-08',
          department: 'HR',
        },
      ],
      pendingTasks: [
        { type: 'Leave Approvals', count: 8 },
        { type: 'Expense Reimbursements', count: 15 },
        { type: 'Performance Reviews', count: 23 },
        { type: 'Document Verifications', count: 5 },
      ],
      attendanceSummary: {
        present: 218,
        absent: 12,
        onLeave: 8,
        wfh: 42,
      },
      payrollSummary: {
        totalPayroll: 48500000,
        pendingPayments: 3,
        completedPayments: 232,
      },
      generatedAt: new Date(),
    };

    // Save report to database
    try {
      const report = new Report({
        name: 'Dashboard Report',
        type: 'dashboard',
        data: metrics,
        generatedAt: new Date(),
        filters,
      });
      await report.save();
    } catch (error) {
      logger.error('Failed to save dashboard report:', error);
    }

    return metrics;
  }
}

export const dashboardService = new DashboardService();
