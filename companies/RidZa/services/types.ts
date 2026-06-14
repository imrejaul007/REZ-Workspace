/**
 * RIDZA Financial Services - Type Definitions
 * Credit, Insurance, Lending, Islamic Finance, Remittance
 */

// ============================================
// CORE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// CUSTOMER & KYC TYPES
// ============================================

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: KYCStatus;
  riskScore: number;
  trustScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum KYCStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface CustomerFinancialProfile {
  customerId: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  existingLoans: number;
  creditScore: number;
  debtToIncomeRatio: number;
  employmentStatus: EmploymentStatus;
  employmentHistory: EmploymentRecord[];
}

export enum EmploymentStatus {
  EMPLOYED = 'employed',
  SELF_EMPLOYED = 'self_employed',
  BUSINESS_OWNER = 'business_owner',
  UNEMPLOYED = 'unemployed',
  RETIRED = 'retired',
}

export interface EmploymentRecord {
  employer: string;
  designation: string;
  startDate: Date;
  endDate?: Date;
  monthlyIncome: number;
}

// ============================================
// CREDIT & LOAN TYPES
// ============================================

export interface CreditApplication {
  id: string;
  customerId: string;
  type: CreditType;
  amount: number;
  term: number;
  purpose: string;
  interestRate: number;
  status: CreditStatus;
  eligibilityScore: number;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export enum CreditType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  HOME = 'home',
  EDUCATION = 'education',
  VEHICLE = 'vehicle',
  MEDICAL = 'medical',
}

export enum CreditStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
  DEFAULTED = 'defaulted',
  CLOSED = 'closed',
}

export interface LoanCalculation {
  principal: number;
  interestRate: number;
  termMonths: number;
  type: LoanType;
  monthlyEMI: number;
  totalInterest: number;
  totalPayment: number;
  amortizationSchedule: AmortizationEntry[];
}

export enum LoanType {
  REDUCING_BALANCE = 'reducing_balance',
  FLAT_RATE = 'flat_rate',
  BULLET = 'bullet',
}

export interface AmortizationEntry {
  month: number;
  openingBalance: number;
  emi: number;
  principal: number;
  interest: number;
  closingBalance: number;
}

export interface CreditScore {
  customerId: string;
  score: number;
  rating: CreditRating;
  factors: ScoreFactor[];
  lastUpdated: Date;
  history: ScoreHistory[];
}

export enum CreditRating {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  VERY_POOR = 'very_poor',
}

export interface ScoreFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface ScoreHistory {
  date: Date;
  score: number;
  change: number;
  reason: string;
}

export interface LoanDisbursement {
  id: string;
  applicationId: string;
  amount: number;
  method: DisbursementMethod;
  accountDetails: AccountDetails;
  status: DisbursementStatus;
  processedAt?: Date;
}

export enum DisbursementMethod {
  BANK_TRANSFER = 'bank_transfer',
  UPI = 'upi',
  WALLET = 'wallet',
  CASH = 'cash',
}

export enum DisbursementStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface AccountDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
}

// ============================================
// INSURANCE TYPES
// ============================================

export interface InsuranceQuote {
  id: string;
  customerId: string;
  type: InsuranceType;
  coverageAmount: number;
  premium: number;
  tenure: number;
  paymentFrequency: PaymentFrequency;
  inclusions: string[];
  exclusions: string[];
  waitingPeriod: number;
  deductible: number;
  validUntil: Date;
}

export enum InsuranceType {
  LIFE = 'life',
  HEALTH = 'health',
  MOTOR = 'motor',
  HOME = 'home',
  TRAVEL = 'travel',
  TERM = 'term',
  CRITICAL_ILLNESS = 'critical_illness',
  PERSONAL_ACCIDENT = 'personal_accident',
}

export enum PaymentFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  HALF_YEARLY = 'half_yearly',
  YEARLY = 'yearly',
}

export interface InsurancePolicy {
  id: string;
  customerId: string;
  type: InsuranceType;
  quoteId: string;
  coverageAmount: number;
  premium: number;
  tenure: number;
  startDate: Date;
  endDate: Date;
  status: PolicyStatus;
  beneficiary?: Beneficiary;
  claims: InsuranceClaim[];
  createdAt: Date;
}

export enum PolicyStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
  CLAIMED = 'claimed',
}

export interface Beneficiary {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  sharePercentage: number;
}

