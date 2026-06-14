// REZ Microservice Data Types
// All interfaces mirror the response shapes from REZ backend services.

// ─── Merchant ────────────────────────────────────────────────────────────────

export interface RezMerchant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessType?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface RezMerchantStats {
  merchantId: string;
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  period?: string;
}

export interface RezStore {
  id: string;
  merchantId: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Purchase Orders ─────────────────────────────────────────────────────────

export interface RezPurchaseOrder {
  id: string;
  merchantId: string;
  supplierId?: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  totalAmount: number;
  currency: string;
  items: RezPurchaseOrderItem[];
  createdAt: string;
  deliveryDate?: string;
}

export interface RezPurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface RezPurchaseOrderSummary {
  merchantId: string;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalSpend: number;
  averageOrderValue: number;
  topSuppliers: string[];
}

// ─── Staff Shifts ─────────────────────────────────────────────────────────────

export interface RezStaffShift {
  id: string;
  merchantId: string;
  storeId?: string;
  staffId: string;
  staffName: string;
  role: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'active' | 'completed' | 'absent';
}

export interface RezShiftGap {
  storeId: string;
  storeName?: string;
  role: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  severity: 'low' | 'medium' | 'high';
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface RezAnalytics {
  merchantId: string;
  period: string;
  totalRevenue: number;
  totalTransactions: number;
  uniqueCustomers: number;
  averageTransactionValue: number;
  topProducts: RezTopProduct[];
  revenueByDay: RezDailyRevenue[];
}

export interface RezTopProduct {
  productId: string;
  productName: string;
  revenue: number;
  quantity: number;
}

export interface RezDailyRevenue {
  date: string;
  revenue: number;
  transactions: number;
}

export interface RezRevenueMetrics {
  merchantId: string;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueGrowthPercent: number;
  projectedMonthRevenue: number;
  weeklyBreakdown: RezWeeklyRevenue[];
}

export interface RezWeeklyRevenue {
  week: string;
  revenue: number;
  transactions: number;
}

export interface RezFoodCostMetrics {
  merchantId: string;
  totalFoodCost: number;
  foodCostPercentage: number;
  wastePercentage: number;
  topCostCategories: RezCostCategory[];
  period: string;
}

export interface RezCostCategory {
  category: string;
  cost: number;
  percentage: number;
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export interface RezProduct {
  id: string;
  storeId: string;
  categoryId?: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  currency: string;
  unit?: string;
  stockQuantity?: number;
  isActive: boolean;
  createdAt: string;
}

export interface RezCategory {
  id: string;
  merchantId: string;
  name: string;
  parentId?: string;
  isActive: boolean;
}

export interface RezSupplier {
  id: string;
  merchantId: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  rating?: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface RezWalletBalance {
  merchantId: string;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  lastUpdated: string;
}

export interface RezTransaction {
  id: string;
  merchantId: string;
  type: 'credit' | 'debit' | 'refund' | 'payout';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  description?: string;
  reference?: string;
  createdAt: string;
}

export interface RezCreditScore {
  merchantId: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  limit: number;
  utilisedLimit: number;
  availableLimit: number;
  lastEvaluated: string;
}

// ─── Fintech / Credit Scoring ─────────────────────────────────────────────────

export type CreditTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface CreditFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

// ─── Circuit Breaker ──────────────────────────────────────────────────────────

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerState {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
}
