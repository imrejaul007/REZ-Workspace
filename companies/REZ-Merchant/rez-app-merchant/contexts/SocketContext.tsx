/**
 * SocketContext — Real-time Socket.IO connection context
 *
 * Wraps the existing socketService singleton, managing connection lifecycle
 * based on auth state and app foreground/background transitions.
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { socketService } from '@/services/api/socket';
import { logger } from '@/utils/logger';

interface SocketContextType {
  isConnected: boolean;
  id?: string;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
}

const defaultContext: SocketContextType = {
  isConnected: false,
  on: () => {},
  off: () => {},
  emit: () => {},
};

const SocketContext = createContext<SocketContextType>(defaultContext);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!state.isAuthenticated || !token) return;

    // MA-INF-001 & MA-INF-029: Reset cancelled flag and listen for token expiry
    cancelledRef.current = false;

    // Connect socket
    socketService
      .connect()
      .then(() => {
        // MA-INF-001: Check cancelled before resolving
        if (!cancelledRef.current) {
          setIsConnected(socketService.getConnectionState() === 'connected');
        }
      })
      .catch((error) => {
        // MA-INF-018: Log failures
        if (!cancelledRef.current) {
          logger.warn('[Socket] Failed to connect:', error);
        }
      });

    // Listen for connection state changes.
    // The socketService emits 'connection-status' (not 'connect'/'disconnect')
    // so we map those correctly here.
    const onConnectionStatus = (status: string) => {
      if (!cancelledRef.current) {
        setIsConnected(status === 'connected');
      }
    };

    // MA-INF-029: Listen for token expiry events
    const onTokenExpiry = () => {
      logger.debug('[Socket] Token expired, reconnecting...');
      socketService.disconnect();
      socketService.connect().catch((e) => console.warn('[Socket] Reconnect failed:', e));
    };

    socketService.on('connection-status', onConnectionStatus);
    socketService.on('token-expired', onTokenExpiry);

    // Handle app state transitions
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        // Returning to foreground — reconnect
        socketService.connect().catch((e) => console.warn('[Socket] Reconnect failed:', e));
      } else if (nextState === 'background') {
        // Going to background — disconnect to save resources
        socketService.disconnect();
      }
      appStateRef.current = nextState;
    });

    return () => {
      // MA-INF-001: Mark as cancelled to prevent state updates after unmount
      cancelledRef.current = true;
      socketService.off('connection-status', onConnectionStatus);
      socketService.off('token-expired', onTokenExpiry);
      socketService.disconnect();
      appStateSub.remove();
    };
  }, [state.isAuthenticated, token]);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketService.on(event, handler);
  }, []);

  const off = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketService.off(event, handler);
  }, []);

  const emit = useCallback((event: string, ...args: unknown[]) => {
    // MA-INF-023: Properly type socket and guard against null before emitting
    // MA-INF-018: Queue subscriptions if socket not ready, with failure logging
    const socket = socketService.getSocket();
    if (!socket || !socketService.isConnected()) {
      logger.warn(`[Socket] Not connected; queuing event: ${event}`);
      // MA-INF-018: Queue for later retry instead of silently dropping
      socketService.queueEvent(event, ...args);
      return;
    }
    socketService.emit(event, ...args);
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, on, off, emit }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
