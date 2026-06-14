import mongoose, { Document, Schema } from 'mongoose';

export interface IChart extends Document {
  name: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'gauge' | 'funnel' | 'heatmap' | 'candlestick';
  description?: string;
  dataConfig: {
    xAxis: string;
    yAxis: string[];
    groupBy?: string;
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  };
  visualization: {
    showLegend: boolean;
    showGrid: boolean;
    showLabels: boolean;
    colorScheme?: string[];
    animations: boolean;
  };
  thresholds?: Array<{
    value: number;
    color: string;
    label?: string;
  }>;
  annotations?: Array<{
    x: string | number;
    label: string;
    color?: string;
  }>;
  organizationId: string;
  createdBy: string;
  isTemplate: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChartSchema = new Schema<IChart>(
  {
    name: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['line', 'bar', 'pie', 'area', 'scatter', 'gauge', 'funnel', 'heatmap', 'candlestick'],
      required: true
    },
    description: { type: String },
    dataConfig: {
      xAxis: { type: String, required: true },
      yAxis: [{ type: String, required: true }],
      groupBy: { type: String },
      aggregation: {
        type: String,
        enum: ['sum', 'avg', 'count', 'min', 'max']
      }
    },
    visualization: {
      showLegend: { type: Boolean, default: true },
      showGrid: { type: Boolean, default: true },
      showLabels: { type: Boolean, default: true },
      colorScheme: [{ type: String }],
      animations: { type: Boolean, default: true }
    },
    thresholds: [
      {
        value: { type: Number, required: true },
        color: { type: String, required: true },
        label: { type: String }
      }
    ],
    annotations: [
      {
        x: { type: Schema.Types.Mixed, required: true },
        label: { type: String, required: true },
        color: { type: String }
      }
    ],
    organizationId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
    isTemplate: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

ChartSchema.index({ organizationId: 1, type: 1 });
ChartSchema.index({ isTemplate: 1, type: 1 });

export const Chart = mongoose.model<IChart>('Chart', ChartSchema);