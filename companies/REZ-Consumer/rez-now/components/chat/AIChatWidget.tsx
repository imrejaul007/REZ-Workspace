'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/app/[storeSlug]/StoreContextProvider';
import { useUIStore } from '@/lib/store/uiStore';
import { useAuthStore } from '@/lib/store/authStore';
import { aiChatService, ChatMessage, QUICK_ACTIONS, QUICK_ACTION_MESSAGES } from '@/lib/services/aiChatService';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import VoiceInput from './VoiceInput';

const CONV_STORAGE_KEY = 'rez_ai_conv_id';

// ── Types ──────────────────────────────────────────────────────────────────────

interface MenuItemReference {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;
}

interface RagAction {
  type: 'recommend' | 'order' | 'navigate' | 'add_to_cart' | 'show_menu';
  label: string;
  data: {
    itemIds?: string[];
    menuItem?: MenuItemReference;
    categorySlug?: string;
    url?: string;
    quantity?: number;
  };
}

interface RagResponse {
  success: boolean;
  answer: string;
  sources: MenuItemReference[];
  actions: RagAction[];
  confidence: number;
  intent: string;
  suggestedQuestions?: string[];
}

// ── Helper Functions ──────────────────────────────────────────────────────────

function getOrCreateConvId(): string {
  if (typeof window === 'undefined') return '';
  const existing = localStorage.getItem(CONV_STORAGE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(CONV_STORAGE_KEY, id);
  return id;
}

function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

// ── Extended ChatMessage ───────────────────────────────────────────────────────

interface ExtendedChatMessage extends ChatMessage {
  ragResponse?: RagResponse;
}

interface AIChatWidgetProps {
  /** Custom store name to display in chat header */
  customStoreName?: string;
  /** Show quick action buttons */
  showQuickActions?: boolean;
  /** Position of the widget */
  position?: 'bottom-right' | 'bottom-left';
  /** Enable RAG-powered responses */
  enableRAG?: boolean;
  /** Enable voice input */
  enableVoiceInput?: boolean;
}

export default function AIChatWidget({
  customStoreName,
  showQuickActions = true,
  position = 'bottom-right',
  enableRAG = true,
  enableVoiceInput = true,
}: AIChatWidgetProps) {
  const { store } = useStore();
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLoadedHistory = useRef(false);

  // Check for dark mode preference
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Initialize session ID
  useEffect(() => {
    setSessionId(getOrCreateConvId());
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ── RAG Integration ─────────────────────────────────────────────────────────────

  /**
   * Process message with RAG chatbot
   */
  const processWithRAG = useCallback(async (text: string): Promise<RagResponse | null> => {
    if (!enableRAG) return null;

    try {
      const response = await fetch('/api/chat/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          storeId: store.id,
          storeSlug: store.slug,
          query: text,
          context: {
            orderHistory: [],
            dietaryRestrictions: [],
            preferences: [],
          },
        }),
      });

      if (!response.ok) {
        logger.warn('[AIChatWidget] RAG API failed', { status: response.status });
        return null;
      }

      const data = await response.json();
      if (data.success) {
        // Track analytics
        fetch('/api/chat/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'message_received',
            sessionId,
            userId: user?.id || 'anonymous',
            storeSlug: store.slug,
            metadata: {
              intent: data.intent,
              confidence: data.confidence,
            },
          }),
        }).catch(() => {});

        return data as RagResponse;
      }
      return null;
    } catch (error) {
      logger.error('[AIChatWidget] RAG error', { error });
      return null;
    }
  }, [enableRAG, store.id, store.slug, sessionId, user?.id]);

  const sendMessage = useCallback(
    async (text: string, isQuickAction = false) => {
      if (!text.trim() || !sessionId) return;

      const userMessage: ExtendedChatMessage = {
        id: `user_${Date.now()}`,
        content: text.trim(),
        sender: 'user',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);
      setSuggestedQuestions([]);

      try {
        // Try RAG first if enabled
        let ragResponse: RagResponse | null = null;
        if (enableRAG) {
          ragResponse = await processWithRAG(text.trim());
        }

        if (ragResponse && ragResponse.success) {
          // Use RAG response
          const ragMessage: ExtendedChatMessage = {
            id: `rag_${Date.now()}`,
            content: ragResponse.answer,
            sender: 'ai',
            timestamp: new Date(),
            ragResponse,
          };

          setMessages((prev) => [...prev, ragMessage]);

          // Update suggested questions
          if (ragResponse.suggestedQuestions) {
            setSuggestedQuestions(ragResponse.suggestedQuestions);
          }

          // Track analytics
          fetch('/api/chat/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'message_received',
              sessionId,
              userId: user?.id || 'anonymous',
              storeSlug: store.slug,
              metadata: {
                intent: ragResponse.intent,
                confidence: ragResponse.confidence,
              },
            }),
          }).catch(() => {});
        } else {
          // Fall back to existing AI chat service
          const response = await aiChatService.sendMessage({
            merchantId: store.id,
            userId: user?.id || 'anonymous',
            message: text.trim(),
            sessionId,
            context: {
              storeSlug: store.slug,
              storeType: store.storeType,
            },
          });

          setMessages((prev) => [...prev, response]);
        }
      } catch (error) {
        logger.error('[AIChatWidget] Send message failed', { error });

        const errorMessage: ExtendedChatMessage = {
          id: `error_${Date.now()}`,
          content: isQuickAction
            ? "I'm having trouble processing your request. Please try again or type your message directly."
            : 'Sorry, I encountered an error. Please try again.',
          sender: 'system',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [sessionId, store.id, store.slug, store.storeType, user?.id, enableRAG, processWithRAG]
  );

  const handleQuickAction = useCallback(
    (action: 'order' | 'book' | 'enquire') => {
      const message = QUICK_ACTION_MESSAGES[action];
      sendMessage(message, true);
    },
    [sendMessage]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || isLoading) return;
      sendMessage(inputValue);
    },
    [inputValue, isLoading, sendMessage]
  );

  const storeName = customStoreName ?? store.name ?? 'REZ Support';

  // Position classes
  const positionClasses = position === 'bottom-right'
    ? 'bottom-20 right-4'
    : 'bottom-20 left-4';

  const drawerPositionClasses = position === 'bottom-right'
    ? 'right-4'
    : 'left-4';

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open AI chat support"
        className={cn(
          'fixed z-40',
          positionClasses,
          'flex items-center justify-center',
          'w-14 h-14 rounded-full shadow-xl',
          'bg-gradient-to-br from-indigo-600 to-purple-600 text-white',
          'transition-all hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2',
          'animate-bounce-subtle'
        )}
      >
        {/* AI sparkle icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
          aria-hidden="true"
        >
          <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
        </svg>
      </button>

      {/* Chat Drawer */}
      <div
        className={cn(
          'fixed z-50 w-[calc(100vw-2rem)] max-w-sm',
          'flex flex-col rounded-2xl shadow-2xl overflow-hidden',
          'border border-gray-200 dark:border-gray-700',
          drawerPositionClasses,
          'transition-all duration-300 ease-in-out',
          isOpen ? 'bottom-36 opacity-100 translate-y-0' : 'bottom-32 opacity-0 translate-y-4 pointer-events-none'
        )}
        style={{
          height: isOpen ? 'calc(100vh - 180px)' : '0',
          maxHeight: isOpen ? '600px' : '0',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-white"
              >
                <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{storeName}</h3>
              <p className="text-white/80 text-xs">AI Support</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
            className="text-white/80 hover:text-white transition-colors p-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
              <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-7 h-7 text-indigo-600 dark:text-indigo-400"
                >
                  <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Hi there! I&apos;m your AI assistant
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[220px]">
                  Ask me about the menu, place an order, or get recommendations.
                </p>
              </div>

              {/* Quick Actions */}
              {showQuickActions && (
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <button
                    onClick={() => handleQuickAction('order')}
                    className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    {QUICK_ACTIONS.ORDER.label}
                  </button>
                  <button
                    onClick={() => handleQuickAction('book')}
                    className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    {QUICK_ACTIONS.BOOK.label}
                  </button>
                  <button
                    onClick={() => handleQuickAction('enquire')}
                    className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    {QUICK_ACTIONS.ENQUIRE.label}
                  </button>
                </div>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isDarkMode={isDarkMode}
              onAddToCart={(itemId) => {
                showToast?.(`Item added to cart`, 'success');
              }}
              onNavigate={(url) => {
                window.location.href = url;
              }}
            />
          ))}

          {isTyping && <TypingIndicator isDarkMode={isDarkMode} />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-2 rounded-full text-sm',
                'bg-gray-100 dark:bg-gray-700',
                'text-gray-900 dark:text-gray-100',
                'placeholder-gray-500 dark:placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />

            {/* Voice Input */}
            {enableVoiceInput && (
              <VoiceInput
                onTranscript={(text) => {
                  setInputValue(text);
                  setTimeout(() => sendMessage(text), 100);
                }}
                disabled={isLoading}
                className="flex-shrink-0"
              />
            )}

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                'bg-indigo-600 text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'hover:bg-indigo-700 active:scale-95',
                'transition-all'
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && !isTyping && (
            <div className="mt-2 flex flex-wrap gap-1">
              {suggestedQuestions.slice(0, 3).map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(question)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-full',
                    'bg-indigo-50 dark:bg-indigo-900/30',
                    'text-indigo-600 dark:text-indigo-400',
                    'hover:bg-indigo-100 dark:hover:bg-indigo-900/50',
                    'transition-colors'
                  )}
                >
                  {question}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    </>
  );
}

