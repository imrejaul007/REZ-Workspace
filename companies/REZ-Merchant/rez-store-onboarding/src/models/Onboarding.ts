import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'file' | 'select' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  options?: { value: string; label: string }[];
}

export interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  status: StepStatus;
  fields?: FormField[];
  completedAt?: string;
  data?: Record<string, unknown>;
  order: number;
}

export interface OnboardingSteps {
  steps: OnboardingStep[];
  currentStep: number;
  completedAt?: string;
}

export interface CreateStoreRequest {
  merchantId: string;
  storeName: string;
  storeType: 'retail' | 'restaurant' | 'grocery' | 'pharmacy';
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  phone: string;
  email: string;
  operatingHours: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[];
}

export interface Store {
  id: string;
  merchantId: string;
  name: string;
  type: string;
  address: StoreAddress;
  phone: string;
  email: string;
  operatingHours: OperatingHours[];
  status: 'active' | 'inactive' | 'onboarding';
  onboardingId: string;
  inventoryAccountId?: string;
  posConfig?: POSConfig;
  createdAt: string;
  updatedAt: string;
}

export interface StoreAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface OperatingHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface POSConfig {
  storeId: string;
  defaultTaxRate: number;
  currency: string;
  receiptFooter: string;
  allowDiscounts: boolean;
  maxDiscountPercent: number;
  staffPINRequired: boolean;
  createdAt: string;
}

export interface QRCode {
  id: string;
  storeId: string;
  productId?: string;
  shelfCode: string;
  qrData: string;
  imageUrl?: string;
  printedAt?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  storeId: string;
  type: 'gst' | 'pan' | 'address_proof' | 'bank_statement' | 'other';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  uploadedAt: string;
}

