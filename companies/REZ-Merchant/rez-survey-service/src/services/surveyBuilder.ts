/**
 * Survey Builder & Sentiment Analysis Service
 * Create surveys, collect feedback, and analyze sentiment
 */

import mongoose, { Schema, Document } from 'mongoose';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Survey {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  type: 'nps' | 'csat' | 'ces' | 'custom';
  questions: Question[];
  settings: SurveySettings;
  targeting: TargetingRules;
  status: 'draft' | 'active' | 'paused' | 'completed';
  responses: number;
  completionRate: number;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface Question {
  id: string;
  type: 'rating' | 'nps' | 'multiple_choice' | 'text' | 'emoji' | 'slider' | 'matrix';
  text: string;
  subtitle?: string;
  required: boolean;
  options?: QuestionOption[];
  settings: QuestionSettings;
  branching?: BranchingRule[];
}

export interface QuestionOption {
  id: string;
  text: string;
  value: string | number;
  isCorrect?: boolean; // For quizzes
  image?: string;
}

export interface QuestionSettings {
  minRating?: number;
  maxRating?: number;
  maxLength?: number;
  placeholder?: string;
  allowMultiple?: boolean;
  showOther?: boolean;
}

export interface BranchingRule {
  condition: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: string | number;
  action: 'skip_to' | 'end_survey';
  targetQuestionId?: string;
}

export interface SurveySettings {
  showProgressBar: boolean;
  allowAnonymous: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showThankYouMessage: boolean;
  thankYouMessage: string;
  redirectUrl?: string;
  closeAfterDate?: Date;
  maxResponses?: number;
  reminderEnabled: boolean;
  reminderDays: number;
}

export interface TargetingRules {
  trigger: 'order_completed' | 'delivery_completed' | 'manual' | 'time_on_app' | 'purchase_value';
  conditions: TargetingCondition[];
  excludePreviousResponders: boolean;
}

export interface TargetingCondition {
  field: 'total_orders' | 'total_spent' | 'last_order_date' | 'customer_tier' | 'city' | 'order_value';
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  isAnonymous: boolean;
  answers: Answer[];
  sentiment?: SentimentResult;
  overallScore?: number;
  completedAt: Date;
  metadata: ResponseMetadata;
}

export interface Answer {
  questionId: string;
  questionText: string;
  value: string | number | string[];
  sentiment?: SentimentResult;
}

export interface SentimentResult {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0 to 1
  keywords: string[];
  emotions: {
    joy?: number;
    sadness?: number;
    anger?: number;
    fear?: number;
    surprise?: number;
  };
}

export interface SurveyAnalytics {
  surveyId: string;
  totalResponses: number;
  completionRate: number;
  averageTime: number; // seconds
  dropOffRate: number; // By question
  npsScore?: number;
  csatScore?: number;
  cesScore?: number;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  questionAnalytics: QuestionAnalytics[];
  trends: SentimentTrend[];
}

export interface QuestionAnalytics {
  questionId: string;
  averageRating?: number;
  distribution?: { value: string; count: number; percentage: number }[];
  wordCloud?: { word: string; count: number }[];
  sentiment?: SentimentResult;
}

export interface SentimentTrend {
  date: Date;
  sentiment: number;
  responseCount: number;
}

// ── MongoDB Models ─────────────────────────────────────────────────────────────

const SurveySchema = new Schema({
  id: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['nps', 'csat', 'ces', 'custom'], required: true },
  questions: [{
    id: String,
    type: { type: String, enum: ['rating', 'nps', 'multiple_choice', 'text', 'emoji', 'slider', 'matrix'] },
    text: String,
    subtitle: String,
    required: Boolean,
    options: [{
      id: String,
      text: String,
      value: Schema.Types.Mixed,
      isCorrect: Boolean,
      image: String,
    }],
    settings: {
      minRating: Number,
      maxRating: Number,
      maxLength: Number,
      placeholder: String,
      allowMultiple: Boolean,
      showOther: Boolean,
    },
    branching: [{
      condition: String,
      value: Schema.Types.Mixed,
      action: String,
      targetQuestionId: String,
    }],
  }],
  settings: {
    showProgressBar: { type: Boolean, default: true },
    allowAnonymous: { type: Boolean, default: false },
    randomizeQuestions: { type: Boolean, default: false },
    randomizeOptions: { type: Boolean, default: false },
    showThankYouMessage: { type: Boolean, default: true },
    thankYouMessage: String,
    redirectUrl: String,
    closeAfterDate: Date,
    maxResponses: Number,
    reminderEnabled: { type: Boolean, default: false },
    reminderDays: { type: Number, default: 3 },
  },
  targeting: {
    trigger: String,
    conditions: [{
      field: String,
      operator: String,
      value: Schema.Types.Mixed,
    }],
    excludePreviousResponders: { type: Boolean, default: true },
  },
  status: { type: String, enum: ['draft', 'active', 'paused', 'completed'], default: 'draft' },
  responses: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  createdBy: String,
}, { timestamps: true });

