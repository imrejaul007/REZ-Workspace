/**
 * Compliance Models for Finance Compliance service
 * MongoDB schemas for GST, TDS, and Payroll compliance records
 */
import mongoose, { Document, Schema } from 'mongoose';

// GST Slab rates as per Indian GST law
export enum GstSlab {
  SLAB_5 = 5,
  SLAB_12 = 12,
  SLAB_18 = 18,
  SLAB_28 = 28,
}

// TDS Sections as per Indian Income Tax
export enum TdsSection {
  SECTION_194A = '194A', // Interest income
  SECTION_194C = '194C', // Contractor payments
  SECTION_194H = '194H', // Commission/brokerage
  SECTION_194I = '194I', // Rent
  SECTION_194J = '194J', // Professional fees
  SECTION_194Q = '194Q', // TDS on purchase of goods
}

export enum ComplianceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLIANT = 'compliant',
  DEFAULTED = 'defaulted',
  EXEMPT = 'exempt',
}

export enum FilingStatus {
  NOT_FILED = 'not_filed',
  FILED = 'filed',
  LATE_FILED = 'late_filed',
  UNDER_REVIEW = 'under_review',
}

// HSN Code validation pattern (2-8 digits)
const HSN_PATTERN = /^\d{2,8}$/;

// GST Invoice interface
export interface IGstInvoice {
  invoiceNumber: string;
  invoiceDate: Date;
  supplierGstin: string;
  recipientGstin: string;
  hsnCode: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  totalAmount: number;
  placeOfSupply: string;
  reverseCharge: boolean;
}

// TDS Deduction interface
export interface ITdsDeduction {
  section: TdsSection;
 panOfDeductee: string;
  nameOfDeductee: string;
  paymentAmount: number;
  tdsAmount: number;
  tdsRate: number;
  dateOfPayment: Date;
  natureOfPayment: string;
}

// Payroll compliance interface
export interface IPayrollCompliance {
  employeeId: string;
  employeePan: string;
  grossSalary: number;
  professionalTax: number;
  tdsOnSalary: number;
  epfContribution: number;
  esicContribution: number;
  ptdsAmount: number;
  netPay: number;
}

