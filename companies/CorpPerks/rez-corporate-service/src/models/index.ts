import mongoose, { Schema } from 'mongoose';
import {
  IHRISConnection,
  HRISProvider,
  SyncStatus,
  IEmployee,
  EmployeeStatus,
  ICorporateCard,
  CardType,
  CardNetwork,
  CardStatus,
  ICardTransaction,
  IGSTInvoice,
  InvoiceStatus,
  IGSTR2BMatch,
  ITravelPolicy,
  ITravelBooking,
  BookingType,
  BookingStatus,
  ApprovalStatus,
  ITravelRequest,
  IBudgetAllocation,
  IBudgetAlert,
  IExpenseReport,
  ExpenseStatus,
  ICompany
} from '../types';

// Company Model
const CompanySchema = new Schema<ICompany>({
  name: { type: String, required: true },
  gstin: { type: String, unique: true, sparse: true },
  pan: String,
  address: {
    street: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    pincode: { type: String, required: true }
  },
  contact: {
    email: { type: String, required: true },
    phone: String
  },
  logo: String,
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  settings: {
    defaultCurrency: { type: String, default: 'INR' },
    invoicePrefix: { type: String, default: 'INV' },
    hrisRequired: { type: Boolean, default: false },
    approvalRequired: { type: Boolean, default: true },
    autoSettlement: { type: Boolean, default: false }
  }
}, { timestamps: true });

CompanySchema.index({ 'contact.email': 1 });

// HRIS Connection Model
const HRISConnectionSchema = new Schema<IHRISConnection>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  provider: { type: String, enum: Object.values(HRISProvider), required: true },
  status: { type: String, enum: Object.values(SyncStatus), default: SyncStatus.DISCONNECTED },
  credentials: {
    clientId: String,
    clientSecret: String,
    username: String,
    password: String,
    accessToken: String,
    refreshToken: String,
    tokenExpiry: Date
  },
  fieldMappings: { type: Map, of: String, default: {} },
  lastSyncAt: Date,
  lastSyncStatus: String,
  lastSyncError: String,
  syncHistory: [{
    syncedAt: { type: Date, default: Date.now },
    status: String,
    employeesAdded: Number,
    employeesUpdated: Number,
    employeesRemoved: Number,
    error: String
  }]
}, { timestamps: true });

HRISConnectionSchema.index({ companyId: 1, provider: 1 }, { unique: true });

// Employee Model
const EmployeeSchema = new Schema<IEmployee>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  externalId: { type: String, required: true },
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  department: { type: String, required: true },
  designation: String,
  doj: { type: Date, required: true },
  status: { type: String, enum: Object.values(EmployeeStatus), default: EmployeeStatus.ACTIVE },
  managerId: String,
  salary: Number,
  phone: String,
  hrisConnectionId: { type: Schema.Types.ObjectId, ref: 'HRISConnection', required: true },
  syncedAt: { type: Date, default: Date.now }
}, { timestamps: true });

EmployeeSchema.index({ companyId: 1 });
EmployeeSchema.index({ companyId: 1, email: 1 }, { unique: true });
EmployeeSchema.index({ companyId: 1, externalId: 1, hrisConnectionId: 1 });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ department: 1 });

// Corporate Card Model
const CorporateCardSchema = new Schema<ICorporateCard>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  cardType: { type: String, enum: Object.values(CardType), required: true },
  network: { type: String, enum: Object.values(CardNetwork), default: CardNetwork.VISA },
  status: { type: String, enum: Object.values(CardStatus), default: CardStatus.PENDING },
  cardToken: { type: String, required: true },
  cardLastFour: { type: String, required: true },
  cardHash: String,
  spendingLimit: {
    daily: Number,
    monthly: Number,
    perTransaction: Number
  },
  restrictions: {
    mccCodes: [String],
    merchantCategories: [String],
    blockedCategories: [String]
  },
  issuedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  issuedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
  closedAt: Date,
  closedReason: String
}, { timestamps: true });

CorporateCardSchema.index({ companyId: 1, employeeId: 1 });
CorporateCardSchema.index({ cardToken: 1 }, { unique: true });
CorporateCardSchema.index({ status: 1, expiresAt: 1 });

