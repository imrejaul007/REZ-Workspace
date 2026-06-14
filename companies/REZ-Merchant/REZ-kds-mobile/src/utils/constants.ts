/**
 * KDS Mobile Constants
 */

import { KitchenStation, OrderPriority, OrderStatus, StationConfig } from '../types';

// API Configuration
export const API_CONFIG = {
  // KDS Service URL - our new backend
  BASE_URL: process.env.EXPO_PUBLIC_KDS_API_URL || 'http://localhost:4014',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// WebSocket Configuration - KDS service WebSocket
export const WS_CONFIG = {
  URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:4014',
  RECONNECT_DELAY: 3000,
  MAX_RECONNECT_ATTEMPTS: 10,
  HEARTBEAT_INTERVAL: 30000,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'kds_auth_token',
  SETTINGS: 'kds_settings',
  CACHED_ORDERS: 'kds_cached_orders',
  STATION_CONFIG: 'kds_station_config',
  LAST_SYNC: 'kds_last_sync',
  OFFLINE_QUEUE: 'kds_offline_queue',
  STORE_ID: 'kds_store_id',
  MERCHANT_ID: 'kds_merchant_id',
};

// Priority Colors
export const PRIORITY_COLORS: Record<OrderPriority, string> = {
  [OrderPriority.LOW]: '#4CAF50',
  [OrderPriority.NORMAL]: '#2196F3',
  [OrderPriority.HIGH]: '#FF9800',
  [OrderPriority.URGENT]: '#F44336',
};

// Status Colors
export const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '#FFC107',
  [OrderStatus.ACKNOWLEDGED]: '#03A9F4',
  [OrderStatus.IN_PROGRESS]: '#9C27B0',
  [OrderStatus.READY]: '#4CAF50',
  [OrderStatus.COMPLETED]: '#607D8B',
  [OrderStatus.CANCELLED]: '#F44336',
};

// Station Colors
export const STATION_COLORS: Record<KitchenStation, string> = {
  [KitchenStation.GRILL]: '#E91E63',
  [KitchenStation.FRY]: '#FF5722',
  [KitchenStation.SALAD]: '#4CAF50',
  [KitchenStation.DESSERT]: '#9C27B0',
  [KitchenStation.BEVERAGE]: '#00BCD4',
  [KitchenStation.APPETIZER]: '#FF9800',
  [KitchenStation.MAIN]: '#3F51B5',
  [KitchenStation.ALL]: '#607D8B',
};

// Default Station Configuration
export const DEFAULT_STATIONS: StationConfig[] = [
  {
    id: 'station-grill',
    name: 'Grill',
    type: KitchenStation.GRILL,
    color: STATION_COLORS[KitchenStation.GRILL],
    icon: 'flame',
    isActive: true,
    orderCount: 0,
  },
  {
    id: 'station-fry',
    name: 'Fry',
    type: KitchenStation.FRY,
    color: STATION_COLORS[KitchenStation.FRY],
    icon: 'frying-pan',
    isActive: true,
    orderCount: 0,
  },
  {
    id: 'station-salad',
    name: 'Salad',
    type: KitchenStation.SALAD,
    color: STATION_COLORS[KitchenStation.SALAD],
    icon: 'leaf',
    isActive: true,
    orderCount: 0,
  },
  {
    id: 'station-dessert',
    name: 'Dessert',
    type: KitchenStation.DESSERT,
    color: STATION_COLORS[KitchenStation.DESSERT],
    icon: 'cake',
    isActive: true,
    orderCount: 0,
  },
  {
    id: 'station-beverage',
    name: 'Beverage',
    type: KitchenStation.BEVERAGE,
    color: STATION_COLORS[KitchenStation.BEVERAGE],
    icon: 'cup',
    isActive: true,
    orderCount: 0,
  },
  {
    id: 'station-appetizer',
    name: 'Appetizer',
    type: KitchenStation.APPETIZER,
    color: STATION_COLORS[KitchenStation.APPETIZER],
    icon: 'restaurant',
    isActive: true,
    orderCount: 0,
  },
  {
    id: 'station-main',
    name: 'Main Kitchen',
    type: KitchenStation.MAIN,
    color: STATION_COLORS[KitchenStation.MAIN],
    icon: 'kitchen',
    isActive: true,
    orderCount: 0,
  },
];

// Timer Thresholds (in seconds)
export const TIMER_THRESHOLDS = {
  NORMAL: 600, // 10 minutes
  WARNING: 900, // 15 minutes
  CRITICAL: 1200, // 20 minutes
};

// Animation Durations (ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Grid Layout
export const GRID_CONFIG = {
  TABLET_LANDSCAPE: {
    columns: 4,
    cardWidth: 280,
    cardHeight: 200,
  },
  TABLET_PORTRAIT: {
    columns: 3,
    cardWidth: 260,
    cardHeight: 180,
  },
  PHONE: {
    columns: 1,
    cardWidth: '100%',
    cardHeight: 160,
  },
};

// Source Icons
export const SOURCE_ICONS: Record<string, string> = {
  pos: 'cash-register',
  online: 'web',
  mobile: 'cellphone',
  kiosk: 'kiosk',
  whatsapp: 'whatsapp',
};

// Sound Files
export const SOUND_FILES = {
  NEW_ORDER: 'new-order.wav',
  URGENT_ORDER: 'urgent-order.wav',
  ORDER_BUMPED: 'order-bumped.wav',
  ALL_DAY: 'all-day.wav',
};
