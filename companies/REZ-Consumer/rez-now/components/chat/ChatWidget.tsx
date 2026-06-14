'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/app/[storeSlug]/StoreContextProvider';
import { useUIStore } from '@/lib/store/uiStore';
import { sendChatMessage, getChatHistory } from '@/lib/api/chat';
import { AIMessage } from '@/lib/api/chat';
import { cn } from '@/lib/utils/cn';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Modal from '@/components/ui/Modal';
import { logger } from '@/lib/utils/logger';

const CONV_STORAGE_KEY = 'rez_chat_conv_id';

const DISPLAY_MODE_LABELS: Record<string, string> = {
  restaurant: 'order via chat',
  cafe: 'order via chat',
  cloud_kitchen: 'order via chat',
  retail: 'find products',
  salon: 'book via chat',
  hotel: 'order via chat',
  service: 'book via chat',
  general: 'chat with us',
};

function getOrCreateConvId(): string {
  if (typeof window === 'undefined') return '';
  const existing = localStorage.getItem(CONV_STORAGE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(CONV_STORAGE_KEY, id);
  return id;
}

interface ChatWidgetProps {
  /** Optional override for the store name shown in the chat header */
  customStoreName?: string;
}

export default function ChatWidget({ customStoreName }: ChatWidgetProps) {
  const isEnabled = process.env.NEXT_PUBLIC_AI_ENABLED === 'true';

  const { store } = useStore();
  const showToast = useUIStore((s) => s.showToast);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedHistory = useRef(false);

  // Initialize conversation ID on mount (client-only)
  useEffect(() => {
    setConversationId(getOrCreateConvId());
  }, []);

  // Scroll to bottom whenever a new message arrives
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Load chat history when drawer first opens
  useEffect(() => {
    if (!isOpen || !conversationId || hasLoadedHistory.current) return;
    hasLoadedHistory.current = true;

    setIsLoading(true);
    getChatHistory(conversationId)
      .then((history) => {
        if (history.length > 0) {
          setMessages(history);
        }
      })
      .catch((err) => {
        logger.warn('[ChatWidget] Failed to load history', { error: err });
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, conversationId]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || !conversationId) return;

      const userMsg: AIMessage = {
        role: 'user',
        content: text.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const response = await sendChatMessage(store.slug, text.trim(), conversationId);

        const assistantMsg: AIMessage = {
          role: 'assistant',
          content: response.content,
          type: response.type,
          createdAt: new Date().toISOString(),
          metadata: {
            items: response.items,
            reservationParams: response.reservationParams,
          },
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: unknown) {
        const error = err as { response?: { status?: number }; code?: string; message?: string };
        if (error.response?.status === 429) {
          showToast('Too many messages. Please wait a moment.', 'error');
        } else if (error.code !== 'CHAT_ERROR' || error.message) {
          showToast('Could not reach AI assistant. Try again.', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, store.slug, showToast]
  );

  if (!isEnabled) return null;

  const displayLabel = DISPLAY_MODE_LABELS[store.storeType] ?? DISPLAY_MODE_LABELS.general;
  const storeName = customStoreName ?? store.name;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label={`Chat with AI assistant — ${displayLabel}`}
        className={cn(
          'fixed bottom-20 right-4 z-40',
          'flex items-center justify-center gap-2',
          'w-14 h-14 rounded-full shadow-xl',
          'bg-indigo-600 text-white',
          'transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2'
        )}
      >
        {/* Chat bubble SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Chat Drawer */}
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={storeName}
        className="flex flex-col max-h-[80vh] p-0 gap-0"
      >
        <div className="flex flex-col min-h-0" style={{ height: 'calc(80vh - 80px)', maxHeight: '560px' }}>
          {/* Subtitle */}
          <div className="px-6 pb-2">
            <p className="text-xs text-gray-500">
              {displayLabel.charAt(0).toUpperCase() + displayLabel.slice(1)} &mdash; powered by AI
            </p>
          </div>

          {/* Message list */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {isLoading && messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <svg
                    className="animate-spin w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Thinking...
                </div>
              </div>
            )}

            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6 text-indigo-500"
                  >
                    <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.33 1.94 4.24 4.33 4.24a4.2 4.2 0 002.67-1.02V17.5a1.5 1.5 0 013 0v.5c0 2.33-1.94 4.24-4.33 4.24a4.2 4.2 0 01-2.68-1.02 4.2 4.2 0 01-1.73.97c-.95.22-1.96.13-2.87-.26a5.44 5.44 0 01-4.23-5.18V6.35C6.02 4.27 7.97 2.33 10.38 2.2V.78a.75.75 0 011.5 0v1.78c2.38.13 4.35 2.24 4.35 4.35v.06a.75.75 0 01-1.5 0V6.35c0-1.53-1.24-2.78-2.78-2.78H11.5c-1.53 0-2.78 1.25-2.78 2.78v7.23c0 1.76 1.02 3.32 2.54 4.16a3.9 3.9 0 004.3-.57 3.9 3.9 0 001.7-3.2V6.35C16.27 4.27 14.32 2.33 11.91 2.2V.78a.75.75 0 011.5 0v1.78c-.47.03-.91.22-1.27.53A2.78 2.78 0 0011.5 6.35v5.78a1.5 1.5 0 003 0V6.35c0-1.53-1.24-2.78-2.78-2.78H11.5a.75.75 0 01-.75-.75v-.06c0-.03.03-.06.03-.06z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Hi! I&apos;m your AI assistant</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                    Ask me about the menu, place an order, or book a reservation.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <ChatMessage key={`${msg.createdAt}-${idx}`} message={msg} />
            ))}

            {isLoading && messages.length > 0 && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-3.5 h-3.5 text-indigo-600"
                  >
                    <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.33 1.94 4.24 4.33 4.24a4.2 4.2 0 002.67-1.02V17.5a1.5 1.5 0 013 0v.5c0 2.33-1.94 4.24-4.33 4.24a4.2 4.2 0 01-2.68-1.02 4.2 4.2 0 01-1.73.97c-.95.22-1.96.13-2.87-.26a5.44 5.44 0 01-4.23-5.18V6.35C6.02 4.27 7.97 2.33 10.38 2.2V.78a.75.75 0 011.5 0v1.78c2.38.13 4.35 2.24 4.35 4.35v.06a.75.75 0 01-1.5 0V6.35c0-1.53-1.24-2.78-2.78-2.78H11.5c-1.53 0-2.78 1.25-2.78 2.78v7.23c0 1.76 1.02 3.32 2.54 4.16a3.9 3.9 0 004.3-.57 3.9 3.9 0 001.7-3.2V6.35C16.27 4.27 14.32 2.33 11.91 2.2V.78a.75.75 0 011.5 0v1.78c-.47.03-.91.22-1.27.53A2.78 2.78 0 0011.5 6.35v5.78a1.5 1.5 0 003 0V6.35c0-1.53-1.24-2.78-2.78-2.78H11.5a.75.75 0 01-.75-.75v-.06c0-.03.03-.06.03-.06z" />
                  </svg>
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-500 animate-pulse">
                  Typing...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0">
            <ChatInput onSend={handleSend} isLoading={isLoading} disabled={!conversationId} />
          </div>
        </div>
      </Modal>
    </>
  );
}
