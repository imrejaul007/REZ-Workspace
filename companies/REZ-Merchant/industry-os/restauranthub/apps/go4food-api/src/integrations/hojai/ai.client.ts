/**
 * Hojai AI Service Client
 * Ports: 4500-4610
 *
 * Handles food search, recommendations, NLP, and AI chat.
 */

import axios, { AxiosInstance } from 'axios';

export interface SearchContext {
  location?: {
    lat: number;
    lng: number;
    city?: string;
  };
  userId?: string;
  preferences?: string[];
  budget?: number;
  time?: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
}

export interface FoodSearchResult {
  dish: {
    id: string;
    name: string;
    description?: string;
    image?: string;
  };
  restaurant: {
    id: string;
    name: string;
    rating: number;
  };
  price: number;
  relevanceScore: number;
  reasons: string[];
}

export interface AdvisorContext {
  location?: string;
  budget?: number;
  preferences?: string[];
  dietary?: string[];
  allergies?: string[];
  time?: string;
}

export interface AdvisorRecommendation {
  dish: {
    id: string;
    name: string;
    image?: string;
  };
  restaurant: {
    id: string;
    name: string;
    rating: number;
    image?: string;
  };
  price: number;
  reason: string;
  score: number;
}

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  keywords: string[];
}

export interface FoodEntity {
  type: 'dish' | 'cuisine' | 'ingredient' | 'restaurant';
  value: string;
  confidence: number;
}

export class HojaiAIClient {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string = process.env.HOJAI_AI_URL || 'http://localhost:4500',
    private readonly apiKey: string = process.env.HOJAI_AI_API_KEY || '',
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[HojaiAI] API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // ===================
  // Food Search
  // ===================

  /**
   * Natural language food search
   * Query examples: "biryani under 300", "healthy lunch near me"
   */
  async searchFood(
    query: string,
    context: SearchContext = {}
  ): Promise<FoodSearchResult[]> {
    const response = await this.client.post<{ results: FoodSearchResult[] }>('/api/ai/food-search', {
      query,
      ...context,
    });
    return response.data.results;
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(partial: string, limit: number = 10): Promise<string[]> {
    const response = await this.client.post<{ suggestions: string[] }>('/api/ai/search-suggestions', {
      partial,
      limit,
    });
    return response.data.suggestions;
  }

  /**
   * Extract food entities from text
   */
  async extractFoodEntities(text: string): Promise<FoodEntity[]> {
    const response = await this.client.post<{ entities: FoodEntity[] }>('/api/ai/extract-entities', {
      text,
    });
    return response.data.entities;
  }

  // ===================
  // AI Food Advisor
  // ===================

  /**
   * Chat with food advisor
   * Examples: "what should I eat under 300?", "best protein meal nearby"
   */
  async chat(
    message: string,
    context: AdvisorContext = {}
  ): Promise<{
    response: string;
    recommendations: AdvisorRecommendation[];
  }> {
    const response = await this.client.post<{
      response: string;
      recommendations: AdvisorRecommendation[];
    }>('/api/ai/food-advisor', {
      message,
      ...context,
    });
    return response.data;
  }

  /**
   * Get personalized dish recommendations
   */
  async recommendDishes(
    userId: string,
    context: AdvisorContext = {}
  ): Promise<AdvisorRecommendation[]> {
    const response = await this.client.post<{ recommendations: AdvisorRecommendation[] }>(
      '/api/ai/recommend',
      {
        userId,
        ...context,
      }
    );
    return response.data.recommendations;
  }

  /**
   * Get similar dishes
   */
  async getSimilarDishes(dishId: string, limit: number = 5): Promise<{
    dish: { id: string; name: string; image?: string };
    similarity: number;
  }[]> {
    const response = await this.client.post<{
      similar: { dish: { id: string; name: string; image?: string }; similarity: number }[];
    }>('/api/ai/similar-dishes', {
      dishId,
      limit,
    });
    return response.data.similar;
  }

  // ===================
  // Sentiment Analysis
  // ===================

  /**
   * Analyze sentiment of a review or text
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const response = await this.client.post<SentimentResult>('/api/ai/sentiment', {
      text,
    });
    return response.data;
  }

  /**
   * Batch sentiment analysis
   */
  async batchSentimentAnalysis(texts: string[]): Promise<SentimentResult[]> {
    const response = await this.client.post<{ results: SentimentResult[] }>('/api/ai/sentiment/batch', {
      texts,
    });
    return response.data.results;
  }

  // ===================
  // Dish Intelligence
  // ===================

  /**
   * Get dish nutrition facts
   */
  async getDishNutrition(dishName: string): Promise<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    serving: string;
  } | null> {
    const response = await this.client.post<{
      nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
        serving: string;
      } | null;
    }>('/api/ai/dish-nutrition', {
      dishName,
    });
    return response.data.nutrition;
  }

  /**
   * Get dish origin and history
   */
  async getDishHistory(dishName: string): Promise<{
    origin: string;
    history: string;
    funFacts: string[];
  } | null> {
    const response = await this.client.post<{
      history: {
        origin: string;
        history: string;
        funFacts: string[];
      } | null;
    }>('/api/ai/dish-history', {
      dishName,
    });
    return response.data.history;
  }

  // ===================
  // Price Intelligence
  // ===================

  /**
   * Estimate fair price for a dish
   */
  async estimatePrice(
    dishName: string,
    location: string,
    quality: 'budget' | 'mid' | 'premium' = 'mid'
  ): Promise<{
    estimatedPrice: number;
    range: { min: number; max: number };
    factors: string[];
  }> {
    const response = await this.client.post('/api/ai/estimate-price', {
      dishName,
      location,
      quality,
    });
    return response.data;
  }

  // ===================
  // Restaurant Intelligence
  // ===================

  /**
   * Get restaurant specialty analysis
   */
  async analyzeRestaurantSpecialties(
    restaurantId: string
  ): Promise<{
    specialties: { dish: string; rating: number; mentions: number }[];
    cuisine: string[];
    priceRange: { min: number; max: number };
  }> {
    const response = await this.client.post('/api/ai/restaurant-analysis', {
      restaurantId,
    });
    return response.data;
  }

  /**
   * Predict wait time
   */
  async predictWaitTime(
    restaurantId: string,
    time: string
  ): Promise<{
    estimatedMinutes: number;
    confidence: number;
  }> {
    const response = await this.client.post('/api/ai/predict-wait-time', {
      restaurantId,
      time,
    });
    return response.data;
  }
}

// Singleton instance
let aiClientInstance: HojaiAIClient | null = null;

export function getHojaiAIClient(): HojaiAIClient {
  if (!aiClientInstance) {
    aiClientInstance = new HojaiAIClient();
  }
  return aiClientInstance;
}
