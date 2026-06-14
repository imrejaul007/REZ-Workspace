import { z } from 'zod';

// Alert Types
export enum AlertType {
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  OVERSTOCK = 'overstock',
  EXPIRING_SOON = 'expiring_soon',
  REORDER_SUGGESTED = 'reorder_suggested',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

// Stock Alert Schema
export const StockAlertSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  sku: z.string(),
  productName: z.string(),
  alertType: z.nativeEnum(AlertType),
  severity: z.nativeEnum(AlertSeverity),
  status: z.nativeEnum(AlertStatus).default(AlertStatus.ACTIVE),
  currentStock: z.number().int().min(0),
  threshold: z.number().int().min(0),
  message: z.string(),
  suggestedAction: z.string().optional(),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.date().optional(),
  resolvedBy: z.string().optional(),
  resolvedAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type StockAlert = z.infer<typeof StockAlertSchema>;

// Purchase Order Status
export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  ORDERED = 'ordered',
  SHIPPED = 'shipped',
  PARTIAL_RECEIVED = 'partial_received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

// Purchase Order Schema
export const PurchaseOrderItemSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  sku: z.string(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  receivedQuantity: z.number().int().min(0).default(0),
  unitCost: z.number().positive(),
  totalCost: z.number().positive(),
});

export const PurchaseOrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  supplierId: z.string().uuid(),
  supplierName: z.string(),
  status: z.nativeEnum(PurchaseOrderStatus).default(PurchaseOrderStatus.DRAFT),
  items: z.array(PurchaseOrderItemSchema),
  totalAmount: z.number().positive(),
  expectedDeliveryDate: z.date().optional(),
  actualDeliveryDate: z.date().optional(),
  notes: z.string().optional(),
  createdBy: z.string(),
  approvedBy: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;
export type PurchaseOrderItem = z.infer<typeof PurchaseOrderItemSchema>;

// Supplier Schema
export const SupplierSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string().default('India'),
  }).optional(),
  leadTimeDays: z.number().int().positive().default(7),
  minimumOrderValue: z.number().positive().default(0),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Supplier = z.infer<typeof SupplierSchema>;

// Reorder Configuration
export const ReorderConfigSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  sku: z.string(),
  reorderPoint: z.number().int().min(0),
  reorderQuantity: z.number().int().positive(),
  preferredSupplierId: z.string().uuid().optional(),
  autoReorder: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type ReorderConfig = z.infer<typeof ReorderConfigSchema>;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Stock Report
export interface StockReport {
  productId: string;
  sku: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  daysOfStock: number;
  suggestedOrderQuantity: number;
}
