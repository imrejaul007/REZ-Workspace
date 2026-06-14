/**
 * KDS Mobile Type Definitions
 * Kitchen Display System types for REZ ecosystem
 */

// Order Priority Levels
export enum OrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Order Status
export enum OrderStatus {
  PENDING = 'pending',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Kitchen Stations
export enum KitchenStation {
  GRILL = 'grill',
  FRY = 'fry',
  SALAD = 'salad',
  DESSERT = 'dessert',
  BEVERAGE = 'beverage',
  APPETIZER = 'appetizer',
  MAIN = 'main',
  ALL = 'all',
}

// Order Item Status
export enum ItemStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  DONE = 'done',
  CANCELLED = 'cancelled',
  SUBSTITUTED = 'substituted',
}

// Order Item
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  customizations?: string[];
  status: ItemStatus;
  station: KitchenStation;
  modifiers?: ItemModifier[];
  imageUrl?: string;
}

// Item Modifier
export interface ItemModifier {
  id: string;
  name: string;
  price: number;
  type: 'add' | 'remove' | 'substitute';
}

// Customer Information
export interface CustomerInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  orderCount: number;
}

// Order
export interface KDSOrder {
  id: string;
  orderNumber: string;
  displayNumber: string;
  status: OrderStatus;
  priority: OrderPriority;
  items: OrderItem[];
  customer: CustomerInfo;
  tableNumber?: string;
  station: KitchenStation | KitchenStation[];
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  completedAt?: string;
  estimatedReadyTime?: string;
  cookingTimeMinutes?: number;
  notes?: string;
  specialInstructions?: string;
  source: 'pos' | 'online' | 'mobile' | 'kiosk' | 'whatsapp';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partial';
  totalAmount: number;
  subtotal: number;
  tax: number;
  discount: number;
  isTakeaway: boolean;
  isPreOrder: boolean;
  preOrderTime?: string;
}

// Station Configuration
export interface StationConfig {
  id: string;
  name: string;
  type: KitchenStation;
  color: string;
  icon: string;
  isActive: boolean;
  orderCount: number;
}

// Notification Payload
export interface KDSNotificationPayload {
  orderId: string;
  orderNumber: string;
  priority: OrderPriority;
  station: KitchenStation;
  itemCount: number;
  totalAmount: number;
  customerName: string;
  source: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Filter Options
export interface OrderFilterOptions {
  status?: OrderStatus[];
  priority?: OrderPriority[];
  station?: KitchenStation[];
  dateFrom?: string;
  dateTo?: string;
  source?: string[];
  searchQuery?: string;
}

// Sort Options
export type SortField = 'createdAt' | 'priority' | 'orderNumber' | 'estimatedReadyTime';
export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  direction: SortDirection;
}

// KDS Statistics
export interface KDSStats {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  averageCookingTime: number;
  ordersPerHour: number;
  stationStats: StationStats[];
}

export interface StationStats {
  station: KitchenStation;
  activeOrders: number;
  completedToday: number;
  averageTime: number;
}

// Sound Configuration
export interface SoundConfig {
  newOrder: boolean;
  urgentOrder: boolean;
  orderBumped: boolean;
  allDay: boolean;
  volume: number;
}

// Voice Configuration
export interface VoiceConfig {
  enabled: boolean;
  language: string;
  rate: number;
  pitch: number;
  announcePriority: boolean;
  announceOrderNumber: boolean;
  announceItems: boolean;
}

// Settings
export interface KDSSettings {
  sound: SoundConfig;
  voice: VoiceConfig;
  display: DisplaySettings;
  notifications: NotificationSettings;
  offline: OfflineSettings;
}

export interface DisplaySettings {
  theme: 'dark' | 'light' | 'auto';
  showImages: boolean;
  showPrices: boolean;
  showCustomerInfo: boolean;
  cardLayout: 'grid' | 'list';
  itemsPerRow: number;
  autoScroll: boolean;
  scrollInterval: number;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  urgentFlash: boolean;
}

export interface OfflineSettings {
  enabled: boolean;
  syncInterval: number;
  maxCachedOrders: number;
}

// WebSocket Events
export type WebSocketEventType =
  | 'order:new'
  | 'order:updated'
  | 'order:cancelled'
  | 'order:bumped'
  | 'station:update'
  | 'sync:required';

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
}
