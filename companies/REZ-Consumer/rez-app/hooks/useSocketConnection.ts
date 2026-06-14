// @ts-nocheck
/**
 * useSocketConnection Hook
 * Socket connection management
 * Split from SocketContext.tsx for better modularity
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useSocketStore, type SocketStoreState } from '@/stores/socketStore';
import { useAuthStore, type AuthStoreState } from '@/stores/authStore';
import { getAuthToken, getUser } from '@/utils/authStorage';
import { SocketEvents } from '@/types/socket.types';

type Socket = unknown;

// Get Socket URL
function getSocketUrl(): string {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    if (__DEV__) return 'http://localhost:5001';
    throw new Error('[SocketContext] FATAL: EXPO_PUBLIC_API_BASE_URL is not set in production.');
  }
  const baseUrl = apiBaseUrl.replace('/api', '');
  if (Platform.OS === 'web') return baseUrl;
  if (__DEV__ && (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1'))) {
    return baseUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  return baseUrl;
}

const DEFAULT_CONFIG = {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
};

interface UseSocketConnectionReturn {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
  lastConnected: Date | null;
  reconnectAttempts: number;
  connect: () => void;
  disconnect: () => void;
}

export function useSocketConnection(config?: Partial<typeof DEFAULT_CONFIG>): UseSocketConnectionReturn {
  const authToken = useAuthStore((s: AuthStoreState) => s.state.token);

  const [socketState, setSocketState] = useState({
    connected: false,
    reconnecting: false,
    error: null as string | null,
    lastConnected: null as Date | null,
    reconnectAttempts: 0,
  });

  const socketRef = useRef<Socket | null>(null);
  const subscribedProducts = useRef(new Set<string>());
  const subscribedStores = useRef(new Set<string>());
  const subscribedOrders = useRef(new Map<string, string | undefined>());

  // Sync to Zustand store
  const _setFromProvider = useSocketStore((s: SocketStoreState) => s._setFromProvider);

  useEffect(() => {
    let cancelled = false;
    const socketUrl = getSocketUrl();
    const socketConfig = { ...DEFAULT_CONFIG, ...config };

    Promise.all([getIO(), getAuthToken(), getUser()]).then(([io, storageToken, user]) => {
      if (cancelled) return;
      const token = authToken ?? storageToken;
      if (!token) return;
      if (!user?.isOnboarded) return;

      try {
        const socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          autoConnect: socketConfig.autoConnect,
          reconnection: socketConfig.reconnection,
          reconnectionAttempts: socketConfig.reconnectionAttempts,
          reconnectionDelay: socketConfig.reconnectionDelay,
          reconnectionDelayMax: socketConfig.reconnectionDelayMax,
          timeout: socketConfig.timeout,
          auth: { token },
        });

        socketRef.current = socket;

        const handleConnect = () => {
          setSocketState(prev => ({
            ...prev,
            connected: true,
            reconnecting: false,
            error: null,
            lastConnected: new Date(),
            reconnectAttempts: 0,
          }));
          resubscribeAll();
        };

        const handleDisconnect = (reason: string) => {
          setSocketState(prev => ({
            ...prev,
            connected: false,
            reconnecting: reason === 'io server disconnect' ? false : true,
          }));
        };

        const handleConnectError = (error: Error) => {
          setSocketState(prev => ({
            ...prev,
            error: error.message,
            reconnecting: true,
          }));
        };

        const handleReconnectAttempt = (attemptNumber: number) => {
          setSocketState(prev => ({
            ...prev,
            reconnecting: true,
            reconnectAttempts: attemptNumber,
          }));
        };

        const handleReconnect = () => {
          setSocketState(prev => ({
            ...prev,
            connected: true,
            reconnecting: false,
            error: null,
            lastConnected: new Date(),
            reconnectAttempts: 0,
          }));
        };

        const handleReconnectError = (error: Error) => {
          setSocketState(prev => ({
            ...prev,
            error: error.message,
          }));
        };

        const handleReconnectFailed = () => {
          setSocketState(prev => ({
            ...prev,
            reconnecting: false,
            error: 'Failed to reconnect after maximum attempts',
          }));
        };

        socket.on(SocketEvents.CONNECT, handleConnect);
        socket.on(SocketEvents.DISCONNECT, handleDisconnect);
        socket.on(SocketEvents.CONNECT_ERROR, handleConnectError);
        socket.on(SocketEvents.RECONNECT_ATTEMPT, handleReconnectAttempt);
        socket.on(SocketEvents.RECONNECT, handleReconnect);
        socket.on(SocketEvents.RECONNECT_ERROR, handleReconnectError);
        socket.on(SocketEvents.RECONNECT_FAILED, handleReconnectFailed);

      } catch (error) {
        setSocketState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize socket',
        }));
      }
    }).catch((err: Error) => {
      if (!cancelled) {
        setSocketState(prev => ({
          ...prev,
          connected: false,
          reconnecting: false,
          error: err?.message ?? 'Failed to initialize socket',
        }));
      }
    });

    // App state handling
    const handleAppState = (nextAppState: AppStateStatus) => {
      if (!socketRef.current) return;
      if (nextAppState === 'active') {
        if (!socketRef.current.connected) socketRef.current.connect();
      } else if ((nextAppState === 'background' || nextAppState === 'inactive') && Platform.OS !== 'web') {
        if (socketRef.current.connected) socketRef.current.disconnect();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppState);

    // Cleanup
    return () => {
      cancelled = true;
      appStateSubscription.remove();
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [authToken]);

  // Sync to store
  useEffect(() => {
    _setFromProvider(socketState);
  }, [socketState, _setFromProvider]);

  // Re-subscribe after reconnect
  const resubscribeAll = useCallback(() => {
    if (!socketRef.current) return;
    subscribedProducts.current.forEach(productId => {
      socketRef.current?.emit(SocketEvents.SUBSCRIBE_PRODUCT, { productId });
    });
    subscribedStores.current.forEach(storeId => {
      socketRef.current?.emit(SocketEvents.SUBSCRIBE_STORE, { storeId });
    });
    subscribedOrders.current.forEach((userId, orderId) => {
      socketRef.current?.emit(SocketEvents.SUBSCRIBE_ORDER, { orderId, userId });
    });
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
  }, []);

  return {
    ...socketState,
    connect,
    disconnect,
  };
}

// Lazy load socket.io-client
const getIO = async () => (await import('socket.io-client')).io;
