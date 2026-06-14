// Merchant Profile Types
export interface MerchantProfile {
  merchantId: string;
  businessName: string;
  businessType: string;
  category: string;
  subcategory?: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
  // Additional properties
  revenuePatterns?: RevenuePatterns;
  orderVolume?: OrderVolume;
  popularItems?: PopularItems;
  customerDemographics?: CustomerDemographics;
  peakHoursDays?: PeakHoursDays;
  inventoryPatterns?: InventoryPatterns;
  seasonalTrends?: SeasonalTrends;
  growthMetrics?: GrowthMetrics;
  healthSignals?: HealthSignals;
}

// Revenue Patterns
export interface RevenuePatterns {
  daily: DailyRevenue[];
  weekly: WeeklyRevenue[];
  monthly: MonthlyRevenue[];
  averageOrderValue: number;
  totalRevenue: number;
  revenueGrowth: {
    mom: number;
    wow: number;
    yoy?: number;
  };
}

export interface DailyRevenue {
  date: string;
  amount: number;
  orderCount: number;
}

export interface WeeklyRevenue {
  weekStart: string;
  weekEnd: string;
  amount: number;
  orderCount: number;
}

export interface MonthlyRevenue {
  month: string;
  amount: number;
  orderCount: number;
}

// Order Volume
export interface OrderVolume {
  total: number;
  completed: number;
  cancelled: number;
  refunded: number;
  pending: number;
  averagePerDay: number;
  averagePerWeek: number;
  frequency: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  peakTimes: PeakTime[];
}

export interface PeakTime {
  hour: number;
  dayOfWeek: number;
  orderCount: number;
  averageValue: number;
}

// Popular Items
export interface PopularItem {
  itemId: string;
  itemName: string;
  category: string;
  orderCount: number;
  revenue: number;
  percentageOfTotal: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

export interface PopularItems {
  items: PopularItem[];
  totalItems: number;
  topCategories: { category: string; count: number }[];
}

// Customer Demographics (Inferred)
export interface CustomerDemographics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  retentionRate: number;
  demographics: {
    ageGroups: AgeGroupDistribution;
    customerTypes: CustomerTypeDistribution;
    locations: LocationDistribution[];
    orderPatterns: OrderPatternDistribution;
  };
  topCustomers: TopCustomer[];
  customerLifetimeValue: {
    average: number;
    median: number;
    distribution: { range: string; count: number }[];
  };
}

export interface AgeGroupDistribution {
  '18-24': number;
  '25-34': number;
  '35-44': number;
  '45-54': number;
  '55+': number;
}

export interface CustomerTypeDistribution {
  individual: number;
  business: number;
  premium: number;
}

export interface LocationDistribution {
  location: string;
  count: number;
  percentage: number;
}

export interface OrderPatternDistribution {
  timeOfDay: { morning: number; afternoon: number; evening: number; night: number };
  orderSize: { small: number; medium: number; large: number };
  frequency: { occasional: number; regular: number; frequent: number };
}

export interface TopCustomer {
  customerId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date;
  customerType: string;
}

// Peak Hours/Days
export interface PeakHoursDays {
  hourlyDistribution: HourlyData[];
  dailyDistribution: DailyData[];
  weeklyDistribution: WeeklyData[];
  monthlyDistribution: MonthlyData[];
  seasonalPatterns: SeasonalPattern[];
}

