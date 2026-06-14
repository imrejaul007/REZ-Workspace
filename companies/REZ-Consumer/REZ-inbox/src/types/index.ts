/**
 * REZ Inbox - Type Definitions
 */

export type MessageCategory =
  | 'travel'
  | 'food'
  | 'invoice'
  | 'subscription'
  | 'banking'
  | 'social'
  | 'promotion'
  | 'other';

export type MessageStatus = 'unread' | 'read' | 'archived' | 'deleted';

export interface EmailMessage {
  id: string;
  userId: string;

  // Email data
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  date: string;

  // Parsed data
  category: MessageCategory;
  extractedData?: ExtractedData;

  // Status
  status: MessageStatus;
  isStarred: boolean;
  isImportant: boolean;

  // Threading
  threadId?: string;
  replyTo?: string;

  // Attachments
  attachments: Attachment[];

  // Meta
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedData {
  // Travel
  bookingReference?: string;
  flightDetails?: {
    airline: string;
    flightNumber: string;
    from: string;
    to: string;
    departureTime: string;
    arrivalTime: string;
    passengerName: string;
    seat?: string;
    pnr?: string;
  };
  hotelDetails?: {
    hotelName: string;
    address: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
    guestName: string;
    bookingRef: string;
  };

  // Food
  orderDetails?: {
    restaurantName: string;
    orderId: string;
    items: string[];
    total: number;
    deliveryAddress?: string;
    estimatedDelivery?: string;
  };

  // Invoice
  invoiceDetails?: {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    amount: number;
    taxAmount?: number;
    items: InvoiceItem[];
    vendorName: string;
    vendorAddress?: string;
  };

  // Subscription
  subscriptionDetails?: {
    serviceName: string;
    plan: string;
    amount: number;
    billingCycle: 'monthly' | 'yearly';
    nextBillingDate: string;
  };
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

export interface MessageThread {
  id: string;
  userId: string;
  subject: string;
  category: MessageCategory;
  lastMessageAt: string;
  messageCount: number;
  participants: string[];
  labels: string[];
  isMuted: boolean;
  isPinned: boolean;
  createdAt: string;
}

export interface EmailParseRequest {
  emailId: string;
  from: string;
  subject: string;
  body: string;
  attachments?: Attachment[];
  timestamp?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UserPreferences {
  userId: string;
  autoCategorize: boolean;
  showPromotions: boolean;
  archiveOld: boolean;
  archiveAfterDays?: number;
  forwardAddresses?: string[];
  labels: string[];
}
