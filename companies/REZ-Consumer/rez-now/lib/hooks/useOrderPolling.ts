'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getOrder } from '@/lib/api/orders';
import { WebOrderStatus } from '@/lib/types';

const BACKOFF_MS = [2000, 4000, 8000, 16000, 30000]; // exponential, capped at 30s
const MAX_ATTEMPTS = 20;
// NW-MED-004: Normalize status to lowercase — backend may return 'COMPLETED', 'Completed', etc.
const TERMINAL_STATUSES: WebOrderStatus[] = ['completed', 'cancelled'];

export function useOrderPolling(
  orderNumber: string,
  socketConnected: boolean,
  onStatusUpdate: (status: WebOrderStatus) => void,
  onTimeout: () => void
) {
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   
  const poll = useCallback(async () => {
    if (attemptsRef.current >= MAX_ATTEMPTS) {
      onTimeout();
      return;
    }

    try {
      const order = await getOrder(orderNumber);
      // NW-MED-004: Normalize to lowercase so case-insensitive comparison works regardless of backend casing
      const normalizedStatus = (order.status ?? '').toLowerCase() as WebOrderStatus;
      onStatusUpdate(normalizedStatus);
      if (TERMINAL_STATUSES.includes(normalizedStatus)) return; // stop polling
    } catch {
      // Network error — keep polling
    }

    attemptsRef.current += 1;
    const delay = BACKOFF_MS[Math.min(attemptsRef.current, BACKOFF_MS.length - 1)];
    // eslint-disable-next-line react-hooks/immutability -- poll is defined by useCallback above; self-reference in setTimeout is intentional
    timerRef.current = setTimeout(poll, delay);
  }, [orderNumber, onStatusUpdate, onTimeout]);

  useEffect(() => {
    // Only poll if Socket.IO is not connected
    if (socketConnected) return;

    attemptsRef.current = 0;
    timerRef.current = setTimeout(poll, BACKOFF_MS[0]);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [orderNumber, socketConnected, poll]);
}
