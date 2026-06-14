// Core Types for REZ Mind Spa Service

export interface CustomerPreferences {
  skinType?: SkinType;
  concerns?: string[];
  budget?: BudgetLevel;
  preferredTime?: TimePreference;
  duration?: number;
  allergies?: string[];
  medicalConditions?: string[];
  preferredTherapistGender?: GenderPreference;
  atmosphere?: AtmospherePreference;
}

export type SkinType = 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive' | 'acne-prone' | 'mature';
export type BudgetLevel = 'economy' | 'mid-range' | 'premium' | 'luxury';
export type TimePreference = 'morning' | 'afternoon' | 'evening' | 'any';
export type GenderPreference = 'male' | 'female' | 'no-preference';
export type AtmospherePreference = 'tranquil' | 'energetic' | 'social' | 'private';

export interface Treatment {
  treatmentId: string;
  name: string;
  category: TreatmentCategory;
  description: string;
  duration: number;
  basePrice: number;
  recommendedPrice?: number;
  benefits: string[];
  suitableFor: string[];
  contraindications: string[];
  seasonality?: SeasonalPattern;
  popularityScore?: number;
}

export type TreatmentCategory =
  | 'massage'
  | 'facial'
  | 'body-treatment'
  | 'aromatherapy'
  | 'hydrotherapy'
  | 'reflexology'
  | 'hot-stone'
  | 'swedish'
  | 'deep-tissue'
  | 'thai'
  | 'bali'
  | 'ayurvedic'
  | 'steam'
  | 'sauna'
  | 'wrap'
  | 'scrub'
  | 'manicure'
  | 'pedicure'
  | 'hair-treatment'
  | 'waxing'
  | 'other';

export interface SeasonalPattern {
  peakMonths: number[];
  lowMonths: number[];
  priceMultiplier: number;
}

export interface Therapist {
  therapistId: string;
  name: string;
  specialties: TreatmentCategory[];
  certifications: string[];
  experience: number;
  rating: number;
  availability: AvailabilitySlot[];
  customerRatings: CustomerRating[];
  languages: string[];
  gender?: 'male' | 'female';
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startHour: number;
  endHour: number;
}

export interface CustomerRating {
  customerId: string;
  rating: number;
  comment?: string;
  date: Date;
}

export interface PastVisit {
  treatmentId: string;
  treatmentName: string;
  date: Date;
  satisfaction: number;
  therapistId?: string;
  notes?: string;
}

export interface WellnessPackage {
  packageId: string;
  name: string;
  description: string;
  treatments: PackageTreatment[];
  originalPrice: number;
  packagePrice: number;
  savings: number;
  recommendedFor: string[];
  validity: number;
}

export interface PackageTreatment {
  treatmentId: string;
  name: string;
  duration: number;
  order: number;
}

export interface TreatmentRecommendation {
  treatment: Treatment;
  score: number;
  reason: string;
  upsellPotential: boolean;
  seasonalRelevance: number;
  confidence: number;
}

export interface TherapistMatch {
  therapist: Therapist;
  matchScore: number;
  matchReasons: string[];
  availabilityScore: number;
  customerSatisfactionPrediction: number;
}

export interface UpsellOpportunity {
  type: UpsellType;
  treatment: Treatment;
  currentTreatment: Treatment;
  savings: number;
  message: string;
  conversionProbability: number;
}

export type UpsellType = 'bundle' | 'upgrade' | 'addon' | 'membership' | 'package';

export interface CustomerSegmentation {
  segmentId: string;
  segmentName: string;
  characteristics: string[];
  preferences: CustomerPreferences;
  avgLifetimeValue: number;
  retentionRate: number;
  preferredChannels: string[];
}

export interface LifetimeValuePrediction {
  predictedCLV: number;
  confidence: number;
  factors: CLVFactor[];
  tier: CustomerTier;
  recommendations: string[];
}

export interface CLVFactor {
  factor: string;
  impact: number;
  weight: number;
}

export type CustomerTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface SentimentAnalysis {
  overall: number;
  positive: number;
  negative: number;
  neutral: number;
  keywords: SentimentKeyword[];
  trends: SentimentTrend[];
}

export interface SentimentKeyword {
  keyword: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  frequency: number;
}

export interface SentimentTrend {
  period: string;
  direction: 'improving' | 'declining' | 'stable';
  delta: number;
}