export interface InsuranceClaim {
  id: string;
  policyId: string;
  type: ClaimType;
  amount: number;
  status: ClaimStatus;
  description: string;
  documents: Document[];
  submittedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export enum ClaimType {
  DEATH = 'death',
  DISABILITY = 'disability',
  MEDICAL = 'medical',
  ACCIDENT = 'accident',
  THEFT = 'theft',
  DAMAGE = 'damage',
}

export enum ClaimStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PENDING_DOCS = 'pending_docs',
}

export interface Document {
  id: string;
  type: DocumentType;
  url: string;
  status: DocumentStatus;
  uploadedAt: Date;
  verifiedAt?: Date;
}

export enum DocumentType {
  ID_PROOF = 'id_proof',
  ADDRESS_PROOF = 'address_proof',
  INCOME_PROOF = 'income_proof',
  BANK_STATEMENT = 'bank_statement',
  MEDICAL_REPORT = 'medical_report',
  VEHICLE_REGISTRATION = 'vehicle_registration',
}

export enum DocumentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

// ============================================
// BNPL (BUY NOW PAY LATER) TYPES
// ============================================

export interface BNPLTransaction {
  id: string;
  customerId: string;
  merchantId: string;
  amount: number;
  tenure: number;
  installments: BNPLInstallment[];
  interestRate: number;
  processingFee: number;
  status: BNPLStatus;
  createdAt: Date;
}

export enum BNPLStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DEFAULTED = 'defaulted',
}

export interface BNPLInstallment {
  number: number;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: InstallmentStatus;
  penalty?: number;
}

export enum InstallmentStatus {
  PENDING = 'pending',
  DUE = 'due',
  PAID = 'paid',
  OVERDUE = 'overdue',
  DEFAULTED = 'defaulted',
}

export interface BNPLCheckout {
  merchantId: string;
  customerId: string;
  amount: number;
  tenure: number;
  merchantName: string;
  productDescription?: string;
}

export interface BNPLApproval {
  transactionId: string;
  approved: boolean;
  creditLimit: number;
  usedLimit: number;
  availableLimit: number;
  interestRate: number;
  processingFee: number;
  reason?: string;
}

// ============================================
// ISLAMIC FINANCE TYPES
// ============================================

export interface IslamicProduct {
  id: string;
  type: IslamicProductType;
  name: string;
  description: string;
  profitRate: number;
  tenure: number;
  minAmount: number;
  maxAmount: number;
  isShariaCompliant: boolean;
  certification?: string;
}

export enum IslamicProductType {
  MURABAHA = 'murabaha',
  IJARA = 'ijara',
  MUDARABAH = 'mudarabah',
  MUSHARAKAH = 'musharakah',
  Salam = 'salam',
  Istisna = 'istisna',
}

export interface ZakatCalculation {
  customerId: string;
  totalWealth: number;
  liabilities: number;
  nisabThreshold: number;
  eligibleAmount: number;
  zakatRate: number;
  calculatedZakat: number;
  calculationDate: Date;
  breakdown: ZakatBreakdown;
}

export interface ZakatBreakdown {
  cashAssets: number;
  goldSilverAssets: number;
  stockAssets: number;
  businessAssets: number;
  realEstateAssets: number;
  otherAssets: number;
  shortTermLiabilities: number;
  longTermLiabilities: number;
}

export interface IslamicFinanceApplication {
  id: string;
  customerId: string;
  productType: IslamicProductType;
  amount: number;
  tenure: number;
  purpose: string;
  status: IslamicApplicationStatus;
  shariaComplianceCheck: ShariaComplianceResult;
  createdAt: Date;
}

export enum IslamicApplicationStatus {
  PENDING = 'pending',
  SHARIA_REVIEW = 'sharia_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
}

export interface ShariaComplianceResult {
  isCompliant: boolean;
  issues?: string[];
  certificationLevel: 'standard' | 'premium' | 'premium_plus';
  approvedBy?: string;
  approvedAt?: Date;
}

export interface IslamicPaymentSchedule {
  transactionId: string;
  schedule: IslamicPaymentEntry[];
  totalProfit: number;
  totalPayment: number;
}

export interface IslamicPaymentEntry {
  number: number;
  date: Date;
  principal: number;
  profit: number;
  total: number;
  remainingBalance: number;
}

// ============================================
// REMITTANCE TYPES
// ============================================

export interface RemittanceRequest {
  id: string;
  senderId: string;
  recipientId: string;
  amount: number;
  currency: string;
  targetCurrency: string;
  exchangeRate: number;
  fees: RemittanceFees;
  amountInTargetCurrency: number;
  purpose: string;
  status: RemittanceStatus;
  createdAt: Date;
}

