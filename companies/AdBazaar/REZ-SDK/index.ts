/**
 * REZ AdBazaar SDK - Core Module
 * Unified SDK for all AdBazaar Intelligence Services
 */

export interface SDKConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface ServiceClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
}

class BaseService implements ServiceClient {
  protected baseUrl: string;
  protected timeout: number;
  protected retries: number;

  constructor(config: SDKConfig, private port: number) {
    this.baseUrl = config.baseUrl || 'http://localhost';
    this.timeout = config.timeout || 10000;
    this.retries = config.retries || 3;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}:${this.port}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new SDKError(`HTTP ${response.status}: ${response.statusText}`, response.status);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof SDKError) throw error;
      throw new SDKError(`Request failed: ${(error as Error).message}`, 0, true);
    }
  }

  async get<T>(path: string): Promise<T> {
    return this.fetch<T>(path);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.fetch<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

// Error class
export class SDKError extends Error {
  constructor(
    message: string,
    public code: number,
    public retryable = false
  ) {
    super(message);
    this.name = 'SDKError';
  }
}

// ============================================
// Email Validator Service (Port 4810)
// ============================================
export class EmailValidatorService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4810);
  }

  async validate(email: string): Promise<EmailValidationResult> {
    return this.post<EmailValidationResult>('/api/validate', { email });
  }

  async checkDisposable(email: string): Promise<{ isDisposable: boolean }> {
    return this.post<{ isDisposable: boolean }>('/api/check-disposable', { email });
  }

  async checkMx(email: string): Promise<{ hasMx: boolean }> {
    return this.post<{ hasMx: boolean }>('/api/check-mx', { email });
  }
}

export interface EmailValidationResult {
  email: string;
  isValid: boolean;
  isDisposable: boolean;
  hasMx: boolean;
  riskScore: number;
}

// ============================================
// Fraud Detection Service (Port 4811)
// ============================================
export class FraudDetectionService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4811);
  }

  async detect(params: FraudDetectionParams): Promise<FraudResult> {
    return this.post<FraudResult>('/api/detect', params);
  }

  async getRiskScore(userId: string): Promise<RiskScore> {
    return this.get<RiskScore>(`/api/risk/${userId}`);
  }
}

export interface FraudDetectionParams {
  userId: string;
  ip: string;
  deviceFingerprint?: string;
  eventType: 'click' | 'view' | 'conversion';
}

export interface FraudResult {
  riskScore: number;
  isBot: boolean;
  isSuspicious: boolean;
  reasons: string[];
}

export interface RiskScore {
  userId: string;
  score: number;
  factors: string[];
}

// ============================================
// A/B Testing Service (Port 4812)
// ============================================
export class ABTestingService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4812);
  }

  async create(params: ExperimentParams): Promise<Experiment> {
    return this.post<Experiment>('/api/experiments', params);
  }

  async getVariant(experimentId: string, userId: string): Promise<{ variant: string }> {
    return this.get<{ variant: string }>(`/api/experiments/${experimentId}/variant/${userId}`);
  }

  async trackConversion(experimentId: string, variant: string, userId: string): Promise<void> {
    await this.post('/api/experiments/${experimentId}/conversion', { variant, userId });
  }

  async getResults(experimentId: string): Promise<ExperimentResults> {
    return this.get<ExperimentResults>(`/api/experiments/${experimentId}/results`);
  }
}

export interface ExperimentParams {
  name: string;
  variants: string[];
  traffic: Record<string, number>;
}

export interface Experiment {
  id: string;
  name: string;
  variants: string[];
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}

export interface ExperimentResults {
  experimentId: string;
  variants: VariantResult[];
  significance: number;
  winner?: string;
}

export interface VariantResult {
  name: string;
  impressions: number;
  conversions: number;
  rate: number;
}

