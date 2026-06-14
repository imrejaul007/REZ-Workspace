import { ObjectId } from 'mongoose';

// ============================================================================
// Common Types
// ============================================================================

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Contact {
  _id?: ObjectId;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  isPrimary: boolean;
  createdAt?: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  tax?: number;
  total: number;
}

export interface Activity {
  _id?: ObjectId;
  activityId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'stage_change' | 'created' | 'updated';
  title: string;
  description?: string;
  date: Date;
  performedBy: string; // employee ID
  metadata?: Record<string, unknown>;
  tenantId?: string;
  entityType?: 'client' | 'deal' | 'proposal' | 'invoice';
  entityId?: string;
}

// Pipeline stage response type (for API responses)
export interface PipelineStageData {
  id: string;
  name: string;
  probability: number;
  order: number;
}

// ============================================================================
// Client Model
// ============================================================================

export interface IClient {
  _id: ObjectId;
  clientId: string;
  tenantId: string;
  companyName: string;
  industry: string;
  website?: string;
  phone: string;
  email: string;
  address: Address;
  contacts: Contact[];
  status: 'prospect' | 'active' | 'inactive' | 'churned';
  source: 'referral' | 'website' | 'linkedin' | 'cold_call' | 'event' | 'other';
  assignedTo: string; // employee ID
  dealValue: number; // total pipeline value
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Deal Model
// ============================================================================

export interface IDeal {
  _id: ObjectId;
  dealId: string;
  tenantId: string;
  title: string;
  description?: string;
  clientId: string;
  value: number;
  currency: 'INR' | 'USD';
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  probability: number; // 0-100
  expectedClose: Date;
  actualClose?: Date;
  products: string[];
  owner: string; // employee ID
  activities: Activity[];
  lossReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Proposal Model
// ============================================================================

export interface IProposal {
  _id: ObjectId;
  proposalId: string;
  tenantId: string;
  clientId: string;
  dealId?: string;
  title: string;
  content: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: 'INR' | 'USD';
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  validUntil: Date;
  sentAt?: Date;
  viewedAt?: Date;
  signedAt?: Date;
  signatureData?: string;
  createdBy: string; // employee ID
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Invoice Model
// ============================================================================

export interface IInvoice {
  _id: ObjectId;
  invoiceId: string;
  tenantId: string;
  invoiceNumber: string;
  clientId: string;
  dealId?: string;
  proposalId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: 'INR' | 'USD';
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  sentAt?: Date;
  paidDate?: Date;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  createdBy: string; // employee ID
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueByMonth: { month: string; revenue: number }[];
  revenueByClient: { clientId: string; clientName: string; revenue: number }[];
  revenueByStage: { stage: string; revenue: number }[];
  averageDealSize: number;
  totalDeals: number;
}

export interface PipelineAnalytics {
  totalValue: number;
  valueByStage: { stage: string; value: number; count: number }[];
  weightedValue: number;
  dealsAtRisk: number;
  projectedRevenue: number;
}

export interface ConversionAnalytics {
  totalLeads: number;
  conversionRate: number;
  avgTimeToClose: number; // in days
  stageConversionRates: { fromStage: string; toStage: string; rate: number }[];
  winRate: number;
  lossRate: number;
}

export interface ForecastingData {
  predictedRevenue: number;
  confidence: number;
  quarterlyForecast: { quarter: string; predicted: number; actual?: number }[];
  riskFactors: string[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Filter Types
// ============================================================================

export interface ClientFilters {
  status?: IClient['status'];
  source?: IClient['source'];
  industry?: string;
  assignedTo?: string;
  search?: string;
  minDealValue?: number;
  maxDealValue?: number;
}

export interface DealFilters {
  stage?: IDeal['stage'];
  owner?: string;
  clientId?: string;
  minValue?: number;
  maxValue?: number;
  expectedCloseFrom?: Date;
  expectedCloseTo?: Date;
  search?: string;
}

export interface InvoiceFilters {
  status?: IInvoice['status'];
  clientId?: string;
  fromDate?: Date;
  toDate?: Date;
  minTotal?: number;
  maxTotal?: number;
}
