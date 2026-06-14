import { z } from 'zod';

// ==================== SUPPLIER SCHEMAS ====================

export const SupplierCategorySchema = z.enum([
  'groceries',
  'beverages',
  'dairy',
  'meat',
  'produce',
  'bakery',
  'frozen',
  'packaged',
  'household',
  'personal_care',
  'other'
]);

export type SupplierCategory = z.infer<typeof SupplierCategorySchema>;

export const SupplierStatusSchema = z.enum([
  'active',
  'inactive',
  'suspended',
  'pending_verification'
]);

export type SupplierStatus = z.infer<typeof SupplierStatusSchema>;

export const SupplierSchema = z.object({
  supplierId: z.string().min(1),
  name: z.string().min(1).max(255),
  category: SupplierCategorySchema,
  status: SupplierStatusSchema.default('pending_verification'),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().default('India'),
    coordinates: z.object({
      lat: z.number().optional(),
      lng: z.number().optional(),
    }).optional(),
  }).optional(),
  taxId: z.string().optional(),
  paymentTerms: z.enum(['immediate', 'net15', 'net30', 'net60', 'net90']).default('net30'),
  minimumOrderValue: z.number().min(0).default(0),
  leadTimeDays: z.number().min(0).default(1),
  rating: z.number().min(0).max(5).default(0),
  totalOrders: z.number().min(0).default(0),
  onTimeDeliveryRate: z.number().min(0).max(100).default(100),
  qualityScore: z.number().min(0).max(100).default(100),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Supplier = z.infer<typeof SupplierSchema>;

// ==================== MERCHANT SUPPLIER MAPPING SCHEMAS ====================

