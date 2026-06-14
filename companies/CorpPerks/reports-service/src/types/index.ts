import { Types } from 'mongoose';

// Widget Types
export type WidgetType =
  | 'table'
  | 'chart'
  | 'metric'
  | 'funnel'
  | 'heatmap'
  | 'timeline'
  | 'gauge';

export type ChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'donut'
  | 'area'
  | 'scatter'
  | 'radar';

export interface IWidgetFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'between';
  value: any;
}

export interface IWidget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string; // e.g., 'attendance', 'employees', 'performance'
  query?: {
    fields: string[];
    filters?: IWidgetFilter[];
    groupBy?: string;
    orderBy?: { field: string; direction: 'asc' | 'desc' }[];
    limit?: number;
  };
  visualization?: {
    chartType?: ChartType;
    xAxis?: string;
    yAxis?: string[];
    colorScheme?: string[];
    showLegend?: boolean;
    showLabels?: boolean;
    thresholds?: { value: number; color: string }[];
  };
  layout?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Filter Types
export type FilterFieldType = 'string' | 'number' | 'date' | 'select' | 'multiselect';

export interface IFilterOption {
  label: string;
  value: string;
}

export interface IReportFilter {
  id: string;
  field: string;
  label: string;
  fieldType: FilterFieldType;
  required: boolean;
  defaultValue?: any;
  options?: IFilterOption[];
}

// Template Types
export type ReportType = 'attendance' | 'performance' | 'financial' | 'custom' | 'lms';

export interface IReportTemplate {
  tenantId: string;
  name: string;
  description: string;
  type: ReportType;
  category: string;
  widgets: IWidget[];
  filters: IReportFilter[];
  isPublic: boolean;
  isDefault: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Report Instance Types
export interface IReportFilterValue {
  filterId: string;
  value: any;
}

export interface IReportInstance {
  tenantId: string;
  templateId: Types.ObjectId;
  params: IReportFilterValue[];
  data: Record<string, any>;
  generatedAt: Date;
  generatedBy: string;
  expiresAt?: Date;
}

// Pagination
export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API Response
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: IPagination;
}
