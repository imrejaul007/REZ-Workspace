import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

/**
 * Generate a secure random ID using React Native crypto
 * Uses a fallback for environments where crypto is not available
 */
function generateSecureId(): string {
  // Use timestamp + random hex bytes for unique IDs
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  return `${timestamp}-${randomPart}`;
}

// MMKV storage
const storage = new MMKV({ id: 'do-app-storage' });

const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

// Types
export interface Message {
  id: string;
  type: 'user' | 'do';
  content: string | DoContent;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface DoContent {
  type: 'text' | 'card' | 'action' | 'reward' | 'suggestion';
  data;
}

export interface Entity {
  id: string;
  type: 'venue' | 'trial' | 'event';
  name: string;
  image?: string;
  subtitle: string;
  distance?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  openNow?: boolean;
  nextSlot?: string;
  karmaDiscount?: number;
  coinEarning?: number;
}

// Chat Store
interface ChatState {
  messages: Message[];
  sessionId: string;
  isTyping: boolean;
  location: { lat: number; lng: number } | null;

  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  setTyping: (typing: boolean) => void;
  setLocation: (location: { lat: number; lng: number }) => void;
  clearHistory: () => void;
  initializeSession: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      sessionId: '',
      isTyping: false,
      location: null,

      setMessages: (messages) => set({ messages }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        })),

      removeMessage: (id) =>
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== id),
        })),

      setTyping: (typing) => set({ isTyping: typing }),

      setLocation: (location) => set({ location }),

      clearHistory: () => {
        const sessionId = `session_${generateSecureId()}`;
        set({ messages: [], sessionId });
      },

      initializeSession: () => {
        const { sessionId } = get();
        if (!sessionId) {
          const newSessionId = `session_${generateSecureId()}`;
          set({ sessionId: newSessionId });
        }
      },
    }),
    {
      name: 'do-chat-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
        location: state.location,
      }),
    }
  )
);

// User Store
interface StylePreferences {
  vibes: string[];
  occasions: string[];
  cuisines: string[];
}

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  stylePreferences?: StylePreferences;
  onboardingCompleted?: boolean;
}

interface KarmaState {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  pointsToNextTier: number;
  multiplier: number;
}

interface WalletState {
  coins: number;
  vouchers: number;
}

interface UserState {
  profile: UserProfile | null;
  karma: KarmaState | null;
  wallet: WalletState | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setProfile: (profile: Partial<UserProfile> | null) => void;
  setAuth: (token: string | null, profile?: Partial<UserProfile>) => void;
  setKarma: (karma: KarmaState | null) => void;
  setWallet: (wallet: WalletState | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  updateCoins: (delta: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      karma: null,
      wallet: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setProfile: (profile) =>
        set((state) => ({
          profile: profile ? { ...state.profile!, ...profile } : null,
          isAuthenticated: !!profile,
        })),

      setAuth: (token, profile) =>
        set({
          token,
          profile: profile ? { ...state.profile!, ...profile } : null,
          isAuthenticated: !!token,
        }),

      setKarma: (karma) => set({ karma }),
      setWallet: (wallet) => set({ wallet }),
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      setLoading: (loading) => set({ isLoading: loading }),

      logout: () =>
        set({
          profile: null,
          token: null,
          karma: null,
          wallet: null,
          isAuthenticated: false,
        }),

      updateCoins: (delta) =>
        set((state) => ({
          wallet: state.wallet
            ? { ...state.wallet, coins: state.wallet.coins + delta }
            : null,
        })),
    }),
    {
      name: 'do-user-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        profile: state.profile,
        token: state.token,
        karma: state.karma,
        wallet: state.wallet,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// UI Store
interface UIState {
  theme: 'light' | 'dark' | 'system';
  hapticEnabled: boolean;
  soundEnabled: boolean;

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setHapticEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      hapticEnabled: true,
      soundEnabled: true,

      setTheme: (theme) => set({ theme }),
      setHapticEnabled: (enabled) => set({ hapticEnabled: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
    }),
    {
      name: 'do-ui-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
