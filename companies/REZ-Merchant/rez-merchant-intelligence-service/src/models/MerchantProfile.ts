import mongoose, { Document, Schema } from 'mongoose';
import {
  MerchantProfile as IMerchantProfile,
  RevenuePatterns,
  OrderVolume,
  PopularItems,
  CustomerDemographics,
  PeakHoursDays,
  InventoryPatterns,
  SeasonalTrends,
  GrowthMetrics,
  HealthSignals,
  MerchantScores,
} from '../types';

export interface MerchantProfileDocument extends Omit<IMerchantProfile, 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
  revenuePatterns?;
  orderVolume?;
  popularItems?;
  customerDemographics?;
  peakHoursDays?;
  inventoryPatterns?;
  seasonalTrends?;
  growthMetrics?;
  healthSignals?;
}

// Revenue Patterns Schema
const DailyRevenueSchema = new Schema({
  date: { type: String, required: true },
  amount: { type: Number, required: true },
  orderCount: { type: Number, required: true },
}, { _id: false });

const WeeklyRevenueSchema = new Schema({
  weekStart: { type: String, required: true },
  weekEnd: { type: String, required: true },
  amount: { type: Number, required: true },
  orderCount: { type: Number, required: true },
}, { _id: false });

const MonthlyRevenueSchema = new Schema({
  month: { type: String, required: true },
  amount: { type: Number, required: true },
  orderCount: { type: Number, required: true },
}, { _id: false });

const RevenueGrowthSchema = new Schema({
  mom: { type: Number, default: 0 },
  wow: { type: Number, default: 0 },
  yoy: { type: Number },
}, { _id: false });

const RevenuePatternsSchema = new Schema({
  daily: [DailyRevenueSchema],
  weekly: [WeeklyRevenueSchema],
  monthly: [MonthlyRevenueSchema],
  averageOrderValue: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  revenueGrowth: { type: RevenueGrowthSchema, default: () => ({}) },
}, { _id: false });

// Order Volume Schema
const PeakTimeSchema = new Schema({
  hour: { type: Number, required: true },
  dayOfWeek: { type: Number, required: true },
  orderCount: { type: Number, required: true },
  averageValue: { type: Number, required: true },
}, { _id: false });

const OrderFrequencySchema = new Schema({
  daily: { type: Number, default: 0 },
  weekly: { type: Number, default: 0 },
  monthly: { type: Number, default: 0 },
}, { _id: false });

const OrderVolumeSchema = new Schema({
  total: { type: Number, default: 0 },
  completed: { type: Number, default: 0 },
  cancelled: { type: Number, default: 0 },
  refunded: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  averagePerDay: { type: Number, default: 0 },
  averagePerWeek: { type: Number, default: 0 },
  frequency: { type: OrderFrequencySchema, default: () => ({}) },
  peakTimes: [PeakTimeSchema],
}, { _id: false });

// Popular Items Schema
const PopularItemSchema = new Schema({
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  orderCount: { type: Number, required: true },
  revenue: { type: Number, required: true },
  percentageOfTotal: { type: Number, required: true },
  trend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
  lastUpdated: { type: Date, default: Date.now },
}, { _id: false });

const TopCategoryCountSchema = new Schema({
  category: { type: String, required: true },
  count: { type: Number, required: true },
}, { _id: false });

const PopularItemsSchema = new Schema({
  items: [PopularItemSchema],
  totalItems: { type: Number, default: 0 },
  topCategories: [TopCategoryCountSchema],
}, { _id: false });

// Customer Demographics Schema
const AgeGroupSchema = new Schema({
  '18-24': { type: Number, default: 0 },
  '25-34': { type: Number, default: 0 },
  '35-44': { type: Number, default: 0 },
  '45-54': { type: Number, default: 0 },
  '55+': { type: Number, default: 0 },
}, { _id: false });

