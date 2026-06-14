/**
 * NPS Service - Core business logic
 */

import { SurveyModel, ISurvey } from '../models/survey';
import { ResponseModel } from '../models/response';
import { logger } from 'utils/logger.js';
import { npsScoreGauge, surveySentCounter, surveyResponseCounter, surveyResponseTime } from '../utils/metrics';

export class NPSService {
  /**
   * Create a survey
   */
  async createSurvey(data: {
    customerId: string;
    type: 'transactional' | 'relationship' | 'churn' | 'onboarding' | 'support';
    questions?: {
      order: number;
      text: string;
      type: 'nps' | 'rating' | 'text' | 'multiple_choice';
      required: boolean;
      options?: string[];
    }[];
    expiresInDays?: number;
    triggeredBy?: string;
  }): Promise<ISurvey> {
    logger.info(`Creating NPS survey for customer ${data.customerId}`);

    const defaultQuestions = [
      { order: 1, text: 'How likely are you to recommend us?', type: 'nps' as const, required: true },
      { order: 2, text: 'What could we improve?', type: 'text' as const, required: false },
    ];

    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const survey = await SurveyModel.create({
      customerId: data.customerId,
      type: data.type,
      status: 'draft',
      questions: data.questions || defaultQuestions,
      expiresAt,
      triggeredBy: data.triggeredBy,
    });

    logger.info(`Survey created: ${survey._id}`);
    return survey;
  }

  /**
   * Send a survey
   */
  async sendSurvey(surveyId: string): Promise<ISurvey | null> {
    const survey = await SurveyModel.findByIdAndUpdate(
      surveyId,
      {
        status: 'sent',
        sentAt: new Date(),
      },
      { new: true }
    ).lean();

    if (survey) {
      surveySentCounter.inc({ type: survey.type });
      logger.info(`Survey ${surveyId} sent to customer ${survey.customerId}`);
    }

    return survey;
  }

  /**
   * Get survey by ID
   */
  async getSurvey(surveyId: string): Promise<ISurvey | null> {
    return SurveyModel.findById(surveyId).lean();
  }

  /**
   * Submit survey response
   */
  async submitResponse(data: {
    surveyId: string;
    answers: {
      questionOrder: number;
      questionText: string;
      answerType: 'nps' | 'rating' | 'text' | 'multiple_choice';
      npsScore?: number;
      ratingValue?: number;
      textAnswer?: string;
      selectedOption?: string;
    }[];
    feedback?: string;
    submittedAt?: Date;
  }): Promise<any> {
    const survey = await SurveyModel.findById(data.surveyId);
    if (!survey) {
      throw new Error('Survey not found');
    }

    if (survey.status === 'completed') {
      throw new Error('Survey already completed');
    }

    // Calculate overall NPS score from first NPS question
    const npsAnswer = data.answers.find(a => a.answerType === 'nps' && a.npsScore !== undefined);
    const overallScore = npsAnswer?.npsScore ?? 5;

    // Determine score category
    let scoreCategory: 'detractor' | 'passive' | 'promoter';
    if (overallScore <= 6) {
      scoreCategory = 'detractor';
    } else if (overallScore <= 8) {
      scoreCategory = 'passive';
    } else {
      scoreCategory = 'promoter';
    }

    // Calculate time to complete
    const timeToComplete = survey.sentAt
      ? Math.round((new Date().getTime() - survey.sentAt.getTime()) / 1000)
      : undefined;

    // Extract improvement areas from feedback
    const improvementAreas: string[] = [];
    if (data.feedback) {
      const keywords = ['slow', 'expensive', 'complicated', 'unreliable', 'confusing', 'bug', 'feature'];
      keywords.forEach(keyword => {
        if (data.feedback!.toLowerCase().includes(keyword)) {
          improvementAreas.push(keyword);
        }
      });
    }

    // Create response
    const response = await ResponseModel.create({
      surveyId: data.surveyId,
      customerId: survey.customerId,
      answers: data.answers,
      overallScore,
      scoreCategory,
      feedback: data.feedback,
      improvementAreas,
      submittedAt: data.submittedAt || new Date(),
      timeToComplete,
    });

    // Update survey status
    survey.status = 'completed';
    survey.score = overallScore;
    survey.completedAt = new Date();
    await survey.save();

    // Record metrics
    surveyResponseCounter.inc({ score_category: scoreCategory });
    if (timeToComplete) {
      surveyResponseTime.observe(timeToComplete);
    }
    npsScoreGauge.set({ customer_id: survey.customerId, period: 'latest' }, overallScore);

    logger.info(`Survey ${data.surveyId} completed with score ${overallScore}`);
    return response;
  }

  /**
   * Get customer NPS history
   */
  async getCustomerHistory(customerId: string, limit: number = 10): Promise<any[]> {
    return ResponseModel.find({ customerId })
      .sort({ submittedAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get survey by customer
   */
  async getSurveyByCustomer(customerId: string): Promise<ISurvey | null> {
    return SurveyModel.findOne({ customerId })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get pending surveys
   */
  async getPendingSurveys(): Promise<ISurvey[]> {
    return SurveyModel.find({
      status: 'sent',
      expiresAt: { $gt: new Date() },
    }).lean();
  }

  /**
   * Mark expired surveys
   */
  async markExpiredSurveys(): Promise<number> {
    const result = await SurveyModel.updateMany(
      {
        status: 'sent',
        expiresAt: { $lt: new Date() },
      },
      { status: 'expired' }
    );

    logger.info(`Marked ${result.modifiedCount} surveys as expired`);
    return result.modifiedCount;
  }
}

export const npsService = new NPSService();