import { Report } from '../models';
import { logger } from '../utils/logger';

export interface EmployeeMetrics {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  newHires: {
    month: string;
    count: number;
  }[];
  departures: {
    month: string;
    count: number;
    reason?: string;
  }[];
  departmentDistribution: {
    department: string;
    headcount: number;
    avgTenure: number;
    avgSalary: number;
  }[];
  employmentType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  ageGroupDistribution: {
    group: string;
    count: number;
  }[];
  locationDistribution: {
    location: string;
    count: number;
  }[];
  topPerformers: {
    employeeId: string;
    name: string;
    department: string;
    score: number;
  }[];
  complianceMetrics: {
    pfDeducted: number;
    esiEnrolled: number;
    taxFiling: number;
  };
  generatedAt: Date;
}

export class EmployeeAnalyticsService {
  /**
   * Get employee analytics metrics
   */
  async getEmployeeMetrics(params: {
    department?: string;
    startDate?: string;
    endDate?: string;
    includeInactive?: boolean;
  }): Promise<EmployeeMetrics> {
    logger.info('Generating employee metrics', { params });

    // Generate comprehensive mock data
    const metrics: EmployeeMetrics = {
      totalEmployees: 247,
      activeEmployees: 235,
      inactiveEmployees: 12,
      newHires: [
        { month: '2026-01', count: 8 },
        { month: '2026-02', count: 15 },
        { month: '2026-03', count: 12 },
        { month: '2026-04', count: 10 },
        { month: '2026-05', count: 18 },
      ],
      departures: [
        { month: '2026-01', count: 2, reason: 'Career Change' },
        { month: '2026-02', count: 3, reason: 'Relocation' },
        { month: '2026-03', count: 1, reason: 'Retirement' },
        { month: '2026-04', count: 4, reason: 'Career Change' },
        { month: '2026-05', count: 2, reason: 'Better Opportunity' },
      ],
      departmentDistribution: [
        {
          department: 'Engineering',
          headcount: 85,
          avgTenure: 2.5,
          avgSalary: 95000,
        },
        {
          department: 'Sales',
          headcount: 52,
          avgTenure: 3.2,
          avgSalary: 65000,
        },
        {
          department: 'Marketing',
          headcount: 38,
          avgTenure: 2.8,
          avgSalary: 55000,
        },
        {
          department: 'Operations',
          headcount: 35,
          avgTenure: 4.1,
          avgSalary: 45000,
        },
        {
          department: 'HR',
          headcount: 20,
          avgTenure: 3.5,
          avgSalary: 50000,
        },
        {
          department: 'Finance',
          headcount: 17,
          avgTenure: 4.8,
          avgSalary: 75000,
        },
      ],
      employmentType: [
        { type: 'Full-time', count: 210, percentage: 85.0 },
        { type: 'Part-time', count: 18, percentage: 7.3 },
        { type: 'Contract', count: 12, percentage: 4.9 },
        { type: 'Intern', count: 7, percentage: 2.8 },
      ],
      genderDistribution: {
        male: 142,
        female: 98,
        other: 7,
      },
      ageGroupDistribution: [
        { group: '18-25', count: 45 },
        { group: '26-35', count: 112 },
        { group: '36-45', count: 58 },
        { group: '46-55', count: 25 },
        { group: '56+', count: 7 },
      ],
      locationDistribution: [
        { location: 'Mumbai', count: 120 },
        { location: 'Bangalore', count: 75 },
        { location: 'Delhi NCR', count: 35 },
        { location: 'Hyderabad', count: 17 },
      ],
      topPerformers: [
        { employeeId: 'EMP101', name: 'Arjun Nair', department: 'Engineering', score: 98 },
        { employeeId: 'EMP205', name: 'Sneha Reddy', department: 'Sales', score: 95 },
        { employeeId: 'EMP089', name: 'Kiran Mehta', department: 'Marketing', score: 93 },
        { employeeId: 'EMP156', name: 'Divya Kapoor', department: 'Engineering', score: 92 },
        { employeeId: 'EMP078', name: 'Rajesh Iyer', department: 'Operations', score: 91 },
      ],
      complianceMetrics: {
        pfDeducted: 210,
        esiEnrolled: 189,
        taxFiling: 235,
      },
      generatedAt: new Date(),
    };

    // Save report
    try {
      const report = new Report({
        name: 'Employee Analytics Report',
        type: 'employees',
        data: metrics,
        generatedAt: new Date(),
        filters: params,
      });
      await report.save();
    } catch (error) {
      logger.error('Failed to save employee report:', error);
    }

    return metrics;
  }
}

export const employeeAnalyticsService = new EmployeeAnalyticsService();
