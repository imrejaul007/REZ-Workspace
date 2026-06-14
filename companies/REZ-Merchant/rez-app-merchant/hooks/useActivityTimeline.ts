/**
 * useActivityTimeline Hook
 *
 * Custom hook for activity timeline functionality:
 * - Combines audit logs + notifications
 * - Real-time updates via Socket.IO
 * - Pagination and filtering
 * - Loading states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { apiClient } from '../services/api/client';
import type { AuditLog, AuditResourceType, AuditSeverity, TimelineEntry } from '../types/audit';
import type { Notification } from '../types/notifications';
import { auditLogToTimelineEntry } from '../utils/audit/auditHelpers';
import { sortNotifications } from '../utils/notifications/notificationHelpers';
import { logger } from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface UseActivityTimelineOptions {
  userId?: string;
  resourceType?: AuditResourceType;
  resourceId?: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseActivityTimelineReturn {
  entries: TimelineEntry[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  unreadCount: number;
  warningMessage: string | null;
}

// Notification entries have looser typing than audit log entries — notifications use
// string-based type fields that may not align with AuditAction/AuditResourceType unions,
// and include a `status` field not present on AuditLog/TimelineEntry.
type NotificationTimelineEntry = Omit<
  TimelineEntry,
  'action' | 'resourceType' | 'details' | 'severity'
> & {
  action: string;
  resourceType: string;
  details: Record<string, unknown>;
  severity: AuditSeverity;
  status?: string;
};

// Mock data generators removed — replaced with real API calls below.

// ============================================================================
// HOOK
// ============================================================================

export const useActivityTimeline = (
  options: UseActivityTimelineOptions = {}
): UseActivityTimelineReturn => {
  const {
    userId,
    resourceType,
    resourceId,
    limit = 50,
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
  } = options;

  // ========================================
  // STATE
  // ========================================
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // ========================================
  // REFS
  // ========================================
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLoadingRef = useRef(false);

  // ========================================
  // SOCKET
  // ========================================
  const socket = useSocket();

  // ========================================
  // FETCH DATA
  // ========================================
  const fetchTimeline = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (isLoadingRef.current) return;

      isLoadingRef.current = true;
      setError(null);

      try {
        setWarningMessage(null);

        // Fetch audit logs and notifications in parallel.
        // Use Promise.allSettled to track which endpoints fail instead of silently swallowing errors.

        const auditLogsPromise = apiClient
          .get<{ logs: AuditLog[]; total: number }>(
            `merchant/audit-logs?page=${pageNum}&limit=${limit}`
          )
          .then((res) => (res.success && res.data?.logs ? res.data.logs : []))
          .catch((err) => {
            logger.warn('[useActivityTimeline] audit-logs endpoint unavailable:', err?.message);
            return [] as AuditLog[];
          });

        const notificationsPromise = apiClient
          .get<{ notifications: Notification[]; unreadCount: number }>(
            `merchant/notifications?page=${pageNum}&limit=${limit}`
          )
          .then((res) =>
            res.success && res.data?.notifications
              ? res.data
              : { notifications: [] as Notification[], unreadCount: 0 }
          )
          .catch((err) => {
            logger.warn('[useActivityTimeline] notifications endpoint unavailable:', err?.message);
            return { notifications: [] as Notification[], unreadCount: 0 };
          });

        // MED-4 FIX: Use Promise.allSettled() to track failures instead of hiding them
        const results = await Promise.allSettled([auditLogsPromise, notificationsPromise]);

        let auditLogs: AuditLog[] = [];
        let notifData: { notifications: Notification[]; unreadCount: number } = {
          notifications: [],
          unreadCount: 0,
        };

        // Check audit logs result
        if (results[0].status === 'fulfilled') {
          auditLogs = results[0].value;
        } else if (results[0].status === 'rejected') {
          logger.error('[useActivityTimeline] Audit logs fetch rejected:', results[0].reason);
          setWarningMessage('Failed to load audit logs. Showing notifications only.');
        }

        // Check notifications result
        if (results[1].status === 'fulfilled') {
          notifData = results[1].value;
        } else if (results[1].status === 'rejected') {
          logger.error('[useActivityTimeline] Notifications fetch rejected:', results[1].reason);
          setWarningMessage('Failed to load notifications. Showing audit logs only.');
        }
        const notifications = notifData.notifications;

        // Convert to timeline entries
        const auditEntries = auditLogs.map(auditLogToTimelineEntry);
        const notifEntries: NotificationTimelineEntry[] = notifications.map((notif) => ({
          ...notif,
          action: `${notif.type}.notification`,
          resourceType: notif.type,
          resourceId: notif.relatedEntityId,
          timestamp: notif.createdAt,
          severity: 'info',
          details: {},
        }));

        // Combine and sort
        const combined = [...auditEntries, ...notifEntries].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Apply filters
        let filtered = combined;
        if (userId) {
          filtered = filtered.filter((entry) => entry.merchantUserId === userId);
        }
        if (resourceType) {
          filtered = filtered.filter((entry) => entry.resourceType === resourceType);
        }
        if (resourceId) {
          filtered = filtered.filter((entry) => entry.resourceId === resourceId);
        }

        // Update state
        setEntries((prev) => (append ? [...prev, ...filtered] : filtered) as TimelineEntry[]);
        setHasMore(filtered.length >= limit);

        // Prefer server-provided unread count; fall back to local count
        const unread =
          notifData.unreadCount ?? notifications.filter((n) => n.status === 'unread').length;
        setUnreadCount(unread);
      } catch (err) {
        logger.error('Failed to fetch timeline:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        isLoadingRef.current = false;
      }
    },
    [userId, resourceType, resourceId, limit]
  );

  // ========================================
  // LOAD MORE
  // ========================================
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || refreshing) return;

    const nextPage = page + 1;
    setPage(nextPage);
    await fetchTimeline(nextPage, true);
  }, [page, hasMore, loading, refreshing, fetchTimeline]);

  // ========================================
  // REFRESH
  // ========================================
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchTimeline(1, false);
  }, [fetchTimeline]);

  // ========================================
  // EFFECTS
  // ========================================

  // Initial load
  useEffect(() => {
    fetchTimeline(1, false);
  }, [fetchTimeline]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    refreshIntervalRef.current = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refresh]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewAuditLog = (log: AuditLog) => {
      const entry = auditLogToTimelineEntry(log);
      setEntries((prev) => [entry, ...prev]);
    };

    const handleNewNotification = (notification: Notification) => {
      const entry: NotificationTimelineEntry = {
        ...notification,
        action: `${notification.type}.notification`,
        resourceType: notification.type,
        resourceId: notification.relatedEntityId,
        timestamp: notification.createdAt,
        severity: 'info',
        details: {},
      };
      setEntries((prev) => [entry as TimelineEntry, ...prev]);
      if (notification.status === 'unread') {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleNotificationRead = (notificationId: string) => {
      setEntries((prev) =>
        prev.map((entry) => (entry.id === notificationId ? { ...entry, status: 'read' } : entry))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    socket.on('audit:new', handleNewAuditLog);
    socket.on('notification:new', handleNewNotification);
    socket.on('notification:read', handleNotificationRead);

    return () => {
      socket.off('audit:new', handleNewAuditLog);
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:read', handleNotificationRead);
    };
  }, [socket]);

  // ========================================
  // RETURN
  // ========================================
  return {
    entries,
    loading,
    refreshing,
    hasMore,
    error,
    loadMore,
    refresh,
    unreadCount,
    warningMessage,
  };
};

export default useActivityTimeline;
