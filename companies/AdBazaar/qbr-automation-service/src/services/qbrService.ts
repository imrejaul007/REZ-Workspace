/**
 * QBR Service - Core business logic
 */

import { QBRModel, IQBR } from '../models/qbr';
import { SectionModel } from '../models/section';
import { ScheduleModel } from '../models/schedule';
import { logger } from 'utils/logger.js';
import { qbrCompletionCounter } from '../utils/metrics';

export class QBRService {
  /**
   * Create a new QBR
   */
  async createQBR(data: {
    customerId: string;
    customerName: string;
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    year: number;
    scheduledDate?: Date;
    assignedTo?: string;
    attendees?: string[];
    meetingLink?: string;
  }): Promise<IQBR> {
    logger.info(`Creating QBR for customer ${data.customerId}, ${data.quarter} ${data.year}`);

    const defaultSections = [
      { sectionId: 'exec-summary', name: 'Executive Summary', status: 'pending' },
      { sectionId: 'usage-metrics', name: 'Usage Metrics', status: 'pending' },
      { sectionId: 'health-score', name: 'Health Score Analysis', status: 'pending' },
      { sectionId: 'roi-analysis', name: 'ROI Analysis', status: 'pending' },
      { sectionId: 'challenges', name: 'Challenges& Risks', status: 'pending' },
      { sectionId: 'action-items', name: 'Action Items', status: 'pending' },
      { sectionId: 'roadmap', name: 'Product Roadmap', status: 'pending' },
    ];

    const qbr = await QBRModel.create({
      ...data,
      status: 'planned',
      sections: defaultSections,
      attendees: data.attendees || [],
    });

    logger.info(`QBR created: ${qbr._id}`);
    return qbr;
  }

  /**
   * Get QBR by ID
   */
  async getQBR(qbrId: string): Promise<IQBR | null> {
    return QBRModel.findById(qbrId).lean();
  }

  /**
   * Update QBR
   */
  async updateQBR(qbrId: string, updates: Partial<IQBR>): Promise<IQBR | null> {
    const qbr = await QBRModel.findByIdAndUpdate(
      qbrId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).lean();

    if (qbr) {
      logger.info(`QBR ${qbrId} updated`);
    }

    return qbr;
  }

  /**
   * Generate QBR content
   */
  async generateQBR(qbrId: string): Promise<IQBR> {
    const qbr = await QBRModel.findById(qbrId);
    if (!qbr) {
      throw new Error('QBR not found');
    }

    logger.info(`Generating QBR content for ${qbrId}`);

    // Update QBR status
    qbr.status = 'in_progress';
    await qbr.save();

    // Generate sections with content
    for (const section of qbr.sections) {
      const sectionData = await this.generateSectionContent(qbr.customerId, section.sectionId, section.name);
      await SectionModel.create({
        qbrId: qbrId,
        name: section.name,
        type: this.mapSectionType(section.sectionId),
        order: qbr.sections.indexOf(section) + 1,
        status: 'completed',
        content: sectionData,
        generatedAt: new Date(),
        generatedBy: 'qbr-automation-service',
      });

      // Update section status in QBR
      const qbrSection = qbr.sections.find(s => s.sectionId === section.sectionId);
      if (qbrSection) {
        qbrSection.status = 'completed';
        qbrSection.completedAt = new Date();
      }
    }

    qbr.status = 'completed';
    qbr.completedDate = new Date();
    await qbr.save();

    qbrCompletionCounter.inc({ status: 'completed' });
    logger.info(`QBR ${qbrId} generation completed`);

    return qbr;
  }

