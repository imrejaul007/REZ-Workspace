/**
 * Notifications API Service
 * Handles all notification-related API calls for the merchant app
 *
 * Features:
 * - Fetch and manage notifications
 * - Mark notifications as read
 * - Delete notifications
 * - Manage notification preferences (email/SMS)
 * - Support for 11+ email templates
 * - SendGrid and Twilio integration
 *
 * Backend Endpoints:
 * - GET    /api/merchant/notifications
 * - PUT    /api/merchant/notifications/settings
 * - POST   /api/merchant/notifications/:id/mark-read
 * - POST   /api/merchant/notifications/mark-all-read
 * - DELETE /api/merchant/notifications/:id
 * - GET    /api/merchant/notifications/preferences
 * - PUT    /api/merchant/notifications/preferences
 */

import { apiClient, ApiResponse, PaginatedResponse } from './client';
import { storageService } from '../storage';
import { getApiUrl } from '../../config/api';
import { devLog, devWarn } from '../../utils/devLog';
import {
  Notification,
  NotificationWithDelivery,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
  NotificationPreferences,
  GetNotificationsRequest,
  GetNotificationsResponse,
  MarkNotificationReadRequest,
  MarkNotificationReadResponse,
  MarkAllNotificationsReadRequest,
  MarkAllNotificationsReadResponse,
  DeleteNotificationRequest,
  DeleteNotificationResponse,
  GetNotificationPreferencesResponse,
  UpdateNotificationPreferencesRequest,
  UpdateNotificationPreferencesResponse,
  GetNotificationStatsResponse,
  NotificationStats,
  OrderNotification,
  CashbackNotification,
  ProductNotification,
  TeamNotification,
  PaymentNotification,
} from '../../types/notifications';

/**
 * NotificationsService handles all notification operations
 */

// MA-GAP-163: Typed return interface for token operations — must be at module level (not inside class)
interface TokenRegistrationResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