SurveySchema.index({ merchantId: 1, status: 1 });

const SurveyResponseSchema = new Schema({
  id: { type: String, required: true, unique: true },
  surveyId: { type: String, required: true, index: true },
  customerId: String,
  customerName: String,
  customerPhone: String,
  isAnonymous: { type: Boolean, default: false },
  answers: [{
    questionId: String,
    questionText: String,
    value: Schema.Types.Mixed,
    sentiment: {
      score: Number,
      label: String,
      confidence: Number,
      keywords: [String],
      emotions: {
        joy: Number,
        sadness: Number,
        anger: Number,
        fear: Number,
        surprise: Number,
      },
    },
  }],
  sentiment: {
    score: Number,
    label: String,
    confidence: Number,
    keywords: [String],
    emotions: Schema.Types.Mixed,
  },
  overallScore: Number,
  completedAt: Date,
  metadata: {
    ipAddress: String,
    userAgent: String,
    platform: String,
    language: String,
    duration: Number, // seconds
  },
}, { timestamps: true });

SurveyResponseSchema.index({ surveyId: 1, completedAt: -1 });

export const SurveyModel = mongoose.models.Survey || mongoose.model('Survey', SurveySchema);
export const SurveyResponseModel = mongoose.models.SurveyResponse || mongoose.model('SurveyResponse', SurveyResponseSchema);

// ── Sentiment Analysis Service ─────────────────────────────────────────────────

class SentimentAnalyzer {
  // Simple Hindi/English sentiment dictionary
  private positiveWords: Set<string>;
  private negativeWords: Set<string>;
  private intensifiers: Set<string>;
  private negators: Set<string>;

  constructor() {
    // Common positive words
    this.positiveWords = new Set([
      // English
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'loved', 'best',
      'awesome', 'perfect', 'delicious', 'tasty', 'fresh', 'fast', 'quick', 'friendly', 'helpful',
      'recommend', 'satisfied', 'happy', 'pleased', 'impressed', 'outstanding',
      // Hindi
      'accha', 'bahut-accha', 'shandaar', 'behtareen', 'pasand', 'ummed', 'khush', 'prasans',
      'swadisht', 'teekha', 'sasta', 'jaldi', 'madadgar', 'sahayak', 'badhiya',
      // Common in India
      'value', 'worth', 'enjoy', 'comfortable', 'hygienic', 'clean',
    ]);

    // Common negative words
    this.negativeWords = new Set([
      // English
      'bad', 'worst', 'terrible', 'horrible', 'awful', 'poor', 'slow', 'rude', 'cold',
      'disappointed', 'disgusting', 'overpriced', 'expensive', 'dirty', 'late', 'waiting',
      'never', 'hate', 'waste', 'broken', 'defective', 'complaint', 'refund',
      // Hindi
      'bura', 'kharab', 'sabse-bura', 'bhoot-buri', 'ganda', 'sasta', 'mehenga',
      'dhire', 'dera', 'bakwas', 'samasya', 'problem', ' pareshani', 'roj', 'hamesha',
      // India-specific
      'late delivery', 'waiting too long', 'not worth', 'not recommended',
    ]);

    this.intensifiers = new Set([
      'very', 'really', 'extremely', 'absolutely', 'totally', 'completely', 'highly',
      'so', 'too', 'most', 'such', 'bahut', 'zyada', 'bhoot',
    ]);

    this.negators = new Set([
      'not', 'no', 'never', 'neither', 'nor', 'none', 'dont', "don't", 'didnt', "didn't",
      'cant', "can't", 'wont', "won't", 'shouldnt', "shouldn't",
      'nahi', 'nhi', 'koi', 'bina',
    ]);
  }

