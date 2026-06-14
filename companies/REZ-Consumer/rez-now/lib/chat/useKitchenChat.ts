// Kitchen Chat Integration with @rez/chat
// This file shows how to integrate the unified chat service into KitchenChatDrawer

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { STORE_CHAT_EVENTS } from '@rez/chat';

// ── Types ──────────────────────────────────────────────────────────────────────

interface KitchenMessage {
  id: string;
  conversationId: string;
  sender: 'customer' | 'staff' | 'kitchen';
  senderName: string;
  content: string;
  tableNumber: string;
  orderType: 'dine_in' | 'takeout' | 'delivery';
  timestamp: string;
  read: boolean;
}

interface UseKitchenChatOptions {
  storeSlug: string;
  apiBaseUrl: string;
  socketUrl?: string;
  token?: string;
}

// ── Hook ────────────────────────────────────────────────────────────────────────

export function useKitchenChat(options: UseKitchenChatOptions) {
  const { storeSlug, apiBaseUrl, socketUrl, token } = options;

  const [messages, setMessages] = useState<KitchenMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [staffTyping, setStaffTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Socket Connection ────────────────────────────────────────────────────

  useEffect(() => {
    const socket = io(`${socketUrl || apiBaseUrl}/table`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      auth: { token },
    });

    socket.on('connect', () => {
      setConnected(true);
      // Join store room
      socket.emit('join-store', { storeSlug });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // New message from customer
    socket.on('table:message:received', (data: KitchenMessage) => {
      setMessages((prev) => [...prev, data]);
      setUnreadCount((prev) => prev + 1);
    });

    // Staff typing indicator
    socket.on('table:message:typing', (data: { tableNumber: string; isTyping: boolean }) => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setStaffTyping(data.isTyping);
      if (data.isTyping) {
        typingTimeoutRef.current = setTimeout(() => setStaffTyping(false), 3000);
      }
    });

    // Message acknowledged
    socket.on('table:message:ack', (data: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, read: true } : m
        )
      );
    });

    socketRef.current = socket;

    return () => {
      socket.emit('leave-store', { storeSlug });
      socket.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [storeSlug, apiBaseUrl, socketUrl, token]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (tableNumber: string, content: string, orderType: 'dine_in' | 'takeout' | 'delivery' = 'dine_in') => {
      if (!socketRef.current || !content.trim()) return;

      const message: KitchenMessage = {
        id: `msg_${Date.now()}`,
        conversationId: `table_${tableNumber}`,
        sender: 'kitchen',
        senderName: 'Kitchen',
        content: content.trim(),
        tableNumber,
        orderType,
        timestamp: new Date().toISOString(),
        read: false,
      };

      // Optimistic update
      setMessages((prev) => [...prev, message]);

      // Send via socket
      socketRef.current.emit('table:message', {
        tableNumber,
        message: content.trim(),
        orderType,
      });
    },
    []
  );

  const sendTyping = useCallback((tableNumber: string, isTyping: boolean) => {
    socketRef.current?.emit('table:message:typing', {
      tableNumber,
      isTyping,
    });
  }, []);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    messages,
    messagesByTable: messages.reduce((acc, msg) => {
      if (!acc[msg.tableNumber]) acc[msg.tableNumber] = [];
      acc[msg.tableNumber].push(msg);
      return acc;
    }, {} as Record<string, KitchenMessage[]>),
    connected,
    staffTyping,
    unreadCount,
    sendMessage,
    sendTyping,
    clearUnread,
  };
}

// ── Example Usage ────────────────────────────────────────────────────────────────

/*
import { useKitchenChat } from '@/lib/chat/useKitchenChat';
import KitchenChatDrawer from '@/components/table/KitchenChatDrawer';

function KitchenPage() {
  const chat = useKitchenChat({
    storeSlug: 'my-restaurant',
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL,
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL,
    token: user.token,
  });

  return (
    <KitchenChatDrawer
      messages={chat.messagesByTable}
      onSendMessage={chat.sendMessage}
      onTyping={chat.sendTyping}
      connected={chat.connected}
      unreadCount={chat.unreadCount}
    />
  );
}
*/
