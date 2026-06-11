/**
 * RIDZA Insurance Service
 * Handles insurance quotes, policies, and claims
 */

import {
  InsuranceQuote,
  InsuranceType,
  InsurancePolicy,
  PolicyStatus,
  InsuranceClaim,
  ClaimType,
  ClaimStatus,
  PaymentFrequency,
  Beneficiary,
  Document,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from './types';

// ============================================
// INSURANCE QUOTES
// ============================================

export interface GetQuoteParams {
  customerId: string;
  type: InsuranceType;
  coverageAmount: number;
  tenure: number;
  paymentFrequency?: PaymentFrequency;
  age?: number;
  occupation?: string;
  medicalHistory?: string[];
}

export interface QuoteCalculation {
  basePremium: number;
  riskAdjustment: number;
  coverageLoading: number;
  discount: number;
  finalPremium: number;
  breakdown: {
    mortalityCharge: number;
    adminCharge: number;
    GST: number;
  };
}

export async function getInsuranceQuote(params: GetQuoteParams): Promise<ApiResponse<InsuranceQuote>> {
  const { customerId, type, coverageAmount, tenure, paymentFrequency = PaymentFrequency.YEARLY } = params;

  // Calculate premium based on type and coverage
  const calculation = calculatePremium(type, coverageAmount, tenure, params);

  const quote: InsuranceQuote = {
    id: `QT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    customerId,
    type,
    coverageAmount,
    premium: calculation.finalPremium,
    tenure,
    paymentFrequency,
    inclusions: getInclusions(type),
    exclusions: getExclusions(type),
    waitingPeriod: getWaitingPeriod(type),
    deductible: getDeductible(type),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
  };

  // Store quote for reference
  await storeQuote(quote);

  return {
    success: true,
    data: quote,
    timestamp: new Date().toISOString(),
    requestId: quote.id,
  };
}

function calculatePremium(
  type: InsuranceType,
  coverageAmount: number,
  tenure: number,
  params: GetQuoteParams
): QuoteCalculation {
  const baseRate = getBasePremiumRate(type);
  let basePremium = (coverageAmount * baseRate) / 1000;

  // Age adjustment
  const age = params.age || 30;
  if (age > 50) basePremium *= 1.5;
  else if (age > 40) basePremium *= 1.25;
  else if (age > 30) basePremium *= 1.1;

  // Risk adjustment based on occupation
  if (params.occupation === 'mining' || params.occupation === 'construction') {
    basePremium *= 1.4;
  } else if (params.occupation === 'office') {
    basePremium *= 0.9;
  }

  // Coverage loading
  let coverageLoading = 0;
  if (coverageAmount > 5000000) coverageLoading = basePremium * 0.1;

  // Medical history loading
  let riskAdjustment = 0;
  if (params.medicalHistory && params.medicalHistory.length > 0) {
    riskAdjustment = basePremium * 0.2;
  }

  // Discount for longer tenure
  let discount = 0;
  if (tenure >= 10) discount = basePremium * 0.15;
  else if (tenure >= 5) discount = basePremium * 0.1;

  const subtotal = basePremium + coverageLoading + riskAdjustment - discount;
  const GST = subtotal * 0.18;

  return {
    basePremium: Math.round(basePremium * 100) / 100,
    riskAdjustment: Math.round(riskAdjustment * 100) / 100,
    coverageLoading: Math.round(coverageLoading * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    finalPremium: Math.round((subtotal + GST) * 100) / 100,
    breakdown: {
      mortalityCharge: Math.round((basePremium * 0.6) * 100) / 100,
      adminCharge: Math.round((basePremium * 0.1) * 100) / 100,
      GST: Math.round(GST * 100) / 100,
    },
  };
}

function getBasePremiumRate(type: InsuranceType): number {
  const rates: Record<InsuranceType, number> = {
    [InsuranceType.LIFE]: 2.5,
    [InsuranceType.HEALTH]: 3.0,
    [InsuranceType.MOTOR]: 4.0,
    [InsuranceType.HOME]: 1.5,
    [InsuranceType.TRAVEL]: 0.5,
    [InsuranceType.TERM]: 1.8,
    [InsuranceType.CRITICAL_ILLNESS]: 3.5,
    [InsuranceType.PERSONAL_ACCIDENT]: 2.0,
  };
  return rates[type] || 2.5;
}

function getInclusions(type: InsuranceType): string[] {
  const inclusions: Record<InsuranceType, string[]> = {
    [InsuranceType.LIFE]: [
      'Death benefit',
      'Terminal illness cover',
      'Accidental death benefit',
      'Waiver of premium on disability',
    ],
    [InsuranceType.HEALTH]: [
      'In-patient hospitalization',
      'Day care procedures',
      'Pre and post hospitalization',
      'Ambulance cover',
      'Health checkup',
    ],
    [InsuranceType.MOTOR]: [
      'Third-party liability',
      'Own damage',
      'Personal accident',
      'Zero depreciation',
      'Roadside assistance',
    ],
    [InsuranceType.HOME]: [
      'Fire and allied perils',
      'Burglary cover',
      'Natural disaster cover',
      'Liability cover',
    ],
    [InsuranceType.TRAVEL]: [
      'Medical emergency',
      'Trip cancellation',
      'Baggage loss',
      'Flight delay',
      'Personal liability',
    ],
    [InsuranceType.TERM]: [
      'Death benefit',
      'Critical illness rider',
      'Disability rider',
    ],
    [InsuranceType.CRITICAL_ILLNESS]: [
      'Cancer cover',
      'Heart attack cover',
      'Stroke cover',
      'Kidney failure',
      'Major organ transplant',
    ],
    [InsuranceType.PERSONAL_ACCIDENT]: [
      'Accidental death',
      'Permanent total disablement',
      'Temporary total disablement',
      'Education benefit for children',
    ],
  };
  return inclusions[type] || [];
}

function getExclusions(type: InsuranceType): string[] {
  const exclusions: Record<InsuranceType, string[]> = {
    [InsuranceType.LIFE]: [
      'Suicide within 1 year',
      'Pre-existing diseases',
      'Adventure sports',
      'Alcohol/drug related death',
    ],
    [InsuranceType.HEALTH]: [
      'Pre-existing diseases (first 2 years)',
      'Cosmetic treatments',
      'Dental treatments (unless due to accident)',
      'Self-inflicted injuries',
    ],
    [InsuranceType.MOTOR]: [
      'Driving without license',
      'Intoxicated driving',
      'Wear and tear',
      'Mechanical breakdown',
    ],
    [InsuranceType.HOME]: [
      'War and nuclear risks',
      'Deliberate damage',
      'Normal wear and tear',
    ],
    [InsuranceType.TRAVEL]: [
      'Pre-existing medical conditions',
      'High-risk activities',
      'Travel to restricted countries',
    ],
    [InsuranceType.TERM]: [
      'Suicide within 1 year',
      'Pre-existing diseases',
      'Hazardous activities',
    ],
    [InsuranceType.CRITICAL_ILLNESS]: [
      'Pre-existing conditions',
      'HIV/AIDS',
      'Self-inflicted',
    ],
    [InsuranceType.PERSONAL_ACCIDENT]: [
      'Self-inflicted injuries',
      'Intoxicated state',
      'War and terrorism',
    ],
  };
  return exclusions[type] || [];
}

function getWaitingPeriod(type: InsuranceType): number {
  const periods: Record<InsuranceType, number> = {
    [InsuranceType.LIFE]: 0,
    [InsuranceType.HEALTH]: 30,
    [InsuranceType.MOTOR]: 0,
    [InsuranceType.HOME]: 0,
    [InsuranceType.TRAVEL]: 0,
    [InsuranceType.TERM]: 0,
    [InsuranceType.CRITICAL_ILLNESS]: 90,
    [InsuranceType.PERSONAL_ACCIDENT]: 0,
  };
  return periods[type] || 30;
}

function getDeductible(type: InsuranceType): number {
  const deductibles: Record<InsuranceType, number> = {
    [InsuranceType.LIFE]: 0,
    [InsuranceType.HEALTH]: 5000,
    [InsuranceType.MOTOR]: 10000,
    [InsuranceType.HOME]: 10000,
    [InsuranceType.TRAVEL]: 0,
    [InsuranceType.TERM]: 0,
    [InsuranceType.CRITICAL_ILLNESS]: 0,
    [InsuranceType.PERSONAL_ACCIDENT]: 0,
  };
  return deductibles[type] || 0;
}

// ============================================
// POLICY MANAGEMENT
// ============================================

export interface PurchasePolicyParams {
  customerId: string;
  quoteId: string;
  beneficiary?: Beneficiary;
  paymentMethod: string;
  paymentDetails: {
    cardNumber?: string;
    bankAccount?: string;
    upiId?: string;
  };
}

export async function purchasePolicy(params: PurchasePolicyParams): Promise<ApiResponse<InsurancePolicy>> {
  const { customerId, quoteId, beneficiary, paymentMethod, paymentDetails } = params;

  // Retrieve quote
  const quote = await retrieveQuote(quoteId);
  if (!quote) {
    return { success: false, error: 'Quote not found or expired', timestamp: new Date().toISOString() };
  }

  if (quote.customerId !== customerId) {
    return { success: false, error: 'Quote does not belong to this customer', timestamp: new Date().toISOString() };
  }

  // Process payment via RABTUL
  const paymentResult = await processPayment(quote.premium, paymentMethod, paymentDetails);
  if (!paymentResult.success) {
    return { success: false, error: paymentResult.error, timestamp: new Date().toISOString() };
  }

  // Create policy
  const policy: InsurancePolicy = {
    id: `POL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    customerId,
    type: quote.type,
    quoteId: quote.id,
    coverageAmount: quote.coverageAmount,
    premium: quote.premium,
    tenure: quote.tenure,
    startDate: new Date(),
    endDate: new Date(Date.now() + quote.tenure * 365 * 24 * 60 * 60 * 1000),
    status: PolicyStatus.ACTIVE,
    beneficiary,
    claims: [],
    createdAt: new Date(),
  };

  // Store policy
  await storePolicy(policy);

  // Log event
  await logInsuranceEvent('policy_purchased', policy);

  return {
    success: true,
    data: policy,
    timestamp: new Date().toISOString(),
    requestId: policy.id,
  };
}

export async function getPolicy(policyId: string): Promise<ApiResponse<InsurancePolicy>> {
  const policy = await retrievePolicy(policyId);

  if (!policy) {
    return { success: false, error: 'Policy not found', timestamp: new Date().toISOString() };
  }

  return { success: true, data: policy, timestamp: new Date().toISOString() };
}

export async function getCustomerPolicies(
  customerId: string,
  pagination?: PaginationParams
): Promise<ApiResponse<PaginatedResponse<InsurancePolicy>>> {
  const policies = await retrieveCustomerPolicies(customerId, pagination);

  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const total = policies.length;
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data: {
      data: policies.slice((page - 1) * limit, page * limit),
      pagination: { page, limit, total, totalPages },
    },
    timestamp: new Date().toISOString(),
  };
}

