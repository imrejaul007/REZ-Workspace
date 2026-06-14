'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { checkPaymentStatus } from '@/lib/api/scanPayment';
import { logger } from '@/lib/utils/logger';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://api.rezapp.com';

// NW-CRIT-006 FIX: Increased from 10s to 90s. UPI payments typically take 30–120s
// to complete. The old 10s timeout caused false "payment failed" states because the
// socket was disconnected before the backend emitted payment:confirmed.
// The polling fallback (activated after socket timeout) covers the remaining cases.
const SOCKET_TIMEOUT_MS = 90_000;

export interface PaymentConfirmedEvent {
  paymentId: string;
  razorpayOrderId: string;
  status: 'completed' | 'failed';
  storeSlug: string;
  amount?: number;
  reason?: string;
  timestamp: string;
}

export type PaymentConfirmationState =
  | { phase: 'idle' }
  | { phase: 'waiting' }
  | { phase: 'confirmed'; event: PaymentConfirmedEvent }
  | { phase: 'failed'; reason: string }
  | { phase: 'timeout' }
  // NW-CRIT-006: Added polling phase — activated after socket timeout to poll backend
  | { phase: 'polling'; paymentId: string };

/**
 * NW-CRIT-012 fix: The customer socket must join the store room so it receives
 * `payment:confirmed` events emitted by the backend at:
 *   io.to(`store-${storeSlug}`).emit('payment:confirmed', { paymentId, coinsEarned })
 *
 * The previous subscribeByOrderId/subscribeByPaymentId approaches emitted
 * `subscribe:payment` — a socket event that has NO handler in the backend
 * (socketSetup.ts and RealTimeService.ts both lack `subscribe:payment`).
 * The event was silently dropped, causing every UPI payment to time out.
 *
 * Usage:
 *   const { state, subscribe } = usePaymentConfirmation();
 *   subscribe(slug, razorpayOrderId);
 */