// Compliance record document interface
export interface IComplianceRecord extends Document {
  tenantId: string;
  type: 'gst' | 'tds' | 'payroll';
  financialYear: string;
  period: {
    start: Date;
    end: Date;
  };
  status: ComplianceStatus;
  filingStatus: FilingStatus;
  gstData?: {
    invoices: IGstInvoice[];
    totalTaxableValue: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalGstPayable: number;
    inputTaxCredit: number;
    netGstPayable: number;
    returnFiled: boolean;
    returnFilingDate?: Date;
  };
  tdsData?: {
    deductions: ITdsDeduction[];
    totalPayments: number;
    totalTdsDeducted: number;
    tdsCertificateIssued: boolean;
    quarterlyReturnFiled: boolean;
  };
  payrollData?: {
    employees: IPayrollCompliance[];
    totalGrossSalary: number;
    totalProfessionalTax: number;
    totalTdsOnSalary: number;
    totalEpf: number;
    totalEsic: number;
    monthlyComplianceMet: boolean;
  };
  filingDeadline: Date;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Filing reminder document
export interface IFilingReminder extends Document {
  tenantId: string;
  type: 'gst' | 'tds' | 'payroll';
  filingType: string;
  period: string;
  dueDate: Date;
  reminderDate: Date;
  status: 'pending' | 'sent' | 'acknowledged';
  notifiedTo: string[];
  createdAt: Date;
}

// Mongoose Schemas
const GstInvoiceSchema = new Schema<IGstInvoice>(
  {
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    supplierGstin: { type: String, required: true },
    recipientGstin: { type: String, required: true },
    hsnCode: { type: String, required: true, match: HSN_PATTERN },
    taxableValue: { type: Number, required: true, min: 0 },
    cgst: { type: Number, required: true, min: 0 },
    sgst: { type: Number, required: true, min: 0 },
    igst: { type: Number, required: true, min: 0 },
    totalGst: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    placeOfSupply: { type: String, required: true },
    reverseCharge: { type: Boolean, default: false },
  },
  { _id: false }
);

const TdsDeductionSchema = new Schema<ITdsDeduction>(
  {
    section: { type: String, enum: Object.values(TdsSection), required: true },
    panOfDeductee: { type: String, required: true },
    nameOfDeductee: { type: String, required: true },
    paymentAmount: { type: Number, required: true, min: 0 },
    tdsAmount: { type: Number, required: true, min: 0 },
    tdsRate: { type: Number, required: true, min: 0 },
    dateOfPayment: { type: Date, required: true },
    natureOfPayment: { type: String, required: true },
  },
  { _id: false }
);

const PayrollComplianceSchema = new Schema<IPayrollCompliance>(
  {
    employeeId: { type: String, required: true },
    employeePan: { type: String, required: true },
    grossSalary: { type: Number, required: true, min: 0 },
    professionalTax: { type: Number, default: 0, min: 0 },
    tdsOnSalary: { type: Number, default: 0, min: 0 },
    epfContribution: { type: Number, default: 0, min: 0 },
    esicContribution: { type: Number, default: 0, min: 0 },
    ptdsAmount: { type: Number, default: 0, min: 0 },
    netPay: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const GstDataSchema = new Schema(
  {
    invoices: [GstInvoiceSchema],
    totalTaxableValue: { type: Number, default: 0 },
    totalCgst: { type: Number, default: 0 },
    totalSgst: { type: Number, default: 0 },
    totalIgst: { type: Number, default: 0 },
    totalGstPayable: { type: Number, default: 0 },
    inputTaxCredit: { type: Number, default: 0 },
    netGstPayable: { type: Number, default: 0 },
    returnFiled: { type: Boolean, default: false },
    returnFilingDate: { type: Date },
  },
  { _id: false }
);

const TdsDataSchema = new Schema(
  {
    deductions: [TdsDeductionSchema],
    totalPayments: { type: Number, default: 0 },
    totalTdsDeducted: { type: Number, default: 0 },
    tdsCertificateIssued: { type: Boolean, default: false },
    quarterlyReturnFiled: { type: Boolean, default: false },
  },
  { _id: false }
);

const PayrollDataSchema = new Schema(
  {
    employees: [PayrollComplianceSchema],
    totalGrossSalary: { type: Number, default: 0 },
    totalProfessionalTax: { type: Number, default: 0 },
    totalTdsOnSalary: { type: Number, default: 0 },
    totalEpf: { type: Number, default: 0 },
    totalEsic: { type: Number, default: 0 },
    monthlyComplianceMet: { type: Boolean, default: false },
  },
  { _id: false }
);

const ComplianceRecordSchema = new Schema<IComplianceRecord>(
  {
    tenantId: { type: String, required: true, index: true },
    type: { type: String, enum: ['gst', 'tds', 'payroll'], required: true },
    financialYear: { type: String, required: true },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    status: {
      type: String,
      enum: Object.values(ComplianceStatus),
      default: ComplianceStatus.PENDING,
    },
    filingStatus: {
      type: String,
      enum: Object.values(FilingStatus),
      default: FilingStatus.NOT_FILED,
    },
    gstData: GstDataSchema,
    tdsData: TdsDataSchema,
    payrollData: PayrollDataSchema,
    filingDeadline: { type: Date, required: true },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'compliance_records',
  }
);

// Compound indexes for efficient queries
ComplianceRecordSchema.index({ tenantId: 1, type: 1, financialYear: 1 });
ComplianceRecordSchema.index({ tenantId: 1, filingDeadline: 1 });
ComplianceRecordSchema.index({ status: 1, filingStatus: 1 });

const FilingReminderSchema = new Schema<IFilingReminder>(
  {
    tenantId: { type: String, required: true, index: true },
    type: { type: String, enum: ['gst', 'tds', 'payroll'], required: true },
    filingType: { type: String, required: true },
    period: { type: String, required: true },
    dueDate: { type: Date, required: true },
    reminderDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'sent', 'acknowledged'], default: 'pending' },
    notifiedTo: [{ type: String }],
  },
  {
    timestamps: true,
    collection: 'filing_reminders',
  }
);

FilingReminderSchema.index({ tenantId: 1, dueDate: 1 });
FilingReminderSchema.index({ status: 1, reminderDate: 1 });

// Export models
export const ComplianceRecord = mongoose.model<IComplianceRecord>('ComplianceRecord', ComplianceRecordSchema);
export const FilingReminder = mongoose.model<IFilingReminder>('FilingReminder', FilingReminderSchema);

export default { ComplianceRecord, FilingReminder };