  /**
   * Analyze sentiment of text
   */
  analyze(text: string): SentimentResult {
    if (!text || text.trim().length === 0) {
      return {
        score: 0,
        label: 'neutral',
        confidence: 0,
        keywords: [],
        emotions: {},
      };
    }

    const words = this.tokenize(text.toLowerCase());
    let positiveCount = 0;
    let negativeCount = 0;
    let isNegated = false;
    let intensifierMultiplier = 1;
    const keywords: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Check for negation
      if (this.negators.has(word)) {
        isNegated = true;
        continue;
      }

      // Check for intensifier
      if (this.intensifiers.has(word)) {
        intensifierMultiplier = 1.5;
        continue;
      }

      // Check sentiment
      if (this.positiveWords.has(word)) {
        keywords.push(word);
        if (isNegated) {
          negativeCount += intensifierMultiplier;
        } else {
          positiveCount += intensifierMultiplier;
        }
        isNegated = false;
        intensifierMultiplier = 1;
      } else if (this.negativeWords.has(word)) {
        keywords.push(word);
        if (isNegated) {
          positiveCount += intensifierMultiplier; // Negated negative = positive
        } else {
          negativeCount += intensifierMultiplier;
        }
        isNegated = false;
        intensifierMultiplier = 1;
      }

      // Check for negation after sentiment word
      if ((positiveCount > 0 || negativeCount > 0) && i < words.length - 1) {
        if (this.negators.has(words[i + 1])) {
          // Invert the last sentiment
          const temp = positiveCount;
          positiveCount = negativeCount;
          negativeCount = temp;
        }
      }
    }

    // Calculate score (-1 to 1)
    const total = positiveCount + negativeCount;
    let score = 0;
    let confidence = 0;

    if (total > 0) {
      score = (positiveCount - negativeCount) / total;
      confidence = Math.min(1, total / 5); // More sentiment words = higher confidence
    }

    // Determine label
    let label: 'positive' | 'negative' | 'neutral';
    if (score > 0.2) label = 'positive';
    else if (score < -0.2) label = 'negative';
    else label = 'neutral';

    // Detect emotions (simplified)
    const emotions = this.detectEmotions(text);

    return {
      score: Math.round(score * 100) / 100,
      label,
      confidence: Math.round(confidence * 100) / 100,
      keywords: [...new Set(keywords)],
      emotions,
    };
  }

  /**
   * Tokenize text
   */
  private tokenize(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
  }

  /**
   * Detect emotions
   */
  private detectEmotions(text: string): SentimentResult['emotions'] {
    const lower = text.toLowerCase();
    const emotions: any = {};

    // Joy indicators
    const joyWords = ['happy', 'excited', 'love', 'amazing', 'great', 'wonderful', 'khush', 'prasans'];
    emotions.joy = this.calculateEmotionScore(lower, joyWords);

    // Sadness indicators
    const sadnessWords = ['sad', 'disappointed', 'upset', 'unhappy', 'bura', 'neshaani'];
    emotions.sadness = this.calculateEmotionScore(lower, sadnessWords);

    // Anger indicators
    const angerWords = ['angry', 'furious', 'hate', 'terrible', 'worst', 'gussa', 'prakop'];
    emotions.anger = this.calculateEmotionScore(lower, angerWords);

    // Surprise indicators
    const surpriseWords = ['surprised', 'shocked', 'unexpected', 'wow', 'acha', 'ah'];
    emotions.surprise = this.calculateEmotionScore(lower, surpriseWords);

    return emotions;
  }

  /**
   * Calculate emotion score
   */
  private calculateEmotionScore(text: string, words: string[]): number {
    let count = 0;
    for (const word of words) {
      if (text.includes(word)) count++;
    }
    return Math.min(1, count / 2);
  }
}

// ── Survey Builder Service ──────────────────────────────────────────────────────

class SurveyBuilderService {
  private sentimentAnalyzer: SentimentAnalyzer;

  constructor() {
    this.sentimentAnalyzer = new SentimentAnalyzer();
  }

