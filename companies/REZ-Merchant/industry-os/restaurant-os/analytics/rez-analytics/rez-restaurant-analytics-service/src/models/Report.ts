import mongoose, { Document, Schema, Types } from 'mongoose';

// Revenue by period aggregation
export interface IRevenueByPeriod {
  period: string; // hour, day, week, month
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  totalCustomers: number;
}

export interface ITableTurnover {
  tableId: string;
  tableName: string;
  totalSeatings: number;
  avgTurnoverTime: number; // minutes
  turnoverCount: number;
  revenue: number;
  utilizationRate: number; // percentage
}

export interface IPopularDish {
  dishId: string;
  dishName: string;
  category: string;
  orderCount: number;
  revenue: number;
  revenuePercentage: number;
  averageRating?: number;
  preparationTime: number; // minutes
}

export interface ICustomerMetrics {
  newCustomers: number;
  returningCustomers: number;
  retentionRate: number; // percentage
  churnRate: number; // percentage
  averageVisitsPerCustomer: number;
  averageOrderFrequency: number; // days between visits
}

export interface IPeakHours {
  hour: number;
  dayOfWeek: number;
  averageRevenue: number;
  orderCount: number;
  averageCustomers: number;
  occupancyRate: number; // percentage
}

export interface IStaffPerformance {
  staffId: string;
  staffName: string;
  role: string;
  ordersServed: number;
  averageOrderTime: number; // minutes
  customerRating: number; // 1-5
  revenue: number;
  tips: number;
}

export interface IOccupancyRate {
  date: Date;
  hour: number;
  totalSeats: number;
  occupiedSeats: number;
  reservationCount: number;
  walkInCount: number;
  turnoverCount: number;
  occupancyPercentage: number;
}

export interface IReport extends Document {
  restaurantId: Types.ObjectId;
  reportType: 'revenue' | 'customer' | 'menu' | 'occupancy' | 'staff' | 'comprehensive';
  periodStart: Date;
  periodEnd: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';

  // Revenue data
  revenue?: {
    total: number;
    byPeriod: IRevenueByPeriod[];
    byPaymentMethod: Record<string, number>;
    byCategory: Record<string, number>;
    trends: {
      comparedToPrevious: number; // percentage change
      projection: number;
    };
  };

  // Table data
  tableTurnover?: ITableTurnover[];

  // Menu data
  popularDishes?: IPopularDish[];

  // Customer data
  customerMetrics?: ICustomerMetrics;
  customerLifetime?: {
    averageLTV: number;
    averageOrdersPerLifetime: number;
    topCustomers: Array<{
      customerId: string;
      totalOrders: number;
      totalSpent: number;
    }>;
  };

  // Peak hours
  peakHours?: IPeakHours[];

  // Staff performance
  staffPerformance?: IStaffPerformance[];

  // Occupancy
  occupancyRate?: {
    average: number;
    byHour: Array<{ hour: number; rate: number }>;
    byDayOfWeek: Array<{ day: number; rate: number }>;
  };

  metadata?: {
    generatedAt: Date;
    generatedBy: string;
    dataSources: string[];
    confidence: number; // 0-1
  };

  createdAt: Date;
  updatedAt: Date;
}

const RevenueByPeriodSchema = new Schema<IRevenueByPeriod>(
  {
    period: { type: String, required: true },
    revenue: { type: Number, required: true },
    orderCount: { type: Number, required: true },
    averageOrderValue: { type: Number, required: true },
    totalCustomers: { type: Number, required: true },
  },
  { _id: false }
);

const TableTurnoverSchema = new Schema<ITableTurnover>(
  {
    tableId: { type: String, required: true },
    tableName: { type: String, required: true },
    totalSeatings: { type: Number, required: true },
    avgTurnoverTime: { type: Number, required: true },
    turnoverCount: { type: Number, required: true },
    revenue: { type: Number, required: true },
    utilizationRate: { type: Number, required: true },
  },
  { _id: false }
);

const PopularDishSchema = new Schema<IPopularDish>(
  {
    dishId: { type: String, required: true },
    dishName: { type: String, required: true },
    category: { type: String, required: true },
    orderCount: { type: Number, required: true },
    revenue: { type: Number, required: true },
    revenuePercentage: { type: Number, required: true },
    averageRating: { type: Number },
    preparationTime: { type: Number, required: true },
  },
  { _id: false }
);

const CustomerMetricsSchema = new Schema<ICustomerMetrics>(
  {
    newCustomers: { type: Number, required: true },
    returningCustomers: { type: Number, required: true },
    retentionRate: { type: Number, required: true },
    churnRate: { type: Number, required: true },
    averageVisitsPerCustomer: { type: Number, required: true },
    averageOrderFrequency: { type: Number, required: true },
  },
  { _id: false }
);

const PeakHoursSchema = new Schema<IPeakHours>(
  {
    hour: { type: Number, required: true },
    dayOfWeek: { type: Number, required: true },
    averageRevenue: { type: Number, required: true },
    orderCount: { type: Number, required: true },
    averageCustomers: { type: Number, required: true },
    occupancyRate: { type: Number, required: true },
  },
  { _id: false }
);

const StaffPerformanceSchema = new Schema<IStaffPerformance>(
  {
    staffId: { type: String, required: true },
    staffName: { type: String, required: true },
    role: { type: String, required: true },
    ordersServed: { type: Number, required: true },
    averageOrderTime: { type: Number, required: true },
    customerRating: { type: Number, required: true },
    revenue: { type: Number, required: true },
    tips: { type: Number, required: true },
  },
  { _id: false }
);

const ReportSchema = new Schema<IReport>(
  {
    restaurantId: { type: Schema.Types.ObjectId, required: true, index: true },
    reportType: {
      type: String,
      enum: ['revenue', 'customer', 'menu', 'occupancy', 'staff', 'comprehensive'],
      required: true,
      index: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    granularity: {
      type: String,
      enum: ['hour', 'day', 'week', 'month'],
      required: true,
    },
    revenue: {
      total: Number,
      byPeriod: [RevenueByPeriodSchema],
      byPaymentMethod: Map,
      byCategory: Map,
      trends: {
        comparedToPrevious: Number,
        projection: Number,
      },
    },
    tableTurnover: [TableTurnoverSchema],
    popularDishes: [PopularDishSchema],
    customerMetrics: CustomerMetricsSchema,
    customerLifetime: {
      averageLTV: Number,
      averageOrdersPerLifetime: Number,
      topCustomers: [
        {
          customerId: String,
          totalOrders: Number,
          totalSpent: Number,
        },
      ],
    },
    peakHours: [PeakHoursSchema],
    staffPerformance: [StaffPerformanceSchema],
    occupancyRate: {
      average: Number,
      byHour: [
        {
          hour: Number,
          rate: Number,
          _id: false,
        },
      ],
      byDayOfWeek: [
        {
          day: Number,
          rate: Number,
          _id: false,
        },
      ],
    },
    metadata: {
      generatedAt: Date,
      generatedBy: String,
      dataSources: [String],
      confidence: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ReportSchema.index({ restaurantId: 1, reportType: 1, periodStart: 1, periodEnd: 1 });
ReportSchema.index({ restaurantId: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);

// Aggregation pipeline helpers
export const ReportAggregationStages = {
  revenueByPeriod: (granularity: 'hour' | 'day' | 'week' | 'month') => {
    const formatMap = {
      hour: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } },
      day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      week: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
      month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
    };

    return {
      $group: {
        _id: formatMap[granularity],
        revenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
        totalCustomers: { $addToSet: '$customerId' },
      },
    };
  },
};
