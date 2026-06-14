'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUIStore } from '@/lib/store/uiStore';
import { logger } from '@/lib/utils/logger';
import { getAccessTokenSync } from '@/lib/api/client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://api.rezapp.com';
const MAX_MESSAGE_LENGTH = 500;
const CHAR_COUNTER_THRESHOLD = 400;

interface TableMessage {
  id: string;
  message: string;
  customerName: string;
  timestamp: string;
  /** true = sent by this customer, false = received (future: staff replies) */
  isSelf: boolean;
}

interface KitchenChatDrawerProps {
  storeSlug: string;
  tableNumber: string;
  customerName?: string;
}

export default function KitchenChatDrawer({
  storeSlug,
  tableNumber,
  customerName = 'Guest',
}: KitchenChatDrawerProps) {
  const showToast = useUIStore((s) => s.showToast);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<TableMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  // NW-MED-050: Track unread count — increments when messages arrive while drawer is closed.
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom whenever messages change and drawer is open
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Connect to the /table namespace once on mount
  useEffect(() => {
    if (!tableNumber) return;

    // NW-MED-049: Pass auth token in Socket.IO handshake — backend must validate
    // the token and verify the user has access to this store+table before allowing
    // connection to the /table namespace.
    const token = getAccessTokenSync();
    const socket = io(`${SOCKET_URL}/table`, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // NW-MED-050: Reset unread count when drawer is opened.
      // The badge persists unread count when drawer is closed.
    });

    socket.on('connect_error', (err) => {
      logger.warn('[KitchenChat] Socket connect error', { message: err.message });
    });

    socket.on('table:message:ack', (data: { id: string; timestamp: string }) => {
      // Mark the pending message as delivered
      setMessages((prev) =>
        prev.map((m) => (m.id === data.id ? { ...m, id: data.id } : m)),
      );
      showToast('Message sent to kitchen', 'success');
      setIsSending(false);
    });

    // NW-MED-050: Handle incoming messages from the kitchen/staff.
    // Increment unread count only when the drawer is closed.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    socket.on('table:message:received', (_data: TableMessage) => {
      if (!isOpen) {
        setUnreadCount((n) => n + 1);
      }
    });

    socket.on('table:message:error', (data: { message: string }) => {
      showToast(data.message || 'Could not send message', 'error');
      setIsSending(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tableNumber, showToast, isOpen]);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || !tableNumber || isSending) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: TableMessage = {
      id: optimisticId,
      message: trimmed,
      customerName,
      timestamp: new Date().toISOString(),
      isSelf: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputValue('');
    setIsSending(true);

    socketRef.current?.emit('table:message', {
      storeSlug,
      tableNumber,
      message: trimmed,
      customerName,
    });
  }, [inputValue, tableNumber, storeSlug, customerName, isSending]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const charsLeft = MAX_MESSAGE_LENGTH - inputValue.length;
  const isOverThreshold = inputValue.length >= CHAR_COUNTER_THRESHOLD;
  const canSend = inputValue.trim().length > 0 && !!tableNumber && !isSending;

  return (
    <>
      {/* Floating chat bubble (bottom-right, above WaiterCallButton) */}
      <button
        onClick={() => {
          setIsOpen((prev) => {
            const next = !prev;
            if (next) setUnreadCount(0); // NW-MED-050: Reset unread on open
            return next;
          });
        }}
        aria-label={isOpen ? 'Close kitchen chat' : 'Chat with kitchen/staff'}
        className={[
          'flex flex-col items-center justify-center gap-0.5',
          'w-14 h-14 rounded-full shadow-lg',
          'text-white text-xs font-semibold',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500',
          isOpen ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700',
        ].join(' ')
        }
        style={{ position: 'relative' }}
      >
        {/* Chat bubble icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z"
            clipRule="evenodd"
          />
        </svg>
        <span className="leading-none text-[10px]">Chat</span>
        {/* NW-MED-050: Show unread count when drawer is closed, not total messages */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-up drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Kitchen chat"
          className="fixed inset-0 z-50 flex items-end justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[70vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Message Kitchen / Staff</h2>
                <p className="text-xs text-gray-500">Table {tableNumber}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-0">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Send a message to the kitchen or staff — e.g. &ldquo;allergy: no nuts&rdquo; or &ldquo;extra napkins please&rdquo;
                </p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col items-end gap-0.5">
                    <div className="max-w-[80%] bg-purple-600 text-white rounded-2xl rounded-br-sm px-3 py-2 text-sm">
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-4 py-3 border-t border-gray-100 flex flex-col gap-1">
              <div className="flex gap-2 items-end">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={2}
                  aria-label="Message to kitchen"
                  className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                />
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  aria-label="Send message"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 self-end"
                >
                  Send
                </button>
              </div>
              {isOverThreshold && (
                <p className={`text-xs text-right ${charsLeft <= 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {charsLeft} character{charsLeft !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