export interface HourlyData {
  hour: number;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

export interface DailyData {
  dayOfWeek: number;
  dayName: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

export interface WeeklyData {
  week: number;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

export interface MonthlyData {
  month: number;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

export interface SeasonalPattern {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  year: number;
  orderCount: number;
  revenue: number;
  growthVsPreviousSeason: number;
}

// Inventory Patterns
export interface InventoryPatterns {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  lowStock: number;
  averageStockLevel: number;
  turnoverRate: number;
  reorderFrequency: number;
  topCategories: { category: string; count: number; turnover: number }[];
  stockAlerts: StockAlert[];
  restockPatterns: RestockPattern[];
}

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  alertType: 'low_stock' | 'out_of_stock' | 'overstock';
  createdAt: Date;
}

export interface RestockPattern {
  productId: string;
  averageDaysBetweenRestocks: number;
  typicalRestockQuantity: number;
  lastRestocked: Date;
  nextPredictedRestock: Date;
}

// Seasonal Trends
export interface SeasonalTrends {
  monthly: MonthlyTrend[];
  yearly: YearlyTrend[];
  events: EventImpact[];
  predictions: TrendPrediction[];
}

export interface MonthlyTrend {
  month: number;
  year: number;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  customerCount: number;
  growthRate: number;
}

export interface YearlyTrend {
  year: number;
  revenue: number;
  orderCount: number;
  customerCount: number;
  growthRate: number;
}

export interface EventImpact {
  eventName: string;
  eventType: string;
  startDate: Date;
  endDate: Date;
  impact: {
    revenueChange: number;
    orderChange: number;
    customerChange: number;
  };
}

export interface TrendPrediction {
  metric: string;
  predictedValue: number;
  confidence: number;
  timeframe: string;
}

// Growth Metrics
export interface GrowthMetrics {
  revenue: GrowthMetric;
  orders: GrowthMetric;
  customers: GrowthMetric;
  averageOrderValue: GrowthMetric;
  customerRetention: GrowthMetric;
  marketShare?: GrowthMetric;
}

export interface GrowthMetric {
  current: number;
  previous: number;
  change: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
  momentum: 'accelerating' | 'decelerating' | 'steady';
}

// Health Signals
export interface HealthSignals {
  overall: HealthStatus;
  alerts: HealthAlert[];
  warnings: HealthWarning[];
  indicators: HealthIndicator[];
  lastHealthCheck: Date;
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  factors: { factor: string; contribution: number }[];
}

export interface HealthAlert {
  id: string;
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric?: string;
  value?: number;
  threshold?: number;
  createdAt: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export type AlertType =
  | 'low_revenue'
  | 'declining_orders'
  | 'customer_churn'
  | 'inventory_issue'
  | 'negative_feedback'
  | 'payment_issue'
  | 'compliance_issue';

export interface HealthWarning {
  id: string;
  type: WarningType;
  message: string;
  metric?: string;
  value?: number;
  threshold?: number;
  createdAt: Date;
  acknowledged: boolean;
}

export type WarningType =
  | 'declining_trend'
  | 'inventory_low'
  | 'customer_inactivity'
  | 'price_competition'
  | 'seasonal_adjustment';

export interface HealthIndicator {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'moderate' | 'poor';
  benchmark?: number;
  trend: 'up' | 'down' | 'stable';
}

// Scoring Types
export interface MerchantScores {
  merchantId: string;
  healthScore: HealthScore;
  growthScore: GrowthScore;
  engagementScore: EngagementScore;
  riskIndicators: RiskIndicator[];
  compositeScore: number;
  calculatedAt: Date;
}

export interface HealthScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  components: {
    revenue: number;
    orders: number;
    customers: number;
    inventory: number;
    feedback: number;
    engagement: number;
  };
  factors: { name: string; impact: number }[];
}

export interface GrowthScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  components: {
    revenueGrowth: number;
    orderGrowth: number;
    customerGrowth: number;
    marketExpansion: number;
  };
  momentum: 'accelerating' | 'stable' | 'decelerating';
}

export interface EngagementScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  components: {
    customerEngagement: number;
    repeatPurchaseRate: number;
    responseRate: number;
    updateFrequency: number;
  };
}

export interface RiskIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  description: string;
  mitigation?: string;
}

// Insights Types
export interface MerchantInsights {
  merchantId: string;
  summary: InsightSummary;
  opportunities: Opportunity[];
  threats: Threat[];
  recommendations: Recommendation[];
  comparisons: Comparison[];
  predictions: Prediction[];
  generatedAt: Date;
}

export interface InsightSummary {
  overallPerformance: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  keyHighlights: string[];
  keyConcerns: string[];
  competitivePosition: number;
}

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  potential: 'high' | 'medium' | 'low';
  estimatedImpact: {
    revenue?: number;
    customers?: number;
    engagement?: number;
  };
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  timeline: string;
}