export const MerchantSupplierMappingSchema = z.object({
  mappingId: z.string().min(1),
  merchantId: z.string().min(1),
  supplierId: z.string().min(1),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  marginTier: z.enum(['standard', 'premium', 'wholesale']).default('standard'),
  customMarkup: z.number().min(0).optional(),
  syncEnabled: z.boolean().default(true),
  lastSyncAt: z.date().optional(),
  syncStatus: z.enum(['synced', 'pending', 'error', 'never_synced']).default('never_synced'),
  errorMessage: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type MerchantSupplierMapping = z.infer<typeof MerchantSupplierMappingSchema>;

// ==================== PRODUCT SCHEMAS ====================

export const ProductCostSchema = z.object({
  costId: z.string().min(1),
  productId: z.string().min(1),
  supplierId: z.string().min(1),
  merchantId: z.string().min(1),
  costPrice: z.number().min(0),
  currency: z.string().default('INR'),
  unit: z.enum(['piece', 'kg', 'g', 'l', 'ml', 'dozen', 'pack', 'box', 'case', 'carton']).default('piece'),
  quantityPerUnit: z.number().min(1).default(1),
  lastUpdated: z.date().default(() => new Date()),
  previousCost: z.number().optional(),
  costChangePercent: z.number().optional(),
  isCurrent: z.boolean().default(true),
});

export type ProductCost = z.infer<typeof ProductCostSchema>;

export const ProductMarginSchema = z.object({
  marginId: z.string().min(1),
  productId: z.string().min(1),
  merchantId: z.string().min(1),
  categoryTargetMargin: z.number().min(0).max(500),
  productTargetMargin: z.number().min(0).max(500).optional(),
  actualMargin: z.number().optional(),
  suggestedPrice: z.number().min(0).optional(),
  competitivePrice: z.number().min(0).optional(),
  lastCalculated: z.date().default(() => new Date()),
});

export type ProductMargin = z.infer<typeof ProductMarginSchema>;

export const SyncedProductSchema = z.object({
  syncedProductId: z.string().min(1),
  merchantId: z.string().min(1),
  supplierId: z.string().min(1),
  supplierProductId: z.string().min(1),
  catalogProductId: z.string().optional(),
  supplierSku: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: SupplierCategorySchema,
  brand: z.string().optional(),
  mrp: z.number().min(0).optional(),
  costPrice: z.number().min(0),
  suggestedSellingPrice: z.number().min(0).optional(),
  inventory: z.number().min(0).default(0),
  unit: z.string().default('piece'),
  barcode: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  lastSyncedAt: z.date().default(() => new Date()),
  syncError: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type SyncedProduct = z.infer<typeof SyncedProductSchema>;

// ==================== COST ALERT SCHEMAS ====================

export const CostAlertSchema = z.object({
  alertId: z.string().min(1),
  merchantId: z.string().min(1),
  supplierId: z.string().min(1),
  productId: z.string().optional(),
  alertType: z.enum(['cost_increase', 'cost_decrease', 'availability', 'quality_issue', 'lead_time_change']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string().min(1),
  oldValue: z.number().optional(),
  newValue: z.number().optional(),
  changePercent: z.number().optional(),
  isRead: z.boolean().default(false),
  isResolved: z.boolean().default(false),
  resolvedAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
});

export type CostAlert = z.infer<typeof CostAlertSchema>;

// ==================== API REQUEST/RESPONSE SCHEMAS ====================

export const SyncProductsRequestSchema = z.object({
  merchantId: z.string().min(1),
  supplierId: z.string().min(1),
  productIds: z.array(z.string()).optional(),
  category: SupplierCategorySchema.optional(),
  forceSync: z.boolean().default(false),
});

export type SyncProductsRequest = z.infer<typeof SyncProductsRequestSchema>;

export const MarginSuggestionRequestSchema = z.object({
  merchantId: z.string().min(1),
  productIds: z.array(z.string()).min(1),
  targetMarginPercent: z.number().min(0).max(500).optional(),
  competitivePricing: z.boolean().default(false),
});

export type MarginSuggestionRequest = z.infer<typeof MarginSuggestionRequestSchema>;

// ==================== TALLY INTEGRATION SCHEMAS ====================

export const TallySupplierSchema = z.object({
  tallyId: z.string(),
  name: z.string(),
  ledgerName: z.string(),
  creditPeriod: z.number().optional(),
  openingBalance: z.number().optional(),
  address: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional(),
  gstin: z.string().optional(),
  state: z.string().optional(),
});

export type TallySupplier = z.infer<typeof TallySupplierSchema>;

export const TallyProductSchema = z.object({
  tallyId: z.string(),
  name: z.string(),
  sku: z.string().optional(),
  groupName: z.string().optional(),
  rate: z.number().optional(),
  mrp: z.number().optional(),
  unit: z.string().optional(),
  openingBalance: z.number().optional(),
  hsnCode: z.string().optional(),
  gstRate: z.number().optional(),
});

export type TallyProduct = z.infer<typeof TallyProductSchema>;

// ==================== PAGINATION SCHEMAS ====================

export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
  });

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    [key: string]: unknown;
  };
}

export interface SupplierWithMappings extends Supplier {
  mappings: MerchantSupplierMapping[];
  productCount: number;
  totalSpent: number;
}

export interface SupplierPerformance {
  supplierId: string;
  name: string;
  rating: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  averageResponseTime: number;
  totalOrders: number;
  totalValue: number;
  lastOrderDate: Date | null;
  period: {
    start: Date;
    end: Date;
  };
}

// ==================== CATEGORY MARGIN CONFIGS ====================

export const CategoryMarginConfigSchema = z.object({
  category: SupplierCategorySchema,
  defaultMarginPercent: z.number().min(0).max(500),
  minMarginPercent: z.number().min(0).max(500),
  maxMarginPercent: z.number().min(0).max(500),
  competitiveAdjustment: z.number().min(0).max(100).default(5),
  isActive: z.boolean().default(true),
});

export type CategoryMarginConfig = z.infer<typeof CategoryMarginConfigSchema>;

// Default category margins for Indian market
export const DEFAULT_CATEGORY_MARGINS: CategoryMarginConfig[] = [
  { category: 'groceries', defaultMarginPercent: 15, minMarginPercent: 8, maxMarginPercent: 25, isActive: true },
  { category: 'beverages', defaultMarginPercent: 20, minMarginPercent: 12, maxMarginPercent: 35, isActive: true },
  { category: 'dairy', defaultMarginPercent: 18, minMarginPercent: 10, maxMarginPercent: 30, isActive: true },
  { category: 'meat', defaultMarginPercent: 25, minMarginPercent: 15, maxMarginPercent: 40, isActive: true },
  { category: 'produce', defaultMarginPercent: 30, minMarginPercent: 20, maxMarginPercent: 50, isActive: true },
  { category: 'bakery', defaultMarginPercent: 22, minMarginPercent: 12, maxMarginPercent: 35, isActive: true },
  { category: 'frozen', defaultMarginPercent: 18, minMarginPercent: 10, maxMarginPercent: 30, isActive: true },
  { category: 'packaged', defaultMarginPercent: 15, minMarginPercent: 8, maxMarginPercent: 25, isActive: true },
  { category: 'household', defaultMarginPercent: 20, minMarginPercent: 12, maxMarginPercent: 35, isActive: true },
  { category: 'personal_care', defaultMarginPercent: 25, minMarginPercent: 15, maxMarginPercent: 45, isActive: true },
  { category: 'other', defaultMarginPercent: 20, minMarginPercent: 10, maxMarginPercent: 35, isActive: true },
];
