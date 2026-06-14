import { useEffect, useState, useCallback, useRef } from 'react';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';

// ==================== TYPES ====================

export type WebSocketEventType =
  | 'notification'
  | 'task_updated'
  | 'leave_status'
  | 'announcement'
  | 'message'
  | 'presence'
  | 'typing'
  | 'connection'
  | 'disconnection'
  | 'room_joined'
  | 'room_left'
  | 'error'
  | 'pong';

export interface WebSocketMessage {
  type: WebSocketEventType;
  room?: string;
  payload: unknown;
  timestamp: string;
}

export interface WebSocketHandlers {
  onMessage?: (message: WebSocketMessage) => void;
  onNotification?: (payload: unknown) => void;
  onTaskUpdated?: (payload: unknown) => void;
  onLeaveStatus?: (payload: unknown) => void;
  onAnnouncement?: (payload: unknown) => void;
  onMessageReceived?: (payload: unknown) => void;
  onPresenceChange?: (payload: { userId: string; status: string }) => void;
  onTyping?: (payload: { userId: string; roomId: string; isTyping: boolean }) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: unknown) => void;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  send: (action: string, payload: unknown) => void;
  joinRoom: (roomId: string, roomType: 'user' | 'team' | 'company' | 'project' | 'custom') => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, type: string, data: unknown) => void;
  sendTyping: (roomId: string, isTyping: boolean, context?: string) => void;
  updatePresence: (status: 'online' | 'offline' | 'away' | 'busy') => void;
  reconnect: () => void;
  disconnect: () => void;
  onlineUsers: string[];
}

// ==================== CONSTANTS ====================

const WS_URL = Constants.expoConfig?.extra?.realtimeServiceUrl || 'ws://localhost:4748';
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL = 30000;

// ==================== HOOK ====================

export function useWebSocket(handlers?: WebSocketHandlers): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const { user, isAuthenticated } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isManualDisconnectRef = useRef(false);

  // ==================== HANDLE MESSAGE ====================

  const handleMessage = useCallback((event: { data: string }) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // Call generic message handler
      handlers?.onMessage?.(message);

      // Call specific handlers based on type
      switch (message.type) {
        case 'notification':
          handlers?.onNotification?.(message.payload);
          break;
        case 'task_updated':
          handlers?.onTaskUpdated?.(message.payload);
          break;
        case 'leave_status':
          handlers?.onLeaveStatus?.(message.payload);
          break;
        case 'announcement':
          handlers?.onAnnouncement?.(message.payload);
          break;
        case 'message':
          handlers?.onMessageReceived?.(message.payload);
          break;
        case 'presence':
          handlers?.onPresenceChange?.(message.payload as { userId: string; status: string });
          break;
        case 'typing':
          handlers?.onTyping?.(message.payload as { userId: string; roomId: string; isTyping: boolean });
          break;
        case 'connection':
          if ('authenticated' in (message.payload as Record<string, unknown>)) {
            setIsConnected(true);
            setConnectionState('connected');
            setError(null);
            handlers?.onConnectionChange?.(true);
          }
          break;
        case 'error':
          const errorPayload = message.payload as { code?: string; message?: string };
          setError(errorPayload.message || 'WebSocket error');
          handlers?.onError?.(errorPayload);
          break;
      }
    } catch (err) {
      logger.error('Failed to parse WebSocket message:', err);
    }
  }, [handlers]);

  // ==================== CONNECT ====================

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    isManualDisconnectRef.current = false;
    setIsConnecting(true);
    setConnectionState('connecting');

    const userId = user.id || user.userId;
    const wsUrl = `${WS_URL}?userId=${userId}&token=${user.token || ''}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionState('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
        handlers?.onConnectionChange?.(true);

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'ping' }));
          }
        }, PING_INTERVAL);
      };

      ws.onmessage = handleMessage;

      ws.onerror = (event) => {
        logger.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setConnectionState('error');
        handlers?.onError?.(event);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionState('disconnected');
        handlers?.onConnectionChange?.(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Auto reconnect if not manual disconnect
        if (!isManualDisconnectRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_INTERVAL);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      setConnectionState('error');
      setIsConnecting(false);
      handlers?.onError?.(err);
    }
  }, [isAuthenticated, user, handleMessage, handlers]);

  // ==================== DISCONNECT ====================

  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionState('disconnected');
    handlers?.onConnectionChange?.(false);
  }, [handlers]);

  // ==================== RECONNECT ====================

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  // ==================== SEND ====================

  const send = useCallback((action: string, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, payload }));
    } else {
      logger.warn('WebSocket not connected, message not sent');
    }
  }, []);

  // ==================== JOIN ROOM ====================

  const joinRoom = useCallback((roomId: string, roomType: 'user' | 'team' | 'company' | 'project' | 'custom') => {
    send('join_room', { roomId, roomType });
  }, [send]);

  // ==================== LEAVE ROOM ====================

  const leaveRoom = useCallback((roomId: string) => {
    send('leave_room', { roomId });
  }, [send]);

  // ==================== SEND MESSAGE ====================

  const sendMessage = useCallback((roomId: string, type: string, data: unknown) => {
    send('send_message', { roomId, type, data });
  }, [send]);

  // ==================== SEND TYPING ====================

  const sendTyping = useCallback((roomId: string, isTyping: boolean, context?: string) => {
    send('typing', { roomId, isTyping, context });
  }, [send]);

  // ==================== UPDATE PRESENCE ====================

  const updatePresence = useCallback((status: 'online' | 'offline' | 'away' | 'busy') => {
    send('presence', { status });
  }, [send]);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, connect, disconnect]);

  // ==================== RETURN ====================

  return {
    isConnected,
    isConnecting,
    connectionState,
    error,
    send,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    updatePresence,
    reconnect,
    disconnect,
    onlineUsers,
  };
}
