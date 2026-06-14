/**
 * Channel Manager API Service
 * Manages OTA (Online Travel Agency) integrations for hotel/property management
 */

import { apiClient } from './client';

export type ChannelType = 'booking_com' | 'expedia' | 'airbnb' | 'makemytrip' | 'goibibo';

export interface ChannelConfig {
  channelType: ChannelType;
  channelName: string;
  isConnected: boolean;
  credentials: {
    apiKey?: string;
    propertyId?: string;
    secretKey?: string;
    propertyCode?: string;
  };
  syncSettings: {
    autoSyncAvailability: boolean;
    autoSyncRates: boolean;
    syncFrequency: 'realtime' | 'hourly' | 'daily';
    lastSyncAt?: string;
  };
  metadata: {
    connectedAt?: string;
    connectionStatus: 'active' | 'inactive' | 'error' | 'pending';
    errorMessage?: string;
    apiCallsUsed?: number;
    apiCallsLimit?: number;
  };
}

export interface ChannelAvailability {
  date: string;
  availableRooms: number;
  price: number;
  currency: string;
  minStay: number;
  maxStay: number;
  closedToArrival: boolean;
  closedToDeparture: boolean;
}

export interface ChannelBooking {
  bookingId: string;
  channelType: ChannelType;
  channelBookingId: string;
  propertyId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  roomsCount: number;
  guestCount: number;
  totalAmount: number;
  commission: number;
  netAmount: number;
  currency: string;
  status: 'confirmed' | 'cancelled' | 'modified' | 'pending' | 'completed';
  specialRequests?: string;
  bookingDate: string;
  source: string;
  channelReference?: string;
}

export interface ChannelSyncStatus {
  channelType: ChannelType;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  status: 'synced' | 'syncing' | 'pending' | 'error' | 'never';
  bookingsSynced: number;
  availabilitySynced: number;
  ratesSynced: number;
  errors: string[];
}

export interface ChannelRevenue {
  channelType: ChannelType;
  totalBookings: number;
  grossRevenue: number;
  commission: number;
  netRevenue: number;
  averageBookingValue: number;
  occupancyRate: number;
  period: {
    start: string;
    end: string;
  };
}

export interface ConnectChannelRequest {
  storeId: string;
  channelType: ChannelType;
  credentials: {
    apiKey?: string;
    propertyId?: string;
    secretKey?: string;
    propertyCode?: string;
  };
}

export interface UpdateSyncSettingsRequest {
  storeId: string;
  channelType: ChannelType;
  settings: Partial<ChannelConfig['syncSettings']>;
}

class ChannelManagerService {
  /**
   * Get all channel configurations for a store
   */
  async getChannels(storeId: string): Promise<ChannelConfig[]> {
    try {
      const response = await apiClient.get<ChannelConfig[]>(`merchant/channels?storeId=${storeId}`);
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch channels');
    } catch (error) {
      if (__DEV__) console.error('Get channels error:', error);
      throw new Error(error.message || 'Failed to fetch channels');
    }
  }

