import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

export interface Basket {
  id: string;
  shopperId: string;
  storeId?: string;
  sessionId?: string;
  status: BasketStatus;
  items: BasketItem[];
  subtotal: number;
  discounts: Discount[];
  discountTotal: number;
  tax: number;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  abandonedAt?: string;
  convertedAt?: string;
}

export type BasketStatus = 'active' | 'saved' | 'abandoned' | 'converted' | 'expired';

export interface BasketItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: ItemDiscount;
  metadata?: Record<string, any>;
}

export interface ItemDiscount {
  type: 'percentage' | 'fixed' | 'bundle';
  value: number;
  code?: string;
  description: string;
}

export interface Discount {
  id: string;
  type: 'percentage' | 'fixed' | 'shipping' | 'loyalty' | 'promo';
  code?: string;
  value: number;
  description: string;
  appliedAt: string;
}

export interface BasketMetrics {
  totalBaskets: number;
  activeBaskets: number;
  abandonedBaskets: number;
  convertedBaskets: number;
  averageBasketValue: number;
  averageItemsPerBasket: number;
  conversionRate: number;
  abandonmentRate: number;
}

export const addItemSchema = {
  type: 'object',
  required: ['productId', 'sku', 'name', 'quantity', 'unitPrice'],
  properties: {
    productId: { type: 'string' },
    sku: { type: 'string' },
    name: { type: 'string' },
    quantity: { type: 'number', minimum: 1 },
    unitPrice: { type: 'number', minimum: 0 },
    metadata: { type: 'object' },
  },
  additionalProperties: false,
};

export const updateItemSchema = {
  type: 'object',
  required: ['quantity'],
  properties: {
    quantity: { type: 'number', minimum: 0 },
  },
  additionalProperties: false,
};

export const createBasketSchema = {
  type: 'object',
  required: ['shopperId'],
  properties: {
    shopperId: { type: 'string' },
    storeId: { type: 'string' },
    sessionId: { type: 'string' },
    currency: { type: 'string', default: 'USD' },
  },
  additionalProperties: false,
};

export const applyDiscountSchema = {
  type: 'object',
  required: ['type', 'value', 'description'],
  properties: {
    type: { type: 'string', enum: ['percentage', 'fixed', 'shipping', 'loyalty', 'promo'] },
    code: { type: 'string' },
    value: { type: 'number' },
    description: { type: 'string' },
  },
  additionalProperties: false,
};

export const validateAddItem = ajv.compile(addItemSchema);
export const validateUpdateItem = ajv.compile(updateItemSchema);
export const validateCreateBasket = ajv.compile(createBasketSchema);
export const validateApplyDiscount = ajv.compile(applyDiscountSchema);