/**
 * Compliance Service - Real GST, TDS, and Payroll compliance logic
 * Implements Indian tax compliance rules as per current regulations
 */
import {
  GstSlab,
  TdsSection,
  ComplianceStatus,
  FilingStatus,
  ComplianceRecord,
  FilingReminder,
  IComplianceRecord,
  IGstInvoice,
  ITdsDeduction,
  IPayrollCompliance,
} from '../models/Compliance';
import { addMonths, addDays, endOfMonth, startOfMonth, format, isBefore, isAfter, differenceInDays } from 'date-fns';

// GST HSN code to slab mapping (simplified - actual mapping is more complex)
const HSN_SLAB_MAP: Record<string, GstSlab> = {
  // Food items (0%, 5%, 12%)
  '0101': GstSlab.SLAB_5, // Live horses
  '0201': GstSlab.SLAB_5, // Bovine meat
  '0401': GstSlab.SLAB_5, // Milk
  '0901': GstSlab.SLAB_5, // Coffee
  '0902': GstSlab.SLAB_5, // Tea
  '1001': GstSlab.SLAB_5, // Wheat
  '1006': GstSlab.SLAB_5, // Rice
  // Pharmaceutical (5%, 12%)
  '3003': GstSlab.SLAB_12, // Medicaments
  '3004': GstSlab.SLAB_12, // Medicaments (retail)
  // Textiles (5%, 12%)
  '5209': GstSlab.SLAB_5, // Woven cotton fabrics
  '6109': GstSlab.SLAB_12, // T-shirts
  // IT Hardware (18%)
  '8471': GstSlab.SLAB_18, // Computers
  '8517': GstSlab.SLAB_18, // Telephones
  // Luxury items (28%)
  '7113': GstSlab.SLAB_28, // Jewelry
  '8703': GstSlab.SLAB_28, // Motor vehicles
  '9202': GstSlab.SLAB_28, // Musical instruments
};

// GST slab thresholds for reverse charge
const REVERSE_CHARGE_THRESHOLD = 5000; // INR

// TDS rates as per Indian Income Tax Act
interface TdsRateConfig {
  rate: number;
  threshold: number;
  thresholdType: 'single' | 'aggregate';
  sections: TdsSection[];
}

const TDS_RATES: Record<TdsSection, TdsRateConfig> = {
  [TdsSection.SECTION_194A]: {
    rate: 10,
    threshold: 40000, // Interest income threshold
    thresholdType: 'single',
    sections: [TdsSection.SECTION_194A],
  },
  [TdsSection.SECTION_194C]: {
    rate: 2, // Individual/HUF 1%, Others 2%
    threshold: 30000, // Per contract
    thresholdType: 'single',
    sections: [TdsSection.SECTION_194C],
  },
  [TdsSection.SECTION_194H]: {
    rate: 5,
    threshold: 15000, // Commission/brokerage threshold
    thresholdType: 'single',
    sections: [TdsSection.SECTION_194H],
  },
  [TdsSection.SECTION_194I]: {
    rate: 2, // Plant/machinery 2%, Land/buildings 10%
    threshold: 240000, // Annual rent threshold
    thresholdType: 'single',
    sections: [TdsSection.SECTION_194I],
  },
  [TdsSection.SECTION_194J]: {
    rate: 10, // Professional fees 10%, Royalties 2%
    threshold: 30000, // Per payment
    thresholdType: 'single',
    sections: [TdsSection.SECTION_194J],
  },
  [TdsSection.SECTION_194Q]: {
    rate: 0.1,
    threshold: 5000000, // Rs 50 lakh annual purchases
    thresholdType: 'aggregate',
    sections: [TdsSection.SECTION_194Q],
  },
};

// Professional tax rates (state-wise, using Maharashtra as default)
const PROFESSIONAL_TAX_BRACKETS = [
  { min: 0, max: 15000, tax: 0 },
  { min: 15001, max: 25000, tax: 150 },
  { min: 25001, max: 50000, tax: 200 },
  { min: 50001, max: Infinity, tax: 300 },
];

// EPF contribution rates
const EPF_RATE = 0.12; // 12% of basic + DA
const EPF_LIMIT = 180000; // Annual wage ceiling for EPF

