import cron from 'node-cron';
import { ScheduledReport, Report } from '../models';
import { logger } from '../utils/logger';
import { dashboardService } from './dashboardService';
import { employeeAnalyticsService } from './employeeAnalyticsService';
import { attendanceAnalyticsService } from './attendanceAnalyticsService';
import { payrollAnalyticsService } from './payrollAnalyticsService';
import { performanceAnalyticsService } from './performanceAnalyticsService';

export class ScheduledReportService {
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Create a new scheduled report
   */
  async createScheduledReport(data: {
    reportId: string;
    reportName: string;
    reportType: string;
    schedule: {
      frequency: string;
      dayOfWeek?: number;
      dayOfMonth?: number;
      hour: number;
      minute: number;
      timezone: string;
    };
    recipients: { email: string; name?: string }[];
    format: string;
    filters?: Record<string, unknown>;
    createdBy: string;
  }): Promise<{ success: boolean; scheduledReport?: unknown; error?: string }> {
    try {
      // Calculate next run time
      const nextRunAt = this.calculateNextRunTime(data.schedule);

      const scheduledReport = new ScheduledReport({
        reportId: data.reportId,
        reportName: data.reportName,
        reportType: data.reportType,
        schedule: data.schedule,
        recipients: data.recipients,
        format: data.format,
        filters: data.filters,
        isActive: true,
        nextRunAt,
        createdBy: data.createdBy,
      });

      await scheduledReport.save();

      logger.info('Scheduled report created', { id: scheduledReport._id });

      return { success: true, scheduledReport };
    } catch (error) {
      logger.error('Failed to create scheduled report:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * List all scheduled reports
   */
  async listScheduledReports(filters?: {
    isActive?: boolean;
    reportType?: string;
  }): Promise<unknown[]> {
    try {
      const query: Record<string, unknown> = {};

      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      if (filters?.reportType) {
        query.reportType = filters.reportType;
      }

      const reports = await ScheduledReport.find(query)
        .sort({ createdAt: -1 })
        .lean();

      return reports;
    } catch (error) {
      logger.error('Failed to list scheduled reports:', error);
      return [];
    }
  }

  /**
   * Update a scheduled report
   */
  async updateScheduledReport(
    id: string,
    updates: Partial<{
      schedule: {
        frequency: string;
        dayOfWeek?: number;
        dayOfMonth?: number;
        hour: number;
        minute: number;
        timezone: string;
      };
      recipients: { email: string; name?: string }[];
      format: string;
      filters: Record<string, unknown>;
      isActive: boolean;
    }>
  ): Promise<{ success: boolean; scheduledReport?: unknown; error?: string }> {
    try {
      const scheduledReport = await ScheduledReport.findById(id);

      if (!scheduledReport) {
        return { success: false, error: 'Scheduled report not found' };
      }

      // Update fields
      if (updates.schedule) {
        scheduledReport.schedule = {
          ...updates.schedule,
          frequency: updates.schedule.frequency as 'daily' | 'weekly' | 'monthly' | 'quarterly'
        };
        scheduledReport.nextRunAt = this.calculateNextRunTime(scheduledReport.schedule);
      }
      if (updates.recipients) {
        scheduledReport.recipients = updates.recipients;
      }
      if (updates.format) {
        scheduledReport.format = updates.format as 'pdf' | 'csv' | 'excel' | 'json';
      }
      if (updates.filters) {
        scheduledReport.filters = updates.filters;
      }
      if (updates.isActive !== undefined) {
        scheduledReport.isActive = updates.isActive;
      }

      await scheduledReport.save();

      return { success: true, scheduledReport };
    } catch (error) {
      logger.error('Failed to update scheduled report:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Delete a scheduled report
   */
  async deleteScheduledReport(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await ScheduledReport.findByIdAndDelete(id);
      logger.info('Scheduled report deleted', { id });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete scheduled report:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Start the scheduler
   */
  startScheduler(): void {
    // Run every minute to check for reports to execute
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.executeDueReports();
    });

    logger.info('Scheduled report scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Scheduled report scheduler stopped');
    }
  }

  /**
   * Execute all due reports
   */
  private async executeDueReports(): Promise<void> {
    try {
      const now = new Date();
      const dueReports = await ScheduledReport.find({
        isActive: true,
        nextRunAt: { $lte: now },
      });

      for (const scheduledReport of dueReports) {
        await this.executeReport(scheduledReport);
      }
    } catch (error) {
      logger.error('Error executing due reports:', error);
    }
  }

  /**
   * Execute a single scheduled report
   */
  private async executeReport(scheduledReport: typeof ScheduledReport.prototype): Promise<void> {
    try {
      logger.info('Executing scheduled report', {
        id: scheduledReport._id,
        name: scheduledReport.reportName,
      });

      // Generate the report based on type
      let reportData: unknown;

      switch (scheduledReport.reportType) {
        case 'dashboard':
          reportData = await dashboardService.getDashboardMetrics(
            scheduledReport.filters as { startDate?: string; endDate?: string; department?: string }
          );
          break;
        case 'employees':
          reportData = await employeeAnalyticsService.getEmployeeMetrics(
            scheduledReport.filters as { department?: string; startDate?: string; endDate?: string }
          );
          break;
        case 'attendance':
          reportData = await attendanceAnalyticsService.getAttendanceMetrics(
            scheduledReport.filters as { startDate: string; endDate: string; department?: string }
          );
          break;
        case 'payroll':
          reportData = await payrollAnalyticsService.getPayrollMetrics(
            scheduledReport.filters as { startDate: string; endDate: string; department?: string }
          );
          break;
        case 'performance':
          reportData = await performanceAnalyticsService.getPerformanceMetrics(
            scheduledReport.filters as { startDate?: string; endDate?: string; department?: string }
          );
          break;
        default:
          logger.warn('Unknown report type:', scheduledReport.reportType);
          return;
      }

      // Save the generated report
      const report = new Report({
        name: scheduledReport.reportName,
        type: scheduledReport.reportType as 'dashboard' | 'employees' | 'attendance' | 'payroll' | 'performance' | 'custom',
        data: reportData,
        generatedAt: new Date(),
        filters: scheduledReport.filters,
      });
      await report.save();

      // Send to recipients (mock - in production, send email)
      await this.sendReportToRecipients(scheduledReport, report);

      // Update last run time and calculate next run
      scheduledReport.lastRunAt = new Date();
      scheduledReport.nextRunAt = this.calculateNextRunTime(scheduledReport.schedule);
      await scheduledReport.save();

      logger.info('Scheduled report executed successfully', {
        id: scheduledReport._id,
        name: scheduledReport.reportName,
      });
    } catch (error) {
      logger.error('Failed to execute scheduled report:', {
        id: scheduledReport._id,
        name: scheduledReport.reportName,
        error,
      });
    }
  }

  /**
   * Send report to recipients (mock implementation)
   */
  private async sendReportToRecipients(
    scheduledReport: typeof ScheduledReport.prototype,
    report: typeof Report.prototype
  ): Promise<void> {
    // In production, this would:
    // 1. Generate the report in the requested format (PDF, CSV, etc.)
    // 2. Send email to each recipient
    // 3. Log the delivery status

    logger.info('Sending report to recipients', {
      reportId: report._id,
      recipients: scheduledReport.recipients.map((r: { email: string }) => r.email),
      format: scheduledReport.format,
    });
  }

  /**
   * Calculate next run time based on schedule
   */
  private calculateNextRunTime(schedule: {
    frequency: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour: number;
    minute: number;
    timezone: string;
  }): Date {
    const now = new Date();
    const next = new Date(now);

    next.setHours(schedule.hour, schedule.minute, 0, 0);

    switch (schedule.frequency) {
      case 'daily':
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;
      case 'weekly':
        const targetDay = schedule.dayOfWeek ?? 1; // Default Monday
        const currentDay = now.getDay();
        let daysUntilTarget = targetDay - currentDay;
        if (daysUntilTarget <= 0) daysUntilTarget += 7;
        next.setDate(now.getDate() + daysUntilTarget);
        break;
      case 'monthly':
        const targetDate = schedule.dayOfMonth ?? 1;
        next.setDate(targetDate);
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
        break;
      case 'quarterly':
        const quarterMonth = (Math.floor(now.getMonth() / 3) + 1) * 3;
        next.setMonth(quarterMonth, schedule.dayOfMonth ?? 1);
        if (next <= now) {
          next.setMonth(quarterMonth + 3, schedule.dayOfMonth ?? 1);
        }
        break;
    }

    return next;
  }
}

export const scheduledReportService = new ScheduledReportService();