export enum RemittanceStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  PROCESSING = 'processing',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface RemittanceFees {
  transferFee: number;
  exchangeMargin: number;
  totalFees: number;
}

export interface Recipient {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  swiftCode: string;
  country: string;
  phone: string;
  email: string;
}

export interface RemittanceTracking {
  id: string;
  transactionId: string;
  status: RemittanceStatus;
  currentLocation?: string;
  estimatedDelivery?: Date;
  history: TrackingEvent[];
}

export interface TrackingEvent {
  timestamp: Date;
  status: RemittanceStatus;
  location?: string;
  description: string;
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  validUntil: Date;
  source: string;
}

// ============================================
// AGENT PORTAL TYPES
// ============================================

export interface FinancialAdvisor {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  specialization: FinancialSpecialization[];
  assignedCustomers: string[];
  totalClients: number;
  activeLoans: number;
  totalPortfolio: number;
  commissionEarned: number;
  status: AdvisorStatus;
  rating: number;
  reviews: AdvisorReview[];
}

export enum FinancialSpecialization {
  CREDIT = 'credit',
  INSURANCE = 'insurance',
  INVESTMENT = 'investment',
  RETIREMENT = 'retirement',
  TAX = 'tax',
  ESTATE = 'estate',
  ISLAMIC_FINANCE = 'islamic_finance',
}

export enum AdvisorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval',
}

export interface AdvisorReview {
  customerId: string;
  rating: number;
  comment: string;
  date: Date;
}

export interface AdvisorCommission {
  id: string;
  advisorId: string;
  transactionId: string;
  productType: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
  paidAt?: Date;
}

export enum CommissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  REJECTED = 'rejected',
}

// ============================================
// DASHBOARD & ANALYTICS TYPES
// ============================================

export interface FinancialDashboard {
  customerId: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  creditScore: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  activeProducts: ProductSummary[];
  upcomingPayments: PaymentReminder[];
  financialHealth: HealthScore;
}

export interface ProductSummary {
  type: string;
  productId: string;
  productName: string;
  balance: number;
  limit?: number;
  status: string;
  nextPayment?: Date;
}

export interface PaymentReminder {
  productId: string;
  productName: string;
  amount: number;
  dueDate: Date;
  daysUntilDue: number;
}

export interface HealthScore {
  overall: number;
  credit: number;
  savings: number;
  investments: number;
  insurance: number;
  retirement: number;
}

export interface AnalyticsData {
  period: string;
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  loanRepayments: number;
  insurancePremiums: number;
  netCashFlow: number;
}

export interface FinancialForecast {
  customerId: string;
  horizon: number;
  predictions: ForecastEntry[];
  confidence: number;
  assumptions: string[];
}

export interface ForecastEntry {
  month: string;
  expectedIncome: number;
  expectedExpenses: number;
  expectedBalance: number;
  recommendedSavings: number;
}

// ============================================
// TRANSACTION TYPES
// ============================================

export interface FinancialTransaction {
  id: string;
  customerId: string;
  type: TransactionType;
  category: string;
  amount: number;
  currency: string;
  description: string;
  reference: string;
  status: TransactionStatus;
  relatedProductId?: string;
  relatedProductType?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  LOAN_DISBURSEMENT = 'loan_disbursement',
  LOAN_REPAYMENT = 'loan_repayment',
  INSURANCE_PREMIUM = 'insurance_premium',
  INSURANCE_CLAIM = 'insurance_claim',
  BNPL_PURCHASE = 'bnpl_purchase',
  BNPL_INSTALLMENT = 'bnpl_installment',
  REMITTANCE_SEND = 'remittance_send',
  REMITTANCE_RECEIVE = 'remittance_receive',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

// ============================================
// WEBHOOK & NOTIFICATION TYPES
// ============================================

export interface WebhookPayload {
  event: string;
  timestamp: Date;
  data: Record<string, unknown>;
  signature?: string;
}

export interface NotificationPayload {
  customerId: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  data?: Record<string, unknown>;
}

export enum NotificationType {
  PAYMENT_DUE = 'payment_due',
  PAYMENT_SUCCESS = 'payment_success',
  APPLICATION_STATUS = 'application_status',
  CLAIM_UPDATE = 'claim_update',
  OFFER = 'offer',
  ALERT = 'alert',
}

export enum NotificationChannel {
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
  IN_APP = 'in_app',
}