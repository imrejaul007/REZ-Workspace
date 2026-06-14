import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import { AuthenticityCheck, CheckHistory } from '../models';
import { logger } from 'utils/logger.js';

export interface DetailedReport {
  summary: {
    influencer: {
      platform: string;
      username: string;
    };
    overallScore: number;
    riskLevel: string;
    lastChecked: Date;
  };
  scores: {
    followerQuality: number;
    engagementAuthenticity: number;
    historicalPattern: number;
    botLikelihood: number;
  };
  breakdown: {
    category: string;
    score: number;
    factors: Record<string, number>;
  }[];
  flags: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  recommendations: Array<{
    category: string;
    priority: string;
    title: string;
    description: string;
    action: string;
  }>;
  history?: {
    totalChecks: number;
    trend: {
      direction: string;
      scoreChange: number;
    };
    averageScore: number;
  };
  generatedAt: Date;
}

export class ReportService {
  /**
   * Generate detailed report for a check
   */
  async generateReport(checkId: string): Promise<DetailedReport | null> {
    const check = await AuthenticityCheck.findById(checkId);
    if (!check) {
      return null;
    }

    const history = await CheckHistory.findOne({ influencerId: check.influencerId });

    // Build flag descriptions
    const flagDescriptions: Record<string, { severity: 'low' | 'medium' | 'high'; description: string }> = {
      suspicious_growth: {
        severity: 'high',
        description: 'Sudden or unusual follower growth pattern detected',
      },
      bot_engagement: {
        severity: 'high',
        description: 'Automated or bot-like engagement behavior detected',
      },
      purchased_followers: {
        severity: 'high',
        description: 'Signs of purchased or fake followers detected',
      },
      unusual_posting_pattern: {
        severity: 'medium',
        description: 'Posting frequency or timing is unusual',
      },
      low_engagement_rate: {
        severity: 'medium',
        description: 'Engagement rate is below platform benchmarks',
      },
      fake_followers_ratio: {
        severity: 'high',
        description: 'High ratio of potentially fake followers',
      },
      engagement_inconsistency: {
        severity: 'medium',
        description: 'Engagement patterns are inconsistent across posts',
      },
      content_quality_issues: {
        severity: 'low',
        description: 'Content quality metrics are below average',
      },
    };

    const report: DetailedReport = {
      summary: {
        influencer: {
          platform: check.platform,
          username: check.username,
        },
        overallScore: check.overallScore,
        riskLevel: check.riskLevel,
        lastChecked: check.date,
      },
      scores: check.scores,
      breakdown: [
        {
          category: 'Follower Quality',
          score: check.breakdown.followerQuality.score,
          factors: check.breakdown.followerQuality.factors,
        },
        {
          category: 'Engagement Authenticity',
          score: check.breakdown.engagementAuthenticity.score,
          factors: check.breakdown.engagementAuthenticity.factors,
        },
        {
          category: 'Historical Pattern',
          score: check.breakdown.historicalPattern.score,
          factors: check.breakdown.historicalPattern.factors,
        },
        {
          category: 'Bot Likelihood',
          score: 100 - check.breakdown.botLikelihood.score,
          factors: check.breakdown.botLikelihood.factors,
        },
      ],
      flags: check.flags.map((flag) => ({
        type: flag,
        ...(flagDescriptions[flag] || { severity: 'medium' as const, description: 'Unknown flag type' }),
      })),
      recommendations: check.recommendations.map((rec) => ({
        category: rec.category,
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        action: rec.action,
      })),
      generatedAt: new Date(),
    };

    if (history) {
      report.history = {
        totalChecks: history.totalChecks,
        trend: {
          direction: history.trend.direction,
          scoreChange: history.trend.scoreChange,
        },
        averageScore: Math.round(history.averageScore * 100) / 100,
      };
    }

    return report;
  }

  /**
   * Export report as PDF
   */
  async exportPDF(checkId: string): Promise<Buffer> {
    const report = await this.generateReport(checkId);
    if (!report) {
      throw new Error('Report not found');
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50 });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text('Influencer Authenticity Report', { align: 'center' });
      doc.moveDown();

