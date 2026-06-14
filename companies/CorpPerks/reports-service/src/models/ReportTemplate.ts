import mongoose, { Schema, Document, Types } from 'mongoose';

// Widget Filter
const widgetFilterSchema = new Schema({
  field: { type: String, required: true },
  operator: {
    type: String,
    enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in', 'between'],
    required: true,
  },
  value: { type: Schema.Types.Mixed, required: true },
}, { _id: false });

// Widget Schema
const widgetSchema = new Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['table', 'chart', 'metric', 'funnel', 'heatmap', 'timeline', 'gauge'],
    required: true,
  },
  title: { type: String, required: true },
  dataSource: { type: String, required: true },
  query: {
    fields: { type: [String], default: [] },
    filters: { type: [widgetFilterSchema], default: [] },
    groupBy: { type: String },
    orderBy: [{
      field: String,
      direction: { type: String, enum: ['asc', 'desc'] },
    }],
    limit: { type: Number },
  },
  visualization: {
    chartType: { type: String, enum: ['bar', 'line', 'pie', 'donut', 'area', 'scatter', 'radar'] },
    xAxis: { type: String },
    yAxis: { type: [String], default: [] },
    colorScheme: { type: [String], default: [] },
    showLegend: { type: Boolean, default: true },
    showLabels: { type: Boolean, default: false },
    thresholds: [{
      value: Number,
      color: String,
    }],
  },
  layout: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 4 },
    height: { type: Number, default: 3 },
  },
}, { _id: false });

// Filter Option
const filterOptionSchema = new Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
}, { _id: false });

// Report Filter
const reportFilterSchema = new Schema({
  id: { type: String, required: true },
  field: { type: String, required: true },
  label: { type: String, required: true },
  fieldType: {
    type: String,
    enum: ['string', 'number', 'date', 'select', 'multiselect'],
    required: true,
  },
  required: { type: Boolean, default: false },
  defaultValue: { type: Schema.Types.Mixed },
  options: { type: [filterOptionSchema], default: [] },
}, { _id: false });

// Report Template Schema
export interface IReportTemplate {
  tenantId: string;
  name: string;
  description: string;
  type: 'attendance' | 'performance' | 'financial' | 'custom' | 'lms';
  category: string;
  widgets: any[];
  filters: any[];
  isPublic: boolean;
  isDefault: boolean;
  createdBy: string;
  updatedBy?: string;
}

export interface IReportTemplateDocument extends IReportTemplate, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reportTemplateSchema = new Schema<IReportTemplateDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['attendance', 'performance', 'financial', 'custom', 'lms'],
      required: true,
    },
    category: { type: String, required: true },
    widgets: { type: [widgetSchema], default: [] },
    filters: { type: [reportFilterSchema], default: [] },
    isPublic: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
    createdBy: { type: String, required: true },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

// Indexes
reportTemplateSchema.index({ tenantId: 1, type: 1 });
reportTemplateSchema.index({ tenantId: 1, category: 1 });
reportTemplateSchema.index({ tenantId: 1, createdBy: 1 });
reportTemplateSchema.index({ tenantId: 1, isDefault: 1 });

export const ReportTemplate = mongoose.model<IReportTemplateDocument>('ReportTemplate', reportTemplateSchema);
