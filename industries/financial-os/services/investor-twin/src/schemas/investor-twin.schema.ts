// Investor Twin Schema - Defines types and validation for Investor Twin Service

export enum InvestorType {
  INDIVIDUAL = 'individual',
  INSTITUTIONAL = 'institutional',
  ACCREDITED = 'accredited',
  RETAIL = 'retail',
  FAMILY_OFFICE = 'family_office',
  VENTURE_CAPITAL = 'venture_capital',
  PRIVATE_EQUITY = 'private_equity',
  HEDGE_FUND = 'hedge_fund',
  SOVEREIGN_WEALTH = 'sovereign_wealth',
  PENSION_FUND = 'pension_fund'
}

export enum RiskTolerance {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
  VERY_AGGRESSIVE = 'very_aggressive'
}

export enum InvestmentHorizon {
  SHORT_TERM = 'short_term',       // < 2 years
  MEDIUM_TERM = 'medium_term',     // 2-5 years
  LONG_TERM = 'long_term',         // 5-10 years
  VERY_LONG_TERM = 'very_long_term' // > 10 years
}

export enum AssetClass {
  EQUITIES = 'equities',
  FIXED_INCOME = 'fixed_income',
  REAL_ESTATE = 'real_estate',
  COMMODITIES = 'commodities',
  CRYPTO = 'crypto',
  ALTERNATIVES = 'alternatives',
  CASH = 'cash',
  DERIVATIVES = 'derivatives'
}

export enum Sector {
  TECHNOLOGY = 'technology',
  HEALTHCARE = 'healthcare',
  FINANCIALS = 'financials',
  ENERGY = 'energy',
  CONSUMER = 'consumer',
  INDUSTRIALS = 'industrials',
  MATERIALS = 'materials',
  UTILITIES = 'utilities',
  REAL_ESTATE = 'real_estate',
  TELECOM = 'telecom'
}

export enum TransactionType {
  BUY = 'buy',
  SELL = 'sell',
  DIVIDEND = 'dividend',
  INTEREST = 'interest',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  FEE = 'fee',
  TRANSFER = 'transfer'
}

export enum OrderStatus {
  PENDING = 'pending',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  PARTIAL = 'partial'
}

export interface ContactInfo {
  phone: string;
  email: string;
  website?: string;
  linkedIn?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface RiskProfile {
  riskTolerance: RiskTolerance;
  investmentHorizon: InvestmentHorizon;
  maxDrawdownTolerance: number;  // Percentage
  liquidityNeeds: 'low' | 'medium' | 'high';
  incomeRequirement: number;     // Percentage of portfolio needed as income
}

export interface PortfolioAllocation {
  assetClass: AssetClass;
  targetPercentage: number;
  currentPercentage: number;
  value: number;
  lastRebalanced?: string;
}

export interface SectorAllocation {
  sector: Sector;
  percentage: number;
  value: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
  alpha: number;
  sortinoRatio: number;
  var95: number;           // Value at Risk 95%
  cvar95: number;           // Conditional Value at Risk 95%
  trackingError?: number;
  informationRatio?: number;
}

export interface Holdings {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weight: number;
  sector: Sector;
  assetClass: AssetClass;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  symbol?: string;
  quantity?: number;
  price?: number;
  amount: number;
  fees: number;
  timestamp: string;
  description?: string;
  status: OrderStatus;
}

export interface Watchlist {
  symbol: string;
  name: string;
  addedAt: string;
  targetPrice?: number;
  notes?: string;
}

export interface InvestmentGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
}

export interface ComplianceDocument {
  id: string;
  type: string;
  name: string;
  uploadedAt: string;
  expiresAt?: string;
  status: 'valid' | 'expired' | 'pending';
  url?: string;
}