  /**
   * Generate content for a section
   */
  private async generateSectionContent(customerId: string, sectionId: string, sectionName: string): Promise<any> {
    // In production, this would integrate with analytics, health score, etc.
    const mockMetrics = {
      usage: Math.floor(Math.random() * 10000),
      activeUsers: Math.floor(Math.random() * 500),
      apiCalls: Math.floor(Math.random() * 100000),
      nps: Math.floor(Math.random() * 10),
 };

    switch (sectionId) {
      case 'exec-summary':
        return {
          summary: `Quarterly performance overview for customer ${customerId}`,
          insights: [
            'Strong adoption of core features',
            'Improved user engagement metrics',
            'Successful integration with existing systems',
          ],
        };

      case 'usage-metrics':
        return {
          metrics: [
            { name: 'Total Usage', value: mockMetrics.usage, change: 15, trend: 'up' },
            { name: 'Active Users', value: mockMetrics.activeUsers, change: 8, trend: 'up' },
            { name: 'API Calls', value: mockMetrics.apiCalls, change: 22, trend: 'up' },
          ],
        };

      case 'health-score':
        return {
          metrics: [
            { name: 'Health Score', value: 75, change: 5, trend: 'up' },
            { name: 'Engagement', value: 80, change: 10, trend: 'up' },
            { name: 'Adoption', value: 70, change: -2, trend: 'down' },
          ],
          insights: ['Health score improved due to increased engagement'],
        };

      case 'roi-analysis':
        return {
          summary: 'ROI analysis showing positive returns',
          metrics: [
            { name: 'Cost Savings', value: '$50,000', change: 20, trend: 'up' },
            { name: 'Efficiency Gain', value: '35%', change: 10, trend: 'up' },
          ],
        };

      case 'challenges':
        return {
          risks: [
            'Training adoption needs improvement',
            'Integration complexity with legacy systems',
          ],
          opportunities: [
            'Expand to additional departments',
            'Leverage advanced features for analytics',
          ],
        };

      case 'action-items':
        return {
          insights: [
            'Schedule follow-up training session',
            'Review integration documentation',
            'Plan feature roadmap for next quarter',
          ],
        };

      case 'roadmap':
        return {
          insights: [
            'Q1: Advanced analytics module',
            'Q2: AI-powered recommendations',
            'Q3: Mobile app enhancement',
          ],
        };

      default:
        return { summary: `Content for ${sectionName}` };
    }
  }

  /**
   * Map section ID to type
   */
  private mapSectionType(sectionId: string): string {
    const mapping: Record<string, string> = {
      'exec-summary': 'executive_summary',
      'usage-metrics': 'usage_metrics',
      'health-score': 'health_score',
      'roi-analysis': 'roi_analysis',
      'challenges': 'challenges',
      'action-items': 'action_items',
      'roadmap': 'roadmap',
    };
    return mapping[sectionId] || 'custom';
  }

  /**
   * Get QBRs by customer
   */
  async getQBRsByCustomer(customerId: string): Promise<IQBR[]> {
    return QBRModel.find({ customerId })
      .sort({ year: -1, quarter: -1 })
      .lean();
  }

  /**
   * Get QBRs by quarter
   */
  async getQBRsByQuarter(quarter: string, year: number): Promise<IQBR[]> {
    return QBRModel.find({ quarter, year })
      .sort({ customerName: 1 })
      .lean();
  }

  /**
   * Get upcoming QBRs
   */
  async getUpcomingQBRs(days: number = 30): Promise<IQBR[]> {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

    return QBRModel.find({
      status: 'planned',
      scheduledDate: { $gte: startDate, $lte: endDate },
    }).sort({ scheduledDate: 1 }).lean();
  }

  /**
   * Schedule QBR
   */
  async scheduleQBR(qbrId: string, scheduledDate: Date, attendees: string[]): Promise<IQBR | null> {
    return this.updateQBR(qbrId, {
      scheduledDate,
      attendees,
      status: 'planned',
    });
  }

  /**
   * Cancel QBR
   */
  async cancelQBR(qbrId: string): Promise<IQBR | null> {
    return this.updateQBR(qbrId, { status: 'cancelled' });
  }
}

export const qbrService = new QBRService();