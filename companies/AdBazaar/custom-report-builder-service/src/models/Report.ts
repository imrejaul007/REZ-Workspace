import mongoose, { Document, Schema } from 'mongoose';

export interface IWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'text' | 'image' | 'filter';
  title?: string;
  dataSourceId?: string;
  query?: string;
  visualization: {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'table';
    colorScheme?: string[];
    showLegend?: boolean;
    showLabels?: boolean;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  settings?: Record<string, any>;
}

export interface IReport extends Document {
  name: string;
  description?: string;
  organizationId: string;
  createdBy: string;
  widgets: IWidget[];
  layout: {
    columns: number;
    rowHeight: number;
    gap: number;
  };
  dataSources: Array<{
    id: string;
    name: string;
    type: string;
    connection: Record<string, any>;
  }>;
  filters: Array<{
    id: string;
    field: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'range';
    defaultValue?: any;
  }>;
  refreshInterval: number;
  isPublic: boolean;
  status: 'draft' | 'published' | 'archived';
  lastRun?: Date;
  lastData?: Record<string, any>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const WidgetSchema = new Schema<IWidget>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['chart', 'table', 'metric', 'text', 'image', 'filter'],
      required: true
    },
    title: { type: String },
    dataSourceId: { type: String },
    query: { type: String },
    visualization: {
      chartType: {
        type: String,
        enum: ['line', 'bar', 'pie', 'area', 'scatter', 'table']
      },
      colorScheme: [{ type: String }],
      showLegend: { type: Boolean },
      showLabels: { type: Boolean }
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    settings: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const ReportSchema = new Schema<IReport>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    organizationId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
    widgets: [WidgetSchema],
    layout: {
      columns: { type: Number, default: 12 },
      rowHeight: { type: Number, default: 100 },
      gap: { type: Number, default: 10 }
    },
    dataSources: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
        connection: { type: Schema.Types.Mixed }
      }
    ],
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
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    lastRun: { type: Date },
    lastData: { type: Schema.Types.Mixed },
    version: { type: Number, default: 1 }
  },
  { timestamps: true }
);

ReportSchema.index({ organizationId: 1, createdAt: -1 });
ReportSchema.index({ organizationId: 1, status: 1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);