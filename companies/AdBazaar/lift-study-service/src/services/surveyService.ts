import { Survey, ISurvey, SurveyResponse, ISurveyResponse } from '../models';
import { CreateSurveyInput } from '../utils/validation';
import { logger } from '../utils/logger';
import { surveyResponsesTotal } from '../utils/metrics';
import mongoose from 'mongoose';

export interface SurveyResponseInput {
  surveyId: string;
  respondentId: string;
  treatmentGroup: boolean;
  responses: Array<{
    questionId: string;
    questionType: string;
    answer: any;
  }>;
  completionTime?: number;
  demographics?: {
    age?: number;
    gender?: string;
    location?: string;
    income?: string;
  };
  metadata?: Record<string, any>;
}

export class SurveyService {
  async createSurvey(input: CreateSurveyInput): Promise<ISurvey> {
    const study = await mongoose.model('LiftStudy').findById(input.studyId);
    if (!study) {
      throw new Error('Study not found');
    }

    const survey = new Survey({
      studyId: new mongoose.Types.ObjectId(input.studyId),
      surveyType: input.surveyType,
      methodology: input.methodology,
      status: 'draft',
      questions: input.questions,
      targetSampleSize: input.targetSampleSize,
      actualSampleSize: 0,
      incentiveAmount: input.incentiveAmount,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      targeting: input.targeting
    });

    await survey.save();
    logger.info('Survey created', { surveyId: survey._id, studyId: input.studyId });

    return survey;
  }

  async getSurvey(surveyId: string): Promise<ISurvey | null> {
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      throw new Error('Invalid survey ID format');
    }

    return Survey.findById(surveyId);
  }

  async listSurveys(studyId?: string, status?: string): Promise<ISurvey[]> {
    const query: Record<string, any> = {};

    if (studyId) {
      query.studyId = new mongoose.Types.ObjectId(studyId);
    }

    if (status) {
      query.status = status;
    }

    return Survey.find(query).sort({ createdAt: -1 });
  }

  async updateSurvey(surveyId: string, updates: Partial<ISurvey>): Promise<ISurvey | null> {
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      throw new Error('Invalid survey ID format');
    }

    const survey = await Survey.findByIdAndUpdate(
      surveyId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (survey) {
      logger.info('Survey updated', { surveyId });
    }

    return survey;
  }

  async activateSurvey(surveyId: string): Promise<ISurvey | null> {
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      throw new Error('Invalid survey ID format');
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return null;
    }

    if (survey.status !== 'draft' && survey.status !== 'paused') {
      throw new Error(`Cannot activate survey in ${survey.status} status`);
    }

    return Survey.findByIdAndUpdate(
      surveyId,
      { $set: { status: 'active' } },
      { new: true }
    );
  }

  async submitResponse(input: SurveyResponseInput): Promise<ISurveyResponse> {
    if (!mongoose.Types.ObjectId.isValid(input.surveyId)) {
      throw new Error('Invalid survey ID format');
    }

    const survey = await Survey.findById(input.surveyId);
    if (!survey) {
      throw new Error('Survey not found');
    }

    if (survey.status !== 'active') {
      throw new Error('Can only submit responses for active surveys');
    }

    // Check for duplicate response
    const existing = await SurveyResponse.findOne({
      surveyId: new mongoose.Types.ObjectId(input.surveyId),
      respondentId: input.respondentId
    });

    if (existing) {
      throw new Error('Response already submitted for this respondent');
    }

    const response = new SurveyResponse({
      surveyId: new mongoose.Types.ObjectId(input.surveyId),
      studyId: survey.studyId,
      respondentId: input.respondentId,
      treatmentGroup: input.treatmentGroup,
      responses: input.responses,
      completionTime: input.completionTime,
      demographics: input.demographics,
      metadata: input.metadata
    });

    await response.save();

    // Update actual sample size
    await Survey.findByIdAndUpdate(input.surveyId, {
      $inc: { actualSampleSize: 1 }
    });

    surveyResponsesTotal.inc({ study_type: survey.surveyType });
    logger.info('Survey response submitted', {
      surveyId: input.surveyId,
      respondentId: input.respondentId
    });

    return response;
  }

  async getResponses(surveyId: string, treatmentGroup?: boolean): Promise<ISurveyResponse[]> {
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      throw new Error('Invalid survey ID format');
    }

    const query: Record<string, any> = {
      surveyId: new mongoose.Types.ObjectId(surveyId)
    };

    if (treatmentGroup !== undefined) {
      query.treatmentGroup = treatmentGroup;
    }

    return SurveyResponse.find(query).sort({ createdAt: -1 });
  }

  async getResponseStats(surveyId: string): Promise<{
    totalResponses: number;
    treatmentResponses: number;
    controlResponses: number;
    completionRate: number;
    averageCompletionTime: number;
    byQuestion: Record<string, any>;
  }> {
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      throw new Error('Invalid survey ID format');
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      throw new Error('Survey not found');
    }

    const [allResponses, treatmentResponses, controlResponses, withCompletionTime] = await Promise.all([
      SurveyResponse.countDocuments({ surveyId: new mongoose.Types.ObjectId(surveyId) }),
      SurveyResponse.countDocuments({
        surveyId: new mongoose.Types.ObjectId(surveyId),
        treatmentGroup: true
      }),
      SurveyResponse.countDocuments({
        surveyId: new mongoose.Types.ObjectId(surveyId),
        treatmentGroup: false
      }),
      SurveyResponse.aggregate([
        {
          $match: {
            surveyId: new mongoose.Types.ObjectId(surveyId),
            completionTime: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$completionTime' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const completionRate = survey.targetSampleSize > 0
      ? (allResponses / survey.targetSampleSize) * 100
      : 0;

    const averageCompletionTime = withCompletionTime[0]?.avgTime || 0;

    // Calculate response distribution by question
    const responses = await SurveyResponse.find({
      surveyId: new mongoose.Types.ObjectId(surveyId)
    });

    const byQuestion: Record<string, any> = {};
    survey.questions.forEach(q => {
      const questionResponses = responses
        .map(r => r.responses.find(res => res.questionId === q.questionId))
        .filter(r => r !== undefined);

      byQuestion[q.questionId] = {
        totalResponses: questionResponses.length,
        responseDistribution: this.calculateDistribution(questionResponses)
      };
    });

    return {
      totalResponses: allResponses,
      treatmentResponses,
      controlResponses,
      completionRate,
      averageCompletionTime,
      byQuestion
    };
  }

  private calculateDistribution(responses: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    const total = responses.length;

    responses.forEach(r => {
      const answer = JSON.stringify(r.answer);
      distribution[answer] = (distribution[answer] || 0) + 1;
    });

    // Convert to percentages
    Object.keys(distribution).forEach(key => {
      distribution[key] = (distribution[key] / total) * 100;
    });

    return distribution;
  }

  async completeSurvey(surveyId: string): Promise<ISurvey | null> {
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      throw new Error('Invalid survey ID format');
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return null;
    }

    // Calculate final stats
    const stats = await this.getResponseStats(surveyId);

    return Survey.findByIdAndUpdate(
      surveyId,
      {
        $set: {
          status: 'completed',
          responseRate: stats.completionRate,
          completionRate: stats.completionRate,
          averageCompletionTime: stats.averageCompletionTime
        }
      },
      { new: true }
    );
  }
}

export const surveyService = new SurveyService();