// ============================================
// Brand Safety Service (Port 4813)
// ============================================
export class BrandSafetyService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4813);
  }

  async check(params: BrandSafetyParams): Promise<BrandSafetyResult> {
    return this.post<BrandSafetyResult>('/api/check', params);
  }

  async checkBatch(contents: BrandSafetyParams[]): Promise<BrandSafetyResult[]> {
    return this.post<BrandSafetyResult[]>('/api/check-batch', { contents });
  }
}

export interface BrandSafetyParams {
  content: string;
  type: 'text' | 'image';
}

export interface BrandSafetyResult {
  isSafe: boolean;
  score: number;
  issues: string[];
  categories: string[];
}

// ============================================
// Viewability Tracker Service (Port 4814)
// ============================================
export class ViewabilityService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4814);
  }

  async track(params: ViewabilityParams): Promise<ViewabilityResult> {
    return this.post<ViewabilityResult>('/api/track', params);
  }

  async getReport(adId: string): Promise<ViewabilityReport> {
    return this.get<ViewabilityReport>(`/api/reports/${adId}`);
  }
}

export interface ViewabilityParams {
  adId: string;
  impressionId: string;
  visible: boolean;
  duration: number;
}

export interface ViewabilityResult {
  impressionId: string;
  viewable: boolean;
  measurable: boolean;
}

export interface ViewabilityReport {
  adId: string;
  totalImpressions: number;
  viewableImpressions: number;
  viewabilityRate: number;
  avgDuration: number;
}

// ============================================
// Attribution Modeling Service (Port 4815)
// ============================================
export class AttributionService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4815);
  }

  async attribute(params: AttributionParams): Promise<AttributionResult> {
    return this.post<AttributionResult>('/api/attribute', params);
  }

  async getModelPerformance(model: string): Promise<ModelPerformance> {
    return this.get<ModelPerformance>(`/api/models/${model}/performance`);
  }
}

export type AttributionModel = 'first-click' | 'last-click' | 'linear' | 'time-decay' | 'position-based' | 'data-driven';

export interface AttributionParams {
  customerId: string;
  touches: Touchpoint[];
  conversionValue: number;
  model?: AttributionModel;
}

export interface Touchpoint {
  channel: string;
  timestamp: string;
}

export interface AttributionResult {
  customerId: string;
  model: AttributionModel;
  channels: ChannelAttribution[];
  totalValue: number;
}

export interface ChannelAttribution {
  channel: string;
  attributedValue: number;
  percentage: number;
}

export interface ModelPerformance {
  model: string;
  accuracy: number;
  sampleSize: number;
  lastUpdated: string;
}

// ============================================
// Audience Sync Service (Port 4816)
// ============================================
export class AudienceSyncService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4816);
  }

  async create(params: AudienceParams): Promise<Audience> {
    return this.post<Audience>('/api/audiences', params);
  }

  async list(): Promise<Audience[]> {
    return this.get<Audience[]>('/api/audiences');
  }

  async syncToDmp(audienceId: string, target: 'liveramp' | 'segment'): Promise<SyncResult> {
    return this.post<SyncResult>(`/api/audiences/${audienceId}/sync`, { target });
  }
}

export interface AudienceParams {
  name: string;
  source: string;
  segments: string[];
}

export interface Audience {
  id: string;
  name: string;
  size: number;
  createdAt: string;
}

export interface SyncResult {
  audienceId: string;
  target: string;
  status: 'pending' | 'completed' | 'failed';
  recordsSynced: number;
}

// ============================================
// Creative Rotation Service (Port 4817)
// ============================================
export class CreativeRotationService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4817);
  }

  async getCreative(params: RotationParams): Promise<RotationResult> {
    return this.post<RotationResult>('/api/rotate', params);
  }

  async recordImpression(creativeId: string): Promise<void> {
    await this.post('/api/impressions', { creativeId });
  }

  async recordClick(creativeId: string): Promise<void> {
    await this.post('/api/clicks', { creativeId });
  }
}

export interface RotationParams {
  campaignId: string;
  userId: string;
  context?: Record<string, unknown>;
}

export interface RotationResult {
  adId: string;
  creativeId: string;
  content: string;
  algorithm: string;
}