export async function getActivePolicies(customerId: string): Promise<ApiResponse<InsurancePolicy[]>> {
  const allPolicies = await retrieveCustomerPolicies(customerId);
  const activePolicies = allPolicies.filter(p => p.status === PolicyStatus.ACTIVE);

  return { success: true, data: activePolicies, timestamp: new Date().toISOString() };
}

export async function getPolicySummary(customerId: string): Promise<ApiResponse<{
  totalPolicies: number;
  activePolicies: number;
  totalCoverage: number;
  totalPremiumPaid: number;
  pendingClaims: number;
  policies: { type: InsuranceType; count: number; totalCoverage: number }[];
}>> {
  const policies = await retrieveCustomerPolicies(customerId);
  const activePolicies = policies.filter(p => p.status === PolicyStatus.ACTIVE);

  const summary = {
    totalPolicies: policies.length,
    activePolicies: activePolicies.length,
    totalCoverage: policies.reduce((sum, p) => sum + p.coverageAmount, 0),
    totalPremiumPaid: policies.reduce((sum, p) => sum + p.premium, 0),
    pendingClaims: policies.reduce((sum, p) => sum + p.claims.filter(c => c.status === ClaimStatus.SUBMITTED || c.status === ClaimStatus.UNDER_REVIEW).length, 0),
    policies: Object.keys(InsuranceType).map(type => ({
      type: type as InsuranceType,
      count: policies.filter(p => p.type === type).length,
      totalCoverage: policies.filter(p => p.type === type).reduce((sum, p) => sum + p.coverageAmount, 0),
    })),
  };

  return { success: true, data: summary, timestamp: new Date().toISOString() };
}