// Main Investor Twin Document Interface
export interface InvestorTwinDocument {
  twinId: string;
  investorId: string;
  type: InvestorType;
  name: string;
  firmName?: string;
  description?: string;
  contact: ContactInfo;
  taxId?: string;
  riskProfile: RiskProfile;
  portfolioAllocations: PortfolioAllocation[];
  sectorAllocations: SectorAllocation[];
  currentMetrics: PerformanceMetrics;
  holdings: Holdings[];
  transactions: Transaction[];
  watchlist: Watchlist[];
  investmentGoals: InvestmentGoal[];
  totalPortfolioValue: number;
  cashBalance: number;
  totalInvested: number;
  totalReturns: number;
  returnsPercent: number;
  documents: ComplianceDocument[];
  preferences: {
    notifications: boolean;
    autoRebalance: boolean;
    rebalanceThreshold: number;
    taxLossHarvesting: boolean;
    dividendReinvestment: boolean;
  };
  status: 'active' | 'inactive' | 'suspended';
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

// Request/Response Types
export interface CreateInvestorTwinRequest {
  investorId: string;
  type: InvestorType;
  name: string;
  firmName?: string;
  description?: string;
  contact: ContactInfo;
  taxId?: string;
  riskProfile?: Partial<RiskProfile>;
  portfolioAllocations?: PortfolioAllocation[];
  sectorAllocations?: SectorAllocation[];
}

export interface CreateInvestorTwinResponse {
  twinId: string;
  investorId: string;
  twinOsEntityId: string;
  createdAt: string;
}

export interface GetInvestorTwinResponse extends InvestorTwinDocument {
  twinOsEntityId: string;
}

export interface UpdateRiskProfileRequest {
  riskProfile: Partial<RiskProfile>;
}

export interface UpdateRiskProfileResponse {
  twinId: string;
  investorId: string;
  riskProfile: RiskProfile;
  updatedAt: string;
}

export interface UpdatePortfolioRequest {
  portfolioAllocations: PortfolioAllocation[];
  sectorAllocations?: SectorAllocation[];
}

export interface UpdatePortfolioResponse {
  twinId: string;
  investorId: string;
  portfolioAllocations: PortfolioAllocation[];
  sectorAllocations: SectorAllocation[];
  updatedAt: string;
}

export interface UpdateHoldingsRequest {
  holdings: Holdings[];
}

export interface UpdateHoldingsResponse {
  twinId: string;
  investorId: string;
  holdings: Holdings[];
  totalPortfolioValue: number;
  updatedAt: string;
}

export interface AddTransactionRequest {
  transaction: Omit<Transaction, 'id'>;
}

export interface AddTransactionResponse {
  twinId: string;
  investorId: string;
  transaction: Transaction;
  updatedAt: string;
}

export interface UpdateMetricsRequest {
  currentMetrics?: Partial<PerformanceMetrics>;
  totalPortfolioValue?: number;
  cashBalance?: number;
  totalInvested?: number;
  totalReturns?: number;
  returnsPercent?: number;
}

export interface UpdateMetricsResponse {
  twinId: string;
  investorId: string;
  currentMetrics: PerformanceMetrics;
  totalPortfolioValue: number;
  updatedAt: string;
}

export interface AddToWatchlistRequest {
  symbol: string;
  name: string;
  targetPrice?: number;
  notes?: string;
}

export interface AddToWatchlistResponse {
  twinId: string;
  investorId: string;
  watchlist: Watchlist[];
  updatedAt: string;
}

export interface RemoveFromWatchlistRequest {
  symbol: string;
}

export interface RemoveFromWatchlistResponse {
  twinId: string;
  investorId: string;
  watchlist: Watchlist[];
  updatedAt: string;
}

export interface UpdatePreferencesRequest {
  preferences: Partial<InvestorTwinDocument['preferences']>;
}

export interface UpdatePreferencesResponse {
  twinId: string;
  investorId: string;
  preferences: InvestorTwinDocument['preferences'];
  updatedAt: string;
}

export interface ListInvestorsRequest {
  type?: InvestorType;
  status?: 'active' | 'inactive' | 'suspended';
  riskTolerance?: RiskTolerance;
  minValue?: number;
  maxValue?: number;
  limit?: number;
  offset?: number;
}

export interface ListInvestorsResponse {
  investors: InvestorTwinDocument[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetPortfolioSummaryResponse {
  twinId: string;
  investorId: string;
  totalPortfolioValue: number;
  cashBalance: number;
  totalInvested: number;
  totalReturns: number;
  returnsPercent: number;
  assetAllocation: {
    assetClass: AssetClass;
    value: number;
    percentage: number;
  }[];
  sectorAllocation: {
    sector: Sector;
    value: number;
    percentage: number;
  }[];
  topHoldings: Holdings[];
  recentTransactions: Transaction[];
  performanceMetrics: PerformanceMetrics;
}

// Default values
export const defaultRiskProfile: RiskProfile = {
  riskTolerance: RiskTolerance.MODERATE,
  investmentHorizon: InvestmentHorizon.MEDIUM_TERM,
  maxDrawdownTolerance: 15,
  liquidityNeeds: 'medium',
  incomeRequirement: 0
};

export const defaultPerformanceMetrics: PerformanceMetrics = {
  totalReturn: 0,
  annualizedReturn: 0,
  volatility: 0,
  sharpeRatio: 0,
  maxDrawdown: 0,
  beta: 1,
  alpha: 0,
  sortinoRatio: 0,
  var95: 0,
  cvar95: 0
};

export const defaultPreferences: InvestorTwinDocument['preferences'] = {
  notifications: true,
  autoRebalance: false,
  rebalanceThreshold: 5,
  taxLossHarvesting: true,
  dividendReinvestment: false
};

export const defaultPortfolioAllocations: PortfolioAllocation[] = [
  { assetClass: AssetClass.EQUITIES, targetPercentage: 60, currentPercentage: 0, value: 0 },
  { assetClass: AssetClass.FIXED_INCOME, targetPercentage: 30, currentPercentage: 0, value: 0 },
  { assetClass: AssetClass.CASH, targetPercentage: 10, currentPercentage: 0, value: 0 }
];