export interface BankDetails {
  id: string;
  storeId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  testTransactionId?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  subcategory?: string;
  price: number;
  costPrice?: number;
  mrp?: number;
  taxRate: number;
  unit: string;
  stockQuantity: number;
  minStockLevel?: number;
  imageUrl?: string;
  shelfCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Default Steps Configuration
// ============================================================================

export const RETAIL_STORE_STEPS: Omit<OnboardingStep, 'status' | 'completedAt' | 'data'>[] = [
  {
    id: 'basic',
    name: 'Basic Info',
    description: 'Store name, type, address',
    order: 0,
    fields: [
      { id: 'storeName', name: 'storeName', type: 'text', label: 'Store Name', required: true, placeholder: 'Enter store name' },
      { id: 'storeType', name: 'storeType', type: 'select', label: 'Store Type', required: true, options: [
        { value: 'retail', label: 'Retail Store' },
        { value: 'grocery', label: 'Grocery Store' },
        { value: 'pharmacy', label: 'Pharmacy' },
        { value: 'restaurant', label: 'Restaurant' },
      ]},
      { id: 'phone', name: 'phone', type: 'phone', label: 'Phone Number', required: true, placeholder: '+91 XXXXX XXXXX', validation: { pattern: '^[+]?[0-9]{10,13}$' } },
      { id: 'email', name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'store@example.com' },
      { id: 'street', name: 'street', type: 'text', label: 'Street Address', required: true },
      { id: 'city', name: 'city', type: 'text', label: 'City', required: true },
      { id: 'state', name: 'state', type: 'text', label: 'State', required: true },
      { id: 'pincode', name: 'pincode', type: 'text', label: 'Pincode', required: true, validation: { pattern: '^[0-9]{6}$' } },
    ],
  },
  {
    id: 'documents',
    name: 'Documents',
    description: 'GST, PAN, address proof',
    order: 1,
    fields: [
      { id: 'gst', name: 'gst', type: 'file', label: 'GST Certificate', required: true },
      { id: 'pan', name: 'pan', type: 'file', label: 'PAN Card', required: true },
      { id: 'addressProof', name: 'addressProof', type: 'file', label: 'Address Proof', required: true },
      { id: 'gstNumber', name: 'gstNumber', type: 'text', label: 'GST Number', required: true, validation: { pattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$' } },
    ],
  },
  {
    id: 'bank',
    name: 'Bank Details',
    description: 'Account for settlements',
    order: 2,
    fields: [
      { id: 'accountHolderName', name: 'accountHolderName', type: 'text', label: 'Account Holder Name', required: true },
      { id: 'accountNumber', name: 'accountNumber', type: 'text', label: 'Account Number', required: true, validation: { pattern: '^[0-9]{9,18}$' } },
      { id: 'ifscCode', name: 'ifscCode', type: 'text', label: 'IFSC Code', required: true, validation: { pattern: '^[A-Z]{4}0[A-Z0-9]{6}$' } },
      { id: 'bankName', name: 'bankName', type: 'text', label: 'Bank Name', required: true },
      { id: 'branchName', name: 'branchName', type: 'text', label: 'Branch Name', required: false },
    ],
  },
  {
    id: 'inventory',
    name: 'Add Products',
    description: 'Import or add products',
    order: 3,
    fields: [],
  },
  {
    id: 'qr',
    name: 'Generate QR',
    description: 'Create shelf QR codes',
    order: 4,
    fields: [],
  },
  {
    id: 'payment',
    name: 'Payment Setup',
    description: 'UPI, cards',
    order: 5,
    fields: [
      { id: 'upiEnabled', name: 'upiEnabled', type: 'select', label: 'UPI Payments', required: true, options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' },
      ]},
      { id: 'cardEnabled', name: 'cardEnabled', type: 'select', label: 'Card Payments', required: true, options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' },
      ]},
      { id: 'cashEnabled', name: 'cashEnabled', type: 'select', label: 'Cash Payments', required: true, options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' },
      ]},
    ],
  },
  {
    id: 'staff',
    name: 'Add Staff',
    description: 'Invite team members',
    order: 6,
    fields: [
      { id: 'staffName', name: 'staffName', type: 'text', label: 'Staff Name', required: false },
      { id: 'staffEmail', name: 'staffEmail', type: 'email', label: 'Staff Email', required: false },
      { id: 'staffPhone', name: 'staffPhone', type: 'phone', label: 'Staff Phone', required: false },
      { id: 'staffRole', name: 'staffRole', type: 'select', label: 'Role', required: false, options: [
        { value: 'manager', label: 'Manager' },
        { value: 'cashier', label: 'Cashier' },
        { value: 'inventory_manager', label: 'Inventory Manager' },
        { value: 'staff', label: 'Staff' },
      ]},
    ],
  },
  {
    id: 'settings',
    name: 'Final Settings',
    description: 'Tax, discounts, hours',
    order: 7,
    fields: [
      { id: 'defaultTaxRate', name: 'defaultTaxRate', type: 'number', label: 'Default Tax Rate (%)', required: true, validation: { min: 0, max: 100 } },
      { id: 'currency', name: 'currency', type: 'select', label: 'Currency', required: true, options: [
        { value: 'INR', label: 'Indian Rupee (INR)' },
        { value: 'USD', label: 'US Dollar (USD)' },
      ]},
      { id: 'allowDiscounts', name: 'allowDiscounts', type: 'select', label: 'Allow Discounts', required: true, options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ]},
      { id: 'maxDiscountPercent', name: 'maxDiscountPercent', type: 'number', label: 'Max Discount (%)', required: false, validation: { min: 0, max: 100 } },
      { id: 'receiptFooter', name: 'receiptFooter', type: 'textarea', label: 'Receipt Footer Message', required: false },
    ],
  },
];

// ============================================================================
// Onboarding Model Factory
// ============================================================================

export function createOnboardingSteps(merchantId: string, storeId: string): OnboardingSteps {
  return {
    steps: RETAIL_STORE_STEPS.map((step, index) => ({
      ...step,
      status: index === 0 ? 'in_progress' : 'pending',
      completedAt: undefined,
      data: {},
    })),
    currentStep: 0,
    completedAt: undefined,
  };
}

export function createStore(data: CreateStoreRequest, onboardingId: string): Store {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    merchantId: data.merchantId,
    name: data.storeName,
    type: data.storeType,
    address: data.address,
    phone: data.phone,
    email: data.email,
    operatingHours: data.operatingHours,
    status: 'onboarding',
    onboardingId,
    createdAt: now,
    updatedAt: now,
  };
}