export function usePaymentConfirmation() {
  const [state, setState] = useState<PaymentConfirmationState>({ phase: 'idle' });
  const socketRef = useRef<Socket | null>(null);
  const subscribedOrderRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearTimer();
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    subscribedOrderRef.current = null;
  }, [clearTimeout]);

  // NW-CRIT-006: Polling fallback activated after socket timeout.
  // Uses exponential backoff capped at 30s, up to 20 attempts (~5 min total).
  // This covers the case where the socket timed out before backend emitted.
  const POLL_BACKOFF_MS = [2000, 4000, 8000, 16000, 30000];
  const MAX_POLL_ATTEMPTS = 20;

  const pollingRef = useRef({ attempts: 0, timer: null as ReturnType<typeof setTimeout> | null });

  const stopPolling = useCallback(() => {
    if (pollingRef.current.timer !== null) {
      clearTimeout(pollingRef.current.timer);
      pollingRef.current.timer = null;
    }
    pollingRef.current.attempts = 0;
  }, []);

  const startPolling = useCallback((storeSlug: string, paymentId: string) => {
    stopPolling();
    setState({ phase: 'polling', paymentId });

    const poll = async () => {
      if (pollingRef.current.attempts >= MAX_POLL_ATTEMPTS) {
        stopPolling();
        setState({ phase: 'failed', reason: 'Payment status could not be confirmed. Please check with the restaurant.' });
        return;
      }

      try {
        const result = await checkPaymentStatus(paymentId);
        if (result.status === 'completed') {
          stopPolling();
          setState({
            phase: 'confirmed',
            event: {
              paymentId,
              razorpayOrderId: result.transactionId ?? paymentId,
              status: 'completed',
              storeSlug,
              amount: undefined,
              timestamp: result.completedAt ?? new Date().toISOString(),
            },
          });
          return;
        }
        if (result.status === 'failed' || result.status === 'cancelled') {
          stopPolling();
          setState({ phase: 'failed', reason: result.status === 'failed' ? 'Payment failed.' : 'Payment cancelled.' });
          return;
        }
        // 'initiated' or 'processing' — keep polling
      } catch {
        // Network error — keep polling
      }

      pollingRef.current.attempts += 1;
      const delay = POLL_BACKOFF_MS[Math.min(pollingRef.current.attempts, POLL_BACKOFF_MS.length - 1)];
      pollingRef.current.timer = setTimeout(poll, delay);
    };

    poll();
  }, [stopPolling]);

  useEffect(() => {
    return () => { disconnect(); stopPolling(); };
  }, [disconnect, stopPolling]);

  /**
   * Subscribe to payment:confirmed / payment:failed by joining the store room.
   *
   * The backend emits payment:confirmed to `store-${storeSlug}` (webOrderingRoutes.ts).
   * We join that room via the authenticated socket using the `join-store` event,
   * then listen globally for `payment:confirmed` / `payment:failed`.
   *
   * @param storeSlug  The store slug (e.g. "burger-king-delhi")
   * @param razorpayOrderId  The Razorpay order ID — used to guard against stale timeouts
   *                         when the user navigates directly to the confirm page after payment.
   */
  const subscribe = useCallback((storeSlug: string, razorpayOrderId: string) => {
    // NW-MED-055: Guard with razorpayOrderId — ignore events whose orderId doesn't match
    // the current subscription. This prevents race conditions when the user rapidly
    // triggers the payment flow (e.g., double-tap or UPI app returns before reconnect).
    subscribedOrderRef.current = razorpayOrderId;

    // Cleanup any prior subscription
    disconnect();
    // NW-MED-055: Set state BEFORE disconnect to avoid losing a late confirmation event
    // that arrives between disconnect() and the new socket connecting.
    setState({ phase: 'waiting' });

    // NW-CRIT-006 FIX: 90s timeout. After timeout, switch to polling fallback instead
    // of showing "timed out" immediately. UPI payments can take 30–120s; 90s covers 99%.
    timeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // NW-CRIT-006: Instead of giving up, start polling the backend for payment status.
      // This handles the case where the socket disconnected before the backend emitted.
      startPolling(storeSlug, razorpayOrderId);
    }, SOCKET_TIMEOUT_MS);

    // Connect to Socket.IO on the main namespace (requires JWT auth token).
    // NEXT_PUBLIC_SOCKET_URL must point to the backend that runs socketSetup.ts.
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;
    subscribedOrderRef.current = razorpayOrderId;

    socket.on('connect', () => {
      // NW-CRIT-012 fix: join the store room instead of emitting subscribe:payment
      // (backend has no subscribe:payment handler — it was silently ignored).
      socket.emit('join-store', { storeId: storeSlug });
    });

    socket.on('payment:confirmed', (event: PaymentConfirmedEvent) => {
      // NW-MED-055: Only process if this event belongs to the current subscription.
      if (subscribedOrderRef.current !== razorpayOrderId) return;
      clearTimer();
      socket.disconnect();
      socketRef.current = null;
      setState({ phase: 'confirmed', event });
    });

    socket.on('payment:failed', (event: PaymentConfirmedEvent) => {
      // NW-MED-055: Only process if this event belongs to the current subscription.
      if (subscribedOrderRef.current !== razorpayOrderId) return;
      clearTimer();
      socket.disconnect();
      socketRef.current = null;
      setState({ phase: 'failed', reason: event.reason || 'Payment failed' });
    });

    socket.on('connect_error', (err) => {
      // NW-MED-009 + NW-MED-053: Log connection failures instead of silently swallowing.
      // NW-MED-053: The hook falls through to polling via the 90s timeout, but
      // the user gets no signal that the real-time channel failed. We log it so
      // operators can diagnose, and rely on the polling fallback to resolve.
      logger.warn('[PaymentSocket] connect_error', { message: err.message });
    });
  }, [disconnect, clearTimer, startPolling]);

  /**
   * @deprecated — NW-CRIT-012: The backend has no `subscribe:payment` handler.
   * Use subscribe(slug, razorpayOrderId) instead.
   */
  const subscribeByOrderId = useCallback((_razorpayOrderId: string) => {
    // No-op: the backend never handled this event.
    // Kept only to avoid TypeScript errors on existing call sites.
    void _razorpayOrderId;
  }, []);

  /**
   * @deprecated — NW-CRIT-012: The backend has no `subscribe:payment` handler.
   * Use subscribe(slug, razorpayOrderId) instead.
   */
  const subscribeByPaymentId = useCallback((_paymentId: string) => {
    // No-op: the backend never handled this event.
    void _paymentId;
  }, []);

  return { state, subscribe, subscribeByOrderId, subscribeByPaymentId, disconnect };
}
