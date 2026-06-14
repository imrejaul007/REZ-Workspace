/**
 * Channel Integration Service - Data Models
 */

export type ChannelId = 'booking_com' | 'makemytrip' | 'goibibo' | 'expedia' | 'airbnb' | 'google_hotel';

export type ConnectionStatus = 'pending' | 'active' | 'inactive' | 'error';

export type SyncStatus = 'pending' | 'processing' | 'success' | 'failed' | 'partial';

export type SyncType = 'inventory' | 'rates' | 'bookings' | 'full';

export type SyncErrorType = 'AUTH_FAILED' | 'RATE_LIMITED' | 'INVALID_DATA' | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN_CHANNEL';

export interface ChannelCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
  accessToken?: string;
  clientId?: string;
  clientSecret?: string;
  propertyId?: string;
  hotelId?: string;
  partnerId?: string;
  listingId?: string;
}

export interface ChannelConnection {
  id: string;
  hotelId: string;
  channelId: ChannelId;
  status: ConnectionStatus;
  credentials: ChannelCredentials;
  lastSync?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomMapping {
  id: string;
  hotelId: string;
  channelId: ChannelId;
  internalRoomId: string;
  channelRoomId: string;
  channelRoomName: string;
  isActive: boolean;
  createdAt: Date;
}

export interface RatePlan {
  id: string;
  hotelId: string;
  roomId: string;
  channelId: ChannelId;
  ratePlanId: string;
  rateName: string;
  baseRate: number;
  currency: string;
  restrictions: {
    minStay: number;
    maxStay: number;
    closedToArrival: boolean;
    closedToDeparture: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryEntry {
  roomId: string;
  date: string; // ISO date string
  available: number;
  price: number | null;
  currency?: string;
}

export interface SyncLog {
  id: string;
  hotelId: string;
  channelId: ChannelId;
  syncType: SyncType;
  status: SyncStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  totalRecords?: number;
  syncedRecords?: number;
  failedRecords?: number;
  errors?: Array<{
    type: SyncErrorType;
    message: string;
    recordId?: string;
  }>;
  createdAt: Date;
}

export interface NormalizedBooking {
  channelBookingId: string;
  channel: ChannelId;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkinDate: Date;
  checkoutDate: Date;
  totalAmount: number;
  currency: string;
  roomId: string;
  guestCount?: number;
  specialRequests?: string;
  status: 'confirmed' | 'cancelled' | 'modified' | 'checked_in' | 'checked_out';
  rawData?: Record<string, unknown>;
}

export interface ChannelAnalytics {
  channelId: ChannelId;
  period: string;
  totalBookings: number;
  totalRevenue: number;
  netRevenue: number;
  avgDailyRate: number;
  occupancyRate: number;
  commissionPaid: number;
  conversionRate: number;
  views: number;
}

export interface ChannelRevenue {
  channelId: ChannelId;
  revenue: number;
  bookings: number;
  avgBookingValue: number;
}
