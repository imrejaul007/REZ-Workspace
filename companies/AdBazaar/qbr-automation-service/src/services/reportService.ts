/**
 * Report Service - QBR report generation
 */

import { ReportModel, IReport } from '../models/report';
import { SectionModel } from '../models/section';
import { QBRModel } from '../models/qbr';
import { logger } from 'utils/logger.js';
import { reportGenerationDuration } from '../utils/metrics';

export class ReportService {
  /**
   * Generate QBR report
   */
  async generateReport(
    qbrId: string,
    format: 'pdf' | 'pptx' | 'html' | 'json' = 'pdf'
  ): Promise<IReport> {
    const qbr = await QBRModel.findById(qbrId);
    if (!qbr) {
      throw new Error('QBR not found');
    }

    logger.info(`Generating ${format} report for QBR ${qbrId}`);

    const report = await ReportModel.create({
      qbrId,
      customerId: qbr.customerId,
      version: '1.0.0',
      format,
      status: 'generating',
      sections: [],
 });

    const startTime = Date.now();

    try {
      // Get all sections for this QBR
      const sections = await SectionModel.find({ qbrId }).sort({ order: 1 }).lean();

      // Update report with sections
      report.sections = sections.map(s => ({
        sectionId: s._id.toString(),
        name: s.name,
        content: s.content,
        order: s.order,
      }));

      // Simulate report generation (in production, would generate actual file)
      await new Promise(resolve => setTimeout(resolve, 1000));

      report.status = 'completed';
      report.generatedAt = new Date();
      report.generatedBy = 'qbr-automation-service';
      report.fileUrl = `/reports/${qbrId}.${format}`;
      report.fileSize = Math.floor(Math.random() * 500000) + 100000; // Mock file size

      await report.save();

      const duration = Date.now() - startTime;
      reportGenerationDuration.observe(duration / 1000);

      logger.info(`Report ${report._id} generated successfully (${duration}ms)`);
    } catch (error) {
      report.status = 'failed';
      await report.save();
      throw error;
    }

    return report;
  }

  /**
   * Get report by ID
   */
  async getReport(reportId: string): Promise<IReport | null> {
    return ReportModel.findById(reportId).lean();
  }

  /**
   * Get reports for a QBR
   */
  async getReportsByQBR(qbrId: string): Promise<IReport[]> {
    return ReportModel.find({ qbrId })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(reportId: string): Promise<IReport | null> {
    return ReportModel.findByIdAndUpdate(
      reportId,
      { $inc: { downloadCount: 1 } },
      { new: true }
    ).lean();
  }

  /**
   * Get report analytics
   */
  async getAnalytics(days: number = 90): Promise<{
    totalReports: number;
    byFormat: Record<string, number>;
    avgGenerationTime: number;
    totalDownloads: number;
    mostDownloaded: IReport[];
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const reports = await ReportModel.find({
      createdAt: { $gte: startDate },
    }).lean();

    const byFormat: Record<string, number> = {};
    let totalDownloads = 0;
    let totalSize = 0;

    reports.forEach(report => {
      byFormat[report.format] = (byFormat[report.format] || 0) + 1;
      totalDownloads += report.downloadCount;
      if (report.fileSize) totalSize += report.fileSize;
    });

    const mostDownloaded = [...reports]
      .sort((a, b) => b.downloadCount - a.downloadCount)
      .slice(0, 5);

    return {
      totalReports: reports.length,
      byFormat,
      avgGenerationTime: reports.length > 0 ? Math.round(totalSize / reports.length / 1000) : 0,
      totalDownloads,
      mostDownloaded,
    };
  }

  /**
   * Delete old reports
   */
  async deleteOldReports(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await ReportModel.deleteMany({
      createdAt: { $lt: cutoffDate },
      downloadCount: 0,
    });

    logger.info(`Deleted ${result.deletedCount} old reports`);
    return result.deletedCount;
  }
}

export const reportService = new ReportService();