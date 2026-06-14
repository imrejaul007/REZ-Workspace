/**
 * useHybridAI - Combined AI for DO App
 *
 * Combines:
 * - HOJAI Flow (Voice: STT/TTS)
 * - HOJAI Genie (Memory: Remember/Recall)
 * - REZ Mind (Intent: Prediction/Learning)
 *
 * Usage:
 * ```typescript
 * import { useHybridAI } from '@/hooks/useHybridAI';
 *
 * function ChatScreen() {
 *   const { handleVoiceCommand, handleTextCommand, usual, context } = useHybridAI();
 *
 *   // Voice command
 *   const response = await handleVoiceCommand(audioUri);
 *
 *   // Text command with context
 *   const response = await handleTextCommand("Order my usual");
 *   // → "Your usual is La Pinoz, Italian, ₹1200"
 *
 *   // Context available
 *   console.log(usual);
 *   // { merchant: 'La Pinoz', cuisine: 'Italian', amount: 1200 }
 * }
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { useFlowVoice, FlowVoiceState } from './useFlowVoice';
import { useGenieMemory, UsualOrder, BookingPattern } from './useGenieMemory';
import { useReZMind } from './useReZMind';

// ============================================
// TYPES
// ============================================

export type IntentType =
  | 'greeting'
  | 'search'
  | 'book'
  | 'order'
  | 'pay'
  | 'track'
  | 'cancel'
  | 'complaint'
  | 'refund'
  | 'check_balance'
  | 'check_karma'
  | 'preferences'
  | 'usual'
  | 'unknown';

export interface HybridIntent {
  type: IntentType;
  confidence: number;
  entities: {
    type: string;
    value: string;
  }[];
  rawText: string;
  context?: Record<string, unknown>;
}

export interface HybridResponse {
  text: string;
  suggestions: string[];
  actions?: {
    type: string;
    data: Record<string, unknown>;
  }[];
  memory?: {
    remember?: boolean;
    type?: string;
    value?: unknown;
  };
  speak?: boolean;
  confidence: number;
}

export interface ConversationContext {
  usual: UsualOrder | null;
  bookingPattern: BookingPattern | null;
  preferences: {
    cuisine?: string;
    dietary?: string[];
    priceRange?: string;
    partySize?: number;
  };
  recentActivity: string[];
}

export interface UseHybridAIOptions {
  userId: string;
  enableVoice?: boolean;
  enableMemory?: boolean;
  enablePrediction?: boolean;
  onIntentDetected?: (intent: HybridIntent) => void;
  onResponseGenerated?: (response: HybridResponse) => void;
  onError?: (error: string) => void;
}

// ============================================
// PATTERNS
// ============================================

const USUAL_PATTERNS = [
  /usual/i,
  /same\s+(as\s+)?(last\s+)?time/i,
  /like\s+(before|last)/i,
  /again/i,
  /repeat/i,
  /the\s+same/i,
];

const ORDER_PATTERNS = [
  /order/i,
  /book/i,
  /reserve/i,
  /table/i,
  /get\s+(me\s+)?/i,
];

const SEARCH_PATTERNS = [
  /find/i,
  /show/i,
  /search/i,
  /look\s+(for|up)/i,
  /what('s| is)/i,
];

const BALANCE_PATTERNS = [
  /balance/i,
  /coins/i,
  /karma/i,
  /how\s+much/i,
];

const PREFERENCE_PATTERNS = [
  /prefer/i,
  /like/i,
  /usually/i,
  /favorite/i,
];

// ============================================
// HOOK
// ============================================

export function useHybridAI(options: UseHybridAIOptions) {
  const {
    userId,
    enableVoice = true,
    enableMemory = true,
    enablePrediction = true,
    onIntentDetected,
    onResponseGenerated,
    onError,
  } = options;

  // Initialize sub-hooks
  const flow = useFlowVoice({
    onError: (e) => onError?.(e),
  });

  const genie = useGenieMemory(userId, {
    onError: (e) => onError?.(e),
  });

  const rezMind = useReZMind();

  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastIntent, setLastIntent] = useState<HybridIntent | null>(null);
  const [context, setContext] = useState<ConversationContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  // Load context on mount
  useEffect(() => {
    if (userId && enableMemory) {
      loadContext();
    }
  }, [userId, enableMemory]);

  // ============================================
  // CONTEXT LOADING
  // ============================================

  /**
   * Load conversation context from Genie
   */
  const loadContext = useCallback(async () => {
    if (!userId) return;

    setIsLoadingContext(true);
    try {
      const ctx = await genie.getContext();
      setContext({
        usual: ctx.usual,
        bookingPattern: ctx.bookingPattern,
        preferences: {
          cuisine: ctx.preferences.find((p) => p.tags?.includes('cuisine'))?.metadata?.value as string,
          dietary: ctx.preferences
            .filter((p) => p.tags?.includes('dietary'))
            .map((p) => p.metadata?.value as string),
          priceRange: ctx.preferences.find((p) => p.tags?.includes('budget'))?.metadata?.range as string,
          partySize: ctx.preferences.find((p) => p.tags?.includes('party_size'))?.metadata?.partySize as number,
        },
        recentActivity: ctx.recentActivity.map((a) => a.content),
      });
    } catch (error) {
      console.warn('[HybridAI] Failed to load context:', error);
    } finally {
      setIsLoadingContext(false);
    }
  }, [userId, genie]);

  /**
   * Refresh context
   */
  const refreshContext = useCallback(async () => {
    await loadContext();
  }, [loadContext]);

  // ============================================
  // INTENT DETECTION
  // ============================================

  /**
   * Detect intent from text
   */
  const detectIntent = useCallback(
    (text: string): HybridIntent => {
      const lowerText = text.toLowerCase().trim();

      // Check for "usual" patterns first
      for (const pattern of USUAL_PATTERNS) {
        if (pattern.test(lowerText)) {
          const intent: HybridIntent = {
            type: 'usual',
            confidence: 0.95,
            entities: [],
            rawText: text,
            context: context?.usual || undefined,
          };
          setLastIntent(intent);
          onIntentDetected?.(intent);
          return intent;
        }
      }

      // Check for order patterns
      for (const pattern of ORDER_PATTERNS) {
        if (pattern.test(lowerText)) {
          // Extract entities
          const entities: HybridIntent['entities'] = [];

          // Party size
          const partyMatch = text.match(/(\d+)\s+(?:people|person)/i);
          if (partyMatch) {
            entities.push({ type: 'partySize', value: partyMatch[1] });
          }

          // Time
          const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
          if (timeMatch) {
            entities.push({ type: 'time', value: timeMatch[1] });
          }

          const intent: HybridIntent = {
            type: 'book',
            confidence: 0.85,
            entities,
            rawText: text,
          };
          setLastIntent(intent);
          onIntentDetected?.(intent);
          return intent;
        }
      }

      // Check for balance patterns
      for (const pattern of BALANCE_PATTERNS) {
        if (pattern.test(lowerText)) {
          const intent: HybridIntent = {
            type: 'check_balance',
            confidence: 0.9,
            entities: [],
            rawText: text,
          };
          setLastIntent(intent);
          onIntentDetected?.(intent);
          return intent;
        }
      }

      // Check for preference patterns
      for (const pattern of PREFERENCE_PATTERNS) {
        if (pattern.test(lowerText)) {
          const intent: HybridIntent = {
            type: 'preferences',
            confidence: 0.8,
            entities: [],
            rawText: text,
          };
          setLastIntent(intent);
          onIntentDetected?.(intent);
          return intent;
        }
      }

      // Check for search patterns
      for (const pattern of SEARCH_PATTERNS) {
        if (pattern.test(lowerText)) {
          // Extract cuisine
          const cuisines = ['italian', 'chinese', 'indian', 'mexican', 'japanese', 'thai'];
          const foundCuisine = cuisines.find((c) => lowerText.includes(c));

          const entities: HybridIntent['entities'] = [];
          if (foundCuisine) {
            entities.push({ type: 'cuisine', value: foundCuisine });
          }

          const intent: HybridIntent = {
            type: 'search',
            confidence: 0.75,
            entities,
            rawText: text,
          };
          setLastIntent(intent);
          onIntentDetected?.(intent);
          return intent;
        }
      }

      // Default
      const intent: HybridIntent = {
        type: 'unknown',
        confidence: 0.5,
        entities: [],
        rawText: text,
      };
      setLastIntent(intent);
      onIntentDetected?.(intent);
      return intent;
    },
    [context, onIntentDetected]
  );

  // ============================================
  // RESPONSE GENERATION
  // ============================================

  /**
   * Generate response based on intent
   */
  const generateResponse = useCallback(
    async (intent: HybridIntent): Promise<HybridResponse> => {
      let response: HybridResponse;

      switch (intent.type) {
        case 'usual':
          response = await handleUsualIntent(intent);
          break;

        case 'book':
        case 'order':
          response = await handleOrderIntent(intent);
          break;

        case 'search':
          response = await handleSearchIntent(intent);
          break;

        case 'check_balance':
        case 'check_karma':
          response = await handleBalanceIntent(intent);
          break;

        case 'preferences':
          response = await handlePreferencesIntent(intent);
          break;

        case 'greeting':
          response = {
            text: 'Hey! 👋 How can I help you today? You can ask me to book a table, find restaurants, or check your karma!',
            suggestions: ['Book a table', 'Find Italian food', 'Check my karma'],
            speak: true,
            confidence: 0.9,
          };
          break;

        default:
          response = {
            text: "I'm not sure I understand. Try saying things like 'Book a table for 2' or 'Find Italian restaurants nearby'",
            suggestions: ['Book a table', 'Show my karma', 'Find restaurants'],
            speak: true,
            confidence: 0.5,
          };
      }

      onResponseGenerated?.(response);
      return response;
    },
    [context, genie, onResponseGenerated]
  );

  // ============================================
  // INTENT HANDLERS
  // ============================================

  /**
   * Handle "usual" intent
   */
  const handleUsualIntent = async (intent: HybridIntent): Promise<HybridResponse> => {
    const usual = context?.usual || (await genie.getUsual());

    if (usual && usual.merchant) {
      const memoryToRemember: HybridResponse['memory'] = {
        remember: true,
        type: 'transaction',
        value: usual,
      };

      return {
        text: `Your usual is ${usual.merchant}${usual.cuisine ? ` (${usual.cuisine})` : ''}${usual.amount ? `, around ₹${usual.amount}` : ''}. Should I book it?`,
        suggestions: [
          `Yes, book ${usual.merchant}`,
          'Show me the menu',
          'Find another option',
        ],
        actions: [
          { type: 'book', data: { merchant: usual.merchant, ...usual } },
        ],
        memory: memoryToRemember,
        speak: true,
        confidence: 0.9,
      };
    }

    return {
      text: "I don't have your usual order yet. Would you like to browse restaurants and I'll remember your preferences?",
      suggestions: ['Browse restaurants', 'Show popular', 'Find Italian food'],
      speak: true,
      confidence: 0.7,
    };
  };

  /**
   * Handle order/book intent
   */
  const handleOrderIntent = async (intent: HybridIntent): Promise<HybridResponse> => {
    const partySize = intent.entities.find((e) => e.type === 'partySize')?.value;
    const time = intent.entities.find((e) => e.type === 'time')?.value;

    // Check for "usual" in context
    if (context?.usual && !partySize) {
      return {
        text: `I can book ${context.usual.merchant}${context.usual.cuisine ? ` (${context.usual.cuisine})` : ''} for you. ${context.usual.amount ? `Around ₹${context.usual.amount}` : ''}. Ready?`,
        suggestions: [
          `Yes, book ${context.usual.merchant}`,
          `Change to ${context.bookingPattern?.preferredPartySize || 2} people`,
          'Show other options',
        ],
        actions: [
          {
            type: 'book',
            data: {
              merchant: context.usual.merchant,
              cuisine: context.usual.cuisine,
              amount: context.usual.amount,
              time: context.bookingPattern?.preferredTime || time,
              partySize: context.bookingPattern?.preferredPartySize || partySize || 2,
            },
          },
        ],
        speak: true,
        confidence: 0.85,
      };
    }

    return {
      text: `I can help you book a table. ${partySize ? `For ${partySize} people` : 'For how many?'}${time ? ` at ${time}` : ''}. What cuisine do you prefer?`,
      suggestions: ['Italian', 'Chinese', 'Indian', 'Any'],
      actions: [{ type: 'search', data: { partySize, time } }],
      speak: true,
      confidence: 0.8,
    };
  };

  /**
   * Handle search intent
   */
  const handleSearchIntent = async (intent: HybridIntent): Promise<HybridResponse> => {
    const cuisine = intent.entities.find((e) => e.type === 'cuisine')?.value;
    const priceRange = context?.preferences?.priceRange;

    if (cuisine) {
      return {
        text: `Finding ${cuisine} restaurants${priceRange ? ` in ${priceRange} range` : ''}...`,
        suggestions: ['Show on map', 'Filter by rating', 'Show all cuisines'],
        actions: [{ type: 'search', data: { cuisine, priceRange } }],
        speak: true,
        confidence: 0.85,
      };
    }

    return {
      text: 'What type of food are you in the mood for?',
      suggestions: ['Italian', 'Chinese', 'Indian', 'Thai', 'Show all'],
      actions: [{ type: 'search', data: {} }],
      speak: true,
      confidence: 0.7,
    };
  };

  /**
   * Handle balance check intent
   */
  const handleBalanceIntent = async (intent: HybridIntent): Promise<HybridResponse> => {
    // This would integrate with RABTUL wallet
    return {
      text: "Let me check your karma and coins...",
      suggestions: ['Show transaction history', 'How to earn more', 'View rewards'],
      actions: [{ type: 'check_balance', data: {} }],
      speak: true,
      confidence: 0.85,
    };
  };

  /**
   * Handle preferences intent
   */
  const handlePreferencesIntent = async (intent: HybridIntent): Promise<HybridResponse> => {
    const prefs = context?.preferences;

    if (prefs && Object.keys(prefs).length > 0) {
      const prefText = [
        prefs.cuisine && `Likes ${prefs.cuisine} food`,
        prefs.dietary?.length && `Dietary: ${prefs.dietary.join(', ')}`,
        prefs.partySize && `Usually goes in groups of ${prefs.partySize}`,
        prefs.priceRange && `Budget: ${prefs.priceRange}`,
      ]
        .filter(Boolean)
        .join('. ');

      return {
        text: prefText
          ? `Your preferences: ${prefText}. Would you like to update any of these?`
          : "I don't have your preferences yet. Let me learn as you use the app!",
        suggestions: ['Update cuisine', 'Update budget', "That's all"],
        speak: true,
        confidence: 0.8,
      };
    }

    return {
      text: "I don't have your preferences saved yet. As you book restaurants and order food, I'll learn your preferences!",
      suggestions: ['Show popular', 'Book a table', 'Find Italian'],
      speak: true,
      confidence: 0.6,
    };
  };

  // ============================================
  // MAIN HANDLERS
  // ============================================

  /**
   * Handle voice command (audio → text → intent → response)
   */
  const handleVoiceCommand = useCallback(
    async (audioUri: string): Promise<HybridResponse> => {
      setIsProcessing(true);

      try {
        // 1. Speech to text
        const transcript = await flow.stopListening();

        if (!transcript) {
          return {
            text: "I didn't catch that. Could you try again?",
            suggestions: ['Try again', 'Type instead'],
            speak: true,
            confidence: 0,
          };
        }

        // 2. Detect intent
        const intent = detectIntent(transcript);

        // 3. Generate response
        const response = await generateResponse(intent);

        // 4. Speak response
        if (response.speak) {
          await flow.speak(response.text);
        }

        // 5. Remember if needed
        if (response.memory?.remember && response.memory.value) {
          if (response.memory.type === 'transaction') {
            const usual = response.memory.value as UsualOrder;
            await genie.rememberTransaction({
              merchantName: usual.merchant || 'Unknown',
              amount: usual.amount || 0,
              category: usual.cuisine || 'restaurant',
            });
          }
        }

        return response;
      } catch (error) {
        const errorMessage = (error as Error).message;
        onError?.(errorMessage);
        return {
          text: 'Something went wrong. Please try again.',
          suggestions: ['Try again', 'Type instead'],
          speak: true,
          confidence: 0,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [flow, detectIntent, generateResponse, genie, onError]
  );

  /**
   * Handle text command (text → intent → response)
   */
  const handleTextCommand = useCallback(
    async (text: string): Promise<HybridResponse> => {
      setIsProcessing(true);

      try {
        // 1. Detect intent
        const intent = detectIntent(text);

        // 2. Generate response
        const response = await generateResponse(intent);

        // 3. Speak response
        if (response.speak) {
          await flow.speak(response.text);
        }

        // 4. Remember if needed
        if (response.memory?.remember && response.memory.value) {
          if (response.memory.type === 'transaction') {
            const usual = response.memory.value as UsualOrder;
            await genie.rememberTransaction({
              merchantName: usual.merchant || 'Unknown',
              amount: usual.amount || 0,
              category: usual.cuisine || 'restaurant',
            });
          }
        }

        return response;
      } catch (error) {
        const errorMessage = (error as Error).message;
        onError?.(errorMessage);
        return {
          text: 'Something went wrong. Please try again.',
          suggestions: ['Try again'],
          speak: false,
          confidence: 0,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [flow, detectIntent, generateResponse, genie, onError]
  );

  /**
   * Handle booking completion - learn from it
   */
  const handleBookingComplete = useCallback(
    async (booking: {
      merchantName: string;
      cuisine?: string;
      time?: string;
      partySize?: number;
      amount?: number;
    }) => {
      // Learn from booking
      if (enableMemory) {
        await genie.learnFromBooking(booking);
      }

      // Refresh context
      await refreshContext();
    },
    [genie, enableMemory, refreshContext]
  );

  /**
   * Handle transaction completion - learn from it
   */
  const handleTransactionComplete = useCallback(
    async (transaction: {
      merchantName: string;
      amount: number;
      category?: string;
      items?: string[];
    }) => {
      // Learn from transaction
      if (enableMemory) {
        await genie.learnFromTransaction(transaction);
      }

      // Refresh context
      await refreshContext();
    },
    [genie, enableMemory, refreshContext]
  );

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    isProcessing,
    isListening: flow.isListening,
    isSpeaking: flow.isSpeaking,
    lastIntent,
    context,
    isLoadingContext,
    error: flow.error || genie.error,

    // Voice
    startListening: flow.startListening,
    stopListening: flow.stopListening,
    speak: flow.speak,
    transcript: flow.transcript,

    // Handlers
    handleVoiceCommand,
    handleTextCommand,
    handleBookingComplete,
    handleTransactionComplete,

    // Intent
    detectIntent,

    // Context
    refreshContext,
    loadContext,

    // Direct access to sub-hooks
    flow,
    genie,
    rezMind,
  };
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default useHybridAI;