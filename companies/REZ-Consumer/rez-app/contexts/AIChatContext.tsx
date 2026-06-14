// AI Chat Context
// Provides AI-powered chat support integration with REZ-support-copilot

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { aiSupportService, AIChatMessage, QuickReply } from '@/services/aiSupportService';
import { logger } from '@/utils/logger';

interface AIChatContextType {
  messages: AIChatMessage[];
  isTyping: boolean;
  isConnected: boolean;
  sessionId: string | null;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  sendQuickReply: (quickReply: QuickReply) => Promise<void>;
  clearMessages: () => void;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  detectIntent: (message: string) => Promise<{ intent: string; confidence: number } | null>;
}

interface AIChatProviderProps {
  children: ReactNode;
  merchantId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  initialContext?: {
    orderId?: string;
    productId?: string;
    storeId?: string;
  };
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

const DEFAULT_WELCOME_MESSAGE: AIChatMessage = {
  id: 'welcome',
  content: 'Hello! I am your AI support assistant. How can I help you today?',
  sender: 'ai',
  timestamp: new Date(),
  quickReplies: [
    { id: 'faq-orders', text: 'Track my order', value: 'track_order', icon: 'cube-outline' },
    { id: 'faq-refund', text: 'Request a refund', value: 'refund_request', icon: 'wallet-outline' },
    { id: 'faq-help', text: 'General help', value: 'general_help', icon: 'help-circle-outline' },
  ],
};

export function AIChatProvider({
  children,
  merchantId,
  userId,
  userName,
  userEmail,
  initialContext,
}: AIChatProviderProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use refs to access latest state in stable callbacks
  const merchantIdRef = useRef(merchantId);
  const userIdRef = useRef(userId);
  const sessionIdRef = useRef(sessionId);
  const initialContextRef = useRef(initialContext);

  // Keep refs in sync
  useEffect(() => {
    merchantIdRef.current = merchantId;
    userIdRef.current = userId;
    sessionIdRef.current = sessionId;
    initialContextRef.current = initialContext;
  }, [merchantId, userId, sessionId, initialContext]);

  // Start a new chat session
  const startSession = useCallback(async () => {
    try {
      setError(null);
      const response = await aiSupportService.startSession(userIdRef.current, merchantIdRef.current);
      setSessionId(response.sessionId);
      sessionIdRef.current = response.sessionId;
      setIsConnected(true);
      logger.info('AI Chat session started', { sessionId: response.sessionId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
      setError(errorMessage);
      setIsConnected(false);
      logger.error('AI Chat session start failed', { error: errorMessage });
    }
  }, []);

  // End the current chat session
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await aiSupportService.endSession(sessionIdRef.current);
      logger.info('AI Chat session ended', { sessionId: sessionIdRef.current });
    } catch (err) {
      logger.error('AI Chat session end failed', err);
    } finally {
      setSessionId(null);
      sessionIdRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Add a message to the conversation
  const addMessage = useCallback((message: AIChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Send a message and get AI response
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message immediately
    const userMessage: AIChatMessage = {
      id: `user-${Date.now()}`,
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    addMessage(userMessage);

    setIsTyping(true);
    setError(null);

    try {
      const response = await aiSupportService.sendMessage({
        merchantId: merchantIdRef.current,
        userId: userIdRef.current,
        message: content.trim(),
        sessionId: sessionIdRef.current || undefined,
        context: initialContextRef.current,
      });

      addMessage(response);
      logger.info('AI Chat message sent', { userMessage: content.trim() });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';

      // Add error message
      const errorResponse: AIChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I could not process your request. Please try again.',
        sender: 'system',
        timestamp: new Date(),
      };
      addMessage(errorResponse);

      setError(errorMessage);
      logger.error('AI Chat sendMessage failed', { error: errorMessage });
    } finally {
      setIsTyping(false);
    }
  }, [addMessage]);

  // Handle quick reply selection
  const sendQuickReply = useCallback(async (quickReply: QuickReply) => {
    // Convert quick reply to a message and send
    const messageContent = quickReply.value || quickReply.text;
    await sendMessage(messageContent);
  }, [sendMessage]);

  // Clear all messages and reset to welcome
  const clearMessages = useCallback(() => {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setError(null);
  }, []);

  // Detect intent from user message
  const detectIntent = useCallback(async (message: string): Promise<{ intent: string; confidence: number } | null> => {
    try {
      return await aiSupportService.detectIntent(message);
    } catch (err) {
      logger.error('AI Chat intent detection failed', err);
      return null;
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    startSession();

    // Cleanup on unmount
    return () => {
      if (sessionIdRef.current) {
        aiSupportService.endSession(sessionIdRef.current).catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo<AIChatContextType>(() => ({
    messages,
    isTyping,
    isConnected,
    sessionId,
    error,
    sendMessage,
    sendQuickReply,
    clearMessages,
    startSession,
    endSession,
    detectIntent,
  }), [
    messages,
    isTyping,
    isConnected,
    sessionId,
    error,
    sendMessage,
    sendQuickReply,
    clearMessages,
    startSession,
    endSession,
    detectIntent,
  ]);

  return (
    <AIChatContext.Provider value={value}>
      {children}
    </AIChatContext.Provider>
  );
}

export function useAIChat(): AIChatContextType {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
}

// Default export for convenience
export default AIChatContext;
