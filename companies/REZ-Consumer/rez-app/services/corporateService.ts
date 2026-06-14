/**
 * CORPORATE SERVICE
 * Integration with rez-corporate-service (CorpPerks)
 *
 * Service: rez-corporate-service
 * Port: 4056
 * URL: https://rez-corporate-service.onrender.com
 *
 * Features:
 * - Employee benefits
 * - Corporate cards
 * - GST invoice generation
 * - Travel booking (with policy compliance)
 * - HRIS integration
 * - Expense management
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

// Employee & Benefits
export interface CorporateEmployee {
  employeeId: string;
  email: string;
  name: string;
  department: string;
  designation: string;
  company: CorporateCompany;
  tier: 'basic' | 'standard' | 'premium' | 'executive';
  benefits: EmployeeBenefits;
  cardDetails?: {
    cardId: string;
    lastFour: string;
    limit: number;
    used: number;
    expiry: string;
  };
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  status: 'active' | 'onboarding' | 'suspended' | 'left';
}

export interface CorporateCompany {
  companyId: string;
  name: string;
  logo?: string;
  domain: string;
  plan: 'starter' | 'business' | 'enterprise';
  features: string[];
}

export interface EmployeeBenefits {
  monthlyFoodAllowance: number;
  monthlyTravelAllowance: number;
  annualHealthBudget: number;
  quarterlyWellnessBudget: number;
  mealVouchers?: number;
  fuelAllowance?: number;
  others: Record<string, number>;
}

// GST Invoice
export interface GSTInvoice {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    billingAddress: Address;
    gstin?: string;
  };
  business: {
    name: string;
    address: Address;
    gstin: string;
  };
  items: GSTLineItem[];
  subtotal: number;
  taxBreakdown: {
    cgst: number;
    sgst: number;
    igst: number;
    tcs?: number;
  };
  totalTax: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  irn?: string; // Invoice Reference Number (e-Invoice)
  eInvoiceUrl?: string;
  qrCodeUrl?: string;
}

export interface GSTLineItem {
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  discount?: number;
  taxableValue: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

// Corporate Card
export interface CorporateCard {
  cardId: string;
  employeeId: string;
  lastFour: string;
  type: 'virtual' | 'physical';
  network: 'visa' | 'mastercard' | 'rupay';
  limit: number;
  used: number;
  available: number;
  expiryMonth: number;
  expiryYear: number;
  status: 'active' | 'blocked' | 'expired';
  spendingCategories: string[];
}

export interface CardTransaction {
  transactionId: string;
  cardId: string;
  amount: number;
  merchant: string;
  category: string;
  mcc: string;
  timestamp: string;
  status: 'pending' | 'posted' | 'declined';
  receipt?: string;
}

// Travel Booking
export interface TravelPolicy {
  policyId: string;
  name: string;
  eligibility: {
    tiers: string[];
    departments?: string[];
    designations?: string[];
  };
  flights: {
    allowed: boolean;
    class: 'economy_only' | 'economy_premium' | 'business_any';
    maxAmount?: number;
  };
  hotels: {
    allowed: boolean;
    starRating: '2_star' | '3_star' | '4_star' | '5_star';
    maxAmountPerNight?: number;
    maxNights?: number;
  };
  trains: {
    allowed: boolean;
    class: 'sleeper' | 'ac' | 'first_class';
  };
  cabs: {
    allowed: boolean;
    type: 'economy' | 'sedan' | 'suv';
    maxPerDay?: number;
  };
  approvals: {
    required: boolean;
    threshold: number;
    approverRole?: string;
  };
}

// Expense Management
export interface ExpenseClaim {
  claimId: string;
  employeeId: string;
  type: 'travel' | 'meal' | 'accommodation' | 'misc';
  description: string;
  amount: number;
  currency: string;
  date: string;
  receipt?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
  approverComments?: string;
  reimbursementRef?: string;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const CORPORATE_SERVICE_URL = process.env.EXPO_PUBLIC_CORPORATE_SERVICE_URL || 'https://rez-corporate-service.onrender.com';
const CORPORATE_API_VERSION = 'v1';
const CORPORATE_BASE_URL = `${CORPORATE_SERVICE_URL}/api/${CORPORATE_API_VERSION}`;

// ============================================================================
// API METHODS - EMPLOYEE
// ============================================================================

/**
 * Get employee profile
 */
export async function getEmployeeProfile(
  employeeId: string
): Promise<ApiResponse<CorporateEmployee>> {
  try {
    const response = await apiClient.get(`${CORPORATE_BASE_URL}/employee/${employeeId}`);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to get employee profile:', error);
    return { success: false, error: 'Failed to load employee profile' };
  }
}

