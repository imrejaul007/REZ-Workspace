import mongoose, { Document } from 'mongoose';

// HRIS Types
export enum HRISProvider {
  GREYTHR = 'greythr',
  BAMBOOHR = 'bamboohr',
  ZOHO = 'zoho'
}

export enum SyncStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  SYNCING = 'syncing'
}

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TERMINATED = 'terminated',
  ON_LEAVE = 'on_leave'
}

export interface IHRISConnection extends Document {
  companyId: mongoose.Types.ObjectId;
  provider: HRISProvider;
  status: SyncStatus;
  credentials: {
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: Date;
  };
  fieldMappings: Record<string, string>;
  lastSyncAt?: Date;
  lastSyncStatus?: 'success' | 'partial' | 'failed';
  lastSyncError?: string;
  syncHistory: {
    syncedAt: Date;
    status: 'success' | 'partial' | 'failed';
    employeesAdded: number;
    employeesUpdated: number;
    employeesRemoved: number;
    error?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployee extends Document {
  companyId: mongoose.Types.ObjectId;
  externalId: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  doj: Date;
  status: EmployeeStatus;
  managerId?: string;
  salary?: number;
  phone?: string;
  hrisConnectionId: mongoose.Types.ObjectId;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Corporate Card Types
export enum CardType {
  VIRTUAL = 'virtual',
  PHYSICAL = 'physical'
}

export enum CardNetwork {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  RUPAY = 'rupay'
}

export enum CardStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  EXPIRED = 'expired',
  PENDING = 'pending',
  CLOSED = 'closed'
}

export interface ICorporateCard extends Document {
  companyId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  cardType: CardType;
  network: CardNetwork;
  status: CardStatus;
  cardToken: string;
  cardLastFour: string;
  cardHash?: string;
  spendingLimit: {
    daily?: number;
    monthly?: number;
    perTransaction?: number;
  };
  restrictions: {
    mccCodes?: string[];
    merchantCategories?: string[];
    blockedCategories?: string[];
  };
  issuedAt: Date;
  expiresAt: Date;
  issuedBy: mongoose.Types.ObjectId;
  closedAt?: Date;
  closedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICardTransaction extends Document {
  cardId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  merchantName: string;
  merchantCategory: string;
  mcc: string;
  amount: number;
  currency: string;
  inrAmount: number;
  transactionDate: Date;
  settledDate?: Date;
  status: 'pending' | 'settled' | 'disputed' | 'refunded';
  merchantLocation?: string;
  referenceNumber: string;
  authCode?: string;
  createdAt: Date;
}

// GST Types
export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export interface IGSTInvoice extends Document {
  companyId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  irn?: string; // Invoice Reference Number
  einvoiceDate?: Date;
  ewayBillNumber?: string;
  ewayBillDate?: Date;
  status: InvoiceStatus;
  seller: {
    gstin: string;
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  buyer: {
    gstin?: string;
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: {
    description: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    rate: number;
    taxableValue: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    igstRate: number;
    igstAmount: number;
    total: number;
  }[];
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
  placeOfSupply: string;
  reverseCharge: boolean;
  cancelledAt?: Date;
  cancelReason?: string;
  submittedAt?: Date;
  acknowledgmentNumber?: string;
  qrCodeUrl?: string;
  einvoicePdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGSTR2BMatch extends Document {
  companyId: mongoose.Types.ObjectId;
  period: string; // e.g., "2026-01"
  invoiceNumber: string;
  vendorGstin: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  itcClaimed: number;
  matchedPurchaseId?: mongoose.Types.ObjectId;
  matchedAt?: Date;
  status: 'matched' | 'unmatched' | 'dispute';
  createdAt: Date;
}

// Travel Types
export enum BookingType {
  HOTEL = 'hotel',
  FLIGHT = 'flight',
  TRAIN = 'train',
  CAB = 'cab'
}

export enum BookingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  BOOKED = 'booked',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface ITravelPolicy extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  rules: {
    hotelStarRating?: number;
    hotelMaxPrice?: number;
    flightClass?: string[];
    cabTier?: string[];
    mealAllowance?: number;
    dailyAllowance?: number;
  };
  approvalRequired: {
    aboveAmount?: number;
    international?: boolean;
    weekendTravel?: boolean;
  };
  approvers: mongoose.Types.ObjectId[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITravelBooking extends Document {
  companyId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  bookingType: BookingType;
  status: BookingStatus;
  travelDetails: {
    destination?: string;
    checkIn?: Date;
    checkOut?: Date;
    departure?: Date;
    arrival?: Date;
    origin?: string;
    hotelName?: string;
    roomType?: string;
    flightClass?: string;
    cabTier?: string;
  };
  costEstimate: {
    amount: number;
    currency: string;
    breakups?: Record<string, number>;
  };
  policyViolation?: {
    rule: string;
    message: string;
    requiresApproval: boolean;
  }[];
  approval: {
    status: ApprovalStatus;
    approverId?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    approverNotes?: string;
  };
  bookingReference?: string;
  confirmationNumber?: string;
  bookedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITravelRequest extends Document {
  companyId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  bookingType: BookingType;
  purpose: string;
  status: ApprovalStatus;
  destination: string;
  departureDate: Date;
  returnDate?: Date;
  estimatedCost: number;
  policyId: mongoose.Types.ObjectId;
  policyViolations?: {
    rule: string;
    message: string;
  }[];
  approverId?: mongoose.Types.ObjectId;
  approverNotes?: string;
  requestedAt: Date;
  respondedAt?: Date;
  createdAt: Date;
}

// Budget Types
export interface IBudgetAllocation extends Document {
  companyId: mongoose.Types.ObjectId;
  departmentId?: string;
  employeeId?: mongoose.Types.ObjectId;
  category: 'meal' | 'travel' | 'wellness' | 'learning' | 'gift' | 'general';
  monthlyLimit: number;
  spent: number;
  rolloverUnused: boolean;
  rolloverLimit: number;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBudgetAlert extends Document {
  companyId: mongoose.Types.ObjectId;
  employeeId?: mongoose.Types.ObjectId;
  category: string;
  threshold: number;
  notifiedAt?: Date;
  notificationType: 'email' | 'push' | 'sms';
  createdAt: Date;
}

// Expense Types
export enum ExpenseStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REIMBURSED = 'reimbursed'
}

export interface IExpenseReport extends Document {
  companyId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: 'travel' | 'meal' | 'supplies' | 'client' | 'other';
  expenses: {
    date: Date;
    merchant: string;
    amount: number;
    category: string;
    description?: string;
    receiptUrl?: string;
    currency: string;
    exchangeRate?: number;
    inrAmount?: number;
    verified: boolean;
  }[];
  totalAmount: number;
  status: ExpenseStatus;
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approverNotes?: string;
  tripId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Company Types
export interface ICompany extends Document {
  name: string;
  gstin?: string;
  pan?: string;
  address: {
    street?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  contact: {
    email: string;
    phone?: string;
  };
  logo?: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: {
    defaultCurrency: string;
    invoicePrefix: string;
    hrisRequired: boolean;
    approvalRequired: boolean;
    autoSettlement: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
