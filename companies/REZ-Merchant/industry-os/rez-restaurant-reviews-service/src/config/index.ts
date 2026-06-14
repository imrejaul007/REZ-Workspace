/**
 * Restaurant Reviews Service - Configuration
 */

export interface AppConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const DEFAULT_CONFIG: AppConfig = {
  port: parseInt(process.env.PORT || '4057', 10),
  environment: (process.env.NODE_ENV as AppConfig['environment']) || 'development',
  logLevel: (process.env.LOG_LEVEL as AppConfig['logLevel']) || 'info',
};

// Review settings
export const REVIEW_SETTINGS = {
  minRating: 1,
  maxRating: 5,
  maxCommentLength: 2000,
  maxTitleLength: 100,
  autoApproveThreshold: 4, // Auto-approve reviews with rating >= 4
  moderationQueueThreshold: 2, // Move to moderation if rating <= 2
  maxPhotosPerReview: 5,
  helpfulVoteBonus: 1,
};

// Sentiment analysis keywords
export const SENTIMENT_KEYWORDS = {
  positive: [
    'excellent', 'amazing', 'great', 'wonderful', 'fantastic', 'perfect',
    'best', 'loved', 'delicious', 'outstanding', 'superb', 'tasty',
    'fresh', 'friendly', 'clean', 'beautiful', 'recommend', 'impressed'
  ],
  negative: [
    'terrible', 'awful', 'horrible', 'bad', 'worst', 'disappointing',
    'poor', 'dirty', 'rude', 'slow', 'cold', 'overpriced', 'mediocre',
    'bland', 'stale', 'unprofessional', 'overrated', 'avoid'
  ],
  neutral: [
    'okay', 'ok', 'average', 'decent', 'fair', 'acceptable', 'mixed'
  ],
};

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type ReviewSentiment = 'positive' | 'neutral' | 'negative';

export default { DEFAULT_CONFIG, REVIEW_SETTINGS, SENTIMENT_KEYWORDS };