/**
 * Get employee by email
 */
export async function getEmployeeByEmail(
  email: string
): Promise<ApiResponse<CorporateEmployee>> {
  try {
    const response = await apiClient.get(`${CORPORATE_BASE_URL}/employee/email/${encodeURIComponent(email)}`);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to get employee by email:', error);
    return { success: false, error: 'Failed to load employee profile' };
  }
}

/**
 * Get employee benefits summary
 */
export async function getEmployeeBenefits(
  employeeId: string
): Promise<ApiResponse<EmployeeBenefits>> {
  try {
    const response = await apiClient.get(`${CORPORATE_BASE_URL}/employee/${employeeId}/benefits`);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to get employee benefits:', error);
    return { success: false, error: 'Failed to load benefits' };
  }
}

/**
 * Check benefit eligibility
 */
export async function checkBenefitEligibility(
  employeeId: string,
  benefitType: string
): Promise<ApiResponse<{
  eligible: boolean;
  remaining: number;
  limit: number;
}>> {
  try {
    const response = await apiClient.get(`${CORPORATE_BASE_URL}/employee/${employeeId}/benefits/${benefitType}/eligibility`);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to check eligibility:', error);
    return { success: false, error: 'Failed to check eligibility' };
  }
}

// ============================================================================
// API METHODS - CORPORATE CARDS
// ============================================================================

/**
 * Get corporate card details
 */
export async function getCorporateCard(
  employeeId: string
): Promise<ApiResponse<CorporateCard>> {
  try {
    const response = await apiClient.get(`${CORPORATE_BASE_URL}/employee/${employeeId}/card`);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to get corporate card:', error);
    return { success: false, error: 'Failed to load card details' };
  }
}

/**
 * Block/unblock corporate card
 */
export async function toggleCardStatus(
  employeeId: string,
  cardId: string,
  action: 'block' | 'unblock'
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const response = await apiClient.post(`${CORPORATE_BASE_URL}/employee/${employeeId}/card/${cardId}/${action}`);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to toggle card status:', error);
    return { success: false, error: 'Failed to update card status' };
  }
}

/**
 * Get card transactions
 */
