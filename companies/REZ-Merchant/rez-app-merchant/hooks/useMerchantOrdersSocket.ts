/**
 * Enhanced Socket.io hook for merchant live order board
 * Integrates with useOrdersDashboard to provide real-time updates
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useMerchantOrders } from './useMerchantOrders';
import { useOrdersDashboard } from './useOrdersDashboard';

/**
 * Hook to sync Socket.io updates with the existing orders dashboard
 * This hook bridges real-time Socket events with the dashboard query/state
 *
 * @param storeId - Store ID to listen for orders
 * @param merchantToken - Optional auth token
 */
export function useMerchantOrdersSocket(storeId: string | null, merchantToken?: string) {
  const dashboard = useOrdersDashboard();
  const socket = useMerchantOrders(storeId, merchantToken);
  const [liveIndicator, setLiveIndicator] = useState<'live' | 'reconnecting' | 'offline'>(
    'offline'
  );
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update live indicator
  useEffect(() => {
    setLiveIndicator(socket.getConnectionStatus());
    // socket object ref is stable; individual fields are the actual deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket.isConnected, socket.isReconnecting, socket.getConnectionStatus]);

  // Handle new orders - add flash animation
  const handleNewOrderReceived = useCallback(
    (orderId: string) => {
      // Trigger a refresh of the dashboard
      if (dashboard.onRefresh) {
        dashboard.onRefresh();
      }

      // Acknowledge the order from socket state
      socket.acknowledgeOrder(orderId);
    },
    [dashboard, socket]
  );

  // Auto-refresh dashboard when new orders arrive — debounced so a burst of
  // socket events collapses into a single refresh call instead of stacking timers.
  useEffect(() => {
    if (socket.newOrders.length > 0 && dashboard.onRefresh) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        dashboard.onRefresh();
      }, 500); // Small delay to allow backend to process
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
    // using stable sub-fields to avoid resubscribing on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket.newOrders.length, dashboard.onRefresh]);

  return {
    // Dashboard state
    ...dashboard,
    // Socket state
    socketConnected: socket.isConnected,
    socketReconnecting: socket.isReconnecting,
    liveIndicator,
    newOrdersCount: socket.newOrders.length,
    lastNewOrderTime: socket.lastNewOrderTime,
    // Actions
    acknowledgeNewOrder: handleNewOrderReceived,
  };
}
