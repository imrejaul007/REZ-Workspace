/**
 * RIDZA Credit Service
 * Handles all credit/loan operations, EMI calculations, and credit scoring
 */

import {
  CreditApplication,
  CreditType,
  CreditStatus,
  LoanCalculation,
  LoanType,
  AmortizationEntry,
  CreditScore,
  CreditRating,
  ScoreFactor,
  ScoreHistory,
  CustomerFinancialProfile,
  LoanDisbursement,
  DisbursementMethod,
  DisbursementStatus,
  ApiResponse,
} from './types';

// ============================================
// CREDIT APPLICATION
// ============================================

export interface ApplyForCreditParams {
  customerId: string;
  type: CreditType;
  amount: number;
  term: number;
  purpose: string;
  employmentStatus?: string;
  monthlyIncome?: number;
  existingEMIs?: number;
}

export interface CreditEligibilityResult {
  eligible: boolean;
  eligibilityScore: number;
  maxAmount: number;
  suggestedRate: number;
  reasons: string[];
}

export async function applyForCredit(params: ApplyForCreditParams): Promise<ApiResponse<CreditApplication>> {
  const { customerId, type, amount, term, purpose } = params;

  // Validate customer
  const profile = await getCustomerFinancialProfile(customerId);
  if (!profile) {
    return { success: false, error: 'Customer not found', timestamp: new Date().toISOString() };
  }

  // Calculate eligibility
  const eligibility = await calculateEligibility(profile, amount, term);

  if (!eligibility.eligible && eligibility.eligibilityScore < 30) {
    return { success: false, error: 'Insufficient eligibility for credit', timestamp: new Date().toISOString() };
  }

  // Create application
  const application: CreditApplication = {
    id: `CRD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    customerId,
    type,
    amount: Math.min(amount, eligibility.maxAmount),
    term,
    purpose,
    interestRate: eligibility.suggestedRate,
    status: CreditStatus.PENDING,
    eligibilityScore: eligibility.eligibilityScore,
    documents: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Store in memory (simulated database)
  await storeCreditApplication(application);

  // Log to event bus
  await logCreditEvent('application_created', application);

  return {
    success: true,
    data: application,
    timestamp: new Date().toISOString(),
    requestId: application.id,
  };
}

export async function getCreditApplication(applicationId: string): Promise<ApiResponse<CreditApplication>> {
  const application = await retrieveCreditApplication(applicationId);

  if (!application) {
    return { success: false, error: 'Application not found', timestamp: new Date().toISOString() };
  }

  return { success: true, data: application, timestamp: new Date().toISOString() };
}

export async function getCustomerCreditApplications(customerId: string): Promise<ApiResponse<CreditApplication[]>> {
  const applications = await retrieveCustomerApplications(customerId);

  return { success: true, data: applications, timestamp: new Date().toISOString() };
}

export async function updateCreditStatus(
  applicationId: string,
  status: CreditStatus
): Promise<ApiResponse<CreditApplication>> {
  const application = await retrieveCreditApplication(applicationId);

  if (!application) {
    return { success: false, error: 'Application not found', timestamp: new Date().toISOString() };
  }

  application.status = status;
  application.updatedAt = new Date();

  await storeCreditApplication(application);
  await logCreditEvent('status_updated', { applicationId, status });

  return { success: true, data: application, timestamp: new Date().toISOString() };
}

export async function approveCreditApplication(
  applicationId: string,
  approvedAmount?: number,
  approvedRate?: number
): Promise<ApiResponse<CreditApplication>> {
  const application = await retrieveCreditApplication(applicationId);

  if (!application) {
    return { success: false, error: 'Application not found', timestamp: new Date().toISOString() };
  }

  if (application.status !== CreditStatus.PENDING && application.status !== CreditStatus.UNDER_REVIEW) {
    return { success: false, error: 'Application cannot be approved in current status', timestamp: new Date().toISOString() };
  }

  // Update application
  application.status = CreditStatus.APPROVED;
  application.amount = approvedAmount || application.amount;
  application.interestRate = approvedRate || application.interestRate;
  application.updatedAt = new Date();

  await storeCreditApplication(application);

  // Log approval event
  await logCreditEvent('application_approved', application);

  return { success: true, data: application, timestamp: new Date().toISOString() };
}

export async function rejectCreditApplication(
  applicationId: string,
  reason: string
): Promise<ApiResponse<CreditApplication>> {
  const application = await retrieveCreditApplication(applicationId);

  if (!application) {
    return { success: false, error: 'Application not found', timestamp: new Date().toISOString() };
  }

  application.status = CreditStatus.REJECTED;
  application.updatedAt = new Date();

  await storeCreditApplication(application);

  // Update credit score negatively
  await updateCreditScore(application.customerId, -15, `Application rejected: ${reason}`);

  // Log rejection event
  await logCreditEvent('application_rejected', { applicationId, reason });

  return { success: true, data: application, timestamp: new Date().toISOString() };
}

// ============================================
// LOAN CALCULATIONS
// ============================================

export async function calculateLoan(params: {
  principal: number;
  rate: number;
  term: number;
  type: LoanType;
}): Promise<ApiResponse<LoanCalculation>> {
  const { principal, rate, term, type } = params;

  let calculation: LoanCalculation;

  switch (type) {
    case LoanType.REDUCING_BALANCE:
      calculation = calculateReducingBalanceLoan(principal, rate, term);
      break;
    case LoanType.FLAT_RATE:
      calculation = calculateFlatRateLoan(principal, rate, term);
      break;
    case LoanType.BULLET:
      calculation = calculateBulletLoan(principal, rate, term);
      break;
    default:
      calculation = calculateReducingBalanceLoan(principal, rate, term);
  }

  return { success: true, data: calculation, timestamp: new Date().toISOString() };
}

function calculateReducingBalanceLoan(principal: number, annualRate: number, termMonths: number): LoanCalculation {
  const monthlyRate = annualRate / 12 / 100;

  // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
  const emi = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
              (Math.pow(1 + monthlyRate, termMonths) - 1);

  const totalPayment = emi * termMonths;
  const totalInterest = totalPayment - principal;

  const schedule = generateAmortizationSchedule(principal, monthlyRate, emi, termMonths);

  return {
    principal,
    interestRate: annualRate,
    termMonths,
    type: LoanType.REDUCING_BALANCE,
    monthlyEMI: Math.round(emi * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    amortizationSchedule: schedule,
  };
}

function calculateFlatRateLoan(principal: number, annualRate: number, termMonths: number): LoanCalculation {
  const totalInterest = (principal * annualRate * termMonths) / (12 * 100);
  const totalPayment = principal + totalInterest;
  const emi = totalPayment / termMonths;

  const schedule: AmortizationEntry[] = [];
  let balance = principal;

  for (let month = 1; month <= termMonths; month++) {
    const principalPortion = principal / termMonths;
    const interestPortion = totalInterest / termMonths;

    balance -= principalPortion;

    schedule.push({
      month,
      openingBalance: Math.round((balance + principalPortion) * 100) / 100,
      emi: Math.round(emi * 100) / 100,
      principal: Math.round(principalPortion * 100) / 100,
      interest: Math.round(interestPortion * 100) / 100,
      closingBalance: Math.round(Math.max(0, balance) * 100) / 100,
    });
  }

  return {
    principal,
    interestRate: annualRate,
    termMonths,
    type: LoanType.FLAT_RATE,
    monthlyEMI: Math.round(emi * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    amortizationSchedule: schedule,
  };
}

function calculateBulletLoan(principal: number, annualRate: number, termMonths: number): LoanCalculation {
  const monthlyInterest = (principal * annualRate) / (12 * 100);

  const schedule: AmortizationEntry[] = [];
  let balance = principal;

  // Interest-only payments
  for (let month = 1; month < termMonths; month++) {
    schedule.push({
      month,
      openingBalance: balance,
      emi: Math.round(monthlyInterest * 100) / 100,
      principal: 0,
      interest: Math.round(monthlyInterest * 100) / 100,
      closingBalance: balance,
    });
  }

  // Final payment with principal
  schedule.push({
    month: termMonths,
    openingBalance: balance,
    emi: Math.round((principal + monthlyInterest) * 100) / 100,
    principal: principal,
    interest: Math.round(monthlyInterest * 100) / 100,
    closingBalance: 0,
  });

  const totalInterest = monthlyInterest * (termMonths - 1) + monthlyInterest;

  return {
    principal,
    interestRate: annualRate,
    termMonths,
    type: LoanType.BULLET,
    monthlyEMI: Math.round(monthlyInterest * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayment: Math.round((principal + totalInterest) * 100) / 100,
    amortizationSchedule: schedule,
  };
}

function generateAmortizationSchedule(
  principal: number,
  monthlyRate: number,
  emi: number,
  termMonths: number
): AmortizationEntry[] {
  const schedule: AmortizationEntry[] = [];
  let balance = principal;

  for (let month = 1; month <= termMonths; month++) {
    const interest = balance * monthlyRate;
    const principalPortion = emi - interest;
    balance -= principalPortion;

    schedule.push({
      month,
      openingBalance: Math.round((balance + principalPortion) * 100) / 100,
      emi: Math.round(emi * 100) / 100,
      principal: Math.round(principalPortion * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      closingBalance: Math.round(Math.max(0, balance) * 100) / 100,
    });
  }

  return schedule;
}

export async function calculateEMI(
  principal: number,
  annualRate: number,
  termMonths: number
): Promise<ApiResponse<{ emi: number; totalInterest: number; totalPayment: number }>> {
  const monthlyRate = annualRate / 12 / 100;

  const emi = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
              (Math.pow(1 + monthlyRate, termMonths) - 1);

  const totalPayment = emi * termMonths;
  const totalInterest = totalPayment - principal;

  return {
    success: true,
    data: {
      emi: Math.round(emi * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
    },
    timestamp: new Date().toISOString(),
  };
}

export async function calculateAffordability(
  monthlyIncome: number,
  existingEMIs: number,
  maxDTI: number = 50
): Promise<ApiResponse<{ maxEMI: number; maxLoanAmount: number; availableEMI: number }>> {
  const maxTotalEMI = (monthlyIncome * maxDTI) / 100;
  const availableEMI = Math.max(0, maxTotalEMI - existingEMIs);

  // Assuming 12% annual rate and 5-year term
  const rate = 12;
  const term = 60;
  const monthlyRate = rate / 12 / 100;
  const maxLoan = availableEMI * ((Math.pow(1 + monthlyRate, term) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, term)));

  return {
    success: true,
    data: {
      maxEMI: Math.round(maxTotalEMI * 100) / 100,
      maxLoanAmount: Math.round(maxLoan * 100) / 100,
      availableEMI: Math.round(availableEMI * 100) / 100,
    },
    timestamp: new Date().toISOString(),
  };
}

// ============================================
// CREDIT SCORING
// ============================================

export async function getCreditScore(customerId: string): Promise<ApiResponse<CreditScore>> {
  // Simulated credit score calculation
  const baseScore = 600 + Math.floor(Math.random() * 200);

  const factors: ScoreFactor[] = [
    { name: 'Payment History', impact: 'positive', weight: 35, description: 'On-time payment record' },
    { name: 'Credit Utilization', impact: 'positive', weight: 30, description: 'Low credit card utilization' },
    { name: 'Credit History Length', impact: 'positive', weight: 15, description: 'Long-standing accounts' },
    { name: 'Credit Mix', impact: 'neutral', weight: 10, description: 'Variety of credit products' },
    { name: 'New Credit', impact: 'negative', weight: 10, description: 'Recent credit inquiries' },
  ];

  const rating = getCreditRating(baseScore);

  const score: CreditScore = {
    customerId,
    score: baseScore,
    rating,
    factors,
    lastUpdated: new Date(),
    history: [
      { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), score: baseScore - 5, change: -5, reason: 'New inquiry' },
      { date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), score: baseScore + 10, change: 10, reason: 'Payment received' },
    ],
  };

  return { success: true, data: score, timestamp: new Date().toISOString() };
}

function getCreditRating(score: number): CreditRating {
  if (score >= 800) return CreditRating.EXCELLENT;
  if (score >= 700) return CreditRating.GOOD;
  if (score >= 650) return CreditRating.FAIR;
  if (score >= 550) return CreditRating.POOR;
  return CreditRating.VERY_POOR;
}

async function updateCreditScore(customerId: string, change: number, reason: string): Promise<void> {
  // In production, this would update the credit score database
  console.log([CreditScore] ${customerId}: ${change > 0 ? '+' : ''}${change} - ${reason}`);
}