export type OpportunityType =
  | 'new_market'
  | 'product_expansion'
  | 'customer_segment'
  | 'partnership'
  | 'automation'
  | 'marketing';

export interface Threat {
  id: string;
  type: ThreatType;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  probability: number;
  potentialImpact: number;
  mitigation?: string;
}

export type ThreatType =
  | 'competition'
  | 'market_change'
  | 'regulatory'
  | 'economic'
  | 'operational';

export interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: string;
  priority: 'high' | 'medium' | 'low';
  actionSteps: string[];
}

export interface Comparison {
  metric: string;
  merchantValue: number;
  industryAverage: number;
  topPerformers: number;
  percentile: number;
  trend: 'above' | 'at' | 'below';
}

export interface Prediction {
  metric: string;
  prediction: number;
  confidence: number;
  timeframe: string;
  model: string;
}

// Recommendation Types
export interface MerchantRecommendations {
  merchantId: string;
  recommendations: StrategicRecommendation[];
  prioritizedActions: PrioritizedAction[];
  nextBestActions: NextBestAction[];
  generatedAt: Date;
  validUntil: Date;
}

export interface StrategicRecommendation {
  id: string;
  category: 'growth' | 'efficiency' | 'retention' | 'marketing' | 'operations' | 'finance';
  title: string;
  description: string;
  impact: {
    revenue: number;
    cost: number;
    effort: number;
  };
  timeframe: 'quick_win' | 'short_term' | 'long_term';
  priority: number;
  confidence: number;
}

export interface PrioritizedAction {
  id: string;
  action: string;
  reason: string;
  expectedResult: string;
  priority: number;
  deadline?: Date;
  assignedTeam?: string;
}

export interface NextBestAction {
  action: string;
  context: string;
  personalization: string;
  conversionProbability: number;
}

// Competitor Types
export interface CompetitorAnalysis {
  merchantId: string;
  competitors: Competitor[];
  marketPosition: MarketPosition;
  competitiveAdvantages: string[];
  competitiveDisadvantages: string[];
  generatedAt: Date;
}

export interface Competitor {
  competitorId: string;
  businessName: string;
  category: string;
  similarity: number;
  metrics: {
    revenue: number;
    orderVolume: number;
    averageOrderValue: number;
    customerCount: number;
    rating: number;
  };
  comparison: {
    strengths: string[];
    weaknesses: string[];
    differences: { metric: string; theirs: number; yours: number }[];
  };
}

export interface MarketPosition {
  revenueRank: number;
  orderVolumeRank: number;
  customerRank: number;
  overallRank: number;
  marketShare: number;
}

// Trend Types
export interface MerchantTrends {
  merchantId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  revenue: TrendData;
  orders: TrendData;
  customers: TrendData;
  averageOrderValue: TrendData;
  customerRetention: TrendData;
  topProducts: TrendDataPoint[];
  customerSegments: TrendSegment[];
  generatedAt: Date;
}

export interface TrendData {
  current: number;
  previous: number;
  change: number;
  percentageChange: number;
  dataPoints: TrendDataPoint[];
  forecast: TrendDataPoint[];
  seasonality: SeasonalityPattern;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  predicted?: boolean;
}

export interface TrendSegment {
  segment: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

export interface SeasonalityPattern {
  hasSeasonality: boolean;
  peakMonth?: number;
  lowMonth?: number;
  amplitude?: number;
}

// Event Types
export interface MerchantEvent {
  merchantId: string;
  eventType: EventCategory;
  eventData: Record<string, unknown>;
  metadata: EventMetadata;
  timestamp: Date;
}

export type EventCategory =
  | 'order'
  | 'inventory'
  | 'customer'
  | 'feedback'
  | 'payment'
  | 'marketing'
  | 'operational'
  | 'system';

export interface EventMetadata {
  source: string;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
}

// API Response Types
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
  timestamp: Date;
  requestId: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Filter Types
export interface TrendFilter {
  startDate?: Date;
  endDate?: Date;
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  metrics?: string[];
}
