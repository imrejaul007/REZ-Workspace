import mongoose, { Document, Schema } from 'mongoose';

export interface IWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'kpi' | 'text' | 'image';
  title?: string;
  dataSourceId?: string;
  query?: string;
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'gauge' | 'funnel';
  visualization: {
    showLegend?: boolean;
    showLabels?: boolean;
    colorScheme?: string[];
    threshold?: number;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  refreshInterval?: number;
  settings?: Record<string, any>;
}

export interface IDashboard extends Document {
  name: string;
  description?: string;
  organizationId: string;
  createdBy: string;
  category: string;
  widgets: IWidget[];
  layout: {
    columns: number;
    rowHeight: number;
    gap: number;
  };
  filters: Array<{
    id: string;
    field: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'range';
    defaultValue?: any;
  }>;
  refreshInterval: number;
  isPublic: boolean;
  isFavorite: boolean;
  tags: string[];
  lastRefreshed?: Date;
  status: 'draft' | 'published' | 'archived';
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const WidgetSchema = new Schema<IWidget>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['chart', 'table', 'metric', 'kpi', 'text', 'image'],
      required: true
    },
    title: { type: String },
    dataSourceId: { type: String },
    query: { type: String },
    chartType: {
      type: String,
      enum: ['line', 'bar', 'pie', 'area', 'scatter', 'gauge', 'funnel']
    },
    visualization: {
      showLegend: { type: Boolean },
      showLabels: { type: Boolean },
      colorScheme: [{ type: String }],
      threshold: { type: Number }
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    refreshInterval: { type: Number },
    settings: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const DashboardSchema = new Schema<IDashboard>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    organizationId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
    category: { type: String, index: true },
    widgets: [WidgetSchema],
    layout: {
      columns: { type: Number, default: 12 },
      rowHeight: { type: Number, default: 100 },
      gap: { type: Number, default: 10 }
    },
    filters: [
      {
        id: { type: String, required: true },
        field: { type: String, required: true },
        label: { type: String, required: true },
        type: {
          type: String,
          enum: ['text', 'select', 'date', 'range']
        },
        defaultValue: { type: Schema.Types.Mixed }
      }
    ],
    refreshInterval: { type: Number, default: 300000 },
    isPublic: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
    tags: [{ type: String }],
    lastRefreshed: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published'
    },
    version: { type: Number, default: 1 }
  },
  { timestamps: true }
);

DashboardSchema.index({ organizationId: 1, createdAt: -1 });
DashboardSchema.index({ organizationId: 1, category: 1 });
DashboardSchema.index({ isFavorite: 1, organizationId: 1 });

export const Dashboard = mongoose.model<IDashboard>('Dashboard', DashboardSchema);