export async function getCreditReport(customerId: string): Promise<ApiResponse<{
  score: CreditScore;
  activeLoans: number;
  totalOutstanding: number;
  paymentHistory: { onTime: number; late: number; missed: number };
  creditUtilization: number;
}>> {
  const scoreResponse = await getCreditScore(customerId);

  const report = {
    score: scoreResponse.data!,
    activeLoans: Math.floor(Math.random() * 5),
    totalOutstanding: Math.floor(Math.random() * 500000),
    paymentHistory: {
      onTime: 85 + Math.floor(Math.random() * 15),
      late: Math.floor(Math.random() * 10),
      missed: Math.floor(Math.random() * 5),
    },
    creditUtilization: 20 + Math.floor(Math.random() * 40),
  };

  return { success: true, data: report, timestamp: new Date().toISOString() };
}

// ============================================
// DISBURSEMENT
// ============================================

export async function disburseLoan(
  applicationId: string,
  method: DisbursementMethod,
  accountDetails: { bankName: string; accountNumber: string; ifscCode: string; accountHolder: string }
): Promise<ApiResponse<LoanDisbursement>> {
  const application = await retrieveCreditApplication(applicationId);

  if (!application) {
    return { success: false, error: 'Application not found', timestamp: new Date().toISOString() };
  }

  if (application.status !== CreditStatus.APPROVED) {
    return { success: false, error: 'Loan not approved for disbursement', timestamp: new Date().toISOString() };
  }

  const disbursement: LoanDisbursement = {
    id: `DIS-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    applicationId,
    amount: application.amount,
    method,
    accountDetails,
    status: DisbursementStatus.PROCESSING,
  };

  // Process disbursement (in production, integrate with RABTUL payment service)
  await processDisbursement(disbursement);

  // Update application status
  application.status = CreditStatus.DISBURSED;
  application.updatedAt = new Date();
  await storeCreditApplication(application);

  return { success: true, data: disbursement, timestamp: new Date().toISOString() };
}

async function processDisbursement(disbursement: LoanDisbursement): Promise<void> {
  // Simulated processing - in production, call RABTUL payment service
  console.log([Disbursement] Processing ${disbursement.amount} to ${disbursement.accountDetails.accountNumber}`);

  // Simulate async processing
  setTimeout(async () => {
    disbursement.status = DisbursementStatus.COMPLETED;
    disbursement.processedAt = new Date();
    await logCreditEvent('disbursement_completed', disbursement);
  }, 1000);
}