class NotificationsService {
  private cacheKey = 'notifications_cache';
  private preferencesKey = 'notification_preferences_cache';
  private statsKey = 'notification_stats_cache';
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all notifications for current merchant
   * Supports filtering, pagination, and sorting
   */
  async getNotifications(request?: GetNotificationsRequest): Promise<Notification[]> {
    try {
      devLog('📬 Fetching notifications...', request);

      const params = this.buildNotificationParams(request);
      const url = `${getApiUrl('merchant/notifications')}${params}`;

      // rez-merchant-service returns { success, data: Notification[], pagination: {...} }
      // (not the getPaginated shape { data: { items: [] } })
      const response = await apiClient.get<Notification[]>(url);

      if (response.success) {
        // data may be an array directly, or wrapped — normalise both shapes
        const items: Notification[] = Array.isArray(response.data)
          ? response.data
          : ((response.data as unknown)?.items ?? []);
        devLog('✅ Notifications fetched:', items.length);

        // Cache the notifications
        await this.cacheNotifications(items);

        return items;
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Get notifications error:', error);

      // Try to return cached notifications on error
      const cached = await this.getCachedNotifications();
      if (cached.length > 0) {
        devLog('📦 Returning cached notifications');
        return cached;
      }

      throw new Error(error.message || 'Failed to fetch notifications');
    }
  }

  /**
   * Get notifications with detailed delivery information
   */
  async getNotificationsWithDelivery(
    request?: GetNotificationsRequest
  ): Promise<NotificationWithDelivery[]> {
    try {
      devLog('📬 Fetching notifications with delivery details...', request);

      const params = this.buildNotificationParams(request);
      const url = `${getApiUrl('merchant/notifications')}${params}&includeDelivery=true`;

      // rez-merchant-service returns { success, data: NotificationWithDelivery[], pagination: {...} }
      const response = await apiClient.get<NotificationWithDelivery[]>(url);

      if (response.success) {
        const items: NotificationWithDelivery[] = Array.isArray(response.data)
          ? response.data
          : ((response.data as unknown)?.items ?? []);
        devLog('✅ Notifications with delivery details fetched:', items.length);
        return items;
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Get notifications with delivery error:', error);
      throw new Error(error.message || 'Failed to fetch notifications with delivery details');
    }
  }

  /**
   * Get unread notifications count and summary
   */
  async getUnreadCount(): Promise<{ unreadCount: number; byType: Record<string, number> }> {
    try {
      devLog('📬 Fetching unread notification count...');

      // rez-merchant-service returns { success, data: { count } } (field is 'count' not 'unreadCount')
      const response = await apiClient.get<{
        count?: number;
        unreadCount?: number;
        byType?: Record<string, number>;
      }>('/merchant/notifications/unread');

      if (response.success && response.data) {
        // Normalise: backend uses 'count', consumers expect 'unreadCount'
        const unreadCount = response.data.count ?? response.data.unreadCount ?? 0;
        devLog('✅ Unread count fetched:', unreadCount);
        return { unreadCount, byType: response.data.byType ?? {} };
      } else {
        throw new Error(response.message || 'Failed to fetch unread count');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Get unread count error:', error);
      throw new Error(error.message || 'Failed to fetch unread count');
    }
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string): Promise<Notification> {
    try {
      devLog(`📬 Fetching notification ${notificationId}...`);

      const response = await apiClient.get<{ notification: Notification }>(
        `/merchant/notifications/${notificationId}`
      );

      if (response.success && response.data) {
        devLog('✅ Notification fetched:', notificationId);
        // Backend returns { notification: ... }, extract the notification
        return response.data.notification || (response.data as unknown as Notification);
      } else {
        throw new Error(response.message || 'Failed to fetch notification');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Get notification error:', error);
      throw new Error(error.message || 'Failed to fetch notification');
    }
  }

  /**
   * Mark single notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      devLog(`📖 Marking notification ${notificationId} as read...`);

      // rez-merchant-service: PATCH /:id/read  (not POST /:id/mark-read)
      const response = await apiClient.patch<MarkNotificationReadResponse['data']>(
        `merchant/notifications/${notificationId}/read`,
        {}
      );

      if (response.success) {
        devLog('✅ Notification marked as read:', notificationId);

        // Invalidate cache
        await this.invalidateNotificationCache();
      } else {
        throw new Error(response.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Mark as read error:', error);
      throw new Error(error.message || 'Failed to mark notification as read');
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markNotificationsAsRead(notificationIds: string[]): Promise<number> {
    try {
      devLog(`📖 Marking ${notificationIds.length} notifications as read...`);

      const response = await apiClient.post<{ markedCount: number }>(
        '/merchant/notifications/mark-multiple-read',
        { notificationIds }
      );

      if (response.success && response.data) {
        devLog('✅ Notifications marked as read:', response.data.markedCount);

        // Invalidate cache
        await this.invalidateNotificationCache();

        return response.data.markedCount;
      } else {
        throw new Error(response.message || 'Failed to mark notifications as read');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Mark multiple as read error:', error);
      throw new Error(error.message || 'Failed to mark notifications as read');
    }
  }

  /**
   * Mark all notifications as read (with optional filters)
   */
  async markAllNotificationsAsRead(request?: MarkAllNotificationsReadRequest): Promise<number> {
    try {
      devLog('📖 Marking all notifications as read...', request);

      const response = await apiClient.post<{ markedCount?: number }>(
        '/merchant/notifications/mark-all-read',
        request || {}
      );

      if (response.success) {
        // rez-merchant-service returns { success: true } without markedCount — default to 0
        const markedCount = response.data?.markedCount ?? 0;
        devLog('✅ All notifications marked as read:', markedCount);

        // Invalidate cache
        await this.invalidateNotificationCache();

        return markedCount;
      } else {
        throw new Error(response.message || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Mark all as read error:', error);
      throw new Error(error.message || 'Failed to mark all notifications as read');
    }
  }

  /**
   * Delete single notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      devLog(`🗑️ Deleting notification ${notificationId}...`);

      const response = await apiClient.delete<DeleteNotificationResponse['data']>(
        `/merchant/notifications/${notificationId}`
      );

      if (response.success) {
        devLog('✅ Notification deleted:', notificationId);

        // Invalidate cache
        await this.invalidateNotificationCache();
      } else {
        throw new Error(response.message || 'Failed to delete notification');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Delete notification error:', error);
      throw new Error(error.message || 'Failed to delete notification');
    }
  }

  /**
   * Delete multiple notifications
   */
  async deleteNotifications(notificationIds: string[]): Promise<number> {
    try {
      devLog(`🗑️ Deleting ${notificationIds.length} notifications...`);

      const response = await apiClient.post<{ deletedCount: number }>(
        '/merchant/notifications/delete-multiple',
        { notificationIds }
      );

      if (response.success && response.data) {
        devLog('✅ Notifications deleted:', response.data.deletedCount);

        // Invalidate cache
        await this.invalidateNotificationCache();

        return response.data.deletedCount;
      } else {
        throw new Error(response.message || 'Failed to delete notifications');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Delete multiple error:', error);
      throw new Error(error.message || 'Failed to delete notifications');
    }
  }

  /**
   * Archive notification (soft delete)
   */
  async archiveNotification(notificationId: string): Promise<void> {
    try {
      devLog(`📦 Archiving notification ${notificationId}...`);

      const response = await apiClient.put(`/merchant/notifications/${notificationId}/archive`, {});

      if (response.success) {
        devLog('✅ Notification archived:', notificationId);

        // Invalidate cache
        await this.invalidateNotificationCache();
      } else {
        throw new Error(response.message || 'Failed to archive notification');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Archive notification error:', error);
      throw new Error(error.message || 'Failed to archive notification');
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      devLog('⚙️ Fetching notification preferences...');

      // Check cache first
      const cached = await this.getCachedPreferences();
      if (cached) {
        devLog('📦 Using cached preferences');
        return cached;
      }

      const response = await apiClient.get<NotificationPreferences>(
        '/merchant/notifications/preferences'
      );

      if (response.success && response.data) {
        devLog('✅ Notification preferences fetched');

        // Cache the preferences
        await this.cachePreferences(response.data);

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch preferences');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Get preferences error:', error);

      // Try to return cached preferences on error
      const cached = await this.getCachedPreferences();
      if (cached) {
        devLog('📦 Returning cached preferences');
        return cached;
      }

      throw new Error(error.message || 'Failed to fetch notification preferences');
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    request: UpdateNotificationPreferencesRequest
  ): Promise<NotificationPreferences> {
    try {
      devLog('⚙️ Updating notification preferences...', request);

      const response = await apiClient.put<NotificationPreferences>(
        '/merchant/notifications/preferences',
        request
      );

      if (response.success && response.data) {
        devLog('✅ Notification preferences updated');

        // Update cache
        await this.cachePreferences(response.data);

        // Invalidate stats cache
        await this.invalidateStatsCache();

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update preferences');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Update preferences error:', error);
      throw new Error(error.message || 'Failed to update notification preferences');
    }
  }

  /**
   * Update specific notification channel preferences
   */
  async updateChannelPreference(
    channel: NotificationChannel,
    settings: Record<string, unknown>
  ): Promise<NotificationPreferences> {
    try {
      devLog(`⚙️ Updating ${channel} channel preferences...`, settings);

      const request: UpdateNotificationPreferencesRequest = {};

      if (channel === NotificationChannel.EMAIL) {
        request.email = settings as NotificationPreferences['email'];
      } else if (channel === NotificationChannel.SMS) {
        request.sms = settings as NotificationPreferences['sms'];
      }

      return await this.updateNotificationPreferences(request);
    } catch (error) {
      if (__DEV__) console.error(`❌ Update ${channel} preference error:`, error);
      throw new Error(error.message || `Failed to update ${channel} preferences`);
    }
  }

  /**
   * Update notification category preferences
   */
  async updateCategoryPreference(
    type: NotificationType,
    settings: Record<string, unknown>
  ): Promise<NotificationPreferences> {
    try {
      devLog(`⚙️ Updating ${type} category preferences...`, settings);

      const request: UpdateNotificationPreferencesRequest = {
        categories: {
          [type]: settings,
        },
      };

      return await this.updateNotificationPreferences(request);
    } catch (error) {
      if (__DEV__) console.error(`❌ Update ${type} preference error:`, error);
      throw new Error(error.message || `Failed to update ${type} preferences`);
    }
  }

  /**
   * Enable/disable all notifications
   */
  async setGlobalMute(mute: boolean): Promise<NotificationPreferences> {
    try {
      devLog(`🔇 Setting global mute to ${mute}...`);

      return await this.updateNotificationPreferences({ globalMute: mute });
    } catch (error) {
      if (__DEV__) console.error('❌ Set global mute error:', error);
      throw new Error(error.message || 'Failed to set global mute');
    }
  }

  /**
   * Update do-not-disturb settings
   */
  async updateDoNotDisturb(settings: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    allowUrgent: boolean;
  }): Promise<NotificationPreferences> {
    try {
      devLog('🔇 Updating do-not-disturb settings...', settings);

      return await this.updateNotificationPreferences({ doNotDisturb: settings });
    } catch (error) {
      if (__DEV__) console.error('❌ Update DND error:', error);
      throw new Error(error.message || 'Failed to update do-not-disturb settings');
    }
  }

  /**
   * Subscribe to email notifications
   */
  async subscribeToEmail(email: string): Promise<void> {
    try {
      devLog(`📧 Subscribing to email notifications: ${email}...`);

      const response = await apiClient.post('/merchant/notifications/subscribe-email', {
        email,
      });

      if (response.success) {
        devLog('✅ Subscribed to email notifications');

        // Invalidate preferences cache
        await this.invalidatePreferencesCache();
      } else {
        throw new Error(response.message || 'Failed to subscribe to email');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Subscribe email error:', error);
      throw new Error(error.message || 'Failed to subscribe to email notifications');
    }
  }

  /**
   * Subscribe to SMS notifications
   */
  async subscribeToSms(phone: string): Promise<void> {
    try {
      devLog(`📱 Subscribing to SMS notifications: ${phone}...`);

      const response = await apiClient.post('/merchant/notifications/subscribe-sms', { phone });

      if (response.success) {
        devLog('✅ Subscribed to SMS notifications');

        // Invalidate preferences cache
        await this.invalidatePreferencesCache();
      } else {
        throw new Error(response.message || 'Failed to subscribe to SMS');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Subscribe SMS error:', error);
      throw new Error(error.message || 'Failed to subscribe to SMS notifications');
    }
  }

  /**
   * Unsubscribe from email notifications
   */
  async unsubscribeFromEmail(): Promise<void> {
    try {
      devLog('📧 Unsubscribing from email notifications...');

      const response = await apiClient.post('/merchant/notifications/unsubscribe-email', {});

      if (response.success) {
        devLog('✅ Unsubscribed from email notifications');

        // Invalidate preferences cache
        await this.invalidatePreferencesCache();
      } else {
        throw new Error(response.message || 'Failed to unsubscribe from email');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Unsubscribe email error:', error);
      throw new Error(error.message || 'Failed to unsubscribe from email notifications');
    }
  }

  /**
   * Unsubscribe from SMS notifications
   */
  async unsubscribeFromSms(): Promise<void> {
    try {
      devLog('📱 Unsubscribing from SMS notifications...');

      const response = await apiClient.post('/merchant/notifications/unsubscribe-sms', {});

      if (response.success) {
        devLog('✅ Unsubscribed from SMS notifications');

        // Invalidate preferences cache
        await this.invalidatePreferencesCache();
      } else {
        throw new Error(response.message || 'Failed to unsubscribe from SMS');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Unsubscribe SMS error:', error);
      throw new Error(error.message || 'Failed to unsubscribe from SMS notifications');
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<NotificationStats> {
    try {
      devLog('📊 Fetching notification statistics...');

      // Check cache first
      const cached = await this.getCachedStats();
      if (cached) {
        devLog('📦 Using cached statistics');
        return cached;
      }

      const response = await apiClient.get<NotificationStats>('/merchant/notifications/stats');

      if (response.success && response.data) {
        devLog('✅ Notification statistics fetched');

        // Cache the stats
        await this.cacheStats(response.data);

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Get stats error:', error);

      // Try to return cached stats on error
      const cached = await this.getCachedStats();
      if (cached) {
        devLog('📦 Returning cached statistics');
        return cached;
      }

      throw new Error(error.message || 'Failed to fetch notification statistics');
    }
  }

  /**
   * Clear all notifications (batch delete)
   */
  async clearAllNotifications(type?: NotificationType): Promise<number> {
    try {
      devLog('🧹 Clearing all notifications...', type);

      const response = await apiClient.post<{ deletedCount: number }>(
        '/merchant/notifications/clear-all',
        { type }
      );

      if (response.success && response.data) {
        devLog('✅ Notifications cleared:', response.data.deletedCount);

        // Invalidate cache
        await this.invalidateNotificationCache();

        return response.data.deletedCount;
      } else {
        throw new Error(response.message || 'Failed to clear notifications');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Clear all error:', error);
      throw new Error(error.message || 'Failed to clear notifications');
    }
  }

  // ============================================================================
  // Push Notification Token Methods
  // ============================================================================

  /**
   * Register push notification token with backend
   * KENJI: integration resilience — push notification failures are logged but not thrown to prevent app crash
   */
  async registerPushToken(
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceName?: string
  ): Promise<TokenRegistrationResult> {
    try {
      // KENJI: integration resilience — 10s timeout to prevent hanging on poor connections
      const data = await apiClient.post(
        'merchant/notifications/register-token',
        { token, platform, deviceName },
        { timeout: 10000 }
      );
      if (!data.success) {
        throw new Error(data.message || 'Failed to register token');
      }
      return { success: true, data };
    } catch (error) {
      // KENJI: integration resilience — log token registration failures but allow app to continue
      if (__DEV__) console.error('[NotificationsService] registerPushToken error:', error?.message);
      return { success: false, message: 'Token registration deferred for retry' };
    }
  }

  /**
   * Unregister push notification token from backend
   * KENJI: integration resilience — token unregistration failures are logged but not thrown to prevent app crash
   */
  async unregisterPushToken(token: string): Promise<TokenRegistrationResult> {
    try {
      // KENJI: integration resilience — 10s timeout to prevent hanging on poor connections
      const data = await apiClient.post(
        'merchant/notifications/unregister-token',
        { token },
        { timeout: 10000 }
      );
      if (!data.success) {
        throw new Error(data.message || 'Failed to unregister token');
      }
      return { success: true, data };
    } catch (error) {
      // KENJI: integration resilience — log token unregistration failures but allow app to continue
      if (__DEV__)
        console.error('[NotificationsService] unregisterPushToken error:', error?.message);
      return { success: false, message: 'Token unregistration deferred for retry' };
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get auth token from storage
   */
  private async getAuthToken(): Promise<string> {
    return (await storageService.getAuthToken()) || '';
  }

  /**
   * Build query parameters for notifications endpoint
   */
  private buildNotificationParams(request?: GetNotificationsRequest): string {
    if (!request) return '';

    const params = new URLSearchParams();

    if (request.page) params.append('page', request.page.toString());
    if (request.limit) params.append('limit', request.limit.toString());
    if (request.type) params.append('type', request.type);
    if (request.status) params.append('status', request.status);
    if (request.priority) params.append('priority', request.priority);
    if (request.startDate) params.append('startDate', request.startDate);
    if (request.endDate) params.append('endDate', request.endDate);
    if (request.unreadOnly) params.append('unreadOnly', 'true');
    if (request.sortBy) params.append('sortBy', request.sortBy);
    if (request.sortOrder) params.append('sortOrder', request.sortOrder);

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Cache notification list
   */
  private async cacheNotifications(notifications: Notification[]): Promise<void> {
    try {
      const cacheData = {
        notifications,
        timestamp: Date.now(),
      };
      await storageService.set(this.cacheKey, cacheData);
    } catch (error) {
      devWarn('Failed to cache notifications:', error);
    }
  }

  /**
   * Get cached notifications
   */
  private async getCachedNotifications(): Promise<Notification[]> {
    try {
      const cached = await storageService.get<unknown>(this.cacheKey);
      if (cached && Date.now() - (cached.timestamp as number) < this.cacheDuration) {
        return (cached.notifications as Notification[]) || [];
      }
    } catch (error) {
      devWarn('Failed to get cached notifications:', error);
    }
    return [];
  }

  /**
   * Invalidate notification cache
   */
  private async invalidateNotificationCache(): Promise<void> {
    try {
      await storageService.remove(this.cacheKey);
    } catch (error) {
      devWarn('Failed to invalidate notification cache:', error);
    }
  }

  /**
   * Cache notification preferences
   */
  private async cachePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      const cacheData = {
        preferences,
        timestamp: Date.now(),
      };
      await storageService.set(this.preferencesKey, cacheData);
    } catch (error) {
      devWarn('Failed to cache preferences:', error);
    }
  }

  /**
   * Get cached preferences
   */
  private async getCachedPreferences(): Promise<NotificationPreferences | null> {
    try {
      const cached = await storageService.get<unknown>(this.preferencesKey);
      if (cached && Date.now() - (cached.timestamp as number) < this.cacheDuration) {
        return (cached.preferences as NotificationPreferences) || null;
      }
    } catch (error) {
      devWarn('Failed to get cached preferences:', error);
    }
    return null;
  }

  /**
   * Invalidate preferences cache
   */
  private async invalidatePreferencesCache(): Promise<void> {
    try {
      await storageService.remove(this.preferencesKey);
    } catch (error) {
      devWarn('Failed to invalidate preferences cache:', error);
    }
  }

  /**
   * Cache notification stats
   */
  private async cacheStats(stats: NotificationStats): Promise<void> {
    try {
      const cacheData = {
        stats,
        timestamp: Date.now(),
      };
      await storageService.set(this.statsKey, cacheData);
    } catch (error) {
      devWarn('Failed to cache stats:', error);
    }
  }

  /**
   * Get cached stats
   */
  private async getCachedStats(): Promise<NotificationStats | null> {
    try {
      const cached = await storageService.get<unknown>(this.statsKey);
      if (cached && Date.now() - (cached.timestamp as number) < this.cacheDuration) {
        return (cached.stats as NotificationStats) || null;
      }
    } catch (error) {
      devWarn('Failed to get cached stats:', error);
    }
    return null;
  }

  /**
   * Invalidate stats cache
   */
  private async invalidateStatsCache(): Promise<void> {
    try {
      await storageService.remove(this.statsKey);
    } catch (error) {
      devWarn('Failed to invalidate stats cache:', error);
    }
  }
}

// Export singleton instance
export const notificationsService = new NotificationsService();

export default notificationsService;
