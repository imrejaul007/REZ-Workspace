/**
 * STAYBOT - Type Definitions
 * All TypeScript interfaces and types for the Hotel AI Operating System
 */

// ============================================
// GUEST TYPES
// ============================================

export interface Guest {
  guestId: string;
  hotelId: string;
  name: string;
  phone: string;
  email: string;
  checkIn: Date;
  checkOut: Date;
  roomNumber: string;
  roomType: RoomType;
  status: GuestStatus;
  loyaltyTier: LoyaltyTier;
  preferences: GuestPreference[];
  requests: string[];
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export type GuestStatus = 'pre-checked-in' | 'checked-in' | 'checked-out' | 'cancelled';
export type LoyaltyTier = 'standard' | 'silver' | 'gold' | 'platinum';
export type RoomType = 'standard' | 'deluxe' | 'suite' | 'presidential';

export interface GuestPreference {
  type: 'diet' | 'room' | 'service' | 'general';
  value: string;
  priority: 'low' | 'medium' | 'high';
}

// ============================================
// ROOM TYPES
// ============================================

export interface Room {
  roomId: string;
  hotelId: string;
  roomNumber: string;
  roomType: RoomType;
  floor: number;
  status: RoomStatus;
  features: string[];
  pricePerNight: number;
  basePrice: number;
  dynamicPrice: number;
  occupancy: number;
  lastCleaned: Date;
  amenities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'blocked';

// ============================================
// BOOKING TYPES
// ============================================

export interface Booking {
  bookingId: string;
  hotelId: string;
  guestId: string;
  guestName: string;
  roomId: string;
  roomNumber: string;
  checkIn: Date;
  checkOut: Date;
  roomType: RoomType;
  totalAmount: number;
  paidAmount: number;
  status: BookingStatus;
  source: BookingSource;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no-show';
export type BookingSource = 'direct' | 'ota' | 'agent' | 'walk-in' | 'corporate';

// ============================================
// COMPLAINT TYPES
// ============================================

export interface Complaint {
  complaintId: string;
  hotelId: string;
  guestId: string;
  roomNumber: string;
  category: ComplaintCategory;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assignedTo?: string;
  resolution?: string;
  compensation?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export type ComplaintCategory =
  | 'room'
  | 'cleanliness'
  | 'service'
  | 'noise'
  | 'wifi'
  | 'food'
  | 'billing'
  | 'staff'
  | 'facilities'
  | 'other';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';
export type ComplaintStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

// ============================================
// HOUSEKEEPING TYPES
// ============================================

export interface HousekeepingTask {
  taskId: string;
  hotelId: string;
  roomNumber: string;
  taskType: HousekeepingTaskType;
  priority: HousekeepingPriority;
  status: HousekeepingStatus;
  assignedTo?: string;
  notes?: string;
  estimatedDuration: number; // minutes
  actualDuration?: number;
  guestComplaint?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export type HousekeepingTaskType =
  | 'standard-clean'
  | 'deep-clean'
  | 'turndown'
  | 'check-out-clean'
  | 'mid-stay-clean'
  | 'emergency-clean';

export type HousekeepingPriority = 'low' | 'normal' | 'high' | 'urgent';
export type HousekeepingStatus = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'inspected';

// ============================================
// ROOM SERVICE TYPES
// ============================================

export interface RoomServiceOrder {
  orderId: string;
  hotelId: string;
  guestId: string;
  roomNumber: string;
  items: RoomServiceItem[];
  status: RoomServiceStatus;
  subtotal: number;
  taxes: number;
  total: number;
  deliveryTime?: number; // minutes
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
}

export interface RoomServiceItem {
  itemId: string;
  name: string;
  category: 'food' | 'beverage' | 'amenity' | 'equipment';
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

export type RoomServiceStatus = 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

// ============================================
// REVENUE TYPES
// ============================================

export interface RevenueMetrics {
  date: string;
  hotelId: string;
  totalRevenue: number;
  roomRevenue: number;
  fnbRevenue: number;
  spaRevenue: number;
  otherRevenue: number;
  occupancyRate: number;
  adr: number; // Average Daily Rate
  revpar: number; // Revenue Per Available Room
  forecast?: number;
}

export interface PricingDecision {
  roomType: RoomType;
  basePrice: number;
  dynamicPrice: number;
  factors: PricingFactor[];
  confidence: number;
  recommendedAction: 'increase' | 'decrease' | 'maintain';
}

export interface PricingFactor {
  name: string;
  impact: number; // -1 to 1
  weight: number;
}

// ============================================
// AI AGENT TYPES
// ============================================

export interface AIAgent {
  id: string;
  name: string;
  type: AIAgentType;
  status: 'active' | 'idle' | 'error';
  capabilities: string[];
  currentTasks: number;
  maxTasks: number;
  lastActive: Date;
}

export type AIAgentType =
  | 'front-desk'
  | 'concierge'
  | 'housekeeping'
  | 'room-service'
  | 'revenue-manager'
  | 'bellhop';

export interface AgentMessage {
  messageId: string;
  sender: string;
  receiver: string;
  type: 'request' | 'response' | 'alert' | 'coordination';
  payload: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: Date;
  expiresAt?: Date;
}

export interface AgentTask {
  taskId: string;
  type: string;
  agentId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  input: Record<string, any>;
  output?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

// ============================================
// AXP PROTOCOL TYPES
// ============================================

export interface AXPMessage {
  header: AXPHeader;
  body: AXPBody;
}

export interface AXPHeader {
  message_id: string;
  timestamp: string;
  sender: string;
  receiver: string;
  action: 'propose' | 'counter' | 'accept' | 'reject' | 'inform' | 'request';
  protocol_version: string;
}

export interface AXPBody {
  intent: string;
  capabilities: string[];
  constraints: Record<string, any>;
  terms: AXPTerms;
  context?: Record<string, any>;
}

export interface AXPTerms {
  price?: number;
  quantity?: number;
  delivery?: string;
  payment_terms?: string;
  sla?: string;
  quality?: string;
}

// ============================================
// HOTEL TYPES
// ============================================

export interface Hotel {
  hotelId: string;
  name: string;
  location: string;
  starRating: number;
  roomCount: number;
  facilities: string[];
  contactInfo: HotelContactInfo;
  settings: HotelSettings;
}

export interface HotelContactInfo {
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
}

export interface HotelSettings {
  checkInTime: string;
  checkOutTime: string;
  lateCheckOutFee: number;
  earlyCheckInFee: number;
  dynamicPricingEnabled: boolean;
  aiAutomationLevel: 'basic' | 'advanced' | 'full';
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface DashboardMetrics {
  totalGuests: number;
  checkedIn: number;
  checkedOut: number;
  pendingBookings: number;
  openComplaints: number;
  roomAvailability: {
    available: number;
    occupied: number;
    maintenance: number;
    cleaning: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  occupancyRate: number;
  adr: number;
  revpar: number;
}