const CustomerTypeSchema = new Schema({
  individual: { type: Number, default: 0 },
  business: { type: Number, default: 0 },
  premium: { type: Number, default: 0 },
}, { _id: false });

const LocationDistributionSchema = new Schema({
  location: { type: String, required: true },
  count: { type: Number, required: true },
  percentage: { type: Number, required: true },
}, { _id: false });

const TimeOfDaySchema = new Schema({
  morning: { type: Number, default: 0 },
  afternoon: { type: Number, default: 0 },
  evening: { type: Number, default: 0 },
  night: { type: Number, default: 0 },
}, { _id: false });

const OrderSizeSchema = new Schema({
  small: { type: Number, default: 0 },
  medium: { type: Number, default: 0 },
  large: { type: Number, default: 0 },
}, { _id: false });

const FrequencyDistSchema = new Schema({
  occasional: { type: Number, default: 0 },
  regular: { type: Number, default: 0 },
  frequent: { type: Number, default: 0 },
}, { _id: false });

const OrderPatternDistSchema = new Schema({
  timeOfDay: { type: TimeOfDaySchema, default: () => ({}) },
  orderSize: { type: OrderSizeSchema, default: () => ({}) },
  frequency: { type: FrequencyDistSchema, default: () => ({}) },
}, { _id: false });

const CLVDistributionSchema = new Schema({
  range: { type: String, required: true },
  count: { type: Number, required: true },
}, { _id: false });

const CLVSchema = new Schema({
  average: { type: Number, default: 0 },
  median: { type: Number, default: 0 },
  distribution: [CLVDistributionSchema],
}, { _id: false });

const TopCustomerSchema = new Schema({
  customerId: { type: String, required: true },
  totalOrders: { type: Number, required: true },
  totalSpent: { type: Number, required: true },
  averageOrderValue: { type: Number, required: true },
  lastOrderDate: { type: Date, required: true },
  customerType: { type: String, required: true },
}, { _id: false });

const DemographicsInnerSchema = new Schema({
  ageGroups: { type: AgeGroupSchema, default: () => ({}) },
  customerTypes: { type: CustomerTypeSchema, default: () => ({}) },
  locations: [LocationDistributionSchema],
  orderPatterns: { type: OrderPatternDistSchema, default: () => ({}) },
}, { _id: false });

const CustomerDemographicsSchema = new Schema({
  totalCustomers: { type: Number, default: 0 },
  newCustomers: { type: Number, default: 0 },
  returningCustomers: { type: Number, default: 0 },
  retentionRate: { type: Number, default: 0 },
  demographics: { type: DemographicsInnerSchema, default: () => ({}) },
  topCustomers: [TopCustomerSchema],
  customerLifetimeValue: { type: CLVSchema, default: () => ({}) },
}, { _id: false });

// Peak Hours/Days Schema
const HourlyDataSchema = new Schema({
  hour: { type: Number, required: true },
  orderCount: { type: Number, required: true },
  revenue: { type: Number, required: true },
  averageOrderValue: { type: Number, required: true },
}, { _id: false });

const DailyDataSchema = new Schema({
  dayOfWeek: { type: Number, required: true },
  dayName: { type: String, required: true },
  orderCount: { type: Number, required: true },
  revenue: { type: Number, required: true },
  averageOrderValue: { type: Number, required: true },
}, { _id: false });

const WeeklyDataSchema = new Schema({
  week: { type: Number, required: true },
  orderCount: { type: Number, required: true },
  revenue: { type: Number, required: true },
  averageOrderValue: { type: Number, required: true },
}, { _id: false });

const MonthlyDataSchema = new Schema({
  month: { type: Number, required: true },
  orderCount: { type: Number, required: true },
  revenue: { type: Number, required: true },
  averageOrderValue: { type: Number, required: true },
}, { _id: false });

const SeasonalPatternSchema = new Schema({
  season: { type: String, enum: ['spring', 'summer', 'fall', 'winter'], required: true },
  year: { type: Number, required: true },
  orderCount: { type: Number, required: true },
  revenue: { type: Number, required: true },
  growthVsPreviousSeason: { type: Number, required: true },
}, { _id: false });

