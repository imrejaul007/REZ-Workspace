'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react';
import { io as socketIO, Socket } from 'socket.io-client';
import { getAccessTokenSync } from '@/lib/api/client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://api.rezapp.com';

// Validate token format and expiration
function getValidToken(): string | null {
  const token = getAccessTokenSync();
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
  } catch {
    // Allow connection if we can't parse - server will validate
  }

  return token;
}

type AvailabilityCallback = (itemId: string, available: boolean) => void;

interface MenuSocketContextValue {
  subscribeAvailability: (itemId: string, callback: AvailabilityCallback) => () => void;
  isConnected: boolean;
}

const MenuSocketContext = createContext<MenuSocketContextValue | null>(null);

export function useMenuSocket(): MenuSocketContextValue {
  const ctx = useContext(MenuSocketContext);
  if (!ctx) {
    throw new Error('useMenuSocket must be used inside MenuSocketProvider');
  }
  return ctx;
}

/**
 * Holds a single Socket.IO connection per store and dispatches
 * `menu:item-availability` events to subscribed MenuItem components.
 *
 * Usage:
 *   <MenuSocketProvider storeId={store.id}>
 *     <StorePage />
 *   </MenuSocketProvider>
 */
export default function MenuSocketProvider({
  storeId,
  children,
}: {
  storeId: string;
  children: React.ReactNode;
}) {
  const socketRef = useRef<Socket | null>(null);
  // Map from itemId → Set of callbacks
  const callbacksRef = useRef<Map<string, Set<AvailabilityCallback>>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!storeId) return;

    // Get valid token before connecting
    const token = getValidToken();
    if (!token) {
      logger.warn('[MenuSocket] No valid auth token, skipping connection');
      return;
    }

    const socket = socketIO(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // SECURITY: Include auth token - backend MUST validate before allowing connection
      auth: { token },
      withCredentials: true,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-store', { storeId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      setIsConnected(false);
      // Log auth-related errors
      if (err.message === 'Authentication required' || err.message === 'Invalid or expired token') {
        logger.error('[MenuSocket] Auth failed:', err.message);
      }
    });

    // Single handler that fans out to all per-item subscriptions
    socket.on(
      'menu:item-availability',
      (data: { itemId: string; available: boolean }) => {
        const cbs = callbacksRef.current.get(data.itemId);
        if (cbs) {
          cbs.forEach((cb) => cb(data.itemId, data.available));
        }
      },
    );

    return () => {
      socket.emit('leave-store', { storeId });
      socket.disconnect();
      socketRef.current = null;
      callbacksRef.current.clear();
      setIsConnected(false);
    };
  }, [storeId]);

  /**
   * Subscribe to availability changes for a specific item.
   * Returns an unsubscribe function — call it on component unmount.
   */
  const subscribeAvailability = useCallback(
    (itemId: string, callback: AvailabilityCallback): (() => void) => {
      if (!callbacksRef.current.has(itemId)) {
        callbacksRef.current.set(itemId, new Set());
      }
      callbacksRef.current.get(itemId)!.add(callback);
      return () => {
        callbacksRef.current.get(itemId)?.delete(callback);
        if (callbacksRef.current.get(itemId)?.size === 0) {
          callbacksRef.current.delete(itemId);
        }
      };
    },
    [],
  );

  return (
    <MenuSocketContext.Provider value={{ subscribeAvailability, isConnected }}>
      {children}
    </MenuSocketContext.Provider>
  );
}