// ============================================
// ELIGIBILITY CALCULATION
// ============================================

async function calculateEligibility(
  profile: CustomerFinancialProfile,
  requestedAmount: number,
  termMonths: number
): Promise<CreditEligibilityResult> {
  let score = 0;
  const reasons: string[] = [];

  // Income factor
  const monthlyEMI = (requestedAmount * 12 * 0.15) / 12; // Simplified rate
  const debtToIncome = (profile.existingLoans + monthlyEMI) / profile.monthlyIncome;

  if (debtToIncome <= 0.3) {
    score += 40;
    reasons.push('Healthy debt-to-income ratio');
  } else if (debtToIncome <= 0.5) {
    score += 20;
    reasons.push('Acceptable debt-to-income ratio');
  } else {
    score -= 20;
    reasons.push('High debt-to-income ratio');
  }

  // Credit score factor
  if (profile.creditScore >= 750) {
    score += 30;
    reasons.push('Excellent credit score');
  } else if (profile.creditScore >= 650) {
    score += 15;
    reasons.push('Good credit score');
  } else if (profile.creditScore >= 550) {
    score += 5;
    reasons.push('Fair credit score');
  } else {
    score -= 30;
    reasons.push('Poor credit score');
  }

  // Employment factor
  if (profile.employmentStatus === 'employed') {
    score += 20;
    reasons.push('Stable employment');
  } else if (profile.employmentStatus === 'self_employed') {
    score += 10;
    reasons.push('Self-employed with income');
  }

  // Calculate max amount
  const maxAmount = profile.monthlyIncome * 12 * (score / 100);

  return {
    eligible: score >= 40,
    eligibilityScore: Math.max(0, Math.min(100, score)),
    maxAmount: Math.round(maxAmount),
    suggestedRate: 12 + (100 - score) * 0.1,
    reasons,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getCustomerFinancialProfile(customerId: string): Promise<CustomerFinancialProfile | null> {
  // Simulated profile - in production, fetch from RABTUL or database
  return {
    customerId,
    monthlyIncome: 50000 + Math.random() * 100000,
    monthlyExpenses: 20000 + Math.random() * 30000,
    existingLoans: Math.random() * 100000,
    creditScore: 600 + Math.random() * 200,
    debtToIncomeRatio: 0.2 + Math.random() * 0.3,
    employmentStatus: 'employed',
    employmentHistory: [],
  };
}

async function storeCreditApplication(application: CreditApplication): Promise<void> {
  // In production, store in database
  console.log([Credit] Stored application ${application.id}`);
}

async function retrieveCreditApplication(applicationId: string): Promise<CreditApplication | null> {
  // In production, retrieve from database
  return null;
}

async function retrieveCustomerApplications(customerId: string): Promise<CreditApplication[]> {
  // In production, retrieve from database
  return [];
}

async function logCreditEvent(event: string, data: unknown): Promise<void> {
  console.log([Credit Event] ${event}:`, data);
  // In production, send to event bus
}