// ============================================
// Frequency Capping Service (Port 4818)
// ============================================
export class FrequencyCappingService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4818);
  }

  async check(params: FrequencyParams): Promise<FrequencyResult> {
    return this.post<FrequencyResult>('/api/check', params);
  }

  async getStats(userId: string, campaignId: string): Promise<FrequencyStats> {
    return this.get<FrequencyStats>(`/api/stats/${userId}/${campaignId}`);
  }
}

export interface FrequencyParams {
  userId: string;
  campaignId: string;
  adId?: string;
}

export interface FrequencyResult {
  canServe: boolean;
  impressions: number;
  limit: number;
  remaining: number;
}

export interface FrequencyStats {
  userId: string;
  campaignId: string;
  dailyImpressions: number;
  weeklyImpressions: number;
  lifetimeImpressions: number;
}

// ============================================
// Budget Allocator Service (Port 4819)
// ============================================
export class BudgetAllocatorService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4819);
  }

  async allocate(params: BudgetParams): Promise<BudgetResult> {
    return this.post<BudgetResult>('/api/allocate', params);
  }

  async rebalance(campaignId: string): Promise<BudgetResult> {
    return this.post<BudgetResult>(`/api/rebalance/${campaignId}`, {});
  }
}

export interface BudgetParams {
  totalBudget: number;
  channels: string[];
  historical: ChannelHistorical[];
}

export interface ChannelHistorical {
  channel: string;
  spend: number;
  conversions: number;
}

export interface BudgetResult {
  totalBudget: number;
  allocation: ChannelAllocation[];
  algorithm: string;
  lastUpdated: string;
}

export interface ChannelAllocation {
  channel: string;
  allocatedBudget: number;
  percentage: number;
  expectedConversions: number;
}

// ============================================
// Churn Predictor Service (Port 4900)
// ============================================
export class ChurnPredictorService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4900);
  }

  async predict(params: ChurnParams): Promise<ChurnResult> {
    return this.post<ChurnResult>('/api/predict', params);
  }

  async getSegment(customerId: string): Promise<ChurnSegment> {
    return this.get<ChurnSegment>(`/api/segment/${customerId}`);
  }
}

export interface ChurnParams {
  customerId: string;
  features: {
    daysSinceLastPurchase: number;
    totalOrders: number;
    avgOrderValue: number;
    engagementScore: number;
  };
}

export interface ChurnResult {
  churnProbability: number;
  riskSegment: 'low' | 'medium' | 'high';
  recommendedActions: string[];
}

export interface ChurnSegment {
  customerId: string;
  segment: 'champions' | 'loyal' | 'at-risk' | 'churned';
}

// ============================================
// LTV Calculator Service (Port 4901)
// ============================================
export class LTVCalculatorService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4901);
  }

  async calculate(params: LTVParams): Promise<LTVResult> {
    return this.post<LTVResult>('/api/calculate', params);
  }

  async getBreakdown(customerId: string): Promise<LTVBreakdown> {
    return this.get<LTVBreakdown>(`/api/breakdown/${customerId}`);
  }
}

export interface LTVParams {
  customerId: string;
  features: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    customerAge: number;
  };
}

export interface LTVResult {
  customerId: string;
  predictedLTV: number;
  confidence: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface LTVBreakdown {
  customerId: string;
  historicalLTV: number;
  predictedLTV: number;
  breakdown: {
    repeatPurchases: number;
    avgOrderValue: number;
    retentionRate: number;
  };
}

// ============================================
// Next Best Action Service (Port 4902)
// ============================================
export class NextBestActionService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4902);
  }

  async recommend(params: NBAParams): Promise<NBAResult> {
    return this.post<NBAResult>('/api/recommend', params);
  }

  async getHistory(customerId: string): Promise<NBAAction[]> {
    return this.get<NBAAction[]>(`/api/history/${customerId}`);
  }
}

