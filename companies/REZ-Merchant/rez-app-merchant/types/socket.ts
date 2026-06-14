// Socket.IO event types for real-time updates
import { DashboardMetrics, DashboardOverview, DashboardNotification } from './dashboard';
import { OrderEvent } from './orders';
import { CashbackEvent } from './cashback';
import { ProductEvent } from './products';

// Client to Server Events
export interface ClientToServerEvents {
  // Dashboard subscriptions
  'join-merchant-dashboard': (merchantId: string) => void;
  'leave-merchant-dashboard': (merchantId: string) => void;

  // Specific data subscriptions
  'subscribe-metrics': (merchantId: string) => void;
  'subscribe-orders': (merchantId: string) => void;
  'subscribe-cashback': (merchantId: string) => void;
  'subscribe-products': (merchantId: string) => void;
  'subscribe-notifications': (merchantId: string) => void;

  // Unsubscribe from updates
  'unsubscribe-metrics': (merchantId: string) => void;
  'unsubscribe-orders': (merchantId: string) => void;
  'unsubscribe-cashback': (merchantId: string) => void;
  'unsubscribe-products': (merchantId: string) => void;
  'unsubscribe-notifications': (merchantId: string) => void;

  // Phase 3: Subscribe to fraud/flag/moderation events
  'subscribe-fraud-alerts': (merchantId: string) => void;
  'unsubscribe-fraud-alerts': (merchantId: string) => void;
  'subscribe-feature-flags': (merchantId: string) => void;
  'unsubscribe-feature-flags': (merchantId: string) => void;
  'subscribe-moderation': (merchantId: string) => void;
  'unsubscribe-moderation': (merchantId: string) => void;

  // Ping for connection testing
  ping: (timestamp: number) => void;
}

// Server to Client Events
export interface ServerToClientEvents {
  // Initial data when joining dashboard
  'initial-dashboard-data': (data: {
    metrics: DashboardMetrics;
    overview: DashboardOverview;
    notifications: DashboardNotification[];
  }) => void;

  // Live metrics updates (every 30 seconds)
  'metrics-updated': (data: DashboardMetrics) => void;

  // Granular live metrics stream (emitted to metrics-${id} subscribers)
  'live-metrics': (data: { metrics: DashboardMetrics; timestamp: Date }) => void;

  // Dashboard-level event wrapper (order/cashback/product events via dashboard room)
  'dashboard-event': (event: { type: string; data; timestamp: Date }) => void;

  // Overview updates (every 60 seconds)
  'overview-updated': (data: DashboardOverview) => void;

  // Real-time event streams
  'order-event': (event: OrderEvent) => void;
  'cashback-event': (event: CashbackEvent) => void;
  'product-event': (event: ProductEvent) => void;

  // System notifications
  'system-notification': (notification: DashboardNotification) => void;
  'notification-read': (notificationId: string) => void;
  'notification-deleted': (notificationId: string) => void;

  // Connection events
  'connection-status': (status: 'connected' | 'disconnected' | 'reconnecting') => void;
  error: (error: SocketError) => void;
  pong: (timestamp: number) => void;

  // Merchant-specific events
  'merchant-settings-updated': (settings) => void;
  'merchant-status-changed': (data: MerchantStatusChangeEvent) => void;

  // Specific merchant lifecycle events (from admin actions)
  merchant_approved: (data: { merchantId: string; message: string }) => void;
  merchant_rejected: (data: { merchantId: string; reason: string; message: string }) => void;
  merchant_suspended: (data: { reason: string; suspendedAt: Date }) => void;
  merchant_reactivated: (data: { reactivatedAt: Date }) => void;

  // Stuck order alert (from background job — order not progressing)
  ORDER_STUCK_ALERT: (data: {
    type: 'preparation_stuck' | 'delivery_stuck';
    orderId: string;
    orderNumber: string;
    status: string;
    message: string;
    timestamp: Date;
  }) => void;

  // Bulk operation updates
  'bulk-operation-progress': (data: BulkOperationProgress) => void;
  'bulk-operation-completed': (data: BulkOperationResult) => void;

  // Analytics updates
  'analytics-updated': (data: {
    type: 'dashboard' | 'orders' | 'cashback' | 'products';
    data;
  }) => void;

  // Coin redemption events
  'payment:coins_redeemed': (data: {
    billId: string;
    userId: string;
    coinsUsed: number;
    rupeeValue: number;
    billAmount: number;
    timestamp: string;
  }) => void;

  // MISS-01/03: Refund events from payment-service via monolith Socket.IO
  'refund-event': (data: {
    id: string;
    orderId: string;
    orderNumber?: string;
    paymentId: string;
    refundId: string;
    amount: number;
    status: 'refund_processed' | 'refund_failed' | 'refund_disputed';
    timestamp: string;
  }) => void;

  // MISS-02: Settlement credited event from wallet-service via monolith Socket.IO
  'wallet-event': (data: {
    id: string;
    orderId: string;
    orderNumber?: string;
    amount: number;
    platformFee: number;
    netAmount: number;
    transactionId: string;
    type: 'settlement_credited';
    timestamp: string;
  }) => void;