      // Summary section
      doc.fontSize(16).font('Helvetica-Bold').text('Summary');
      doc.fontSize(12).font('Helvetica');
      doc.text(`Platform: ${report.summary.influencer.platform}`);
      doc.text(`Username: ${report.summary.influencer.username}`);
      doc.text(`Overall Score: ${report.summary.overallScore}/100`);
      doc.text(`Risk Level: ${report.summary.riskLevel.toUpperCase()}`);
      doc.text(`Last Checked: ${report.summary.lastChecked.toISOString()}`);
      doc.moveDown();

      // Scores section
      doc.fontSize(16).font('Helvetica-Bold').text('Authenticity Scores');
      doc.fontSize(12).font('Helvetica');
      doc.text(`Follower Quality: ${report.scores.followerQuality}/100`);
      doc.text(`Engagement Authenticity: ${report.scores.engagementAuthenticity}/100`);
      doc.text(`Historical Pattern: ${report.scores.historicalPattern}/100`);
      doc.text(`Bot Likelihood: ${report.scores.botLikelihood}/100`);
      doc.moveDown();

      // Flags section
      if (report.flags.length > 0) {
        doc.fontSize(16).font('Helvetica-Bold').text('Authenticity Flags');
        doc.fontSize(12).font('Helvetica');
        report.flags.forEach((flag) => {
          doc.text(`- ${flag.type.replace(/_/g, ' ')} [${flag.severity.toUpperCase()}]: ${flag.description}`);
        });
        doc.moveDown();
      }

      // Recommendations section
      if (report.recommendations.length > 0) {
        doc.fontSize(16).font('Helvetica-Bold').text('Recommendations');
        doc.fontSize(12).font('Helvetica');
        report.recommendations.forEach((rec, index) => {
          doc.text(`${index + 1}. ${rec.title} [${rec.priority.toUpperCase()}]`);
          doc.text(`   ${rec.description}`);
          doc.text(`   Action: ${rec.action}`);
          doc.moveDown(0.5);
        });
      }

      // History section
      if (report.history) {
        doc.moveDown();
        doc.fontSize(16).font('Helvetica-Bold').text('Check History');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Total Checks: ${report.history.totalChecks}`);
        doc.text(`Average Score: ${report.history.averageScore}/100`);
        doc.text(`Trend: ${report.history.trend.direction} (${report.history.trend.scoreChange > 0 ? '+' : ''}${report.history.trend.scoreChange})`);
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Generated on ${report.generatedAt.toISOString()}`, { align: 'center' });
      doc.text('Powered by AdBazaar Influencer Authenticity Check', { align: 'center' });

      doc.end();
    });
  }

  /**
   * Export report as CSV
   */
  async exportCSV(checkId: string): Promise<string> {
    const report = await this.generateReport(checkId);
    if (!report) {
      throw new Error('Report not found');
    }

    const fields = [
      { label: 'Platform', value: 'summary.influencer.platform' },
      { label: 'Username', value: 'summary.influencer.username' },
      { label: 'Overall Score', value: 'summary.overallScore' },
      { label: 'Risk Level', value: 'summary.riskLevel' },
      { label: 'Follower Quality Score', value: 'scores.followerQuality' },
      { label: 'Engagement Authenticity Score', value: 'scores.engagementAuthenticity' },
      { label: 'Historical Pattern Score', value: 'scores.historicalPattern' },
      { label: 'Bot Likelihood Score', value: 'scores.botLikelihood' },
      { label: 'Flags', value: (row: DetailedReport) => row.flags.map((f) => f.type).join('; ') },
      { label: 'Last Checked', value: (row: DetailedReport) => row.summary.lastChecked.toISOString() },
      { label: 'Generated At', value: (row: DetailedReport) => row.generatedAt.toISOString() },
    ];

    const parser = new Parser({ fields });
    return parser.parse(report);
  }
}

export const reportService = new ReportService();