export async function getCardTransactions(
  cardId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ApiResponse<CardTransaction[]>> {
  try {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const response = await apiClient.get(`${CORPORATE_BASE_URL}/card/${cardId}/transactions?${params}`);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to get transactions:', error);
    return { success: false, error: 'Failed to load transactions' };
  }
}

// ============================================================================
// API METHODS - GST INVOICE
// ============================================================================

/**
 * Generate GST invoice
 */
export async function generateGSTInvoice(
  invoiceData: Omit<GSTInvoice, 'invoiceId' | 'invoiceNumber' | 'invoiceDate'>
): Promise<ApiResponse<GSTInvoice>> {
  try {
    const response = await apiClient.post(`${CORPORATE_BASE_URL}/gst/invoice`, invoiceData);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to generate GST invoice:', error);
    return { success: false, error: 'Failed to generate invoice' };
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoice(
  invoiceId: string
): Promise<ApiResponse<GSTInvoice>> {
  try {
    const response = await apiClient.get(`${CORPORATE_BASE_URL}/gst/invoice/${invoiceId}`);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to get invoice:', error);
    return { success: false, error: 'Failed to load invoice' };
  }
}

/**
 * Get e-invoice IRN details
 */
export async function getEinvoiceDetails(
  invoiceId: string
): Promise<ApiResponse<{
  irn: string;
  eInvoiceUrl: string;
  qrCodeUrl: string;
  issuedAt: string;
}>> {
  try {
    const response = await apiClient.get(`${CORPORATE_BASE_URL}/gst/invoice/${invoiceId}/einvoice`);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to get e-invoice details:', error);
    return { success: false, error: 'Failed to load e-invoice details' };
  }
}

/**
 * Download invoice PDF
 */
export async function downloadInvoicePDF(
  invoiceId: string
): Promise<ApiResponse<{ downloadUrl: string }>> {
  try {
    const response = await apiClient.get(`${CORPORATE_BASE_URL}/gst/invoice/${invoiceId}/pdf`);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to download invoice:', error);
    return { success: false, error: 'Failed to download invoice' };
  }
}

/**
 * Get GSTR-2B reconciliation data
 */
export async function getGSTR2BReconciliation(
  period: { month: number; year: number }
): Promise<ApiResponse<{
  period: string;
  totalITC: number;
  matchedInvoices: number;
  unmatchedInvoices: number;
  invoices: Array<{
    invoiceId: string;
    invoiceNumber: string;
    date: string;
    gstin: string;
    taxableValue: number;
    taxAmount: number;
    itcAvailable: number;
    status: 'matched' | 'unmatched' | 'pending';
  }>;
}>> {
  try {
    const response = await apiClient.get(`${CORPORATE_BASE_URL}/gst/gstr2b?month=${period.month}&year=${period.year}`);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to get GSTR2B data:', error);
    return { success: false, error: 'Failed to load GSTR2B data' };
  }
}

// ============================================================================
// API METHODS - TRAVEL BOOKING
// ============================================================================

/**
 * Get travel policy for employee
 */
export async function getTravelPolicy(
  employeeId: string
): Promise<ApiResponse<TravelPolicy>> {
  try {
    const response = await apiClient.get(`${CORPORATE_BASE_URL}/employee/${employeeId}/travel/policy`);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to get travel policy:', error);
    return { success: false, error: 'Failed to load travel policy' };
  }
}

/**
 * Check travel booking eligibility
 */
export async function checkTravelEligibility(
  employeeId: string,
  bookingType: 'flight' | 'hotel' | 'train' | 'cab',
  amount: number
): Promise<ApiResponse<{
  eligible: boolean;
  requiresApproval: boolean;
  approver?: { id: string; name: string; email: string };
  denialReason?: string;
}>> {
  try {
    const response = await apiClient.post(`${CORPORATE_BASE_URL}/employee/${employeeId}/travel/eligibility`, {
      bookingType,
      amount,
    });
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to check travel eligibility:', error);
    return { success: false, error: 'Failed to check eligibility' };
  }
}

/**
 * Request travel approval
 */
export async function requestTravelApproval(
  employeeId: string,
  request: {
    type: 'flight' | 'hotel' | 'train' | 'cab';
    description: string;
    amount: number;
    dates: { start: string; end: string };
    reason: string;
  }
): Promise<ApiResponse<{
  approvalId: string;
  status: 'pending' | 'approved' | 'rejected';
  approver?: { id: string; name: string };
}>> {
  try {
    const response = await apiClient.post(`${CORPORATE_BASE_URL}/employee/${employeeId}/travel/approval`, request);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to request travel approval:', error);
    return { success: false, error: 'Failed to submit approval request' };
  }
}

// ============================================================================
// API METHODS - EXPENSE MANAGEMENT
// ============================================================================

/**
 * Submit expense claim
 */
export async function submitExpenseClaim(
  claim: Omit<ExpenseClaim, 'claimId' | 'status'>
): Promise<ApiResponse<ExpenseClaim>> {
  try {
    const response = await apiClient.post(`${CORPORATE_BASE_URL}/expense/claim`, claim);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to submit expense claim:', error);
    return { success: false, error: 'Failed to submit expense claim' };
  }
}

/**
 * Get expense claims
 */
export async function getExpenseClaims(
  employeeId: string,
  options?: {
    status?: ExpenseClaim['status'];
    limit?: number;
    offset?: number;
  }
): Promise<ApiResponse<ExpenseClaim[]>> {
  try {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const response = await apiClient.get(`${CORPORATE_BASE_URL}/employee/${employeeId}/expenses?${params}`);
    return response;
  } catch (error) {
    logger.error('[CorporateService] Failed to get expense claims:', error);
    return { success: false, error: 'Failed to load expense claims' };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user has corporate account
 */
export async function isCorporateUser(email: string): Promise<boolean> {
  try {
    const response = await getEmployeeByEmail(email);
    return response.success && !!response.data;
  } catch {
    return false;
  }
}

/**
 * Get card spending summary
 */
export function getSpendingSummary(card: CorporateCard): {
  percentageUsed: number;
  remaining: number;
  status: 'healthy' | 'warning' | 'critical';
} {
  const percentageUsed = (card.used / card.limit) * 100;
  return {
    percentageUsed: Math.round(percentageUsed),
    remaining: card.available,
    status: percentageUsed > 90 ? 'critical' : percentageUsed > 75 ? 'warning' : 'healthy',
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const corporateService = {
  // Employee
  getEmployeeProfile,
  getEmployeeByEmail,
  getEmployeeBenefits,
  checkBenefitEligibility,

  // Cards
  getCorporateCard,
  toggleCardStatus,
  getCardTransactions,

  // GST
  generateGSTInvoice,
  getInvoice,
  getEinvoiceDetails,
  downloadInvoicePDF,
  getGSTR2BReconciliation,

  // Travel
  getTravelPolicy,
  checkTravelEligibility,
  requestTravelApproval,

  // Expenses
  submitExpenseClaim,
  getExpenseClaims,

  // Helpers
  isCorporateUser,
  getSpendingSummary,
};

export default corporateService;
