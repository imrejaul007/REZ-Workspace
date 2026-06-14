import mongoose, { Schema, Document } from 'mongoose';

// Base interface for all metric documents
export interface IMetricBase extends Document {
  date: Date;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Daily Revenue Metric
export interface IDailyRevenueMetric extends IMetricBase {
  totalRevenue: number;
  grossRevenue: number;
  netRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  categoryBreakdown: {
    category: string;
    revenue: number;
    orderCount: number;
    percentage: number;
  }[];
  paymentMethodBreakdown: {
    method: string;
    revenue: number;
    count: number;
  }[];
  hourlyBreakdown: {
    hour: number;
    revenue: number;
    orderCount: number;
  }[];
}

// Customer Metric
export interface ICustomerMetric extends IMetricBase {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  customerSegments: {
    segment: 'new' | 'regular' | 'at_risk' | 'churned';
    count: number;
    percentage: number;
  }[];
  averageLTV: number;
  totalLTV: number;
  customerAcquisitionCost: number;
  retentionRate: number;
}

// Dish Metric
export interface IDishMetric extends IMetricBase {
  topSellingDishes: {
    dishId: string;
    name: string;
    quantity: number;
    revenue: number;
    margin: number;
    rank: number;
  }[];
  trendingDishes: {
    dishId: string;
    name: string;
    trend: 'up' | 'down' | 'stable';
    percentageChange: number;
    quantity: number;
  }[];
  averageOrderValue: number;
  totalItemsSold: number;
  categoryBreakdown: {
    category: string;
    quantity: number;
    revenue: number;
  }[];
}

// Operational Metric
export interface IOperationalMetric extends IMetricBase {
  averageTableTurnTime: number; // in minutes
  averageTicketTime: number; // in minutes
  tableUtilization: number; // percentage
  peakHours: {
    hour: number;
    tableCount: number;
    utilization: number;
  }[];
  laborMetrics: {
    staffCount: number;
    laborCost: number;
    laborCostPercentage: number;
    salesPerStaff: number;
  };
  kitchenMetrics: {
    averagePrepTime: number;
    averageCookingTime: number;
    rushHourTickets: number;
    slowPeriodTickets: number;
  };
}

// Event Types
export interface IOrderEvent {
  eventType: 'order_placed' | 'order_completed' | 'order_cancelled' | 'order_modified';
  orderId: string;
  restaurantId: string;
  timestamp: Date;
  customerId?: string;
  items: {
    dishId: string;
    name: string;
    quantity: number;
    price: number;
    cost: number;
  }[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  tableId?: string;
}

export interface ICustomerEvent {
  eventType: 'customer_visit' | 'customer_signup' | 'customer_return';
  customerId: string;
  restaurantId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Schemas
const DailyRevenueMetricSchema = new Schema<IDailyRevenueMetric>(
  {
    date: { type: Date, required: true, index: true },
    restaurantId: { type: String, required: true, index: true },
    totalRevenue: { type: Number, required: true, default: 0 },
    grossRevenue: { type: Number, required: true, default: 0 },
    netRevenue: { type: Number, required: true, default: 0 },
    orderCount: { type: Number, required: true, default: 0 },
    averageOrderValue: { type: Number, required: true, default: 0 },
    categoryBreakdown: [
      {
        category: String,
        revenue: Number,
        orderCount: Number,
        percentage: Number,
      },
    ],
    paymentMethodBreakdown: [
      {
        method: String,
        revenue: Number,
        count: Number,
      },
    ],
    hourlyBreakdown: [
      {
        hour: Number,
        revenue: Number,
        orderCount: Number,
      },
    ],
  },
  { timestamps: true }
);

DailyRevenueMetricSchema.index({ restaurantId: 1, date: -1 });

const CustomerMetricSchema = new Schema<ICustomerMetric>(
  {
    date: { type: Date, required: true, index: true },
    restaurantId: { type: String, required: true, index: true },
    totalCustomers: { type: Number, required: true, default: 0 },
    newCustomers: { type: Number, required: true, default: 0 },
    repeatCustomers: { type: Number, required: true, default: 0 },
    customerSegments: [
      {
        segment: {
          type: String,
          enum: ['new', 'regular', 'at_risk', 'churned'],
        },
        count: Number,
        percentage: Number,
      },
    ],
    averageLTV: { type: Number, required: true, default: 0 },
    totalLTV: { type: Number, required: true, default: 0 },
    customerAcquisitionCost: { type: Number, default: 0 },
    retentionRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CustomerMetricSchema.index({ restaurantId: 1, date: -1 });

const DishMetricSchema = new Schema<IDishMetric>(
  {
    date: { type: Date, required: true, index: true },
    restaurantId: { type: String, required: true, index: true },
    topSellingDishes: [
      {
        dishId: String,
        name: String,
        quantity: Number,
        revenue: Number,
        margin: Number,
        rank: Number,
      },
    ],
    trendingDishes: [
      {
        dishId: String,
        name: String,
        trend: {
          type: String,
          enum: ['up', 'down', 'stable'],
        },
        percentageChange: Number,
        quantity: Number,
      },
    ],
    averageOrderValue: { type: Number, required: true, default: 0 },
    totalItemsSold: { type: Number, required: true, default: 0 },
    categoryBreakdown: [
      {
        category: String,
        quantity: Number,
        revenue: Number,
      },
    ],
  },
  { timestamps: true }
);

DishMetricSchema.index({ restaurantId: 1, date: -1 });

const OperationalMetricSchema = new Schema<IOperationalMetric>(
  {
    date: { type: Date, required: true, index: true },
    restaurantId: { type: String, required: true, index: true },
    averageTableTurnTime: { type: Number, required: true, default: 0 },
    averageTicketTime: { type: Number, required: true, default: 0 },
    tableUtilization: { type: Number, required: true, default: 0 },
    peakHours: [
      {
        hour: Number,
        tableCount: Number,
        utilization: Number,
      },
    ],
    laborMetrics: {
      staffCount: { type: Number, default: 0 },
      laborCost: { type: Number, default: 0 },
      laborCostPercentage: { type: Number, default: 0 },
      salesPerStaff: { type: Number, default: 0 },
    },
    kitchenMetrics: {
      averagePrepTime: { type: Number, default: 0 },
      averageCookingTime: { type: Number, default: 0 },
      rushHourTickets: { type: Number, default: 0 },
      slowPeriodTickets: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

OperationalMetricSchema.index({ restaurantId: 1, date: -1 });

// Export models
export const DailyRevenueMetric = mongoose.model<IDailyRevenueMetric>(
  'DailyRevenueMetric',
  DailyRevenueMetricSchema
);

export const CustomerMetric = mongoose.model<ICustomerMetric>(
  'CustomerMetric',
  CustomerMetricSchema
);

export const DishMetric = mongoose.model<IDishMetric>(
  'DishMetric',
  DishMetricSchema
);

export const OperationalMetric = mongoose.model<IOperationalMetric>(
  'OperationalMetric',
  OperationalMetricSchema
);

// Live metrics for real-time updates (stored in Redis)
export interface ILiveMetrics {
  ordersToday: number;
  revenueToday: number;
  customersToday: number;
  averageTicketTime: number;
  tableUtilization: number;
  lastUpdated: Date;
}

export const LiveMetricsSchema = new Schema<ILiveMetrics>({
  ordersToday: { type: Number, default: 0 },
  revenueToday: { type: Number, default: 0 },
  customersToday: { type: Number, default: 0 },
  averageTicketTime: { type: Number, default: 0 },
  tableUtilization: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});
