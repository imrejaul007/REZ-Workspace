/**
 * @rez/chat - Stub package
 * Real implementation would connect to REZ Chat Service
 */

// Types
export interface AIAppType {
  appId?: string;
  type: string;
}

export interface CustomerContext {
  customerId?: string;
  storeId?: string;
  orderId?: string;
  name?: string;
  email?: string;
  phone?: string;
  tier?: string;
  preferences?: Record<string, unknown>;
  recentOrders?: unknown[];
  bookings?: unknown[];
}

// Stub components
export function AIFloatingChat(props: {
  appType: AIAppType | string;
  customerContext?: CustomerContext;
  className?: string;
  // Hotel-specific props
  industryCategory?: string;
  userId?: string;
  merchantId?: string;
  socketUrl?: string;
  position?: string;
  themeColor?: string;
  showSuggestions?: boolean;
  enableTransfer?: boolean;
  token?: string;
  onEscalate?: (data: unknown) => void;
  onAction?: (action: unknown) => void;
}) {
  return null; // Stub component
}

export function AIChatWidget(props: {
  appType: AIAppType | string;
  customerContext?: CustomerContext;
}): unknown {
  return null;
}

// Event types for store chat
export const STORE_CHAT_EVENTS = {
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_SENT: 'message_sent',
  TYPING_START: 'typing_start',
  TYPING_END: 'typing_end',
  CONNECTION_ESTABLISHED: 'connection_established',
  CONNECTION_ERROR: 'connection_error',
} as const;


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-chat-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