  /**
   * Create a new survey
   */
  async createSurvey(params: {
    merchantId: string;
    name: string;
    description?: string;
    type: 'nps' | 'csat' | 'ces' | 'custom';
    questions: Omit<Question, 'id'>[];
    settings?: Partial<SurveySettings>;
    targeting?: Partial<TargetingRules>;
    createdBy: string;
  }): Promise<Survey> {
    // Generate IDs for questions
    const questions = params.questions.map((q, i) => ({
      ...q,
      id: `q_${Date.now()}_${i}`,
    }));

    // Create default NPS/CSAT/CES questions based on type
    if (params.type === 'nps' && questions.length === 0) {
      questions.push({
        id: `q_${Date.now()}_nps`,
        type: 'nps',
        text: 'How likely are you to recommend us to a friend or colleague?',
        subtitle: '0 = Not at all likely, 10 = Extremely likely',
        required: true,
        settings: { minRating: 0, maxRating: 10 },
      });
    }

    if (params.type === 'csat' && questions.length === 0) {
      questions.push({
        id: `q_${Date.now()}_csat`,
        type: 'rating',
        text: 'How satisfied are you with your experience?',
        subtitle: '1 = Very Dissatisfied, 5 = Very Satisfied',
        required: true,
        settings: { minRating: 1, maxRating: 5 },
      });
    }

    const survey = new SurveyModel({
      id: `SRV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      merchantId: params.merchantId,
      name: params.name,
      description: params.description,
      type: params.type,
      questions,
      settings: {
        showProgressBar: true,
        allowAnonymous: false,
        randomizeQuestions: false,
        randomizeOptions: false,
        showThankYouMessage: true,
        thankYouMessage: 'Thank you for your valuable feedback!',
        reminderEnabled: false,
        reminderDays: 3,
        ...params.settings,
      },
      targeting: {
        trigger: 'manual',
        conditions: [],
        excludePreviousResponders: true,
        ...params.targeting,
      },
      status: 'draft',
      createdBy: params.createdBy,
    });

    await survey.save();
    return survey;
  }

  /**
   * Update survey
   */
  async updateSurvey(surveyId: string, updates: Partial<Survey>): Promise<Survey> {
    const survey = await SurveyModel.findOneAndUpdate(
      { id: surveyId },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!survey) throw new Error('Survey not found');
    return survey;
  }

  /**
   * Get survey
   */
  async getSurvey(surveyId: string): Promise<Survey | null> {
    return SurveyModel.findOne({ id: surveyId });
  }

  /**
   * Get surveys for merchant
   */
  async getSurveys(merchantId: string, status?: string): Promise<Survey[]> {
    const query: any = { merchantId };
    if (status) query.status = status;
    return SurveyModel.find(query).sort({ createdAt: -1 });
  }

  /**
   * Publish survey
   */
  async publishSurvey(surveyId: string): Promise<Survey> {
    return this.updateSurvey(surveyId, { status: 'active' });
  }

  /**
   * Pause survey
   */
  async pauseSurvey(surveyId: string): Promise<Survey> {
    return this.updateSurvey(surveyId, { status: 'paused' });
  }

  /**
   * Close survey
   */
  async closeSurvey(surveyId: string): Promise<Survey> {
    return this.updateSurvey(surveyId, { status: 'completed' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPONSE HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Submit survey response
   */
  async submitResponse(params: {
    surveyId: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    answers: Array<{ questionId: string; value: string | number | string[] }>;
    isAnonymous?: boolean;
    metadata?: ResponseMetadata;
  }): Promise<SurveyResponse> {
    const survey = await this.getSurvey(params.surveyId);
    if (!survey) throw new Error('Survey not found');
    if (survey.status !== 'active') throw new Error('Survey is not accepting responses');

    // Process answers with sentiment analysis
    const processedAnswers: Answer[] = [];
    let overallSentiment: SentimentResult | undefined;
    let overallScore: number | undefined;

    for (const answer of params.answers) {
      const question = survey.questions.find(q => q.id === answer.questionId);
      let sentiment: SentimentResult | undefined;

      // Analyze sentiment for text responses
      if (question?.type === 'text' && typeof answer.value === 'string') {
        sentiment = this.sentimentAnalyzer.analyze(answer.value);
      }

      processedAnswers.push({
        questionId: answer.questionId,
        questionText: question?.text || '',
        value: answer.value,
        sentiment,
      });

      // Calculate NPS score
      if (question?.type === 'nps' && typeof answer.value === 'number') {
        if (answer.value >= 9) overallScore = 1;
        else if (answer.value <= 6) overallScore = -1;
        else overallScore = 0;
      }

      // Calculate CSAT score
      if (question?.type === 'rating' && typeof answer.value === 'number') {
        overallScore = (answer.value - 1) / 4; // Normalize to 0-1
      }
    }

    // Overall sentiment from all text answers
    const textAnswers = processedAnswers.filter(a => a.sentiment);
    if (textAnswers.length > 0) {
      const avgScore = textAnswers.reduce((sum, a) => sum + (a.sentiment?.score || 0), 0) / textAnswers.length;
      overallSentiment = {
        score: Math.round(avgScore * 100) / 100,
        label: avgScore > 0.2 ? 'positive' : avgScore < -0.2 ? 'negative' : 'neutral',
        confidence: textAnswers.reduce((sum, a) => sum + (a.sentiment?.confidence || 0), 0) / textAnswers.length,
        keywords: [...new Set(textAnswers.flatMap(a => a.sentiment?.keywords || []))],
        emotions: {
          joy: textAnswers.reduce((sum, a) => sum + (a.sentiment?.emotions?.joy || 0), 0) / textAnswers.length,
          sadness: textAnswers.reduce((sum, a) => sum + (a.sentiment?.emotions?.sadness || 0), 0) / textAnswers.length,
          anger: textAnswers.reduce((sum, a) => sum + (a.sentiment?.emotions?.anger || 0), 0) / textAnswers.length,
        },
      };
    }

    const response = new SurveyResponseModel({
      id: `RSP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      surveyId: params.surveyId,
      customerId: params.isAnonymous ? undefined : params.customerId,
      customerName: params.isAnonymous ? undefined : params.customerName,
      customerPhone: params.isAnonymous ? undefined : params.customerPhone,
      isAnonymous: params.isAnonymous || false,
      answers: processedAnswers,
      sentiment: overallSentiment,
      overallScore,
      completedAt: new Date(),
      metadata: params.metadata || {},
    });

    await response.save();

    // Update survey response count
    await SurveyModel.updateOne(
      { id: params.surveyId },
      { $inc: { responses: 1 } }
    );

    return response;
  }

