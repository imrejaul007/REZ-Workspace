import { SequenceAnalytics, ISequenceAnalytics, Enrollment, Sequence } from '../models';
import { createChildLogger } from 'utils/logger.js';
import { stepsCompletedTotal } from '../utils/metrics';

const logger = createChildLogger('AnalyticsService');

export interface SequenceAnalyticsSummary {
  sequenceId: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  droppedEnrollments: number;
  conversionRate: number;
  emailMetrics: {
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  };
  avgCompletionTime: number;
  stepFunnel: {
    step: number;
    name: string;
    type: string;
    entered: number;
    completed: number;
    dropOff: number;
  }[];
}

export class AnalyticsService {
  async getSequenceAnalytics(sequenceId: string): Promise<SequenceAnalyticsSummary | null> {
    const sequence = await Sequence.findById(sequenceId);
    if (!sequence) return null;

    const enrollments = await Enrollment.find({ sequenceId });

    const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
    const droppedEnrollments = enrollments.filter(e => e.status === 'dropped').length;

    const totalEnrollments = enrollments.length;
    const conversionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

    // Calculate email metrics
    const emailMetrics = enrollments.reduce(
      (acc, e) => ({
        sent: acc.sent + e.metrics.emailsSent,
        opened: acc.opened + e.metrics.emailsOpened,
        clicked: acc.clicked + e.metrics.emailsClicked
      }),
      { sent: 0, opened: 0, clicked: 0 }
    );

    const openRate = emailMetrics.sent > 0 ? (emailMetrics.opened / emailMetrics.sent) * 100 : 0;
    const clickRate = emailMetrics.sent > 0 ? (emailMetrics.clicked / emailMetrics.sent) * 100 : 0;

    // Calculate average completion time
    const completedWithTime = enrollments.filter(e => e.completedAt && e.startedAt);
    const avgCompletionTime = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, e) => {
          return sum + (new Date(e.completedAt!).getTime() - new Date(e.startedAt!).getTime());
        }, 0) / completedWithTime.length / 1000 // Convert to seconds
      : 0;

    // Build step funnel
    const stepFunnel = sequence.steps.map((step, index) => {
      const entered = enrollments.filter(e => e.currentStep >= index || e.status === 'completed').length;
      const completed = enrollments.filter(e => e.stepHistory.some(h => h.stepOrder === index && h.status === 'completed')).length;
      const previousEntered = index === 0 ? totalEnrollments : stepFunnel[index - 1]?.entered || totalEnrollments;

      return {
        step: index,
        name: step.name,
        type: step.type,
        entered,
        completed,
        dropOff: previousEntered - entered
      };
    });

    return {
      sequenceId,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      droppedEnrollments,
      conversionRate: Math.round(conversionRate * 100) / 100,
      emailMetrics: {
        sent: emailMetrics.sent,
        opened: emailMetrics.opened,
        clicked: emailMetrics.clicked,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100
      },
      avgCompletionTime: Math.round(avgCompletionTime),
      stepFunnel
    };
  }

  async recordStepCompletion(enrollmentId: string, stepOrder: number, result?: Record<string, unknown>): Promise<void> {
    stepsCompletedTotal.inc({ sequence_id: 'unknown' }); // Will be fixed with proper label

    // Create analytics record
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analytics = await SequenceAnalytics.findOne({
      sequenceId: enrollment.sequenceId,
      date: today
    });

    if (!analytics) {
      analytics = new SequenceAnalytics({
        sequenceId: enrollment.sequenceId,
        userId: enrollment.userId,
        date: today,
        metrics: {},
        stepMetrics: [],
        conversionFunnel: []
      });
    }

    // Update metrics
    const stepIndex = analytics.stepMetrics.findIndex(s => s.stepOrder === stepOrder);
    if (stepIndex >= 0) {
      analytics.stepMetrics[stepIndex].completed++;
    }

    await analytics.save();
  }

  async getAnalyticsForDateRange(
    sequenceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ISequenceAnalytics[]> {
    return SequenceAnalytics.find({
      sequenceId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
  }

  async getUserAnalytics(userId: string): Promise<{
    totalSequences: number;
    activeSequences: number;
    totalEnrollments: number;
    totalCompletions: number;
    avgConversionRate: number;
  }> {
    const sequences = await Sequence.find({ userId, isTemplate: false });
    const enrollments = await Enrollment.find({ userId });

    const totalEnrollments = enrollments.length;
    const totalCompletions = enrollments.filter(e => e.status === 'completed').length;

    return {
      totalSequences: sequences.length,
      activeSequences: sequences.filter(s => s.status === 'active').length,
      totalEnrollments,
      totalCompletions,
      avgConversionRate: totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0
    };
  }
}

export const analyticsService = new AnalyticsService();