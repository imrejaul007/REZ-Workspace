/**
 * Surveys API Service
 * Handles all survey-related API calls
 */
import apiClient from './apiClient';

export interface SurveyQuestion {
  id: string;
  type: 'multiple_choice' | 'single_choice' | 'rating' | 'text' | 'scale';
  question: string;
  options?: string[];
  required: boolean;
  order: number;
  minValue?: number;
  maxValue?: number;
}

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
  } | null;
  allowSkip: boolean;
  randomizeQuestions: boolean;
  showProgress: boolean;
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
  streak: number;
}

export interface SurveyAnswer {
  questionId: string;
  answer: string | string[] | number;
}

export interface SurveySessionResult {
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

class SurveysApiService {
  /**
   * Get all surveys with optional filters
   */
  async getSurveys(category?: string, limit = 50, offset = 0): Promise<Survey[]> {
    try {
      const params: Record<string, string | number | boolean | undefined | null> = { limit, offset };
      if (category && category !== 'All') {
        params.category = category;
      }

      const response = await apiClient.get<unknown>('/surveys', params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch surveys');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get survey categories with counts
   */
  async getCategories(): Promise<SurveyCategory[]> {
    try {
      const response = await apiClient.get<unknown>('/surveys/categories');

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch categories');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's survey statistics
   */
  async getUserStats(): Promise<UserSurveyStats> {
    try {
      const response = await apiClient.get<unknown>('/surveys/user/stats');

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user stats');
      }

      return response.data;
    } catch (error) {
      // Return default stats if error
      return {
        totalEarned: 0,
        surveysCompleted: 0,
        averageTime: 0,
        completionRate: 100,
        streak: 0,
      };
    }
  }

  /**
   * Get survey by ID with full details
   */
  async getSurveyById(id: string): Promise<SurveyDetail> {
    try {
      const response = await apiClient.get<unknown>(`/surveys/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch survey');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start a survey session
   */
  async startSurvey(surveyId: string): Promise<SurveySessionResult> {
    try {
      const response = await apiClient.post<unknown>(`/surveys/${surveyId}/start`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to start survey');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit survey answers
   */
  async submitSurvey(surveyId: string, answers: SurveyAnswer[]): Promise<SurveySubmitResult> {
    try {
      const response = await apiClient.post<unknown>(`/surveys/${surveyId}/submit`, { answers } as Record<string, unknown>);

      if (!response.success) {
        throw new Error(response.error || 'Failed to submit survey');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save survey progress
   */
  async saveProgress(surveyId: string, answers: SurveyAnswer[], currentQuestionIndex: number): Promise<void> {
    try {
      await apiClient.post<unknown>(`/surveys/${surveyId}/save-progress`, { answers, currentQuestionIndex } as Record<string, unknown>);
    } catch (error) {
      // Don't throw - progress saving is not critical
    }
  }

  /**
   * Abandon a survey
   */
  async abandonSurvey(surveyId: string): Promise<void> {
    try {
      await apiClient.post<unknown>(`/surveys/${surveyId}/abandon`);
    } catch (error) {
      // Don't throw - abandoning is not critical
    }
  }

  /**
   * Get user's survey history
   */
  async getUserHistory(limit = 50, offset = 0): Promise<{ surveys: SurveyHistoryItem[], total: number, hasMore: boolean }> {
    try {
      const response = await apiClient.get<unknown>('/surveys/user/history', { limit, offset });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch history');
      }

      return response.data;
    } catch (error) {
      return { surveys: [], total: 0, hasMore: false };
    }
  }
}

// Create singleton instance
const surveysApiService = new SurveysApiService();

export default surveysApiService;
export { SurveysApiService };