export async function cancelPolicy(policyId: string, reason: string): Promise<ApiResponse<InsurancePolicy>> {
  const policy = await retrievePolicy(policyId);

  if (!policy) {
    return { success: false, error: 'Policy not found', timestamp: new Date().toISOString() };
  }

  if (policy.status !== PolicyStatus.ACTIVE) {
    return { success: false, error: 'Policy cannot be cancelled in current status', timestamp: new Date().toISOString() };
  }

  policy.status = PolicyStatus.CANCELLED;
  await storePolicy(policy);

  await logInsuranceEvent('policy_cancelled', { policyId, reason });

  return { success: true, data: policy, timestamp: new Date().toISOString() };
}

// ============================================
// CLAIMS MANAGEMENT
// ============================================

export interface SubmitClaimParams {
  policyId: string;
  type: ClaimType;
  amount: number;
  description: string;
  documents: {
    type: string;
    url: string;
  }[];
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
}

export async function submitClaim(params: SubmitClaimParams): Promise<ApiResponse<InsuranceClaim>> {
  const { policyId, type, amount, description, documents, bankDetails } = params;

  // Validate policy
  const policy = await retrievePolicy(policyId);
  if (!policy) {
    return { success: false, error: 'Policy not found', timestamp: new Date().toISOString() };
  }

  if (policy.status !== PolicyStatus.ACTIVE) {
    return { success: false, error: 'Policy is not active', timestamp: new Date().toISOString() };
  }

  // Check if within coverage
  if (amount > policy.coverageAmount) {
    return { success: false, error: 'Claim amount exceeds coverage', timestamp: new Date().toISOString() };
  }

  // Create claim
  const claim: InsuranceClaim = {
    id: `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    policyId,
    type,
    amount,
    status: ClaimStatus.SUBMITTED,
    description,
    documents: documents.map((d, i) => ({
      id: `DOC-${Date.now()}-${i}`,
      type: d.type as Document['type'],
      url: d.url,
      status: 'pending' as Document['status'],
      uploadedAt: new Date(),
    })),
    submittedAt: new Date(),
  };

  // Store claim
  await storeClaim(claim);

  // Update policy with new claim
  policy.claims.push(claim);
  await storePolicy(policy);

  await logInsuranceEvent('claim_submitted', claim);

  // Trigger claim processing
  await processClaim(claim.id);

  return {
    success: true,
    data: claim,
    timestamp: new Date().toISOString(),
    requestId: claim.id,
  };
}

export async function getClaim(claimId: string): Promise<ApiResponse<InsuranceClaim>> {
  const claim = await retrieveClaim(claimId);

  if (!claim) {
    return { success: false, error: 'Claim not found', timestamp: new Date().toISOString() };
  }

  return { success: true, data: claim, timestamp: new Date().toISOString() };
}

export async function getCustomerClaims(
  customerId: string,
  status?: ClaimStatus
): Promise<ApiResponse<InsuranceClaim[]>> {
  const policies = await retrieveCustomerPolicies(customerId);
  let claims: InsuranceClaim[] = [];

  policies.forEach(policy => {
    const filteredClaims = status
      ? policy.claims.filter(c => c.status === status)
      : policy.claims;
    claims.push(...filteredClaims);
  });

  // Sort by submission date
  claims.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

  return { success: true, data: claims, timestamp: new Date().toISOString() };
}

export async function updateClaimStatus(
  claimId: string,
  status: ClaimStatus,
  resolution?: string
): Promise<ApiResponse<InsuranceClaim>> {
  const claim = await retrieveClaim(claimId);

  if (!claim) {
    return { success: false, error: 'Claim not found', timestamp: new Date().toISOString() };
  }

  claim.status = status;
  if (resolution) claim.resolution = resolution;
  if (status === ClaimStatus.APPROVED || status === ClaimStatus.REJECTED) {
    claim.resolvedAt = new Date();
  }

  await storeClaim(claim);

  await logInsuranceEvent('claim_status_updated', { claimId, status, resolution });

  // If approved, process payout
  if (status === ClaimStatus.APPROVED) {
    await processClaimPayout(claim);
  }

  return { success: true, data: claim, timestamp: new Date().toISOString() };
}

async function processClaimPayout(claim: InsuranceClaim): Promise<void> {
  // Integrate with RABTUL for payout
  console.log(`[Insurance] Processing claim payout ${claim.id} for ${claim.amount}`);
}

async function processClaim(claimId: string): Promise<void> {
  // Simulated async claim processing
  console.log(`[Insurance] Processing claim ${claimId}`);
}

// ============================================
// PREMIUM CALCULATOR
// ============================================

export async function calculatePremiumBreakdown(
  type: InsuranceType,
  coverageAmount: number,
  age: number,
  tenure: number
): Promise<ApiResponse<QuoteCalculation>> {
  const calculation = calculatePremium(type, coverageAmount, tenure, { age });
  return { success: true, data: calculation, timestamp: new Date().toISOString() };
}

export async function compareQuotes(
  quotes: InsuranceQuote[]
): Promise<ApiResponse<{
  bestValue: InsuranceQuote;
  cheapest: InsuranceQuote;
  highestCoverage: InsuranceQuote;
}>> {
  const sortedByPremium = [...quotes].sort((a, b) => a.premium - b.premium);
  const sortedByCoverage = [...quotes].sort((a, b) => b.coverageAmount - a.coverageAmount);

  // Best value = highest coverage/premium ratio
  const bestValue = quotes.reduce((best, current) => {
    const currentRatio = current.coverageAmount / current.premium;
    const bestRatio = best.coverageAmount / best.premium;
    return currentRatio > bestRatio ? current : best;
  });

  return {
    success: true,
    data: {
      bestValue,
      cheapest: sortedByPremium[0],
      highestCoverage: sortedByCoverage[0],
    },
    timestamp: new Date().toISOString(),
  };
}

// ============================================
// RENEWAL MANAGEMENT
// ============================================

export async function getRenewalQuote(policyId: string): Promise<ApiResponse<InsuranceQuote>> {
  const policy = await retrievePolicy(policyId);

  if (!policy) {
    return { success: false, error: 'Policy not found', timestamp: new Date().toISOString() };
  }

  // Generate renewal quote with possible loadings
  const quote = await getInsuranceQuote({
    customerId: policy.customerId,
    type: policy.type,
    coverageAmount: policy.coverageAmount,
    tenure: policy.tenure,
    age: 30 + Math.floor((Date.now() - new Date('1990-01-01').getTime()) / (365 * 24 * 60 * 60 * 1000)),
  });

  // Add renewal discount
  if (quote.data) {
    quote.data.premium *= 0.95; // 5% loyalty discount
    quote.data.id = `QT-REN-${Date.now()}`;
  }

  return quote;
}

export async function renewPolicy(policyId: string, paymentMethod: string): Promise<ApiResponse<InsurancePolicy>> {
  const currentPolicy = await retrievePolicy(policyId);

  if (!currentPolicy) {
    return { success: false, error: 'Policy not found', timestamp: new Date().toISOString() };
  }

  // Get renewal quote
  const quoteResponse = await getRenewalQuote(policyId);
  if (!quoteResponse.success || !quoteResponse.data) {
    return { success: false, error: 'Could not generate renewal quote', timestamp: new Date().toISOString() };
  }

  // Create new policy
  const newPolicy: InsurancePolicy = {
    id: `POL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    customerId: currentPolicy.customerId,
    type: currentPolicy.type,
    quoteId: quoteResponse.data.id,
    coverageAmount: currentPolicy.coverageAmount,
    premium: quoteResponse.data.premium,
    tenure: currentPolicy.tenure,
    startDate: currentPolicy.endDate,
    endDate: new Date(currentPolicy.endDate.getTime() + currentPolicy.tenure * 365 * 24 * 60 * 60 * 1000),
    status: PolicyStatus.ACTIVE,
    beneficiary: currentPolicy.beneficiary,
    claims: [],
    createdAt: new Date(),
  };

  await storePolicy(newPolicy);

  await logInsuranceEvent('policy_renewed', { oldPolicyId: policyId, newPolicyId: newPolicy.id });

  return {
    success: true,
    data: newPolicy,
    timestamp: new Date().toISOString(),
    requestId: newPolicy.id,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function storeQuote(quote: InsuranceQuote): Promise<void> {
  console.log(`[Insurance] Stored quote ${quote.id}`);
}

async function retrieveQuote(quoteId: string): Promise<InsuranceQuote | null> {
  // In production, retrieve from database
  return null;
}

async function storePolicy(policy: InsurancePolicy): Promise<void> {
  console.log(`[Insurance] Stored policy ${policy.id}`);
}

async function retrievePolicy(policyId: string): Promise<InsurancePolicy | null> {
  // In production, retrieve from database
  return null;
}

async function retrieveCustomerPolicies(
  customerId: string,
  pagination?: PaginationParams
): Promise<InsurancePolicy[]> {
  // In production, retrieve from database
  return [];
}

async function storeClaim(claim: InsuranceClaim): Promise<void> {
  console.log(`[Insurance] Stored claim ${claim.id}`);
}

async function retrieveClaim(claimId: string): Promise<InsuranceClaim | null> {
  // In production, retrieve from database
  return null;
}

async function processPayment(
  amount: number,
  method: string,
  details: unknown
): Promise<{ success: boolean; error?: string }> {
  // In production, integrate with RABTUL payment service
  console.log(`[Insurance] Processing payment of ${amount} via ${method}`);
  return { success: true };
}

async function logInsuranceEvent(event: string, data: unknown): Promise<void> {
  console.log(`[Insurance Event] ${event}:`, data);
}