/** @deprecated - use surveysApi.ts instead */
import apiClient from './apiClient';

export interface Survey {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  category: string;
  subcategory?: string;
  reward: number;
  estimatedTime: number;
  questionsCount: number;
  status: string;
  sponsor?: {
    name: string;
    logo: string;
  };
  expiresAt?: string;
  completedCount: number;
  targetResponses: number;
  isFeatured: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SurveyDetail extends Survey {
  questions: SurveyQuestion[];
  instructions?: string[];
  userStatus: 'not_started' | 'in_progress' | 'completed';
  existingSession?: {
    sessionId: string;
    currentQuestionIndex: number;
    answeredCount: number;
  };
  allowSkip: boolean;
  randomizeQuestions: boolean;
  showProgress: boolean;
}

export interface SurveyQuestion {
  id: string;
  type: 'multiple_choice' | 'single_choice' | 'rating' | 'text' | 'scale';
  question: string;
  options?: string[];
  required: boolean;
  order: number;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
}

export interface SurveyCategory {
  name: string;
  count: number;
}

export interface UserSurveyStats {
  totalEarned: number;
  surveysCompleted: number;
  averageTime: number;
  completionRate: number;
  streak?: number;
}

export interface SurveyAnswer {
  questionId: string;
  answer: string | string[] | number;
}

export interface SurveySession {
  sessionId: string;
  currentQuestionIndex: number;
  answers: SurveyAnswer[];
  resumed: boolean;
}

export interface SurveySubmitResult {
  sessionId: string;
  coinsEarned: number;
  timeSpent: number;
  qualityScore: number;
  completedAt: string;
}

export interface SurveyHistoryItem {
  sessionId: string;
  survey: {
    _id: string;
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    reward: number;
  } | null;
  coinsEarned: number;
  timeSpent: number;
  completedAt: string;
}

class SurveyApiService {
  /**
   * Get all surveys with optional filters
   */
  async getSurveys(category?: string, limit = 50, offset = 0): Promise<Survey[]> {
    try {
      const params: Record<string, string | number | boolean | undefined | null> = {
        limit,
        offset,
      };
      if (category && category !== 'All') {
        params.category = category;
      }

      const data = await apiClient.get<Survey[]>('/surveys', params);

      if (data.success) {
        return data.data as Survey[];
      } else {
        throw new Error(data.error || 'Failed to fetch surveys');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get survey categories with counts
   */
  async getCategories(): Promise<SurveyCategory[]> {
    try {
      const data = await apiClient.get<SurveyCategory[]>('/surveys/categories');

      if (data.success) {
        return data.data as SurveyCategory[];
      } else {
        throw new Error(data.error || 'Failed to fetch categories');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's survey statistics
   */
  async getUserStats(): Promise<UserSurveyStats> {
    const defaultStats: UserSurveyStats = {
      totalEarned: 0,
      surveysCompleted: 0,
      averageTime: 0,
      completionRate: 100,
      streak: 0,
    };

    try {
      const data = await apiClient.get<UserSurveyStats>('/surveys/user/stats');

      if (data.success) {
        return data.data as UserSurveyStats;
      }
      return defaultStats;
    } catch (error) {
      // Return default stats on error (unauthenticated or network failure)
      return defaultStats;
    }
  }

  /**
   * Get user's survey history
   */
  async getUserHistory(limit = 50, offset = 0): Promise<{ surveys: SurveyHistoryItem[], total: number, hasMore: boolean }> {
    try {
      const data = await apiClient.get<{ surveys: SurveyHistoryItem[], total: number, hasMore: boolean }>(
        '/surveys/user/history',
        { limit, offset }
      );

      if (data.success) {
        return data.data as { surveys: SurveyHistoryItem[], total: number, hasMore: boolean };
      } else {
        throw new Error(data.error || 'Failed to fetch history');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get survey by ID with full details
   */
  async getSurveyById(surveyId: string): Promise<SurveyDetail> {
    try {
      const data = await apiClient.get<SurveyDetail>(`/surveys/${surveyId}`);

      if (data.success) {
        return data.data as SurveyDetail;
      } else {
        throw new Error(data.error || 'Failed to fetch survey');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start a survey session
   */
  async startSurvey(surveyId: string): Promise<SurveySession> {
    try {
      const data = await apiClient.post<SurveySession>(`/surveys/${surveyId}/start`);

      if (data.success) {
        return data.data as SurveySession;
      } else {
        throw new Error(data.error || 'Failed to start survey');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit survey answers
   */
  async submitSurvey(surveyId: string, answers: SurveyAnswer[]): Promise<SurveySubmitResult> {
    try {
      const data = await apiClient.post<SurveySubmitResult>(
        `/surveys/${surveyId}/submit`,
        { answers }
      );

      if (data.success) {
        return data.data as SurveySubmitResult;
      } else {
        throw new Error(data.error || 'Failed to submit survey');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save survey progress
   */
  async saveProgress(surveyId: string, answers: SurveyAnswer[], currentQuestionIndex: number): Promise<{ sessionId: string, savedAnswers: number, currentQuestionIndex: number }> {
    try {
      const data = await apiClient.post<{ sessionId: string, savedAnswers: number, currentQuestionIndex: number }>(
        `/surveys/${surveyId}/save-progress`,
        { answers, currentQuestionIndex }
      );

      if (data.success) {
        return data.data as { sessionId: string, savedAnswers: number, currentQuestionIndex: number };
      } else {
        throw new Error(data.error || 'Failed to save progress');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Abandon survey
   */
  async abandonSurvey(surveyId: string): Promise<void> {
    try {
      const data = await apiClient.post(`/surveys/${surveyId}/abandon`);

      if (!data.success) {
        throw new Error(data.error || 'Failed to abandon survey');
      }
    } catch (error) {
      throw error;
    }
  }
}

// Create singleton instance
const surveyApiService = new SurveyApiService();

export default surveyApiService;
export { SurveyApiService };
