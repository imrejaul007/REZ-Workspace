import { TimeEntry, TimeReport, ProjectSummary, UserSummary, Project } from '../types';
import { projectService } from './project.service';
import { timeEntryService } from './time-entry.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('ReportService');

export class ReportService {
  async generateReport(tenantId: string, startDate: Date, endDate: Date): Promise<TimeReport> {
    const entries = await timeEntryService.findAll(tenantId, {
      startDate,
      endDate,
    });

    // Get all projects for the tenant
    const projects = await projectService.findAll(tenantId);
    const projectMap = new Map(projects.map(p => [p.id, p]));

    // Calculate totals
    let totalMinutes = 0;
    let totalBillableMinutes = 0;

    // Group by project
    const byProject: Record<string, ProjectSummary> = {};
    // Group by user
    const byUser: Record<string, UserSummary> = {};
    // Group by date
    const byDate: Record<string, number> = {};

    for (const entry of entries) {
      totalMinutes += entry.duration;
      if (entry.isBillable) {
        totalBillableMinutes += entry.duration;
      }

      // By project
      if (!byProject[entry.projectId]) {
        const project = projectMap.get(entry.projectId);
        byProject[entry.projectId] = {
          projectName: project?.name || 'Unknown Project',
          totalMinutes: 0,
          billableMinutes: 0,
          entryCount: 0,
          amount: 0,
        };
      }
      byProject[entry.projectId].totalMinutes += entry.duration;
      byProject[entry.projectId].entryCount++;

      if (entry.isBillable) {
        byProject[entry.projectId].billableMinutes += entry.duration;
        const project = projectMap.get(entry.projectId);
        if (project) {
          byProject[entry.projectId].amount += (entry.duration / 60) * project.hourlyRate;
        }
      }

      // By user
      if (!byUser[entry.userId]) {
        byUser[entry.userId] = {
          userName: `User ${entry.userId.substring(0, 8)}`,
          totalMinutes: 0,
          billableMinutes: 0,
          entryCount: 0,
          amount: 0,
        };
      }
      byUser[entry.userId].totalMinutes += entry.duration;
      byUser[entry.userId].entryCount++;

      if (entry.isBillable) {
        byUser[entry.userId].billableMinutes += entry.duration;
        const project = projectMap.get(entry.projectId);
        if (project) {
          byUser[entry.userId].amount += (entry.duration / 60) * project.hourlyRate;
        }
      }

      // By date
      const dateKey = entry.startTime.toISOString().split('T')[0];
      byDate[dateKey] = (byDate[dateKey] || 0) + entry.duration;
    }

    const report: TimeReport = {
      tenantId,
      startDate,
      endDate,
      entries,
      totalMinutes,
      totalBillableMinutes,
      byProject,
      byUser,
      byDate,
    };

    logger.info('Report generated', { tenantId, totalMinutes, entryCount: entries.length });

    return report;
  }

  async getBillableHoursReport(tenantId: string, startDate: Date, endDate: Date): Promise<{
    totalBillableMinutes: number;
    totalNonBillableMinutes: number;
    byProject: {
      projectId: string;
      projectName: string;
      hourlyRate: number;
      billableMinutes: number;
      amount: number;
    }[];
    byUser: {
      userId: string;
      billableMinutes: number;
      amount: number;
    }[];
  }> {
    const entries = await timeEntryService.findAll(tenantId, {
      startDate,
      endDate,
    });

    const projects = await projectService.findAll(tenantId);
    const projectMap = new Map(projects.map(p => [p.id, p]));

    let totalBillableMinutes = 0;
    let totalNonBillableMinutes = 0;

    const byProjectMap: Record<string, number> = {};
    const byUserMap: Record<string, number> = {};

    for (const entry of entries) {
      if (entry.isBillable) {
        totalBillableMinutes += entry.duration;

        if (!byProjectMap[entry.projectId]) {
          byProjectMap[entry.projectId] = 0;
        }
        byProjectMap[entry.projectId] += entry.duration;

        if (!byUserMap[entry.userId]) {
          byUserMap[entry.userId] = 0;
        }
        byUserMap[entry.userId] += entry.duration;
      } else {
        totalNonBillableMinutes += entry.duration;
      }
    }

    const byProject = Object.entries(byProjectMap).map(([projectId, minutes]) => {
      const project = projectMap.get(projectId);
      return {
        projectId,
        projectName: project?.name || 'Unknown',
        hourlyRate: project?.hourlyRate || 0,
        billableMinutes: minutes,
        amount: (minutes / 60) * (project?.hourlyRate || 0),
      };
    });

    const byUser = Object.entries(byUserMap).map(([userId, minutes]) => {
      // Calculate user's effective rate (average of their projects)
      const userProjects = entries
        .filter(e => e.userId === userId && e.isBillable)
        .map(e => projectMap.get(e.projectId)?.hourlyRate || 0);
      const avgRate = userProjects.length > 0
        ? userProjects.reduce((a, b) => a + b, 0) / userProjects.length
        : 0;

      return {
        userId,
        billableMinutes: minutes,
        amount: (minutes / 60) * avgRate,
      };
    });

    return {
      totalBillableMinutes,
      totalNonBillableMinutes,
      byProject,
      byUser,
    };
  }

  async getDailyBreakdown(tenantId: string, userId: string, startDate: Date, endDate: Date): Promise<{
    date: string;
    totalMinutes: number;
    entries: { projectId: string; duration: number }[];
  }[]> {
    const entries = await timeEntryService.findAll(tenantId, {
      userId,
      startDate,
      endDate,
    });

    const byDate: Record<string, { total: number; projects: Record<string, number> }> = {};

    for (const entry of entries) {
      const dateKey = entry.startTime.toISOString().split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = { total: 0, projects: {} };
      }
      byDate[dateKey].total += entry.duration;
      byDate[dateKey].projects[entry.projectId] = (byDate[dateKey].projects[entry.projectId] || 0) + entry.duration;
    }

    return Object.entries(byDate)
      .map(([date, data]) => ({
        date,
        totalMinutes: data.total,
        entries: Object.entries(data.projects).map(([projectId, duration]) => ({
          projectId,
          duration,
        })),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const reportService = new ReportService();