export interface ConsultationRequest {
  merchantId: string;
  customerId: string;
  customerName?: string;
  preferences: CustomerPreferences;
  pastVisits?: PastVisit[];
  sessionId?: string;
}

export interface ConsultationResponse {
  sessionId: string;
  customerId: string;
  recommendations: TreatmentRecommendation[];
  therapistMatches: TherapistMatch[];
  upsellOpportunities: UpsellOpportunity[];
  suggestedPackages: WellnessPackage[];
  customerSegmentation?: CustomerSegmentation;
  lifetimeValuePrediction: LifetimeValuePrediction;
  insights: string[];
}

export interface PricingAnalysis {
  treatmentId: string;
  treatmentName: string;
  currentPrice: number;
  recommendedPrice: PriceRecommendation;
  factors: PricingFactor[];
  competitivePosition: CompetitivePosition;
  seasonalRecommendation: SeasonalPricing;
}

export interface PriceRecommendation {
  minPrice: number;
  optimalPrice: number;
  maxPrice: number;
  confidence: number;
  strategy: PricingStrategy;
}

export interface PricingFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface CompetitivePosition {
  percentile: number;
  belowAverage: boolean;
  marketAverage: number;
  positioning: 'budget' | 'mid-market' | 'premium' | 'luxury';
}

export interface SeasonalPricing {
  currentSeason: Season;
  multiplier: number;
  recommendations: SeasonalPriceRecommendation[];
}

export interface SeasonalPriceRecommendation {
  month: number;
  recommendedMultiplier: number;
  reason: string;
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type PricingStrategy = 'penetration' | 'value' | 'premium' | 'competitive';

export interface WellnessInsight {
  insightId: string;
  merchantId: string;
  type: InsightType;
  confidence: number;
  payload: InsightPayload;
  metadata: InsightMetadata;
  expiresAt: Date;
  createdAt: Date;
}

export type InsightType = 'treatment' | 'upsell' | 'retention' | 'pricing';

export interface InsightPayload {
  title: string;
  description: string;
  data?: Record<string, unknown>;
  recommendations?: string[];
  metrics?: InsightMetric[];
}

export interface InsightMetric {
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  unit?: string;
}

export interface InsightMetadata {
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  source: string;
}

export interface InsightsDashboard {
  merchantId: string;
  period: string;
  summary: DashboardSummary;
  treatmentPerformance: TreatmentPerformance[];
  customerBehavior: CustomerBehaviorInsights;
  revenueOptimization: RevenueOptimization[];
  retentionMetrics: RetentionMetrics;
  topInsights: WellnessInsight[];
  generatedAt: Date;
}

export interface DashboardSummary {
  totalSessions: number;
  activeCustomers: number;
  avgSatisfaction: number;
  revenueGrowth: number;
  retentionRate: number;
  topCategory: TreatmentCategory;
}

export interface TreatmentPerformance {
  treatmentId: string;
  treatmentName: string;
  bookings: number;
  revenue: number;
  avgSatisfaction: number;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
}

export interface CustomerBehaviorInsights {
  peakHours: PeakHour[];
  preferredTreatments: string[];
  avgVisitFrequency: number;
  seasonality: SeasonalBehavior;
  churnRiskCustomers: number;
  vipCustomers: number;
}

export interface PeakHour {
  hour: number;
  dayOfWeek: number;
  bookingCount: number;
}

export interface SeasonalBehavior {
  peakSeason: Season;
  lowSeason: Season;
  predictedDemand: Record<Season, number>;
}

export interface RevenueOptimization {
  opportunityId: string;
  type: 'pricing' | 'package' | 'upsell' | 'retention';
  potentialRevenue: number;
  implementationEffort: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface RetentionMetrics {
  overall: number;
  byTier: Record<CustomerTier, number>;
  churnRate: number;
  reactivationRate: number;
  nps: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
  latency?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  duration: number;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SpaMindSession {
  merchantId: string;
  sessionId: string;
  customerId: string;
  analysis: {
    customerSegmentation?: CustomerSegmentation;
    sentiment?: SentimentAnalysis;
    preferences?: CustomerPreferences;
  };
  recommendations: TreatmentRecommendation[];
  therapistMatches: TherapistMatch[];
  lifetimeValuePrediction?: LifetimeValuePrediction;
  sessionData: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Environment Config Types
export interface AppConfig {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwtSecret: string;
  internalToken: string;
  logLevel: string;
  corsOrigins: string[];
  rateLimitWindow: number;
  rateLimitMax: number;
}
