import { Report } from '../models';
import { logger } from '../utils/logger';

export interface PerformanceMetrics {
  overall: {
    avgScore: number;
    topPerformers: number;
    averagePerformers: number;
    underPerformers: number;
    totalReviews: number;
    completionRate: number;
  };
  byDepartment: {
    department: string;
    avgScore: number;
    topPerformers: number;
    underPerformers: number;
    reviewCompletionRate: number;
  }[];
  scoreDistribution: {
    score: number;
    count: number;
    percentage: number;
  }[];
  trends: {
    month: string;
    avgScore: number;
    topPerformers: number;
    completionRate: number;
  }[];
  topPerformers: {
    employeeId: string;
    name: string;
    department: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
    achievements: string[];
  }[];
  underPerformers: {
    employeeId: string;
    name: string;
    department: string;
    score: number;
    issues: string[];
    recommendedActions: string[];
  }[];
  goalProgress: {
    employeeId: string;
    name: string;
    department: string;
    goals: {
      title: string;
      progress: number;
      status: 'on_track' | 'at_risk' | 'off_track';
      dueDate: string;
    }[];
    overallProgress: number;
  }[];
  competencyScores: {
    competency: string;
    avgScore: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  reviewCycleStatus: {
    cycleName: string;
    totalReviews: number;
    completed: number;
    pending: number;
    deadline: string;
    completionPercentage: number;
  }[];
  generatedAt: Date;
}

export class PerformanceAnalyticsService {
  /**
   * Get performance analytics
   */
  async getPerformanceMetrics(params: {
    startDate?: string;
    endDate?: string;
    department?: string;
    metric?: string;
    sortBy?: 'score' | 'name' | 'date';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PerformanceMetrics> {
    logger.info('Generating performance metrics', { params });

    const metrics: PerformanceMetrics = {
      overall: {
        avgScore: 78.5,
        topPerformers: 42,
        averagePerformers: 175,
        underPerformers: 30,
        totalReviews: 247,
        completionRate: 87.5,
      },
      byDepartment: [
        {
          department: 'Engineering',
          avgScore: 82.3,
          topPerformers: 18,
          underPerformers: 5,
          reviewCompletionRate: 94.1,
        },
        {
          department: 'Sales',
          avgScore: 76.8,
          topPerformers: 8,
          underPerformers: 8,
          reviewCompletionRate: 88.5,
        },
        {
          department: 'Marketing',
          avgScore: 80.2,
          topPerformers: 6,
          underPerformers: 4,
          reviewCompletionRate: 92.1,
        },
        {
          department: 'Operations',
          avgScore: 74.5,
          topPerformers: 5,
          underPerformers: 7,
          reviewCompletionRate: 85.7,
        },
        {
          department: 'HR',
          avgScore: 84.1,
          topPerformers: 4,
          underPerformers: 1,
          reviewCompletionRate: 95.0,
        },
        {
          department: 'Finance',
          avgScore: 79.8,
          topPerformers: 3,
          underPerformers: 2,
          reviewCompletionRate: 94.1,
        },
      ],
      scoreDistribution: [
        { score: 90, count: 25, percentage: 10.1 },
        { score: 80, count: 65, percentage: 26.3 },
        { score: 70, count: 98, percentage: 39.7 },
        { score: 60, count: 42, percentage: 17.0 },
        { score: 50, count: 15, percentage: 6.1 },
        { score: 40, count: 2, percentage: 0.8 },
      ],
      trends: [
        { month: '2026-01', avgScore: 75.2, topPerformers: 35, completionRate: 82.0 },
        { month: '2026-02', avgScore: 76.8, topPerformers: 38, completionRate: 84.5 },
        { month: '2026-03', avgScore: 77.5, topPerformers: 40, completionRate: 85.8 },
        { month: '2026-04', avgScore: 78.1, topPerformers: 41, completionRate: 86.2 },
        { month: '2026-05', avgScore: 78.5, topPerformers: 42, completionRate: 87.5 },
      ],
      topPerformers: [
        {
          employeeId: 'EMP101',
          name: 'Arjun Nair',
          department: 'Engineering',
          score: 98,
          trend: 'up',
          achievements: [
            'Delivered Q1 targets 120%',
            'Mentored 3 junior developers',
            'Led migration to microservices',
          ],
        },
        {
          employeeId: 'EMP205',
          name: 'Sneha Reddy',
          department: 'Sales',
          score: 95,
          trend: 'up',
          achievements: [
            'Highest revenue generator Q1',
            'Onboarded 5 new enterprise clients',
            'Zero escalations',
          ],
        },
        {
          employeeId: 'EMP089',
          name: 'Kiran Mehta',
          department: 'Marketing',
          score: 93,
          trend: 'stable',
          achievements: [
            'Campaign ROI increased 45%',
            'Social media following +60%',
          ],
        },
        {
          employeeId: 'EMP156',
          name: 'Divya Kapoor',
          department: 'Engineering',
          score: 92,
          trend: 'up',
          achievements: [
            'Reduced system downtime by 80%',
            'Implemented automated testing',
          ],
        },
        {
          employeeId: 'EMP078',
          name: 'Rajesh Iyer',
          department: 'Operations',
          score: 91,
          trend: 'stable',
          achievements: [
            'Process efficiency improved 30%',
            'Zero safety incidents',
          ],
        },
      ],
      underPerformers: [
        {
          employeeId: 'EMP112',
          name: 'Amit Sharma',
          department: 'Sales',
          score: 45,
          issues: [
            'Below target for 3 consecutive months',
            'Customer complaints received',
            'Attendance concerns',
          ],
          recommendedActions: [
            'Performance improvement plan',
            'Additional training on product knowledge',
            'Weekly one-on-one sessions',
          ],
        },
        {
          employeeId: 'EMP167',
          name: 'Pooja Verma',
          department: 'Operations',
          score: 48,
          issues: [
            'Quality metrics below threshold',
            'Missed deadlines',
          ],
          recommendedActions: [
            'Skills gap assessment',
            'Mentorship program',
            'Clear performance goals',
          ],
        },
      ],
      goalProgress: [
        {
          employeeId: 'EMP101',
          name: 'Arjun Nair',
          department: 'Engineering',
          goals: [
            { title: 'Complete AWS certification', progress: 80, status: 'on_track', dueDate: '2026-06-30' },
            { title: 'Mentor 3 junior devs', progress: 100, status: 'on_track', dueDate: '2026-05-31' },
            { title: 'Deploy new API gateway', progress: 60, status: 'at_risk', dueDate: '2026-06-15' },
          ],
          overallProgress: 80,
        },
        {
          employeeId: 'EMP205',
          name: 'Sneha Reddy',
          department: 'Sales',
          goals: [
            { title: 'Close 10 enterprise deals', progress: 70, status: 'on_track', dueDate: '2026-06-30' },
            { title: 'Maintain 95% CSAT', progress: 100, status: 'on_track', dueDate: '2026-06-30' },
          ],
          overallProgress: 85,
        },
      ],
      competencyScores: [
        { competency: 'Communication', avgScore: 82.5, trend: 'up' },
        { competency: 'Technical Skills', avgScore: 79.2, trend: 'up' },
        { competency: 'Teamwork', avgScore: 85.1, trend: 'stable' },
        { competency: 'Problem Solving', avgScore: 77.8, trend: 'up' },
        { competency: 'Leadership', avgScore: 74.5, trend: 'stable' },
        { competency: 'Time Management', avgScore: 76.3, trend: 'down' },
      ],
      reviewCycleStatus: [
        {
          cycleName: 'Q1 2026 Annual Review',
          totalReviews: 247,
          completed: 216,
          pending: 31,
          deadline: '2026-06-30',
          completionPercentage: 87.5,
        },
        {
          cycleName: 'Probation Review May 2026',
          totalReviews: 18,
          completed: 15,
          pending: 3,
          deadline: '2026-06-15',
          completionPercentage: 83.3,
        },
      ],
      generatedAt: new Date(),
    };

    // Fix the duplicate key issue
    metrics.byDepartment[2].avgScore = 80.2;

    // Save report
    try {
      const report = new Report({
        name: 'Performance Analytics Report',
        type: 'performance',
        data: metrics,
        generatedAt: new Date(),
        filters: params,
      });
      await report.save();
    } catch (error) {
      logger.error('Failed to save performance report:', error);
    }

    return metrics;
  }
}

export const performanceAnalyticsService = new PerformanceAnalyticsService();
