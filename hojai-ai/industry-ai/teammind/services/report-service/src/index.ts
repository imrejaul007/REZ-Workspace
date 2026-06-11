/**
 * Report Service - Team Analytics & Reporting
 * Part of TEAMMIND - Team Management AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface TeamReport {
  id: string;
  reportType: 'productivity' | 'performance' | 'attendance' | 'project';
  period: { start: string; end: string };
  department?: string;
  generatedBy: string;
  createdAt: string;
  data: Record<string, unknown>;
}

export interface ProductivityMetrics {
  employeeId: string;
  employeeName: string;
  period: string;
  tasksCompleted: number;
  tasksAssigned: number;
  meetingsAttended: number;
  avgTaskDuration: number;
  overtimeHours: number;
  productivityScore: number;
}

export interface PerformanceSummary {
  department: string;
  totalEmployees: number;
  avgProductivity: number;
  topPerformer: { id: string; name: string; score: number };
  improvementAreas: string[];
}

export class ReportService {
  async generateProductivityReport(
    period: { start: string; end: string },
    department?: string
  ): Promise<{ metrics: ProductivityMetrics[]; summary: PerformanceSummary }> {
    const employees = ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Ross', 'Eve Wilson'];
    const metrics = employees.map((name, i) => ({
      employeeId: `EMP${i + 1}`,
      employeeName: name,
      period: `${period.start} to ${period.end}`,
      tasksCompleted: Math.floor(Math.random() * 20) + 10,
      tasksAssigned: Math.floor(Math.random() * 15) + 15,
      meetingsAttended: Math.floor(Math.random() * 15) + 5,
      avgTaskDuration: Math.floor(Math.random() * 4) + 2,
      overtimeHours: Math.floor(Math.random() * 10),
      productivityScore: 70 + Math.random() * 30
    }));

    const sorted = [...metrics].sort((a, b) => b.productivityScore - a.productivityScore);

    return {
      metrics,
      summary: {
        department: department || 'All',
        totalEmployees: metrics.length,
        avgProductivity: Math.round(metrics.reduce((s, m) => s + m.productivityScore, 0) / metrics.length),
        topPerformer: sorted[0],
        improvementAreas: ['Meeting efficiency', 'Task completion rate', 'Documentation']
      }
    };
  }

  async generateAttendanceReport(
    period: { start: string; end: string }
  ): Promise<{
    totalDays: number;
    avgAttendance: number;
    lateArrivals: number;
    earlyLeaves: number;
    leavesTaken: number;
    employeeBreakdown: { name: string; present: number; absent: number; leaves: number }[];
  }> {
    const employees = ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Ross', 'Eve Wilson'];
    const totalDays = 22; // Assuming working days

    return {
      totalDays,
      avgAttendance: 92 + Math.random() * 8,
      lateArrivals: Math.floor(Math.random() * 15),
      earlyLeaves: Math.floor(Math.random() * 10),
      leavesTaken: Math.floor(Math.random() * 20),
      employeeBreakdown: employees.map(name => ({
        name,
        present: Math.floor(Math.random() * 3) + 19,
        absent: Math.floor(Math.random() * 3),
        leaves: Math.floor(Math.random() * 5)
      }))
    };
  }

  async generateProjectReport(
    projectId: string,
    period: { start: string; end: string }
  ): Promise<{
    projectId: string;
    tasksCompleted: number;
    tasksInProgress: number;
    tasksDelayed: number;
    teamUtilization: number;
    budgetUsed: number;
    timelineStatus: 'ahead' | 'on_track' | 'at_risk' | 'delayed';
  }> {
    const tasksCompleted = Math.floor(Math.random() * 30) + 20;
    const tasksInProgress = Math.floor(Math.random() * 10) + 5;
    const timelineOptions: ('ahead' | 'on_track' | 'at_risk' | 'delayed')[] = ['ahead', 'on_track', 'at_risk', 'delayed'];

    return {
      projectId,
      tasksCompleted,
      tasksInProgress,
      tasksDelayed: Math.floor(Math.random() * 5),
      teamUtilization: 75 + Math.random() * 20,
      budgetUsed: 40 + Math.random() * 40,
      timelineStatus: timelineOptions[Math.floor(Math.random() * timelineOptions.length)]
    };
  }

  async exportReport(
    reportId: string,
    format: 'pdf' | 'excel' | 'csv'
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    return {
      downloadUrl: `https://reports.teammind.ai/${reportId}.${format}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }
}

export default ReportService;