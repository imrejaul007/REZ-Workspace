/**
 * Restaurant Inventory Service - Configuration
 */

export interface AppConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const DEFAULT_CONFIG: AppConfig = {
  port: parseInt(process.env.PORT || '4056', 10),
  environment: (process.env.NODE_ENV as AppConfig['environment']) || 'development',
  logLevel: (process.env.LOG_LEVEL as AppConfig['logLevel']) || 'info',
};

// Default stock level thresholds
export const STOCK_THRESHOLDS = {
  defaultMinStock: 10,
  defaultMaxStock: 100,
  lowStockAlertDays: 7,
  expiringAlertDays: 3,
};

// Categories
export const ITEM_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Meat',
  'Seafood',
  'Dairy',
  'Bakery',
  'Beverages',
  'Spices',
  'Oils & Condiments',
  'Grains & Pulses',
  'Prepared Items',
  'Beverages (Bottled)',
  'Supplies',
  'Other',
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number];

// Units
export const ITEM_UNITS = [
  'kg',
  'g',
  'L',
  'mL',
  'pcs',
  'pack',
  'dozen',
  'bottle',
  'can',
  'box',
  'carton',
] as const;

export type ItemUnit = typeof ITEM_UNITS[number];

export default { DEFAULT_CONFIG, STOCK_THRESHOLDS, ITEM_CATEGORIES, ITEM_UNITS };