// ESIC contribution rates
const ESIC_RATE = 0.0325; // 3.25% employee contribution

/**
 * Validate GSTIN format (15 characters)
 */
export function validateGstin(gstin: string): boolean {
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
  return pattern.test(gstin.toUpperCase());
}

/**
 * Validate HSN code format (2-8 digits)
 */
export function validateHsnCode(hsn: string): boolean {
  return /^\d{2,8}$/.test(hsn);
}

/**
 * Validate PAN format
 */
export function validatePan(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
}

/**
 * Get GST slab based on HSN code
 */
export function getGstSlabFromHsn(hsnCode: string): GstSlab {
  const prefix = hsnCode.substring(0, 4);
  return HSN_SLAB_MAP[prefix] ?? GstSlab.SLAB_18; // Default to 18%
}

/**
 * Calculate GST amount based on slab
 */
export function calculateGstAmount(taxableValue: number, slab: GstSlab): { cgst: number; sgst: number; igst: number } {
  const totalGst = (taxableValue * slab) / 100;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;
  const igst = totalGst; // IGST = CGST + SGST for inter-state
  return { cgst, sgst, igst };
}

/**
 * Calculate GST for a single invoice
 */
export interface GstCalculationInput {
  taxableValue: number;
  hsnCode: string;
  isInterState: boolean;
  reverseCharge: boolean;
}

export interface GstCalculationResult {
  hsnCode: string;
  slab: GstSlab;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  totalAmount: number;
  reverseCharge: boolean;
  reverseChargeNote?: string;
}

/**
 * Calculate GST with proper slabs and validation
 */
export function calculateGst(input: GstCalculationInput): GstCalculationResult {
  // Validate HSN code
  if (!validateHsnCode(input.hsnCode)) {
    throw new Error(`Invalid HSN code format: ${input.hsnCode}`);
  }

  // Validate taxable value
  if (input.taxableValue < 0) {
    throw new Error('Taxable value cannot be negative');
  }

  // Get GST slab from HSN
  const slab = getGstSlabFromHsn(input.hsnCode);

  // Calculate GST components
  const { cgst, sgst, igst } = calculateGstAmount(input.taxableValue, slab);

  // Determine reverse charge applicability
  let reverseCharge = input.reverseCharge;
  let reverseChargeNote: string | undefined;

  if (!reverseCharge && input.taxableValue > REVERSE_CHARGE_THRESHOLD) {
    // Check if unregistered supplier (reverse charge applies)
    reverseChargeNote = 'Reverse charge applicable if supplier is unregistered';
  }

  const totalGst = input.isInterState ? igst : cgst + sgst;
  const totalAmount = input.taxableValue + totalGst;

  return {
    hsnCode: input.hsnCode,
    slab,
    taxableValue: input.taxableValue,
    cgst: input.isInterState ? 0 : cgst,
    sgst: input.isInterState ? 0 : sgst,
    igst: input.isInterState ? igst : 0,
    totalGst,
    totalAmount,
    reverseCharge,
    reverseChargeNote,
  };
}

/**
 * Calculate multiple invoices and aggregate GST
 */
export interface BulkGstCalculationInput {
  invoices: Array<{
    taxableValue: number;
    hsnCode: string;
    isInterState: boolean;
    reverseCharge?: boolean;
  }>;
}

export interface BulkGstCalculationResult {
  invoices: GstCalculationResult[];
  summary: {
    totalTaxableValue: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalGst: number;
    totalAmount: number;
    invoiceCount: number;
  };
}

export function calculateBulkGst(input: BulkGstCalculationInput): BulkGstCalculationResult {
  const results = input.invoices.map((inv) => calculateGst({
    taxableValue: inv.taxableValue,
    hsnCode: inv.hsnCode,
    isInterState: inv.isInterState,
    reverseCharge: inv.reverseCharge ?? false,
  }));

  const summary = {
    totalTaxableValue: results.reduce((sum, r) => sum + r.taxableValue, 0),
    totalCgst: results.reduce((sum, r) => sum + r.cgst, 0),
    totalSgst: results.reduce((sum, r) => sum + r.sgst, 0),
    totalIgst: results.reduce((sum, r) => sum + r.igst, 0),
    totalGst: results.reduce((sum, r) => sum + r.totalGst, 0),
    totalAmount: results.reduce((sum, r) => sum + r.totalAmount, 0),
    invoiceCount: results.length,
  };

  return { invoices: results, summary };
}