  // ── Phase 3: Fraud, Feature Flags, Moderation events ──

  // Fraud alert — anomaly detected for this merchant's transactions
  'fraud-alert': (data: {
    alertId: string;
    type: string;
    status: 'monitoring' | 'escalated';
    value?: number;
    threshold?: number;
    flaggedAt: string;
  }) => void;

  // Feature flag changed for this merchant (admin toggled a flag)
  'feature-flag-changed': (data: {
    flagKey: string;
    enabled: boolean;
    isOverridden: boolean;
    overrideReason?: string;
  }) => void;

  // Content moderation status update (review/photo approved/rejected)
  'moderation-update': (data: {
    contentType: 'review' | 'photo' | 'ugc';
    contentId: string;
    previousStatus: string;
    newStatus: string;
    updatedAt: string;
  }) => void;

  // Web QR order events
  'web-order:new': (data: {
    orderId: string;
    orderNumber: string;
    items: unknown[];
    total: number;
    tableNumber?: string;
    customerPhone: string;
    customerName?: string;
    channel: string;
  }) => void;

  'web-order:cancelled': (data: {
    orderId: string;
    orderNumber: string;
    reason?: string;
    cancelledAt?: string;
  }) => void;

  // Web QR order status update
  'web-order:status-update': (data: { orderNumber: string; status: string }) => void;

  // Parcel request from web ordering
  'parcel-request': (data: { orderNumber: string }) => void;

  // Waiter call from web ordering
  'waiter-call': (data: { tableNumber: string; reason: string }) => void;
}

// Standardized order alert payload — matches backend OrderAlertPayload.
// All ORDER_ALERT and ORDER_STUCK_ALERT events follow this shape.
export interface OrderAlertPayload {
  type: string; // e.g. 'preparation_stuck', 'delivery_stuck'
  severity?: 'warning' | 'critical';
  message: string;
  timestamp: Date;
  orderId?: string;
  orderNumber?: string;
  status?: string;
  count?: number;
  threshold?: string;
}

// Merchant status change event (unified event from admin actions)
export interface MerchantStatusChangeEvent {
  status: 'active' | 'inactive' | 'suspended';
  merchantId: string;
  reason?: string;
  message: string;
  changedAt: string;
}

// Socket error types
export interface SocketError {
  type: 'authentication' | 'permission' | 'rate_limit' | 'server_error' | 'validation';
  message: string;
  code?: string;
  details?;
  timestamp: string;
}

// Bulk operation progress tracking
export interface BulkOperationProgress {
  operationId: string;
  type: 'order_update' | 'cashback_action' | 'product_update' | 'export';
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  status: 'in_progress' | 'paused' | 'cancelled';
  eta?: number; // Estimated time remaining in seconds
  message?: string;
}

export interface BulkOperationResult {
  operationId: string;
  type: 'order_update' | 'cashback_action' | 'product_update' | 'export';
  status: 'completed' | 'failed' | 'partial';
  results: {
    successful: number;
    failed: number;
    total: number;
  };
  errors?: Array<{
    item: string;
    error: string;
  }>;
  downloadUrl?: string; // For export operations
  completedAt: string;
}

// Real-time alert types
export interface RealTimeAlert {
  id: string;
  type: 'low_stock' | 'high_risk_cashback' | 'large_order' | 'system_issue' | 'payment_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data?;
  timestamp: string;
  autoResolve: boolean;
  resolveAfter?: number; // Seconds
}

// Socket connection configuration
export interface SocketConfig {
  url: string;
  options: {
    auth: {
      token: string;
    };
    transports: ['websocket', 'polling'];
    timeout: number;
    reconnection: boolean;
    reconnectionDelay: number;
    reconnectionAttempts: number;
    maxReconnectionAttempts: number;
  };
}

// Socket connection states
export type SocketConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error'
  | 'timeout'
  | 'degraded';

// Socket event subscriptions management
export interface SocketSubscription {
  merchantId: string;
  subscriptions: {
    metrics: boolean;
    orders: boolean;
    cashback: boolean;
    products: boolean;
    notifications: boolean;
  };
  joinedAt: string;
  lastActivity: string;
}

// Live dashboard update types
export interface LiveDashboardUpdate {
  type: 'metrics' | 'overview' | 'notification' | 'alert';
  data;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
}

// Real-time statistics for connection monitoring
export interface SocketStats {
  connectionUptime: number;
  messagesReceived: number;
  messagesSent: number;
  reconnectionCount: number;
  lastReconnectionAt?: string;
  averageLatency: number;
  subscriptionCount: number;
}

// Socket middleware for authentication and validation
export interface SocketMiddleware {
  authenticate: (token: string) => Promise<boolean>;
  validateMerchant: (merchantId: string, userId: string) => Promise<boolean>;
  rateLimit: (socketId: string, action: string) => Promise<boolean>;
  logActivity: (socketId: string, event: string, data?) => void;
}