const PeakHoursDaysSchema = new Schema({
  hourlyDistribution: [HourlyDataSchema],
  dailyDistribution: [DailyDataSchema],
  weeklyDistribution: [WeeklyDataSchema],
  monthlyDistribution: [MonthlyDataSchema],
  seasonalPatterns: [SeasonalPatternSchema],
}, { _id: false });

// Inventory Patterns Schema
const StockAlertSchema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  currentStock: { type: Number, required: true },
  threshold: { type: Number, required: true },
  alertType: { type: String, enum: ['low_stock', 'out_of_stock', 'overstock'], required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const RestockPatternSchema = new Schema({
  productId: { type: String, required: true },
  averageDaysBetweenRestocks: { type: Number, required: true },
  typicalRestockQuantity: { type: Number, required: true },
  lastRestocked: { type: Date, required: true },
  nextPredictedRestock: { type: Date, required: true },
}, { _id: false });

const InventoryCategorySchema = new Schema({
  category: { type: String, required: true },
  count: { type: Number, required: true },
  turnover: { type: Number, required: true },
}, { _id: false });

const InventoryPatternsSchema = new Schema({
  totalProducts: { type: Number, default: 0 },
  activeProducts: { type: Number, default: 0 },
  outOfStock: { type: Number, default: 0 },
  lowStock: { type: Number, default: 0 },
  averageStockLevel: { type: Number, default: 0 },
  turnoverRate: { type: Number, default: 0 },
  reorderFrequency: { type: Number, default: 0 },
  topCategories: [InventoryCategorySchema],
  stockAlerts: [StockAlertSchema],
  restockPatterns: [RestockPatternSchema],
}, { _id: false });

// Seasonal Trends Schema
const MonthlyTrendSchema = new Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  revenue: { type: Number, required: true },
  orderCount: { type: Number, required: true },
  averageOrderValue: { type: Number, required: true },
  customerCount: { type: Number, required: true },
  growthRate: { type: Number, required: true },
}, { _id: false });

const YearlyTrendSchema = new Schema({
  year: { type: Number, required: true },
  revenue: { type: Number, required: true },
  orderCount: { type: Number, required: true },
  customerCount: { type: Number, required: true },
  growthRate: { type: Number, required: true },
}, { _id: false });

const EventImpactSchema = new Schema({
  eventName: { type: String, required: true },
  eventType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  impact: {
    revenueChange: { type: Number, required: true },
    orderChange: { type: Number, required: true },
    customerChange: { type: Number, required: true },
  },
}, { _id: false });

const TrendPredictionSchema = new Schema({
  metric: { type: String, required: true },
  predictedValue: { type: Number, required: true },
  confidence: { type: Number, required: true },
  timeframe: { type: String, required: true },
}, { _id: false });

const SeasonalTrendsSchema = new Schema({
  monthly: [MonthlyTrendSchema],
  yearly: [YearlyTrendSchema],
  events: [EventImpactSchema],
  predictions: [TrendPredictionSchema],
}, { _id: false });

// Growth Metrics Schema
const GrowthMetricValueSchema = new Schema({
  current: { type: Number, default: 0 },
  previous: { type: Number, default: 0 },
  change: { type: Number, default: 0 },
  percentageChange: { type: Number, default: 0 },
  trend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
  momentum: { type: String, enum: ['accelerating', 'decelerating', 'steady'], default: 'steady' },
}, { _id: false });

const GrowthMetricsSchema = new Schema({
  revenue: { type: GrowthMetricValueSchema, default: () => ({}) },
  orders: { type: GrowthMetricValueSchema, default: () => ({}) },
  customers: { type: GrowthMetricValueSchema, default: () => ({}) },
  averageOrderValue: { type: GrowthMetricValueSchema, default: () => ({}) },
  customerRetention: { type: GrowthMetricValueSchema, default: () => ({}) },
  marketShare: { type: GrowthMetricValueSchema },
}, { _id: false });