export interface NBAParams {
  customerId: string;
  context: {
    lastPurchase?: string;
    cartValue?: number;
    segment?: string;
  };
}

export interface NBAResult {
  customerId: string;
  recommendedAction: string;
  actionType: string;
  confidence: number;
  alternativeActions: string[];
}

export interface NBAAction {
  action: string;
  timestamp: string;
  outcome?: string;
}

// ============================================
// Sentiment Analyzer Service (Port 4903)
// ============================================
export class SentimentAnalyzerService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4903);
  }

  async analyze(params: SentimentParams): Promise<SentimentResult> {
    return this.post<SentimentResult>('/api/analyze', params);
  }

  async analyzeBatch(texts: string[]): Promise<SentimentResult[]> {
    return this.post<SentimentResult[]>('/api/analyze-batch', { texts });
  }
}

export interface SentimentParams {
  text: string;
  source?: string;
}

export interface SentimentResult {
  text: string;
  score: number;
  label: 'positive' | 'neutral' | 'negative';
  keywords: string[];
}

// ============================================
// Competitor Monitor Service (Port 4904)
// ============================================
export class CompetitorMonitorService extends BaseService {
  constructor(config: SDKConfig) {
    super(config, 4904);
  }

  async listCompetitors(): Promise<Competitor[]> {
    return this.get<Competitor[]>('/api/competitors');
  }

  async getAnalysis(competitorId: string): Promise<CompetitorAnalysis> {
    return this.get<CompetitorAnalysis>(`/api/competitors/${competitorId}/analysis`);
  }

  async addCompetitor(params: CompetitorParams): Promise<Competitor> {
    return this.post<Competitor>('/api/competitors', params);
  }
}

export interface CompetitorParams {
  name: string;
  website: string;
  industry: string;
}

export interface Competitor {
  id: string;
  name: string;
  website: string;
  lastUpdated: string;
}

export interface CompetitorAnalysis {
  competitorId: string;
  sentiment: SentimentResult;
  mentions: number;
  trending: 'up' | 'down' | 'stable';
}

// ============================================
// Main AdIntelligence Class
// ============================================
export class AdIntelligence {
  email: EmailValidatorService;
  fraud: FraudDetectionService;
  ab: ABTestingService;
  brandSafety: BrandSafetyService;
  viewability: ViewabilityService;
  attribution: AttributionService;
  audience: AudienceSyncService;
  creative: CreativeRotationService;
  frequency: FrequencyCappingService;
  budget: BudgetAllocatorService;
  churn: ChurnPredictorService;
  ltv: LTVCalculatorService;
  nba: NextBestActionService;
  sentiment: SentimentAnalyzerService;
  competitor: CompetitorMonitorService;

  constructor(config: SDKConfig = {}) {
    this.email = new EmailValidatorService(config);
    this.fraud = new FraudDetectionService(config);
    this.ab = new ABTestingService(config);
    this.brandSafety = new BrandSafetyService(config);
    this.viewability = new ViewabilityService(config);
    this.attribution = new AttributionService(config);
    this.audience = new AudienceSyncService(config);
    this.creative = new CreativeRotationService(config);
    this.frequency = new FrequencyCappingService(config);
    this.budget = new BudgetAllocatorService(config);
    this.churn = new ChurnPredictorService(config);
    this.ltv = new LTVCalculatorService(config);
    this.nba = new NextBestActionService(config);
    this.sentiment = new SentimentAnalyzerService(config);
    this.competitor = new CompetitorMonitorService(config);
  }
}

// Analytics wrapper for backward compatibility
export class AnalyticsService {
  churn: ChurnPredictorService;
  ltv: LTVCalculatorService;
  nba: NextBestActionService;
  sentiment: SentimentAnalyzerService;

  constructor(config: SDKConfig = {}) {
    this.churn = new ChurnPredictorService(config);
    this.ltv = new LTVCalculatorService(config);
    this.nba = new NextBestActionService(config);
    this.sentiment = new SentimentAnalyzerService(config);
  }
}

// Export everything
export * from './index';
