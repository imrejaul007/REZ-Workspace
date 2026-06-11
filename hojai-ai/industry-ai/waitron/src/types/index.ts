/**
 * WAITRON - TypeScript Types
 * Restaurant AI Agent System Types
 */

// ============================================
// CORE TYPES
// ============================================

export interface Restaurant {
  restaurantId: string;
  name: string;
  ownerId: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  cuisine: string[];
  operatingHours: OperatingHours;
  tables: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatingHours {
  [day: string]: { open: string; close: string; closed?: boolean };
}

export interface MenuItem {
  itemId: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  preparationTime: number; // minutes
  ingredients: Ingredient[];
  dietary: DietaryInfo;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  currentStock: number;
  minStock: number; // reorder threshold
  supplierId?: string;
  lastOrdered?: Date;
}

export interface DietaryInfo {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  containsNuts: boolean;
  containsDairy: boolean;
  spicy?: 1 | 2 | 3;
}

// ============================================
// ORDER TYPES
// ============================================

export interface Order {
  orderId: string;
  restaurantId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  orderType: 'dine-in' | 'takeout' | 'delivery';
  tableNumber?: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  assignedAgent?: string;
  estimatedPrepTime?: number;
  actualPrepTime?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface OrderItem {
  itemId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  ingredients?: { name: string; used: number }[];
}

export type OrderStatus =
  | 'received'      // Order received
  | 'confirmed'     // Kitchen confirmed
  | 'preparing'     // Being prepared
  | 'ready'         // Ready for serving/delivery
  | 'served'        // Delivered to customer
  | 'completed'     // Payment completed
  | 'cancelled';    // Order cancelled

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet' | 'card_on_delivery';

// ============================================
// RESERVATION TYPES
// ============================================

export interface Reservation {
  reservationId: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  time: string;
  partySize: number;
  tablePreference?: string;
  specialRequests?: string;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'no_show' | 'cancelled';

// ============================================
// INVENTORY TYPES
// ============================================

export interface InventoryItem {
  itemId: string;
  restaurantId: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  costPerUnit: number;
  supplierId?: string;
  lastOrdered?: Date;
  lastReceived?: Date;
  expiresInDays?: number;
  status: InventoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired' | 'discontinued';

export interface PurchaseOrder {
  orderId: string;
  restaurantId: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  deliveryCost: number;
  total: number;
  status: PurchaseOrderStatus;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  received?: number;
}

export type PurchaseOrderStatus = 'draft' | 'sent' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

// ============================================
// AGENT TYPES
// ============================================

export interface Agent {
  agentId: string;
  type: AgentType;
  name: string;
  description: string;
  capabilities: string[];
  status: AgentStatus;
  currentTasks: string[];
  performance: AgentPerformance;
  registeredAt: Date;
  lastActive: Date;
}

export type AgentType =
  | 'waiter'        // Takes orders from customers
  | 'kitchen'        // Manages kitchen operations
  | 'inventory'      // Manages inventory and supplies
  | 'reservations'   // Manages table reservations
  | 'billing'        // Processes payments
  | 'catering'       // Handles catering orders
  | 'manager';       // Restaurant manager

export type AgentStatus = 'idle' | 'busy' | 'offline' | 'error';

export interface AgentPerformance {
  tasksCompleted: number;
  avgResponseTime: number; // ms
  successRate: number;     // 0-100
  lastEvaluation?: Date;
}

export interface AgentTask {
  taskId: string;
  type: string;
  agentId: string;
  status: TaskStatus;
  input: any;
  output?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

// ============================================
// AXP PROTOCOL TYPES
// ============================================

export interface AXPMessage {
  header: AXPHeader;
  body: AXPBody;
}

export interface AXPHeader {
  messageId: string;
  timestamp: string;
  sender: string;       // Agent ID
  receiver: string;     // Agent ID or 'broadcast'
  action: AXPAction;
  replyTo?: string;      // Original message ID for replies
  conversationId?: string;
}

export type AXPAction =
  | 'propose'      // Make a proposal
  | 'counter'       // Counter-proposal
  | 'accept'        // Accept proposal
  | 'reject'        // Reject proposal
  | 'request'       // Request information
  | 'inform'        // Inform about something
  | 'confirm'       // Confirm something
  | 'cancel';       // Cancel transaction

export interface AXPBody {
  intent: string;                    // What the message is about
  capabilities?: string[];           // Agent capabilities
  constraints?: Record<string, any>;  // Constraints
  terms: AXPTerms;
  data?: Record<string, any>;         // Additional data
}

export interface AXPTerms {
  price?: number;
  quantity?: number;
  delivery?: string;      // ISO date
  paymentTerms?: string;  // net_15, net_30, etc.
  quality?: string;
  warranty?: string;
}

export interface AXPConversation {
  conversationId: string;
  participants: string[];
  messages: AXPMessage[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SUPPLIER & SUPPLY NETWORK TYPES
// ============================================

export interface Supplier {
  supplierId: string;
  name: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  rating: number;           // 0-5
  deliveryDays: number;     // Days for delivery
  minimumOrder: number;     // Minimum order value
  paymentTerms: string;
  verified: boolean;
  trustScore: number;       // 0-100
  products: SupplierProduct[];
  createdAt: Date;
}

export interface SupplierProduct {
  itemName: string;
  category: string;
  unitPrice: number;
  unit: string;
  minQuantity: number;
  available: boolean;
}

export interface SupplyRequest {
  requestId: string;
  restaurantId: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  neededBy: Date;
  budget?: number;
  preferredSupplier?: string;
  status: 'pending' | 'searching' | 'quoted' | 'ordered' | 'delivered';
  quotes: SupplyQuote[];
  selectedQuote?: SupplyQuote;
  createdAt: Date;
}

export interface SupplyQuote {
  quoteId: string;
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  totalPrice: number;
  deliveryDate: Date;
  paymentTerms: string;
  validUntil: Date;
}

// ============================================
// TRADE FINANCE TYPES
// ============================================

export interface CreditLine {
  creditLineId: string;
  entityId: string;
  entityType: 'restaurant' | 'supplier' | 'distributor';
  limit: number;
  used: number;
  available: number;
  interestRate: number;
  paymentTerms: string;
  status: 'active' | 'suspended' | 'closed';
  validUntil: Date;
}

export interface Transaction {
  transactionId: string;
  fromEntity: string;
  toEntity: string;
  amount: number;
  currency: string;
  type: 'payment' | 'credit' | 'refund';
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  createdAt: Date;
}

// ============================================
// WAITRON AI CONTEXT
// ============================================

export interface WaiterContext {
  restaurantId: string;
  customerId?: string;
  sessionId: string;
  orderHistory?: Order[];
  preferences?: CustomerPreferences;
  dietaryRestrictions?: string[];
  currentOrder?: Order;
}

export interface CustomerPreferences {
  favoriteItems: string[];
  preferredPaymentMethod: PaymentMethod;
  tippingPercentage?: number;
  notes?: string;
}

export interface KitchenContext {
  restaurantId: string;
  currentOrders: Order[];
  prepTimes: Map<string, number>; // itemId -> avg prep time
  staffAvailability: number;
  equipmentStatus: Map<string, 'available' | 'busy' | 'broken'>;
}

export interface InventoryContext {
  restaurantId: string;
  items: InventoryItem[];
  lowStockItems: InventoryItem[];
  outOfStockItems: InventoryItem[];
  pendingOrders: PurchaseOrder[];
  recentAlerts: InventoryAlert[];
}

export interface InventoryAlert {
  alertId: string;
  itemId: string;
  itemName: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring' | 'price_change';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  acknowledged?: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message?: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    processingTime?: number;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// EVENT TYPES
// ============================================

export interface WaitronEvent {
  eventId: string;
  eventType: WaitronEventType;
  source: string;
  target?: string;
  payload: any;
  timestamp: Date;
}

export type WaitronEventType =
  | 'order.received'
  | 'order.confirmed'
  | 'order.preparing'
  | 'order.ready'
  | 'order.served'
  | 'order.completed'
  | 'order.cancelled'
  | 'inventory.low'
  | 'inventory.out'
  | 'inventory.received'
  | 'reservation.created'
  | 'reservation.confirmed'
  | 'agent.message'
  | 'agent.task.completed'
  | 'supply.quote.received'
  | 'supply.order.placed'
  | 'supply.order.delivered';