// Health Signals Schema
const HealthStatusFactorsSchema = new Schema({
  factor: { type: String, required: true },
  contribution: { type: Number, required: true },
}, { _id: false });

const HealthStatusSchema = new Schema({
  status: { type: String, enum: ['healthy', 'warning', 'critical'], default: 'healthy' },
  score: { type: Number, default: 100 },
  factors: [HealthStatusFactorsSchema],
}, { _id: false });

const HealthAlertSchema = new Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['low_revenue', 'declining_orders', 'customer_churn', 'inventory_issue', 'negative_feedback', 'payment_issue', 'compliance_issue'],
    required: true,
  },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  message: { type: String, required: true },
  metric: { type: String },
  value: { type: Number },
  threshold: { type: Number },
  createdAt: { type: Date, default: Date.now },
  acknowledged: { type: Boolean, default: false },
  resolvedAt: { type: Date },
}, { _id: false });

const HealthWarningSchema = new Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['declining_trend', 'inventory_low', 'customer_inactivity', 'price_competition', 'seasonal_adjustment'],
    required: true,
  },
  message: { type: String, required: true },
  metric: { type: String },
  value: { type: Number },
  threshold: { type: Number },
  createdAt: { type: Date, default: Date.now },
  acknowledged: { type: Boolean, default: false },
}, { _id: false });

const HealthIndicatorSchema = new Schema({
  name: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  status: { type: String, enum: ['good', 'moderate', 'poor'], required: true },
  benchmark: { type: Number },
  trend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
}, { _id: false });

const HealthSignalsSchema = new Schema({
  overall: { type: HealthStatusSchema, default: () => ({}) },
  alerts: [HealthAlertSchema],
  warnings: [HealthWarningSchema],
  indicators: [HealthIndicatorSchema],
  lastHealthCheck: { type: Date, default: Date.now },
}, { _id: false });

// Merchant Location Schema
const CoordinatesSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
}, { _id: false });

const LocationSchema = new Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  coordinates: { type: CoordinatesSchema },
}, { _id: false });

const ContactSchema = new Schema({
  email: { type: String, required: true },
  phone: { type: String, required: true },
  website: { type: String },
}, { _id: false });

// Main Merchant Profile Schema
const MerchantProfileSchema = new Schema<MerchantProfileDocument>(
  {
    merchantId: { type: String, required: true, unique: true, index: true },
    businessName: { type: String, required: true },
    businessType: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String },
    location: { type: LocationSchema, required: true },
    contact: { type: ContactSchema, required: true },
    revenuePatterns: { type: RevenuePatternsSchema, default: () => ({}) },
    orderVolume: { type: OrderVolumeSchema, default: () => ({}) },
    popularItems: { type: PopularItemsSchema, default: () => ({}) },
    customerDemographics: { type: CustomerDemographicsSchema, default: () => ({}) },
    peakHoursDays: { type: PeakHoursDaysSchema, default: () => ({}) },
    inventoryPatterns: { type: InventoryPatternsSchema, default: () => ({}) },
    seasonalTrends: { type: SeasonalTrendsSchema, default: () => ({}) },
    growthMetrics: { type: GrowthMetricsSchema, default: () => ({}) },
    healthSignals: { type: HealthSignalsSchema, default: () => ({}) },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'merchant_profiles',
  }
);

// Indexes
MerchantProfileSchema.index({ 'location.city': 1, category: 1 });
MerchantProfileSchema.index({ 'revenuePatterns.monthly': 1 });
MerchantProfileSchema.index({ 'healthSignals.overall.status': 1 });
MerchantProfileSchema.index({ updatedAt: -1 });

export const MerchantProfileModel = mongoose.model<MerchantProfileDocument>('MerchantProfile', MerchantProfileSchema);

export default MerchantProfileModel;