/**
 * Calculate TDS on a payment
 */
export interface TdsCalculationInput {
  section: TdsSection;
  paymentAmount: number;
  panAvailable: boolean;
  isIndividualOrHuf?: boolean;
}

export interface TdsCalculationResult {
  section: TdsSection;
  paymentAmount: number;
  tdsRate: number;
  tdsAmount: number;
  tdsThreshold: number;
  isExempt: boolean;
  exemptionReason?: string;
  panNotAvailableSurcharge?: number;
}

export function calculateTds(input: TdsCalculationInput): TdsCalculationResult {
  const config = TDS_RATES[input.section];
  const threshold = config.threshold;

  // Check if below threshold
  if (input.paymentAmount <= threshold) {
    return {
      section: input.section,
      paymentAmount: input.paymentAmount,
      tdsRate: 0,
      tdsAmount: 0,
      tdsThreshold: threshold,
      isExempt: true,
      exemptionReason: `Payment below threshold of Rs ${threshold.toLocaleString('en-IN')}`,
    };
  }

  // Calculate base TDS rate
  let rate = config.rate;

  // Section 194C: Individuals/HUF get 1%, others get 2%
  if (input.section === TdsSection.SECTION_194C && input.isIndividualOrHuf) {
    rate = 1;
  }

  // Section 194I: Land/building 10%, Plant/machinery 2%
  // Assuming plant/machinery by default

  // Section 194J: Royalties 2%, Professional fees 10%
  // Assuming professional fees by default

  // PAN not available: TDS at double rate (Section 206AA)
  let surcharge = 0;
  if (!input.panAvailable) {
    rate = rate * 2;
    surcharge = 0.10; // 10% education cess
  }

  let tdsAmount = (input.paymentAmount * rate) / 100;

  // Add surcharge if applicable
  if (surcharge > 0) {
    tdsAmount = tdsAmount * (1 + surcharge);
  }

  return {
    section: input.section,
    paymentAmount: input.paymentAmount,
    tdsRate: rate,
    tdsAmount: Math.round(tdsAmount * 100) / 100,
    tdsThreshold: threshold,
    isExempt: false,
    panNotAvailableSurcharge: surcharge > 0 ? surcharge * 100 : undefined,
  };
}

/**
 * Calculate TDS for a tenant for a quarter
 */
export interface TenantTdsInput {
  tenantId: string;
  financialYear: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  deductions: TdsCalculationInput[];
}

export interface TenantTdsResult {
  tenantId: string;
  financialYear: string;
  quarter: string;
  totalPayments: number;
  totalTdsDeducted: number;
  deductions: TdsCalculationResult[];
  tdsPayable: number;
  dueDate: Date;
  complianceStatus: ComplianceStatus;
}

export async function calculateTenantTds(input: TenantTdsInput): Promise<TenantTdsResult> {
  const deductionResults = input.deductions.map((d) => calculateTds(d));

  const totalPayments = deductionResults.reduce((sum, d) => sum + d.paymentAmount, 0);
  const totalTdsDeducted = deductionResults.reduce((sum, d) => sum + d.tdsAmount, 0);

  // Determine quarter end month
  const quarterMonths: Record<string, number> = {
    Q1: 6, // Apr-Jun
    Q2: 9, // Jul-Sep
    Q3: 12, // Oct-Dec
    Q4: 3, // Jan-Mar
  };
  const endMonth = quarterMonths[input.quarter];
  const year = input.financialYear.split('-')[0];
  const dueDate = new Date(parseInt(year, 10), endMonth, 28); // 28th of quarter end month

  // Check compliance status
  let complianceStatus = ComplianceStatus.COMPLIANT;
  if (isBefore(dueDate, new Date())) {
    complianceStatus = isAfter(dueDate, addDays(new Date(), -30)) ? ComplianceStatus.IN_PROGRESS : ComplianceStatus.DEFAULTED;
  }

  return {
    tenantId: input.tenantId,
    financialYear: input.financialYear,
    quarter: input.quarter,
    totalPayments,
    totalTdsDeducted,
    deductions: deductionResults,
    tdsPayable: totalTdsDeducted,
    dueDate,
    complianceStatus,
  };
}