// Card Transaction Model
const CardTransactionSchema = new Schema<ICardTransaction>({
  cardId: { type: Schema.Types.ObjectId, ref: 'CorporateCard', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  merchantName: { type: String, required: true },
  merchantCategory: { type: String, required: true },
  mcc: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  inrAmount: { type: Number, required: true },
  transactionDate: { type: Date, required: true },
  settledDate: Date,
  status: { type: String, enum: ['pending', 'settled', 'disputed', 'refunded'], default: 'pending' },
  merchantLocation: String,
  referenceNumber: { type: String, required: true },
  authCode: String
}, { timestamps: true });

CardTransactionSchema.index({ cardId: 1, transactionDate: -1 });
CardTransactionSchema.index({ companyId: 1, transactionDate: -1 });
CardTransactionSchema.index({ employeeId: 1, transactionDate: -1 });

// GST Invoice Model
const GSTInvoiceSchema = new Schema<IGSTInvoice>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  invoiceNumber: { type: String, required: true },
  irn: String,
  einvoiceDate: Date,
  ewayBillNumber: String,
  ewayBillDate: Date,
  status: { type: String, enum: Object.values(InvoiceStatus), default: InvoiceStatus.DRAFT },
  seller: {
    gstin: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  buyer: {
    gstin: String,
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  items: [{
    description: { type: String, required: true },
    hsnCode: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'NOS' },
    rate: { type: Number, required: true },
    taxableValue: { type: Number, required: true },
    cgstRate: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  }],
  totalTaxableValue: { type: Number, required: true },
  totalCgst: { type: Number, default: 0 },
  totalSgst: { type: Number, default: 0 },
  totalIgst: { type: Number, default: 0 },
  totalTax: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  placeOfSupply: { type: String, required: true },
  reverseCharge: { type: Boolean, default: false },
  cancelledAt: Date,
  cancelReason: String,
  submittedAt: Date,
  acknowledgmentNumber: String,
  qrCodeUrl: String,
  einvoicePdfUrl: String
}, { timestamps: true });

GSTInvoiceSchema.index({ companyId: 1, invoiceNumber: 1 }, { unique: true });
GSTInvoiceSchema.index({ companyId: 1, status: 1 });
GSTInvoiceSchema.index({ irn: 1 });
GSTInvoiceSchema.index({ 'buyer.gstin': 1 });

// GSTR2B Match Model
const GSTR2BMatchSchema = new Schema<IGSTR2BMatch>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  period: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  vendorGstin: { type: String, required: true },
  taxableValue: { type: Number, required: true },
  igst: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  itcClaimed: { type: Number, default: 0 },
  matchedPurchaseId: { type: Schema.Types.ObjectId },
  matchedAt: Date,
  status: { type: String, enum: ['matched', 'unmatched', 'dispute'], default: 'unmatched' }
}, { timestamps: true });

GSTR2BMatchSchema.index({ companyId: 1, period: 1 });
GSTR2BMatchSchema.index({ status: 1 });

// Travel Policy Model
const TravelPolicySchema = new Schema<ITravelPolicy>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  description: String,
  rules: {
    hotelStarRating: Number,
    hotelMaxPrice: Number,
    flightClass: [String],
    cabTier: [String],
    mealAllowance: Number,
    dailyAllowance: Number
  },
  approvalRequired: {
    aboveAmount: Number,
    international: Boolean,
    weekendTravel: Boolean
  },
  approvers: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

TravelPolicySchema.index({ companyId: 1 });
TravelPolicySchema.index({ companyId: 1, isDefault: 1 });

// Travel Booking Model
const TravelBookingSchema = new Schema<ITravelBooking>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  bookingType: { type: String, enum: Object.values(BookingType), required: true },
  status: { type: String, enum: Object.values(BookingStatus), default: BookingStatus.PENDING },
  travelDetails: {
    destination: String,
    checkIn: Date,
    checkOut: Date,
    departure: Date,
    arrival: Date,
    origin: String,
    hotelName: String,
    roomType: String,
    flightClass: String,
    cabTier: String
  },
  costEstimate: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    breakups: { type: Map, of: Number }
  },
  policyViolation: [{
    rule: String,
    message: String,
    requiresApproval: Boolean
  }],
  approval: {
    status: { type: String, enum: Object.values(ApprovalStatus), default: ApprovalStatus.PENDING },
    approverId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    approvedAt: Date,
    approverNotes: String
  },
  bookingReference: String,
  confirmationNumber: String,
  bookedAt: Date,
  cancelledAt: Date,
  cancelReason: String
}, { timestamps: true });

