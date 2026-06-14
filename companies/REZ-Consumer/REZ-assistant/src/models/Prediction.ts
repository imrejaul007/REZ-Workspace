/**
 * Prediction Model
 * AI-powered predictions for user needs and behaviors
 */

import { IntentCategory, SearchIntent } from './SearchIntent';
import { UserPreference, PreferenceInsight } from './UserPreference';

export type PredictionType =
  | 'next_category'
  | 'purchase_intent'
  | 'churn_risk'
  | 'price_elasticity'
  | 'recommendation'
  | 'abandonment_risk'
  | 'upsell_opportunity'
  | 're-engagement';

export interface PredictionConfidence {
  score: number; // 0-1
  factors: Array<{
    factor: string;
    weight: number;
    contribution: number;
  }>;
  model_version: string;
}

export interface PurchaseIntentPrediction {
  prediction_type: 'purchase_intent';
  user_id: string;
  intent_id: string;
  probability: number; // 0-1
  predicted_timeframe: 'immediate' | 'within_hour' | 'within_day' | 'within_week';
  recommended_action: string;
  confidence: PredictionConfidence;
  triggering_signals: string[];
}

export interface ChurnRiskPrediction {
  prediction_type: 'churn_risk';
  user_id: string;
  risk_score: number; // 0-1, higher = more likely to churn
  risk_factors: string[];
  predicted_inactive_days: number;
  recommended_retention_offers: string[];
  confidence: PredictionConfidence;
}

export interface AbandonmentRiskPrediction {
  prediction_type: 'abandonment_risk';
  current_intent: SearchIntent;
  risk_score: number; // 0-1
  risk_signals: Array<{
    signal: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  recommended_interventions: string[];
  confidence: PredictionConfidence;
}

export interface NextCategoryPrediction {
  prediction_type: 'next_category';
  user_id: string;
  predicted_categories: Array<{
    category: IntentCategory;
    probability: number;
    reasoning: string;
  }>;
  context_window_start: Date;
  context_window_end: Date;
  confidence: PredictionConfidence;
}

export interface RecommendationPrediction {
  prediction_type: 'recommendation';
  user_id: string;
  recommendations: Array<{
    merchant_id: string;
    score: number;
    reason: string;
    category: IntentCategory;
    price_range: [number, number];
    match_score: number; // How well it matches preferences
  }>;
  strategy: 'personalized' | 'exploratory' | 'trending' | 'complementary';
  confidence: PredictionConfidence;
}

export interface UpsellPrediction {
  prediction_type: 'upsell_opportunity';
  user_id: string;
  current_purchase_id: string;
  upsell_probability: number;
  suggested_add_ons: Array<{
    item_id: string;
    name: string;
    price: number;
    relevance_score: number;
    conversion_probability: number;
  }>;
  discount_effectiveness: number; // How effective would a discount be
  confidence: PredictionConfidence;
}

export interface ReEngagementPrediction {
  prediction_type: 're-engagement';
  user_id: string;
  inactivity_days: number;
  predicted_reactivation_date: Date;
  optimal_contact_channel: 'push' | 'email' | 'sms' | 'in_app';
  optimal_contact_time: Date;
  incentive_recommendation: string;
  confidence: PredictionConfidence;
}

export type Prediction =
  | PurchaseIntentPrediction
  | ChurnRiskPrediction
  | AbandonmentRiskPrediction
  | NextCategoryPrediction
  | RecommendationPrediction
  | UpsellPrediction
  | ReEngagementPrediction;

export interface PredictionRequest {
  user_id: string;
  prediction_type: PredictionType;
  context?: {
    current_intent?: SearchIntent;
    preferences?: UserPreference;
    recent_insights?: PreferenceInsight[];
    time_horizon?: 'realtime' | 'hourly' | 'daily' | 'weekly';
  };
}

export interface PredictionResponse {
  prediction: Prediction;
  model_metadata: {
    version: string;
    latency_ms: number;
    features_used: string[];
  };
}
