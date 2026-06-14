import { create } from 'zustand';
import { v4 as uuidv4 } from 'crypto';
import type {
  ChatStoreState,
  Message,
  QueryHistoryItem,
  SuggestedQuestion,
  ConversationContext,
  VoiceInputState,
  DEFAULT_SUGGESTED_QUESTIONS,
} from '@/types/copilot';

// Simple UUID generator without external dependency
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messages: [],
  isLoading: false,
  queryHistory: [],
  suggestedQuestions: [],
  conversationContext: null,
  voiceInputState: {
    isListening: false,
    isProcessing: false,
    transcript: '',
  },

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, { ...message, id: message.id || generateId() }],
    }));
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  addToHistory: (item: QueryHistoryItem) => {
    set((state) => ({
      queryHistory: [
        { ...item, id: item.id || generateId() },
        ...state.queryHistory.slice(0, 49), // Keep last 50
      ],
    }));
  },

  setSuggestedQuestions: (questions: SuggestedQuestion[]) => {
    set({ suggestedQuestions: questions });
  },

  updateContext: (context: Partial<ConversationContext>) => {
    set((state) => ({
      conversationContext: state.conversationContext
        ? { ...state.conversationContext, ...context }
        : context as ConversationContext,
    }));
  },

  setVoiceInputState: (voiceState: Partial<VoiceInputState>) => {
    set((state) => ({
      voiceInputState: { ...state.voiceInputState, ...voiceState },
    }));
  },
}));

// Selector hooks for optimized re-renders
export const useMessages = () => useChatStore((state) => state.messages);
export const useIsLoading = () => useChatStore((state) => state.isLoading);
export const useQueryHistory = () => useChatStore((state) => state.queryHistory);
export const useSuggestedQuestions = () => useChatStore((state) => state.suggestedQuestions);
export const useConversationContext = () => useChatStore((state) => state.conversationContext);
export const useVoiceInputState = () => useChatStore((state) => state.voiceInputState);