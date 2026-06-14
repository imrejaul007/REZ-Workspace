import { v4 as uuidv4 } from 'uuid';
import { Survey, ISurvey, Question, IQuestion, Response, IResponse, Result, IResult } from '../models';
import { createServiceLogger } from 'utils/logger.js';

const logger = createServiceLogger('SurveyService');

export class SurveyService {
  async createSurvey(data: Partial<ISurvey>): Promise<ISurvey> {
    const surveyId = `srv_${uuidv4()}`;
    const survey = new Survey({ ...data, surveyId });
    await survey.save();
    logger.info('Survey created', { surveyId, name: data.name });
    return survey;
  }

  async getSurveyById(surveyId: string): Promise<ISurvey | null> {
    return Survey.findOne({ surveyId });
  }

  async updateSurvey(surveyId: string, data: Partial<ISurvey>): Promise<ISurvey | null> {
    const survey = await Survey.findOneAndUpdate({ surveyId }, data, { new: true });
    if (survey) logger.info('Survey updated', { surveyId });
    return survey;
  }

  async getAllSurveys(companyId: string, status?: string): Promise<ISurvey[]> {
    const query: Record<string, unknown> = { companyId };
    if (status) query['status'] = status;
    return Survey.find(query).sort({ createdAt: -1 });
  }

  async addQuestion(surveyId: string, data: Partial<IQuestion>): Promise<IQuestion> {
    const questionId = `q_${uuidv4()}`;
    const count = await Question.countDocuments({ surveyId });
    const question = new Question({ ...data, surveyId, questionId, order: count });
    await question.save();
    logger.info('Question added', { questionId, surveyId });
    return question;
  }

  async getQuestionsBySurvey(surveyId: string): Promise<IQuestion[]> {
    return Question.find({ surveyId }).sort({ order: 1 });
  }

  async submitResponse(data: {
    surveyId: string;
    userId: string;
    companyId: string;
    npsScore?: number;
    answers: Array<{ questionId: string; value: string | number }>;
    comments?: string;
  }): Promise<IResponse> {
    const responseId = `resp_${uuidv4()}`;
    const response = new Response({
      responseId,
      surveyId: data.surveyId,
      userId: data.userId,
      companyId: data.companyId,
      npsScore: data.npsScore,
      answers: data.answers,
      comments: data.comments,
      completedAt: new Date()
    });

    await response.save();

    // Update survey response count
    const responses = await Response.countDocuments({ surveyId: data.surveyId });
    await Survey.updateOne({ surveyId: data.surveyId }, { responseCount: responses });

    logger.info('Response submitted', { responseId, surveyId });
    return response;
  }

  async getResponsesBySurvey(surveyId: string): Promise<IResponse[]> {
    return Response.find({ surveyId }).sort({ completedAt: -1 });
  }

  async computeResults(surveyId: string): Promise<IResult> {
    const survey = await this.getSurveyById(surveyId);
    if (!survey) throw new Error('Survey not found');

    const responses = await this.getResponsesBySurvey(surveyId);
    const npsResponses = responses.filter(r => r.npsScore !== undefined);

    const promoters = npsResponses.filter(r => r.npsScore >= 9).length;
    const passives = npsResponses.filter(r => r.npsScore >= 7 && r.npsScore <= 8).length;
    const detractors = npsResponses.filter(r => r.npsScore <= 6).length;

    const total = npsResponses.length || 1;
    const promoterPercent = (promoters / total) * 100;
    const detractorPercent = (detractors / total) * 100;
    const npsScore = Math.round(promoterPercent - detractorPercent);

    const resultId = `res_${uuidv4()}`;
    const result = new Result({
      resultId,
      surveyId,
      companyId: survey.companyId,
      totalResponses: responses.length,
      completedResponses: npsResponses.length,
      npsScore,
      promoters,
      passives,
      detractors,
      promoterPercent,
      passivePercent: (passives / total) * 100,
      detractorPercent,
      completionRate: survey.completionRate,
      responseRate: survey.responseCount > 0 ? (responses.length / survey.responseCount) * 100 : 0
    });

    await result.save();
    logger.info('Results computed', { resultId, surveyId, npsScore });
    return result;
  }

  async getResults(surveyId: string): Promise<{
    survey: ISurvey | null;
    results: IResult[];
    responses: IResponse[];
  }> {
    const survey = await this.getSurveyById(surveyId);
    const results = await Result.find({ surveyId }).sort({ computedAt: -1 });
    const responses = await this.getResponsesBySurvey(surveyId);
    return { survey, results, responses };
  }

  async sendSurvey(surveyId: string): Promise<{ sent: number }> {
    const survey = await this.getSurveyById(surveyId);
    if (!survey) throw new Error('Survey not found');

    survey.status = 'active';
    survey.startDate = new Date();
    await survey.save();

    const targetCount = (survey.targetAudience.userIds?.length || 0) + (survey.targetAudience.segments?.length || 0) * 100;
    logger.info('Survey sent', { surveyId, targetCount });
    return { sent: targetCount };
  }

  async closeSurvey(surveyId: string): Promise<ISurvey | null> {
    const survey = await Survey.findOneAndUpdate(
      { surveyId, status: 'active' },
      { status: 'completed', endDate: new Date() },
      { new: true }
    );
    if (survey) {
      await this.computeResults(surveyId);
      logger.info('Survey closed', { surveyId });
    }
    return survey;
  }
}

export const surveyService = new SurveyService();