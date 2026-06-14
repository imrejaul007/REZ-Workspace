import { z } from 'zod';

// Warehouse Types
export enum WarehouseType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DISTRIBUTION = 'distribution',
  RETAIL = 'retail',
  FULFILLMENT = 'fulfillment',
  RETURNS = 'returns'
}

export enum WarehouseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed'
}

export enum TransferStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  IN_TRANSIT = 'in_transit',
  RECEIVED = 'received',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}

export enum AllocationStrategy {
  NEAREST = 'nearest',
  CHEAPEST = 'cheapest',
  FASTEST = 'fastest',
  BALANCED = 'balanced'
}

export enum FulfillmentPriority {
  SPEED = 'speed',
  COST = 'cost',
  STOCK_BALANCE = 'stock_balance'
}

// Location schema
export const LocationSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1).default('India'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional()
});

export type Location = z.infer<typeof LocationSchema>;

// Warehouse schema
export const WarehouseSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(2).max(20).regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores'),
  type: z.nativeEnum(WarehouseType),
  status: z.nativeEnum(WarehouseStatus).default(WarehouseStatus.ACTIVE),
  location: LocationSchema,
  capacity: z.object({
    maxUnits: z.number().int().positive(),
    currentUnits: z.number().int().nonnegative().default(0)
  }),
  operatingHours: z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/)
  }).optional(),
  contact: z.object({
    name: z.string().min(1),
    phone: z.string().min(10),
    email: z.string().email().optional()
  }),
  managerId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({})
});

export type Warehouse = z.infer<typeof WarehouseSchema>;
export type WarehouseInput = z.infer<typeof WarehouseSchema>;

// Inventory item schema
export const InventoryItemSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().nonnegative(),
  reservedQuantity: z.number().int().nonnegative().default(0),
  availableQuantity: z.number().int().nonnegative(),
  reorderPoint: z.number().int().nonnegative().default(10),
  reorderQuantity: z.number().int().positive().default(50),
  maxStock: z.number().int().positive().optional(),
  binLocation: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  cost: z.number().nonnegative().default(0),
  lastRestocked: z.string().datetime().optional(),
  lastCounted: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({})
});

export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type InventoryItemInput = z.infer<typeof InventoryItemSchema>;

// Transfer schema
export const TransferItemSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
  cost: z.number().nonnegative().default(0)
});

export const TransferSchema = z.object({
  transferNumber: z.string(),
  sourceWarehouseId: z.string().min(1),
  destinationWarehouseId: z.string().min(1),
  status: z.nativeEnum(TransferStatus).default(TransferStatus.PENDING),
  items: z.array(TransferItemSchema),
  totalItems: z.number().int().positive(),
  totalValue: z.number().nonnegative().default(0),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledDate: z.string().datetime().optional(),
  shippedDate: z.string().datetime().optional(),
  receivedDate: z.string().datetime().optional(),
  trackingInfo: z.object({
    carrier: z.string().optional(),
    trackingNumber: z.string().optional(),
    estimatedDelivery: z.string().datetime().optional()
  }).optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
  approvedBy: z.string().optional(),
  receivedBy: z.string().optional(),
  metadata: z.record(z.unknown()).default({})
});

export type Transfer = z.infer<typeof TransferSchema>;
export type TransferInput = z.infer<typeof TransferSchema>;
export type TransferItem = z.infer<typeof TransferItemSchema>;

// Allocation request schema
export const AllocationRequestSchema = z.object({
  orderId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    sku: z.string().min(1),
    quantity: z.number().int().positive(),
    priority: z.number().int().nonnegative().default(0)
  })),
  fulfillmentLocation: LocationSchema.optional(),
  strategy: z.nativeEnum(AllocationStrategy).default(AllocationStrategy.NEAREST),
  preferWarehouseIds: z.array(z.string()).optional(),
  excludeWarehouseIds: z.array(z.string()).optional()
});

export type AllocationRequest = z.infer<typeof AllocationRequestSchema>;

// Fulfillment optimization request schema
export const FulfillmentRequestSchema = z.object({
  destinationLocation: LocationSchema,
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive()
  })),
  priority: z.nativeEnum(FulfillmentPriority).default(FulfillmentPriority.SPEED),
  maxWarehouses: z.number().int().positive().max(10).default(3),
  includeCosts: z.boolean().default(true),
  warehouseIds: z.array(z.string()).optional()
});

export type FulfillmentRequest = z.infer<typeof FulfillmentRequestSchema>;

// Analytics schema
export const WarehouseAnalyticsSchema = z.object({
  warehouseId: z.string(),
  period: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  metrics: z.object({
    totalOrders: z.number().int().nonnegative(),
    fulfilledOrders: z.number().int().nonnegative(),
    failedOrders: z.number().int().nonnegative(),
    totalItemsShipped: z.number().int().nonnegative(),
    totalItemsReceived: z.number().int().nonnegative(),
    averageFulfillmentTime: z.number().nonnegative(),
    inventoryTurnover: z.number().nonnegative(),
    stockAccuracy: z.number().min(0).max(100),
    utilizationRate: z.number().min(0).max(100)
  }),
  transfers: z.object({
    sent: z.number().int().nonnegative(),
    received: z.number().int().nonnegative(),
    inTransit: z.number().int().nonnegative(),
    totalValue: z.number().nonnegative()
  })
});

export type WarehouseAnalytics = z.infer<typeof WarehouseAnalyticsSchema>;

// API Response types
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
    timestamp: string;
  };
}

// Low stock alert
export interface LowStockAlert {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  productId: string;
  sku: string;
  productName: string;
  currentQuantity: number;
  reorderPoint: number;
  severity: 'warning' | 'critical';
  timestamp: string;
}
