import mongoose, { Schema, Document } from 'mongoose';

// Dashboard widget interface
export interface IWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'comparison';
  title: string;
  metric: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config?: {
    colors?: string[];
    showLegend?: boolean;
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    timeRange?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  };
}

// Dashboard layout interface
export interface ILayout {
  columns: number;
  rowHeight: number;
  breakpoints: {
    lg: number;
    md: number;
    sm: number;
  };
}

// Dashboard config document interface
export interface IDashboardConfig extends Document {
  publisherId: string;
  name: string;
  description?: string;
  widgets: IWidget[];
  layout: ILayout;
  refreshInterval: number; // in seconds
  timezone: string;
  currency: 'USD' | 'INR' | 'EUR' | 'GBP';
  filters: {
    defaultTimeRange: string;
    defaultAdFormats: string[];
    defaultPlacements: string[];
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Widget schema
const WidgetSchema = new Schema<IWidget>({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['chart', 'metric', 'table', 'comparison'],
    required: true
  },
  title: { type: String, required: true },
  metric: { type: String, required: true },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'full'],
    default: 'medium'
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    w: { type: Number, default: 4 },
    h: { type: Number, default: 2 }
  },
  config: {
    colors: [String],
    showLegend: { type: Boolean, default: true },
    chartType: {
      type: String,
      enum: ['line', 'bar', 'pie', 'area']
    },
    timeRange: {
      type: String,
      enum: ['day', 'week', 'month', 'quarter', 'year']
    }
  }
}, { _id: false });

// Layout schema
const LayoutSchema = new Schema<ILayout>({
  columns: { type: Number, default: 12 },
  rowHeight: { type: Number, default: 80 },
  breakpoints: {
    lg: { type: Number, default: 1200 },
    md: { type: Number, default: 996 },
    sm: { type: Number, default: 768 }
  }
}, { _id: false });

// Dashboard config schema
const DashboardConfigSchema = new Schema<IDashboardConfig>({
  publisherId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    default: 'Default Dashboard'
  },
  description: { type: String },
  widgets: {
    type: [WidgetSchema],
    default: []
  },
  layout: {
    type: LayoutSchema,
    default: () => ({})
  },
  refreshInterval: {
    type: Number,
    default: 300 // 5 minutes
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  currency: {
    type: String,
    enum: ['USD', 'INR', 'EUR', 'GBP'],
    default: 'USD'
  },
  filters: {
    defaultTimeRange: {
      type: String,
      default: 'last_30_days'
    },
    defaultAdFormats: [String],
    defaultPlacements: [String]
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'dashboard_configs'
});

// Compound index for publisher + isDefault
DashboardConfigSchema.index({ publisherId: 1, isDefault: 1 });

// Static method to get or create default dashboard
DashboardConfigSchema.statics.getOrCreateDefault = async function(publisherId: string) {
  let dashboard = await this.findOne({ publisherId, isDefault: true });

  if (!dashboard) {
    dashboard = await this.create({
      publisherId,
      name: 'Default Dashboard',
      isDefault: true,
      widgets: [
        {
          id: 'revenue-overview',
          type: 'metric',
          title: 'Total Revenue',
          metric: 'revenue',
          size: 'large',
          position: { x: 0, y: 0, w: 3, h: 2 }
        },
        {
          id: 'impressions-overview',
          type: 'metric',
          title: 'Total Impressions',
          metric: 'impressions',
          size: 'large',
          position: { x: 3, y: 0, w: 3, h: 2 }
        },
        {
          id: 'ctr-overview',
          type: 'metric',
          title: 'Average CTR',
          metric: 'ctr',
          size: 'large',
          position: { x: 6, y: 0, w: 3, h: 2 }
        },
        {
          id: 'ecpm-overview',
          type: 'metric',
          title: 'Average eCPM',
          metric: 'ecpm',
          size: 'large',
          position: { x: 9, y: 0, w: 3, h: 2 }
        },
        {
          id: 'revenue-chart',
          type: 'chart',
          title: 'Revenue Trend',
          metric: 'revenue',
          size: 'large',
          position: { x: 0, y: 2, w: 8, h: 3 },
          config: {
            chartType: 'area',
            showLegend: true
          }
        },
        {
          id: 'performance-breakdown',
          type: 'chart',
          title: 'Performance by Format',
          metric: 'performance_by_format',
          size: 'medium',
          position: { x: 8, y: 2, w: 4, h: 3 },
          config: {
            chartType: 'bar'
          }
        }
      ]
    });
  }

  return dashboard;
};

export const DashboardConfig = mongoose.model<IDashboardConfig>('DashboardConfig', DashboardConfigSchema);
export default DashboardConfig;