TravelBookingSchema.index({ companyId: 1, employeeId: 1 });
TravelBookingSchema.index({ status: 1, 'approval.status': 1 });

// Travel Request Model
const TravelRequestSchema = new Schema<ITravelRequest>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  bookingType: { type: String, enum: Object.values(BookingType), required: true },
  purpose: { type: String, required: true },
  status: { type: String, enum: Object.values(ApprovalStatus), default: ApprovalStatus.PENDING },
  destination: { type: String, required: true },
  departureDate: { type: Date, required: true },
  returnDate: Date,
  estimatedCost: { type: Number, required: true },
  policyId: { type: Schema.Types.ObjectId, ref: 'TravelPolicy' },
  policyViolations: [{
    rule: String,
    message: String
  }],
  approverId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  approverNotes: String,
  requestedAt: { type: Date, default: Date.now },
  respondedAt: Date
}, { timestamps: true });

TravelRequestSchema.index({ companyId: 1, employeeId: 1 });
TravelRequestSchema.index({ status: 1 });

// Budget Allocation Model
const BudgetAllocationSchema = new Schema<IBudgetAllocation>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  departmentId: String,
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  category: { type: String, enum: ['meal', 'travel', 'wellness', 'learning', 'gift', 'general'], required: true },
  monthlyLimit: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  rolloverUnused: { type: Boolean, default: false },
  rolloverLimit: { type: Number, default: 0 },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true }
}, { timestamps: true });

BudgetAllocationSchema.index({ companyId: 1, category: 1 });
BudgetAllocationSchema.index({ companyId: 1, employeeId: 1, category: 1 });
BudgetAllocationSchema.index({ periodEnd: 1 });

// Budget Alert Model
const BudgetAlertSchema = new Schema<IBudgetAlert>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  category: { type: String, required: true },
  threshold: { type: Number, required: true },
  notifiedAt: Date,
  notificationType: { type: String, enum: ['email', 'push', 'sms'], default: 'push' }
}, { timestamps: true });

// Expense Report Model
const ExpenseReportSchema = new Schema<IExpenseReport>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['travel', 'meal', 'supplies', 'client', 'other'], required: true },
  expenses: [{
    date: { type: Date, required: true },
    merchant: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: String,
    receiptUrl: String,
    currency: { type: String, default: 'INR' },
    exchangeRate: Number,
    inrAmount: Number,
    verified: { type: Boolean, default: false }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: Object.values(ExpenseStatus), default: ExpenseStatus.DRAFT },
  submittedAt: Date,
  approvedAt: Date,
  approvedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
  approverNotes: String,
  tripId: { type: Schema.Types.ObjectId, ref: 'TravelBooking' }
}, { timestamps: true });

ExpenseReportSchema.index({ companyId: 1, employeeId: 1 });
ExpenseReportSchema.index({ status: 1 });
ExpenseReportSchema.index({ 'expenses.date': -1 });

// Export Models
export const Company = mongoose.model<ICompany>('Company', CompanySchema);
export const HRISConnection = mongoose.model<IHRISConnection>('HRISConnection', HRISConnectionSchema);
export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
export const CorporateCard = mongoose.model<ICorporateCard>('CorporateCard', CorporateCardSchema);
export const CardTransaction = mongoose.model<ICardTransaction>('CardTransaction', CardTransactionSchema);
export const GSTInvoice = mongoose.model<IGSTInvoice>('GSTInvoice', GSTInvoiceSchema);
export const GSTR2BMatch = mongoose.model<IGSTR2BMatch>('GSTR2BMatch', GSTR2BMatchSchema);
export const TravelPolicy = mongoose.model<ITravelPolicy>('TravelPolicy', TravelPolicySchema);
export const TravelBooking = mongoose.model<ITravelBooking>('TravelBooking', TravelBookingSchema);
export const TravelRequest = mongoose.model<ITravelRequest>('TravelRequest', TravelRequestSchema);
export const BudgetAllocation = mongoose.model<IBudgetAllocation>('BudgetAllocation', BudgetAllocationSchema);
export const BudgetAlert = mongoose.model<IBudgetAlert>('BudgetAlert', BudgetAlertSchema);
export const ExpenseReport = mongoose.model<IExpenseReport>('ExpenseReport', ExpenseReportSchema);