// ── Message Bubble Component ────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ExtendedChatMessage;
  isDarkMode: boolean;
  onAddToCart?: (itemId: string) => void;
  onNavigate?: (url: string) => void;
}

function MessageBubble({ message, isDarkMode, onAddToCart, onNavigate }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const ragResponse = message.ragResponse;

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2',
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : isSystem
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* RAG Recommendations */}
        {ragResponse && ragResponse.sources.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium opacity-75">Recommended for you:</p>
            <div className="grid gap-2">
              {ragResponse.sources.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg',
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  )}
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs opacity-75">{formatPrice(item.price)}</p>
                  </div>
                  {onAddToCart && (
                    <button
                      onClick={() => onAddToCart(item.id)}
                      className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        'bg-indigo-600 text-white',
                        'hover:bg-indigo-700',
                        'transition-colors'
                      )}
                    >
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RAG Actions */}
        {ragResponse && ragResponse.actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {ragResponse.actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (action.type === 'navigate' && action.data.url && onNavigate) {
                    onNavigate(action.data.url);
                  }
                  if (action.type === 'add_to_cart' && action.data.itemIds?.[0] && onAddToCart) {
                    onAddToCart(action.data.itemIds[0]);
                  }
                }}
                className={cn(
                  'px-2 py-1 text-xs rounded-full',
                  'border border-indigo-300 dark:border-indigo-700',
                  'text-indigo-600 dark:text-indigo-400',
                  'hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
                  'transition-colors'
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        <p
          className={cn(
            'text-[10px] mt-2',
            isUser ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500'
          )}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ── Typing Indicator Component ──────────────────────────────────────────────────

function TypingIndicator({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="flex justify-start">
      <div
        className={cn(
          'rounded-2xl rounded-bl-sm px-4 py-3',
          'bg-white dark:bg-gray-800 shadow-sm'
        )}
      >
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'w-2 h-2 rounded-full animate-bounce',
              isDarkMode ? 'bg-gray-500' : 'bg-gray-400'
            )}
            style={{ animationDelay: '0ms' }}
          />
          <span
            className={cn(
              'w-2 h-2 rounded-full animate-bounce',
              isDarkMode ? 'bg-gray-500' : 'bg-gray-400'
            )}
            style={{ animationDelay: '150ms' }}
          />
          <span
            className={cn(
              'w-2 h-2 rounded-full animate-bounce',
              isDarkMode ? 'bg-gray-500' : 'bg-gray-400'
            )}
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
