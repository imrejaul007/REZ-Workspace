/**
 * CRM Types for Customer Profile and Campaign Management
 *
 * This module defines all TypeScript types and Zod schemas for:
 * - Customer profiles with behavior tracking
 * - Campaign targeting and delivery
 * - Segment management
 */

// ============================================================
// ENUMS
// ============================================================

export enum CustomerSegment {
  NEW = 'new',
  REGULAR = 'regular',
  VIP = 'vip',
  AT_RISK = 'at-risk',
  CHURNED = 'churned',
}

export enum ChurnRisk {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum OrderFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  OCCASIONAL = 'occasional',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum CampaignChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

export enum FulfillmentType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
  DINE_IN = 'dine-in',
}

// ============================================================
// CUSTOMER PROFILE INTERFACES
// ============================================================

export interface FavoriteItem {
  itemId: string;
  itemName: string;
  orderCount: number;
  lastOrderedAt: Date;
  totalSpend: number;
}

export interface CustomerPreferences {
  favoriteItems: FavoriteItem[];
  dietaryRestrictions: string[];
  preferredPaymentMethod: string;
  preferredOrderType: FulfillmentType;
  avgOrderValue: number;
  orderFrequency: OrderFrequency;
}

export interface CustomerBehavior {
  lastOrderDate: Date | null;
  totalOrders: number;
  lifetimeValue: number;
  churnRisk: ChurnRisk;
  engagementScore: number; // 0-100
  avgDaysBetweenOrders: number | null;
  firstOrderDate: Date | null;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  restaurantId: string;
  preferences: CustomerPreferences;
  behavior: CustomerBehavior;
  segment: CustomerSegment;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastInteraction: Date;
}

// ============================================================
// CAMPAIGN INTERFACES
// ============================================================

export interface CampaignTarget {
  segment?: CustomerSegment;
  minLifetimeValue?: number;
  maxLifetimeValue?: number;
  dietaryRestrictions?: string[];
  tags?: string[];
  excludeChurned?: boolean;
  minOrderCount?: number;
  maxOrderCount?: number;
  orderTypes?: FulfillmentType[];
  joinDateAfter?: Date;
  joinDateBefore?: Date;
}

export interface CampaignMessage {
  subject?: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
}

export interface Campaign {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  target: CampaignTarget;
  message: CampaignMessage;
  channel: CampaignChannel;
  status: CampaignStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  totalRecipients: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  openedCount: number;
  clickedCount: number;
  convertedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignMetrics {
  campaignId: string;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  converted: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
}

// ============================================================
// ORDER INTEGRATION
// ============================================================

export interface OrderData {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  items: OrderItemData[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: string;
  fulfillmentType: FulfillmentType;
  status: string;
  createdAt: Date;
}

export interface OrderItemData {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalAmount: number;
}

// ============================================================
// SIMILARITY & RECOMMENDATIONS
// ============================================================

export interface CustomerSimilarity {
  userId: string;
  similarityScore: number; // 0-1
  sharedPreferences: string[];
  sharedBehavior: {
    avgOrderValueDiff: number;
    frequencyDiff: number;
  };
}

export interface CustomerRecommendation {
  type: 'item' | 'offer' | 'campaign';
  itemId?: string;
  itemName?: string;
  offer?: string;
  reason: string;
  confidence: number; // 0-1
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface CustomerProfileResponse {
  success: boolean;
  profile?: CustomerProfile;
  error?: string;
}

export interface CampaignTargetsResponse {
  success: boolean;
  targets: CustomerProfile[];
  total: number;
  metrics: {
    avgLifetimeValue: number;
    segmentBreakdown: Record<CustomerSegment, number>;
  };
}

export interface CampaignResponse {
  success: boolean;
  campaign?: Campaign;
  error?: string;
}

export interface SegmentStats {
  segment: CustomerSegment;
  count: number;
  avgLifetimeValue: number;
  avgEngagementScore: number;
  totalRevenue: number;
}

export interface SegmentStatsResponse {
  success: boolean;
  stats: SegmentStats[];
  total: number;
}
