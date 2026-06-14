/**
 * AssetMind TypeScript SDK - Types
 */

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetClass: string;
  exchange?: string;
  country?: string;
  currency: string;
  status: string;
}

export interface AssetTwin {
  symbol: string;
  opportunityScore: number;
  riskScore: number;
  sentiment: number;
  prediction: Prediction;
  currentPrice: number;
  priceChange24h: number;
}

export interface Prediction {
  bullishProbability: number;
  neutralProbability: number;
  bearishProbability: number;
  confidence: number;
  timeHorizon: string;
  reasoningChain: string[];
  supportingFactors: string[];
  contradictingFactors: string[];
}

export interface ResearchReport {
  reportId: string;
  subject: string;
  rating: 'BUY' | 'HOLD' | 'SELL';
  priceTarget: number;
  currentPrice: number;
  upside: number;
  timeHorizon: string;
  conviction: 'HIGH' | 'MEDIUM' | 'LOW';
  executiveSummary: string;
  keyThesisPoints: string[];
  riskFactors: string[];
  monitoringPoints: string[];
  confidence: number;
  dataSources: string[];
}

export interface Briefing {
  date: string;
  marketSentiment: string;
  topOpportunities: Opportunity[];
  topRisks: Risk[];
  economicEvents: EconomicEvent[];
  portfolioImpact: string[];
}

export interface Opportunity {
  symbol: string;
  name: string;
  score: number;
  conviction: string;
  thesis: string;
  riskLevel: string;
  sector?: string;
}

export interface Risk {
  name: string;
  type: string;
  score: number;
  reason: string;
  affectedAssets: string[];
}

export interface EconomicEvent {
  event: string;
  impact: string;
  time: string;
  forecast?: string;
}

export interface HealthScores {
  overallHealth: number;
  market: number;
  financial: number;
  sentiment: number;
  risk: number;
  technical: number;
}

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  weight: number;
}

export interface PortfolioAnalytics {
  totalValue: number;
  totalReturn: number;
  totalReturnPct: number;
  dayPnl: number;
  beta: number;
  diversificationScore: number;
  riskScore: number;
}

export interface HealthCheck {
  service: string;
  status: string;
  version: string;
  port: number;
}

export interface APIResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
