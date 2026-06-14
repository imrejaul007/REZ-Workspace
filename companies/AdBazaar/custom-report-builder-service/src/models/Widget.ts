import mongoose, { Document, Schema } from 'mongoose';

export interface IWidget extends Document {
  name: string;
  type: 'chart' | 'table' | 'metric' | 'text' | 'image' | 'filter';
  description?: string;
  visualization: {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'table' | 'gauge' | 'funnel';
    colorScheme?: string[];
    showLegend?: boolean;
    showLabels?: boolean;
    threshold?: number;
  };
  dataSource?: {
    id: string;
    type: string;
    query?: string;
  };
  settings: Record<string, any>;
  organizationId: string;
  isGlobal: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const WidgetSchema = new Schema<IWidget>(
  {
    name: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['chart', 'table', 'metric', 'text', 'image', 'filter'],
      required: true
    },
    description: { type: String },
    visualization: {
      chartType: {
        type: String,
        enum: ['line', 'bar', 'pie', 'area', 'scatter', 'table', 'gauge', 'funnel']
      },
      colorScheme: [{ type: String }],
      showLegend: { type: Boolean, default: true },
      showLabels: { type: Boolean, default: true },
      threshold: { type: Number }
    },
    dataSource: {
      id: { type: String },
      type: { type: String },
      query: { type: String }
    },
    settings: { type: Schema.Types.Mixed, default: {} },
    organizationId: { type: String, required: true, index: true },
    isGlobal: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

WidgetSchema.index({ organizationId: 1, type: 1 });
WidgetSchema.index({ isGlobal: 1, type: 1 });

export const Widget = mongoose.model<IWidget>('Widget', WidgetSchema);