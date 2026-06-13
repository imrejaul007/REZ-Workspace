import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

export interface ShopperProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints: number;
  preferences: ShopperPreferences;
  address?: ShopperAddress;
  purchaseHistory: PurchaseSummary;
  behaviorMetrics: BehaviorMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface ShopperPreferences {
  categories: string[];
  brands: string[];
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  communicationStyle: 'minimal' | 'standard' | 'detailed';
}

export interface ShopperAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PurchaseSummary {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  favoriteCategories: string[];
}

export interface BehaviorMetrics {
  sessionsCount: number;
  averageSessionDuration: number;
  conversionRate: number;
  abandonedBaskets: number;
  wishlistItems: number;
  referralCount: number;
}

export const createShopperSchema = {
  type: 'object',
  required: ['email', 'firstName', 'lastName'],
  properties: {
    email: { type: 'string', format: 'email' },
    firstName: { type: 'string', minLength: 1, maxLength: 100 },
    lastName: { type: 'string', minLength: 1, maxLength: 100 },
    phone: { type: 'string', pattern: '^\\+?[1-9]\\d{1,14}$' },
    dateOfBirth: { type: 'string', format: 'date' },
  },
  additionalProperties: true,
};

export const updateShopperSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', minLength: 1, maxLength: 100 },
    lastName: { type: 'string', minLength: 1, maxLength: 100 },
    phone: { type: 'string', pattern: '^\\+?[1-9]\\d{1,14}$' },
    dateOfBirth: { type: 'string', format: 'date' },
    preferences: {
      type: 'object',
      properties: {
        categories: { type: 'array', items: { type: 'string' } },
        brands: { type: 'array', items: { type: 'string' } },
        notificationPreferences: {
          type: 'object',
          properties: {
            email: { type: 'boolean' },
            sms: { type: 'boolean' },
            push: { type: 'boolean' },
          },
        },
        communicationStyle: { type: 'string', enum: ['minimal', 'standard', 'detailed'] },
      },
    },
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        zipCode: { type: 'string' },
        country: { type: 'string' },
      },
    },
  },
  additionalProperties: false,
};

export const validateCreateShopper = ajv.compile(createShopperSchema);
export const validateUpdateShopper = ajv.compile(updateShopperSchema);