/**
 * Calculate professional tax based on monthly salary
 */
export function calculateProfessionalTax(monthlySalary: number): number {
  const bracket = PROFESSIONAL_TAX_BRACKETS.find(
    (b) => monthlySalary >= b.min && monthlySalary <= b.max
  );
  return bracket?.tax ?? 0;
}

/**
 * Calculate TDS on salary (Section 192)
 */
export interface SalaryInput {
  grossSalary: number;
  hra?: number;
  standardDeduction?: number;
  section80C?: number;
  section80D?: number;
  nps?: number;
}

export interface SalaryTdsResult {
  grossSalary: number;
  taxableSalary: number;
  taxSlab: string;
  taxAmount: number;
  professionalTax: number;
  totalDeductions: number;
  netTds: number;
  cess: number;
  totalTaxPayable: number;
}

export function calculateSalaryTds(input: SalaryInput): SalaryTdsResult {
  // Standard deduction
  const standardDeduction = input.standardDeduction ?? 75000;

  // Section 80C investments limit
  const section80CLimit = 150000;
  const section80C = Math.min(input.section80C ?? 0, section80CLimit);

  // Section 80D health insurance
  const section80D = input.section80D ?? 0;

  // NPS contribution (up to 14% of employer)
  const nps = input.nps ?? 0;

  // Total deductions
  const totalDeductions = standardDeduction + section80C + section80D + nps;

  // Taxable salary
  const taxableSalary = Math.max(0, input.grossSalary - totalDeductions);

  // Calculate tax based on new tax regime (simplified)
  let taxAmount = 0;
  let taxSlab = '';

  if (taxableSalary <= 300000) {
    taxSlab = '0%';
    taxAmount = 0;
  } else if (taxableSalary <= 700000) {
    taxSlab = '5%';
    taxAmount = ((taxableSalary - 300000) * 5) / 100;
  } else if (taxableSalary <= 1000000) {
    taxSlab = '10%';
    taxAmount = 20000 + ((taxableSalary - 700000) * 10) / 100;
  } else if (taxableSalary <= 1200000) {
    taxSlab = '15%';
    taxAmount = 50000 + ((taxableSalary - 1000000) * 15) / 100;
  } else if (taxableSalary <= 1500000) {
    taxSlab = '20%';
    taxAmount = 80000 + ((taxableSalary - 1200000) * 20) / 100;
  } else {
    taxSlab = '30%';
    taxAmount = 140000 + ((taxableSalary - 1500000) * 30) / 100;
  }

  // Rebate under 87A (for income up to 7 lakh)
  if (taxableSalary <= 700000) {
    taxAmount = 0;
  }

  // Professional tax
  const professionalTax = calculateProfessionalTax(input.grossSalary / 12);

  // Cess
  const cess = taxAmount > 0 ? taxAmount * 0.04 : 0;

  const totalTaxPayable = taxAmount + professionalTax + cess;

  return {
    grossSalary: input.grossSalary,
    taxableSalary,
    taxSlab,
    taxAmount,
    professionalTax,
    totalDeductions,
    netTds: taxAmount,
    cess,
    totalTaxPayable: Math.round(totalTaxPayable),
  };
}

/**
 * Calculate payroll compliance for an employee
 */
export interface PayrollCalculationInput {
  employeeId: string;
  employeePan: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  epf?: number;
  esic?: boolean;
  professionalTax?: number;
}

export interface PayrollComplianceResult {
  employeeId: string;
  employeePan: string;
  grossSalary: number;
  taxableSalary: number;
  professionalTax: number;
  epfContribution: number;
  esicContribution: number;
  tdsOnSalary: number;
  netPay: number;
  complianceNotes: string[];
}

