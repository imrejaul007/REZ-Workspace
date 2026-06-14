import mongoose, { Document, Schema } from 'mongoose';

export interface IWidget extends Document {
  name: string;
  type: 'chart' | 'table' | 'metric' | 'kpi' | 'text' | 'image';
  description?: string;
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'gauge' | 'funnel' | 'heatmap';
  visualization: {
    showLegend?: boolean;
    showLabels?: boolean;
    colorScheme?: string[];
    threshold?: number;
    animations?: boolean;
  };
  dataSource: {
    id: string;
    type: string;
    query?: string;
  };
  settings: Record<string, any>;
  organizationId: string;
  isGlobal: boolean;
  usageCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WidgetSchema = new Schema<IWidget>(
  {
    name: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['chart', 'table', 'metric', 'kpi', 'text', 'image'],
      required: true
    },
    description: { type: String },
    chartType: {
      type: String,
      enum: ['line', 'bar', 'pie', 'area', 'scatter', 'gauge', 'funnel', 'heatmap']
    },
    visualization: {
      showLegend: { type: Boolean, default: true },
      showLabels: { type: Boolean, default: true },
      colorScheme: [{ type: String }],
      threshold: { type: Number },
      animations: { type: Boolean, default: true }
    },
    dataSource: {
      id: { type: String },
      type: { type: String },
      query: { type: String }
    },
    settings: { type: Schema.Types.Mixed, default: {} },
    organizationId: { type: String, required: true, index: true },
    isGlobal: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

WidgetSchema.index({ organizationId: 1, type: 1 });
WidgetSchema.index({ isGlobal: 1, type: 1 });
WidgetSchema.index({ usageCount: -1 });

export const Widget = mongoose.model<IWidget>('Widget', WidgetSchema);