'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebOrderStatus, OrderStatusUpdateEvent } from '@/lib/types';
import { logger } from '@/lib/utils/logger';
import { getAccessTokenSync } from '@/lib/api/client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://api.rezapp.com';

// Retry configuration for connection resilience
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 1000;
const RECONNECT_BACKOFF = [1000, 2000, 4000, 8000, 16000];

export function useOrderSocket(
  orderNumber: string,
  storeSlug: string,
  onStatusUpdate: (status: WebOrderStatus) => void
) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isAuthenticatedRef = useRef(false);

  // Validate token before connecting
  const validateAndGetToken = useCallback((): string | null => {
    const token = getAccessTokenSync();
    if (!token) {
      logger.warn('[Socket] No auth token available, skipping connection');
      return null;
    }

    // Basic JWT structure validation (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.warn('[Socket] Invalid token format');
      return null;
    }

    // Check token expiration (payload is base64url encoded)
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        logger.warn('[Socket] Token expired');
        return null;
      }
    } catch {
      // If we can't parse, still try to connect - server will validate
    }

    return token;
  }, []);

  useEffect(() => {
    if (!orderNumber || !storeSlug) return;

    const token = validateAndGetToken();
    if (!token) {
      logger.warn('[Socket] Skipping connection due to missing/invalid token');
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY_MS,
      reconnectionDelayMax: 16000,
      // SECURITY: Pass auth token — backend MUST validate token before allowing
      // order status events to be received for this user's orders.
      auth: { token },
      // Security options
      withCredentials: true,
      timeout: 10000,
    });

    socketRef.current = socket;
    isAuthenticatedRef.current = true;
    reconnectAttemptRef.current = 0;

    socket.on('connect', () => {
      // NW-MED-031: Replace console.* with centralized logger for fitness test compliance.
      logger.debug('[Socket] Connected for order', { orderNumber, socketId: socket.id });
    });

    socket.on('connect_error', (err) => {
      reconnectAttemptRef.current++;
      const backoffIndex = Math.min(reconnectAttemptRef.current, RECONNECT_BACKOFF.length - 1);
      const delay = RECONNECT_BACKOFF[backoffIndex];

      // Log different error types for debugging
      if (err.message === 'Authentication required') {
        logger.error('[Socket] Auth failed - token may be invalid or expired', { error: err.message });
        isAuthenticatedRef.current = false;
      } else if (err.message === 'Invalid or expired token') {
        logger.error('[Socket] Token rejected by server', { error: err.message });
        isAuthenticatedRef.current = false;
      } else {
        logger.warn('[Socket] Connection error', {
          message: err.message,
          attempt: reconnectAttemptRef.current,
          nextRetryIn: delay,
        });
      }
    });

    socket.on('web-order:status-update', (data: OrderStatusUpdateEvent) => {
      // NW-MED-054: Validate both orderNumber AND storeId — prevents forged updates from
      // clients who guess an order number. The backend should also emit storeId in events.
      if (data.orderNumber === orderNumber && data.storeId === storeSlug) {
        logger.debug('[Socket] Status update received', {
          orderNumber,
          status: data.status,
        });
        onStatusUpdate(data.status);
      } else {
        // SECURITY: Log potential attempt to inject updates for wrong orders
        logger.warn('[Socket] Rejected status update for wrong order/store', {
          receivedOrderNumber: data.orderNumber,
          expectedOrderNumber: orderNumber,
          receivedStoreId: data.storeId,
          expectedStoreSlug: storeSlug,
        });
      }
    });

    socket.on('disconnect', (reason) => {
      // NW-MED-031: Replace console.* with centralized logger for fitness test compliance.
      logger.debug('[Socket] Disconnected', { orderNumber, reason });
      isAuthenticatedRef.current = false;
    });

    socket.on('error', (err) => {
      logger.error('[Socket] Socket error', { error: err });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      isAuthenticatedRef.current = false;
    };
  }, [orderNumber, storeSlug, onStatusUpdate, validateAndGetToken]);

  // Expose connection status for use by polling fallback
  const isConnected = socketRef.current?.connected ?? false;

  return { isConnected };
}
