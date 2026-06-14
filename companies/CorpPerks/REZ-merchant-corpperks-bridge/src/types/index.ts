import { z } from 'zod';

// Employee Types
export const EmployeeStatusEnum = z.enum(['active', 'inactive', 'on_leave', 'terminated']);
export type EmployeeStatus = z.infer<typeof EmployeeStatusEnum>;

export const GenderEnum = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);
export type Gender = z.infer<typeof GenderEnum>;

export const HrisProviderEnum = z.enum(['bamboohr', 'greythr', 'zoho_people', 'manual']);
export type HrisProvider = z.infer<typeof HrisProviderEnum>;

// Employee Schema
export const EmployeeSchema = z.object({
  id: z.string().uuid(),
  corpPerksId: z.string(),
  merchantEmployeeId: z.string().optional(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  employeeCode: z.string().optional(),
  dateOfJoining: z.string().datetime().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: GenderEnum.optional(),
  status: EmployeeStatusEnum.default('active'),
  hrisProvider: HrisProviderEnum,
  hrisEmployeeId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  syncedAt: z.string().datetime().optional(),
});

export type Employee = z.infer<typeof EmployeeSchema>;

// Benefit Types
export const BenefitTypeEnum = z.enum([
  'meal_allowance',
  'meal_plan',
  'fuel_allowance',
  'transport',
  'health_insurance',
  'wellness',
  'tax_benefit',
  'corporate_discount',
  'gift_voucher',
  'other'
]);
export type BenefitType = z.infer<typeof BenefitTypeEnum>;

export const BenefitSchema = z.object({
  id: z.string().uuid(),
  corpPerksId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: BenefitTypeEnum,
  value: z.number().positive(),
  currency: z.string().default('INR'),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  merchantId: z.string().optional(),
  merchantProductId: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  restrictions: z.object({
    maxUsagePerMonth: z.number().int().positive().optional(),
    maxTotalUsage: z.number().int().positive().optional(),
    minOrderValue: z.number().positive().optional(),
    applicableCategories: z.array(z.string()).optional(),
    excludeProducts: z.array(z.string()).optional(),
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Benefit = z.infer<typeof BenefitSchema>;

export const EmployeeBenefitSchema = z.object({
  id: z.string().uuid(),
  employeeId: z.string(),
  benefitId: z.string(),
  assignedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  remainingValue: z.number(),
  totalValue: z.number(),
  usageHistory: z.array(z.object({
    date: z.string().datetime(),
    amount: z.number(),
    merchantOrderId: z.string().optional(),
    description: z.string().optional(),
  })).default([]),
  isActive: z.boolean().default(true),
});

export type EmployeeBenefit = z.infer<typeof EmployeeBenefitSchema>;

// GST Invoice Types
export const InvoiceStatusEnum = z.enum([
  'draft',
  'issued',
  'sent',
  'paid',
  'cancelled',
  'expired'
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

export const InvoiceTypeEnum = z.enum([
  'tax_invoice',
  'receipt',
  'credit_note',
  'debit_note',
  'refund_voucher'
]);
export type InvoiceType = z.infer<typeof InvoiceTypeEnum>;

export const GSTInvoiceSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string(),
  corpPerksInvoiceId: z.string().optional(),
  merchantInvoiceId: z.string().optional(),
  invoiceType: InvoiceTypeEnum,
  status: InvoiceStatusEnum.default('draft'),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime().optional(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  billingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    country: z.string().default('India'),
  }),
  shippingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    country: z.string().default('India'),
  }).optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  placeOfSupply: z.string(),
  items: z.array(z.object({
    description: z.string(),
    hsnCode: z.string().optional(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    discount: z.number().min(0).default(0),
    taxableValue: z.number(),
    cgstRate: z.number().min(0).max(100).default(0),
    cgstAmount: z.number().min(0).default(0),
    sgstRate: z.number().min(0).max(100).default(0),
    sgstAmount: z.number().min(0).default(0),
    igstRate: z.number().min(0).max(100).default(0),
    igstAmount: z.number().min(0).default(0),
    cessRate: z.number().min(0).max(100).default(0),
    cessAmount: z.number().min(0).default(0),
    totalAmount: z.number(),
  })),
  subtotal: z.number(),
  totalDiscount: z.number().default(0),
  totalTaxableValue: z.number(),
  totalCgst: z.number().default(0),
  totalSgst: z.number().default(0),
  totalIgst: z.number().default(0),
  totalCess: z.number().default(0),
  totalTax: z.number(),
  grandTotal: z.number(),
  currency: z.string().default('INR'),
  irn: z.string().optional(),
  irnDate: z.string().datetime().optional(),
  ewaybillNumber: z.string().optional(),
  signedInvoiceUrl: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type GSTInvoice = z.infer<typeof GSTInvoiceSchema>;

// Corporate Order Types
export const CorporateOrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  employeeId: z.string(),
  merchantOrderId: z.string().optional(),
  companyId: z.string(),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled', 'refunded']),
  items: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    discount: z.number().min(0).default(0),
    benefitApplied: z.string().optional(),
    benefitDeduction: z.number().min(0).default(0),
    subtotal: z.number(),
  })),
  subtotal: z.number(),
  benefitDeduction: z.number().default(0),
  taxAmount: z.number().default(0),
  deliveryFee: z.number().default(0),
  grandTotal: z.number(),
  paymentMethod: z.enum(['allowance', 'card', 'upi', 'wallet', 'corporate_billing']),
  invoiceId: z.string().optional(),
  deliveryAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    instructions: z.string().optional(),
  }).optional(),
  scheduledFor: z.string().datetime().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CorporateOrder = z.infer<typeof CorporateOrderSchema>;

// Sync Types
export const SyncResultSchema = z.object({
  success: z.boolean(),
  syncedCount: z.number().int(),
  failedCount: z.number().int(),
  skippedCount: z.number().int(),
  errors: z.array(z.object({
    id: z.string().optional(),
    message: z.string(),
    code: z.string().optional(),
  })).default([]),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  provider: HrisProviderEnum,
  employees: z.array(EmployeeSchema).default([]),
});

export type SyncResult = z.infer<typeof SyncResultSchema>;

// API Request/Response Types
export const SyncEmployeesRequestSchema = z.object({
  provider: HrisProviderEnum,
  companyId: z.string().optional(),
  department: z.string().optional(),
  status: EmployeeStatusEnum.optional(),
  since: z.string().datetime().optional(),
  forceSync: z.boolean().default(false),
});

export type SyncEmployeesRequest = z.infer<typeof SyncEmployeesRequestSchema>;

export const AssignBenefitRequestSchema = z.object({
  employeeId: z.string().uuid(),
  benefitId: z.string().uuid(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  customValue: z.number().positive().optional(),
});

export type AssignBenefitRequest = z.infer<typeof AssignBenefitRequestSchema>;

export const CreateInvoiceRequestSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  billingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    country: z.string().default('India'),
  }),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  items: z.array(z.object({
    description: z.string(),
    hsnCode: z.string().optional(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    discount: z.number().min(0).default(0),
  })).min(1),
  invoiceType: InvoiceTypeEnum.default('tax_invoice'),
  dueDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceRequestSchema>;

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  services: {
    mongodb: 'connected' | 'disconnected';
    merchantApi: 'available' | 'unavailable';
    corpPerksApi: 'available' | 'unavailable';
  };
}
