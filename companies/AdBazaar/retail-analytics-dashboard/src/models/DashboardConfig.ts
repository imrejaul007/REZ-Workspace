import mongoose, { Schema, Document } from 'mongoose';

export interface IWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'metric' | 'map';
  title: string;
  dataSource: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

export interface IDashboardConfig extends Document {
  retailerId: string;
  retailerName: string;
  widgets: IWidget[];
  layout: {
    columns: number;
    rowHeight: number;
  };
  refreshInterval: number;
  filters: {
    dateRange: { start: Date; end: Date };
    campaigns?: string[];
    regions?: string[];
    categories?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const WidgetSchema = new Schema<IWidget>({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['kpi', 'chart', 'table', 'metric', 'map'],
    required: true,
  },
  title: { type: String, required: true },
  dataSource: { type: String, required: true },
  config: { type: Schema.Types.Mixed, default: {} },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    w: { type: Number, required: true },
    h: { type: Number, required: true },
  },
});

const DashboardConfigSchema = new Schema<IDashboardConfig>(
  {
    retailerId: { type: String, required: true, unique: true, index: true },
    retailerName: { type: String, required: true },
    widgets: { type: [WidgetSchema], default: [] },
    layout: {
      columns: { type: Number, default: 12 },
      rowHeight: { type: Number, default: 80 },
    },
    refreshInterval: { type: Number, default: 60 },
    filters: {
      dateRange: {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
      },
      campaigns: [{ type: String }],
      regions: [{ type: String }],
      categories: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

DashboardConfigSchema.index({ retailerId: 1, updatedAt: -1 });

export const DashboardConfig = mongoose.model<IDashboardConfig>(
  'DashboardConfig',
  DashboardConfigSchema
);