  /**
   * Get response
   */
  async getResponse(responseId: string): Promise<SurveyResponse | null> {
    return SurveyResponseModel.findOne({ id: responseId });
  }

  /**
   * Get responses for survey
   */
  async getResponses(
    surveyId: string,
    options?: { limit?: number; offset?: number; withSentiment?: boolean }
  ): Promise<SurveyResponse[]> {
    const query = SurveyResponseModel.find({ surveyId })
      .sort({ completedAt: -1 });

    if (options?.limit) query.limit(options.limit);
    if (options?.offset) query.skip(options.offset);

    return query;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get survey analytics
   */
  async getAnalytics(surveyId: string): Promise<SurveyAnalytics> {
    const survey = await this.getSurvey(surveyId);
    if (!survey) throw new Error('Survey not found');

    const responses = await SurveyResponseModel.find({ surveyId });
    const totalResponses = responses.length;

    // Calculate metrics
    const npsResponses = responses.filter(r => r.overallScore !== undefined);
    const csatResponses = npsResponses; // Can be different

    let npsScore: number | undefined;
    let csatScore: number | undefined;

    if (survey.type === 'nps' && npsResponses.length > 0) {
      const promoters = npsResponses.filter(r => (r.overallScore || 0) > 0).length;
      const detractors = npsResponses.filter(r => (r.overallScore || 0) < 0).length;
      npsScore = Math.round(((promoters - detractors) / npsResponses.length) * 100);
    }

    if (survey.type === 'csat' && csatResponses.length > 0) {
      const sum = csatResponses.reduce((s, r) => s + (r.overallScore || 0), 0);
      csatScore = Math.round((sum / csatResponses.length) * 100);
    }

    // Sentiment breakdown
    const sentimentBreakdown = {
      positive: responses.filter(r => r.sentiment?.label === 'positive').length,
      negative: responses.filter(r => r.sentiment?.label === 'negative').length,
      neutral: responses.filter(r => r.sentiment?.label === 'neutral').length,
    };

    // Per-question analytics
    const questionAnalytics: QuestionAnalytics[] = [];
    for (const question of survey.questions) {
      const answers = responses.flatMap(r => r.answers.filter(a => a.questionId === question.id));

      if (question.type === 'rating' || question.type === 'nps') {
        const numericAnswers = answers.map(a => Number(a.value)).filter(v => !isNaN(v));
        if (numericAnswers.length > 0) {
          const avg = numericAnswers.reduce((s, v) => s + v, 0) / numericAnswers.length;
          questionAnalytics.push({
            questionId: question.id,
            averageRating: Math.round(avg * 100) / 100,
          });
        }
      }

      if (question.type === 'text') {
        const textAnswers = answers.map(a => String(a.value)).filter(Boolean);
        if (textAnswers.length > 0) {
          // Word cloud
          const wordCounts = new Map<string, number>();
          for (const text of textAnswers) {
            const words = text.toLowerCase().split(/\s+/);
            for (const word of words) {
              if (word.length > 3) {
                wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
              }
            }
          }
          const wordCloud = [...wordCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([word, count]) => ({ word, count }));

          // Aggregate sentiment
          const sentimentScores = answers
            .filter(a => a.sentiment)
            .map(a => a.sentiment!.score);
          const avgSentiment = sentimentScores.length > 0
            ? sentimentScores.reduce((s, v) => s + v, 0) / sentimentScores.length
            : 0;

          questionAnalytics.push({
            questionId: question.id,
            wordCloud,
            sentiment: {
              score: Math.round(avgSentiment * 100) / 100,
              label: avgSentiment > 0.2 ? 'positive' : avgSentiment < -0.2 ? 'negative' : 'neutral',
              confidence: 0.5,
              keywords: [],
              emotions: {},
            },
          });
        }
      }
    }

    return {
      surveyId,
      totalResponses,
      completionRate: survey.completionRate,
      averageTime: 0, // Would calculate from metadata
      dropOffRate: 0,
      npsScore,
      csatScore,
      sentimentBreakdown,
      questionAnalytics,
      trends: [], // Would calculate over time
    };
  }

  /**
   * Get negative feedback alerts
   */
  async getNegativeFeedbackAlerts(
    merchantId: string,
    hours: number = 24
  ): Promise<Array<{
    response: SurveyResponse;
    alertReason: string;
    priority: 'high' | 'medium' | 'low';
  }>> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const responses = await SurveyResponseModel.find({
      surveyId: { $in: (await this.getSurveys(merchantId)).map(s => s.id) },
      completedAt: { $gte: since },
    }).populate('surveyId');

    const alerts: Array<{
      response: SurveyResponse;
      alertReason: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    for (const response of responses) {
      // Check NPS score
      if ((response.overallScore || 0) < 0) {
        alerts.push({
          response,
          alertReason: 'Low NPS score (detractor)',
          priority: 'high',
        });
      }

      // Check sentiment
      if (response.sentiment?.label === 'negative' && response.sentiment?.confidence > 0.7) {
        alerts.push({
          response,
          alertReason: 'Strong negative sentiment detected',
          priority: response.sentiment.confidence > 0.9 ? 'high' : 'medium',
        });
      }
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get survey templates
   */
  getTemplates(): Array<{
    name: string;
    type: 'nps' | 'csat' | 'ces' | 'custom';
    questions: Omit<Question, 'id'>[];
  }> {
    return [
      {
        name: 'NPS Survey',
        type: 'nps',
        questions: [
          {
            type: 'nps',
            text: 'How likely are you to recommend us to a friend or colleague?',
            subtitle: '0 = Not at all likely, 10 = Extremely likely',
            required: true,
            settings: { minRating: 0, maxRating: 10 },
          },
          {
            type: 'text',
            text: 'What could we improve?',
            subtitle: 'Your feedback helps us serve you better',
            required: false,
            settings: { maxLength: 500, placeholder: 'Share your thoughts...' },
          },
        ],
      },
      {
        name: 'Customer Satisfaction (CSAT)',
        type: 'csat',
        questions: [
          {
            type: 'rating',
            text: 'How satisfied are you with your experience today?',
            subtitle: '1 = Very Dissatisfied, 5 = Very Satisfied',
            required: true,
            settings: { minRating: 1, maxRating: 5 },
          },
          {
            type: 'multiple_choice',
            text: 'What did you enjoy most?',
            required: false,
            options: [
              { id: '1', text: 'Food quality', value: 'food_quality' },
              { id: '2', text: 'Service', value: 'service' },
              { id: '3', text: 'Ambiance', value: 'ambiance' },
              { id: '4', text: 'Value for money', value: 'value' },
            ],
            settings: { allowMultiple: true },
          },
        ],
      },
      {
        name: 'Post-Delivery Feedback',
        type: 'ces',
        questions: [
          {
            type: 'rating',
            text: 'How easy was it to order and receive your delivery?',
            subtitle: '1 = Very Difficult, 5 = Very Easy',
            required: true,
            settings: { minRating: 1, maxRating: 5 },
          },
          {
            type: 'text',
            text: 'Any comments about your delivery experience?',
            required: false,
            settings: { maxLength: 300 },
          },
        ],
      },
    ];
  }
}

export const surveyBuilderService = new SurveyBuilderService();
export const sentimentAnalyzer = new SentimentAnalyzer();
export default surveyBuilderService;