export function calculatePayrollCompliance(input: PayrollCalculationInput): PayrollComplianceResult {
  const grossSalary = input.basicSalary + input.hra + input.allowances;

  // Professional tax
  const professionalTax = input.professionalTax ?? calculateProfessionalTax(input.basicSalary);

  // EPF contribution (12% of basic + DA, capped at wage ceiling)
  const epfWage = Math.min(input.basicSalary + input.hra, EPF_LIMIT / 12);
  const epfContribution = input.epf ?? (epfWage * EPF_RATE);

  // ESIC contribution (3.25% of gross, only for wages <= 21000/month)
  let esicContribution = 0;
  if (input.esic && grossSalary <= 21000) {
    esicContribution = grossSalary * ESIC_RATE;
  }

  // Calculate TDS on salary
  const tdsResult = calculateSalaryTds({
    grossSalary,
    hra: input.hra,
    standardDeduction: 75000,
  });

  // Net pay calculation
  const deductions = professionalTax + tdsResult.totalTaxPayable;
  const netPay = grossSalary - deductions;

  // Generate compliance notes
  const complianceNotes: string[] = [];
  if (!validatePan(input.employeePan)) {
    complianceNotes.push('Invalid PAN - TDS will be deducted at higher rate');
  }
  if (grossSalary > EPF_LIMIT) {
    complianceNotes.push(`EPF wage ceiling exceeded (${EPF_LIMIT.toLocaleString('en-IN')})`);
  }
  if (input.esic && grossSalary > 21000) {
    complianceNotes.push('ESIC limit exceeded - employee not eligible');
  }

  return {
    employeeId: input.employeeId,
    employeePan: input.employeePan,
    grossSalary,
    taxableSalary: tdsResult.taxableSalary,
    professionalTax,
    epfContribution: Math.round(epfContribution * 100) / 100,
    esicContribution: Math.round(esicContribution * 100) / 100,
    tdsOnSalary: tdsResult.totalTaxPayable,
    netPay: Math.round(netPay * 100) / 100,
    complianceNotes,
  };
}

/**
 * Get upcoming filing reminders
 */
export interface FilingReminderInput {
  tenantId: string;
  daysAhead?: number;
}

export interface FilingReminderResult {
  reminders: Array<{
    type: 'gst' | 'tds' | 'payroll';
    filingType: string;
    period: string;
    dueDate: Date;
    daysRemaining: number;
    status: ComplianceStatus;
    isOverdue: boolean;
  }>;
}

export async function getFilingReminders(input: FilingReminderInput): Promise<FilingReminderResult> {
  const daysAhead = input.daysAhead ?? 30;
  const now = new Date();
  const futureDate = addDays(now, daysAhead);

  // Get reminders from database
  const reminders = await FilingReminder.find({
    tenantId: input.tenantId,
    dueDate: { $gte: now, $lte: futureDate },
    status: { $ne: 'acknowledged' },
  }).sort({ dueDate: 1 });

  const result = reminders.map((r) => {
    const daysRemaining = differenceInDays(r.dueDate, now);
    return {
      type: r.type as 'gst' | 'tds' | 'payroll',
      filingType: r.filingType,
      period: r.period,
      dueDate: r.dueDate,
      daysRemaining: Math.max(0, daysRemaining),
      status: daysRemaining < 0 ? ComplianceStatus.DEFAULTED : ComplianceStatus.PENDING,
      isOverdue: daysRemaining < 0,
    };
  });

  return { reminders: result };
}

/**
 * Generate filing reminders for a tenant
 */