  /**
   * Get only connected channels
   */
  async getConnectedChannels(storeId: string): Promise<ChannelConfig[]> {
    try {
      const response = await apiClient.get<ChannelConfig[]>(
        `merchant/channels/connected?storeId=${storeId}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch connected channels');
    } catch (error) {
      if (__DEV__) console.error('Get connected channels error:', error);
      throw new Error(error.message || 'Failed to fetch connected channels');
    }
  }

  /**
   * Connect a channel with credentials
   */
  async connectChannel(
    storeId: string,
    channelType: ChannelType,
    credentials: {
      apiKey?: string;
      propertyId?: string;
      secretKey?: string;
      propertyCode?: string;
    }
  ): Promise<ChannelConfig> {
    try {
      const response = await apiClient.post<ChannelConfig>('merchant/channels/connect', {
        storeId,
        channelType,
        credentials,
      });
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to connect channel');
    } catch (error) {
      if (__DEV__) console.error('Connect channel error:', error);
      throw new Error(error.message || 'Failed to connect channel');
    }
  }

  /**
   * Disconnect a channel
   */
  async disconnectChannel(storeId: string, channelType: ChannelType): Promise<void> {
    try {
      const response = await apiClient.post<{ success: boolean }>('merchant/channels/disconnect', {
        storeId,
        channelType,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect channel');
      }
    } catch (error) {
      if (__DEV__) console.error('Disconnect channel error:', error);
      throw new Error(error.message || 'Failed to disconnect channel');
    }
  }

  /**
   * Update sync settings for a channel
   */
  async updateSyncSettings(
    storeId: string,
    channelType: ChannelType,
    settings: Partial<ChannelConfig['syncSettings']>
  ): Promise<ChannelConfig> {
    try {
      const response = await apiClient.post<ChannelConfig>('merchant/channels/sync-settings', {
        storeId,
        channelType,
        settings,
      });
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to update sync settings');
    } catch (error) {
      if (__DEV__) console.error('Update sync settings error:', error);
      throw new Error(error.message || 'Failed to update sync settings');
    }
  }

  /**
   * Get sync status for all channels
   */
  async getSyncStatus(storeId: string): Promise<ChannelSyncStatus[]> {
    try {
      const response = await apiClient.get<ChannelSyncStatus[]>(
        `merchant/channels/sync-status?storeId=${storeId}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch sync status');
    } catch (error) {
      if (__DEV__) console.error('Get sync status error:', error);
      throw new Error(error.message || 'Failed to fetch sync status');
    }
  }

  /**
   * Trigger manual sync for a channel
   */
  async triggerSync(
    storeId: string,
    channelType: ChannelType
  ): Promise<{ success: boolean; synced: number; errors: string[] }> {
    try {
      const response = await apiClient.post<{ success: boolean; synced: number; errors: string[] }>(
        'merchant/channels/sync',
        { storeId, channelType }
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to trigger sync');
    } catch (error) {
      if (__DEV__) console.error('Trigger sync error:', error);
      throw new Error(error.message || 'Failed to trigger sync');
    }
  }

  /**
   * Sync availability for a channel
   */
  async syncAvailability(
    storeId: string,
    channelType: ChannelType,
    availability: ChannelAvailability[]
  ): Promise<{ success: boolean; synced: number; errors: string[] }> {
    try {
      const response = await apiClient.post<{ success: boolean; synced: number; errors: string[] }>(
        'merchant/channels/sync/availability',
        { storeId, channelType, availability }
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to sync availability');
    } catch (error) {
      if (__DEV__) console.error('Sync availability error:', error);
      throw new Error(error.message || 'Failed to sync availability');
    }
  }

  /**
   * Get bookings from OTA channels
   */
  async getBookings(
    storeId: string,
    options?: {
      channelType?: ChannelType;
      status?: ChannelBooking['status'];
      checkInFrom?: string;
      checkInTo?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<{ bookings: ChannelBooking[]; total: number }> {
    try {
      const params = new URLSearchParams();
      params.append('storeId', storeId);
      if (options?.channelType) params.append('channelType', options.channelType);
      if (options?.status) params.append('status', options.status);
      if (options?.checkInFrom) params.append('checkInFrom', options.checkInFrom);
      if (options?.checkInTo) params.append('checkInTo', options.checkInTo);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.skip) params.append('skip', options.skip.toString());

      const response = await apiClient.get<ChannelBooking[]>(
        `merchant/channels/bookings?${params.toString()}`
      );
      if (response.success && response.data) {
        return {
          bookings: response.data || [],
          total: 0,
        };
      }
      throw new Error(response.error || 'Failed to fetch bookings');
    } catch (error) {
      if (__DEV__) console.error('Get bookings error:', error);
      throw new Error(error.message || 'Failed to fetch bookings');
    }
  }

  /**
   * Get revenue statistics from channels
   */
  async getRevenue(storeId: string, fromDate: string, toDate: string): Promise<ChannelRevenue[]> {
    try {
      const response = await apiClient.get<ChannelRevenue[]>(
        `merchant/channels/revenue?storeId=${storeId}&fromDate=${fromDate}&toDate=${toDate}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch revenue');
    } catch (error) {
      if (__DEV__) console.error('Get revenue error:', error);
      throw new Error(error.message || 'Failed to fetch revenue');
    }
  }

  /**
   * Get channel booking by ID
   */
  async getBooking(storeId: string, bookingId: string): Promise<ChannelBooking | null> {
    try {
      const response = await apiClient.get<ChannelBooking>(
        `merchant/channels/bookings/${bookingId}?storeId=${storeId}`
      );
      if (response.success && response.data) return response.data;
      return null;
    } catch (error) {
      if (__DEV__) console.error('Get booking error:', error);
      return null;
    }
  }
}

export const channelManagerService = new ChannelManagerService();