export async function generateFilingReminders(tenantId: string, financialYear: string): Promise<void> {
  const year = financialYear.split('-')[0];
  const startDate = new Date(parseInt(year, 10), 3, 1); // April 1st

  // GST reminders (monthly GSTR-1 by 10th, GSTR-3B by 20th)
  const gstReminders = [
    { month: 0, type: 'GSTR-1', day: 10 },
    { month: 0, type: 'GSTR-3B', day: 20 },
    { month: 1, type: 'GSTR-1', day: 10 },
    { month: 1, type: 'GSTR-3B', day: 20 },
    { month: 2, type: 'GSTR-1', day: 10 },
    { month: 2, type: 'GSTR-3B', day: 20 },
  ];

  for (const r of gstReminders) {
    const dueDate = new Date(parseInt(year, 10), 3 + r.month, r.day);
    if (isAfter(dueDate, new Date())) {
      const period = format(dueDate, 'MMMM yyyy');
      await FilingReminder.findOneAndUpdate(
        { tenantId, type: 'gst', filingType: r.type, period },
        {
          tenantId,
          type: 'gst',
          filingType: r.type,
          period,
          dueDate,
          reminderDate: addDays(dueDate, -7),
          status: 'pending',
        },
        { upsert: true }
      );
    }
  }

  // TDS reminders (quarterly)
  const tdsQuarters = [
    { quarter: 'Q1', month: 9, day: 31 },
    { quarter: 'Q2', month: 12, day: 31 },
    { quarter: 'Q3', month: 3, day: 31 },
    { quarter: 'Q4', month: 6, day: 31 },
  ];

  for (const q of tdsQuarters) {
    const dueMonth = q.month >= 12 ? q.month - 12 : q.month;
    const dueYear = q.month >= 12 ? parseInt(year, 10) + 1 : parseInt(year, 10);
    const dueDate = new Date(dueYear, dueMonth, q.day);

    if (isAfter(dueDate, new Date())) {
      const period = `${q.quarter} ${financialYear}`;
      await FilingReminder.findOneAndUpdate(
        { tenantId, type: 'tds', filingType: 'TDS Return', period },
        {
          tenantId,
          type: 'tds',
          filingType: 'TDS Return',
          period,
          dueDate,
          reminderDate: addDays(dueDate, -14),
          status: 'pending',
        },
        { upsert: true }
      );
    }
  }

  // Professional tax reminders (monthly by 15th)
  for (let month = 0; month < 12; month++) {
    const dueDate = new Date(parseInt(year, 10), month, 15);
    if (isAfter(dueDate, new Date())) {
      const period = format(dueDate, 'MMMM yyyy');
      await FilingReminder.findOneAndUpdate(
        { tenantId, type: 'payroll', filingType: 'Professional Tax', period },
        {
          tenantId,
          type: 'payroll',
          filingType: 'Professional Tax',
          period,
          dueDate,
          reminderDate: addDays(dueDate, -5),
          status: 'pending',
        },
        { upsert: true }
      );
    }
  }
}

/**
 * Get compliance status summary for a tenant
 */
export async function getComplianceSummary(tenantId: string, financialYear: string): Promise<{
  gst: { status: ComplianceStatus; lastFiled?: Date; nextDue?: Date };
  tds: { status: ComplianceStatus; lastFiled?: Date; nextDue?: Date };
  payroll: { status: ComplianceStatus; lastFiled?: Date; nextDue?: Date };
}> {
  const records = await ComplianceRecord.find({
    tenantId,
    financialYear,
  });

  const summary = {
    gst: { status: ComplianceStatus.PENDING as ComplianceStatus },
    tds: { status: ComplianceStatus.PENDING as ComplianceStatus },
    payroll: { status: ComplianceStatus.PENDING as ComplianceStatus },
  };

  for (const record of records) {
    if (record.type === 'gst') {
      summary.gst = {
        status: record.status,
        lastFiled: record.gstData?.returnFilingDate,
        nextDue: record.filingDeadline,
      };
    } else if (record.type === 'tds') {
      summary.tds = {
        status: record.status,
        lastFiled: record.tdsData?.quarterlyReturnFiled ? new Date() : undefined,
        nextDue: record.filingDeadline,
      };
    } else if (record.type === 'payroll') {
      summary.payroll = {
        status: record.status,
        lastFiled: record.payrollData?.monthlyComplianceMet ? new Date() : undefined,
        nextDue: record.filingDeadline,
      };
    }
  }

  return summary;
}

export default {
  validateGstin,
  validateHsnCode,
  validatePan,
  calculateGst,
  calculateBulkGst,
  calculateTds,
  calculateTenantTds,
  calculateProfessionalTax,
  calculateSalaryTds,
  calculatePayrollCompliance,
  getFilingReminders,
  generateFilingReminders,
  getComplianceSummary,
};