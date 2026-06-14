// @ts-nocheck
import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { REZ_GO_CONFIG, SESSION_CONFIG, CASHBACK_CONFIG } from './config';
import { productApi, ProductInfo } from './productApi';
import { goWebSocket, WebSocketMessage } from './websocket';

// Haptic feedback
const triggerHaptic = (type: 'success' | 'warning' | 'error') => {
  if (!REZ_GO_CONFIG.ENABLE_HAPTICS) return;
  // Implementation would use expo-haptics
  console.log(`Haptic: ${type}`);
};

// Types
export interface GoCartItem {
  id: string;
  productId: string;
  barcode: string;
  name: string;
  price: number;
  mrp?: number;
  quantity: number;
  cashbackPercent: number;
  cashbackAmount: number;
  imageUrl?: string;
  category?: string;
  brand?: string;
  scannedAt: Date;
}

export interface GoSession {
  sessionId: string;
  storeId: string;
  storeName: string;
  status: 'active' | 'completed' | 'cancelled' | 'syncing';
  items: GoCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  cashbackEarned: number;
  savings: {
    totalMRP: number;
    totalPaid: number;
    totalSaved: number;
  };
  startedAt: Date;
  exitVerified?: boolean;
  exitVerifiedAt?: Date;
}

export interface GoStore {
  storeId: string;
  name: string;
  logo?: string;
  banner?: string;
  address?: string;
  storeType: string;
  cashbackPercent: number;
  exitRequired: boolean;
}

export interface BudgetGuard {
  enabled: boolean;
  limit: number;
  current: number;
  remaining: number;
  warningShown: boolean;
}

export interface StreakInfo {
  currentStreak: number;
  bonusPercent: number;
  lastVisit: Date | null;
}

export interface ComboSuggestion {
  id: string;
  name: string;
  items: string[];
  originalPrice: number;
  comboPrice: number;
  savings: number;
}

interface GoContextValue {
  // Session state
  activeSession: GoSession | null;
  isLoading: boolean;
  error: string | null;

  // Cart totals
  cartSummary: {
    itemCount: number;
    subtotal: number;
    tax: number;
    total: number;
    cashbackEarned: number;
    totalSaved: number;
    mrpTotal: number;
  } | null;

  // Store info
  currentStore: GoStore | null;

  // Budget guard
  budgetGuard: BudgetGuard | null;

  // Streak info
  streak: StreakInfo | null;

  // Combo suggestions
  comboSuggestions: ComboSuggestion[];

  // Actions
  startSession: (storeId: string) => Promise<void>;
  resumeSession: (sessionId: string, storeId: string) => Promise<void>;
  addItem: (barcode: string, quantity?: number) => Promise<{ success: boolean; product?: ProductInfo; message?: string }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  cancelSession: () => Promise<void>;
  checkout: (paymentMethod: 'upi' | 'wallet' | 'card') => Promise<boolean>;
  verifyExit: (exitCode: string) => Promise<boolean>;
  setBudgetLimit: (limit: number) => void;
  clearError: () => void;

  // Real-time status
  isConnected: boolean;
  lastSyncAt: Date | null;
}

const GoContext = createContext<GoContextValue | null>(null);

export function GoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthUser();
  const [activeSession, setActiveSession] = useState<GoSession | null>(null);
  const [currentStore, setCurrentStore] = useState<GoStore | null>(null);
  const [budgetGuard, setBudgetGuard] = useState<BudgetGuard | null>(null);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [comboSuggestions, setComboSuggestions] = useState<ComboSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const unsubscribes = useRef<(() => void)[]>([]);

  // Calculate cart summary
  const cartSummary = activeSession
    ? {
        itemCount: activeSession.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: activeSession.subtotal,
        tax: activeSession.tax,
        total: activeSession.total,
        cashbackEarned: activeSession.cashbackEarned,
        totalSaved: activeSession.savings.totalSaved,
        mrpTotal: activeSession.savings.totalMRP,
      }
    : null;

  // WebSocket connection management
  useEffect(() => {
    if (!activeSession || !user?.token || !REZ_GO_CONFIG.ENABLE_WEBSOCKET) return;

    // Connect to WebSocket
    goWebSocket.connect({
      sessionId: activeSession.sessionId,
      storeId: activeSession.storeId,
      authToken: user.token,
    });

    setIsConnected(true);

    // Subscribe to events
    const unsub1 = goWebSocket.on('cart.updated', (msg: WebSocketMessage) => {
      if (msg.data.session) {
        setActiveSession(msg.data.session);
        setLastSyncAt(new Date());
      }
    });

    const unsub2 = goWebSocket.on('exit.verified', (msg: WebSocketMessage) => {
      setActiveSession((prev) =>
        prev ? { ...prev, exitVerified: true, exitVerifiedAt: new Date() } : null
      );
      triggerHaptic('success');
    });

    const unsub3 = goWebSocket.on('fraud.alert', (msg: WebSocketMessage) => {
      triggerHaptic('warning');
    });

    const unsub4 = goWebSocket.on('cart.item_added', (msg: WebSocketMessage) => {
      triggerHaptic('success');
    });

    unsubscribes.current = [unsub1, unsub2, unsub3, unsub4];

    return () => {
      goWebSocket.disconnect();
      unsubscribes.current.forEach((unsub) => unsub());
      setIsConnected(false);
    };
  }, [activeSession?.sessionId, user?.token]);

  // Calculate cashback for item
  const calculateCashback = useCallback((product: ProductInfo, quantity: number): { percent: number; amount: number } => {
    let percent = CASHBACK_CONFIG.DEFAULT_PERCENT;

    // Time bonus
    const hour = new Date().getHours();
    if (hour >= CASHBACK_CONFIG.HAPPY_HOUR_START && hour < CASHBACK_CONFIG.HAPPY_HOUR_END) {
      percent += CASHBACK_CONFIG.HAPPY_HOUR_BONUS;
    } else if (hour >= CASHBACK_CONFIG.EARLY_BIRD_START && hour < CASHBACK_CONFIG.EARLY_BIRD_END) {
      percent += CASHBACK_CONFIG.EARLY_BIRD_BONUS;
    }

    // Streak bonus
    if (streak) {
      if (streak.currentStreak >= 7) percent += CASHBACK_CONFIG.STREAK_7_DAY;
      else if (streak.currentStreak >= 5) percent += CASHBACK_CONFIG.STREAK_5_DAY;
      else if (streak.currentStreak >= 3) percent += CASHBACK_CONFIG.STREAK_3_DAY;
    }

    const amount = Math.floor(product.price * quantity * (percent / 100));
    return { percent, amount };
  }, [streak]);

  // Add item with barcode lookup
  const addItem = useCallback(async (barcode: string, quantity: number = 1): Promise<{ success: boolean; product?: ProductInfo; message?: string }> => {
    if (!user || !activeSession) {
      return { success: false, message: 'No active session' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Lookup product
      const product = await productApi.lookupBarcode(barcode);
      if (!product) {
        triggerHaptic('warning');
        return { success: false, message: 'Product not found' };
      }

      // Check budget guard
      if (REZ_GO_CONFIG.ENABLE_BUDGET_GUARD && budgetGuard?.enabled) {
        const newTotal = (activeSession.total || 0) + product.price * quantity;
        if (newTotal > budgetGuard.limit) {
          triggerHaptic('warning');
          return {
            success: false,
            product,
            message: `Budget limit reached! Limit: ₹${budgetGuard.limit}`,
          };
        }
      }

      // Calculate cashback
      const { percent, amount } = calculateCashback(product, quantity);

      // Create cart item
      const cartItem: GoCartItem = {
        id: `${product.productId}-${Date.now()}`,
        productId: product.productId,
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        quantity,
        cashbackPercent: percent,
        cashbackAmount: amount,
        imageUrl: product.imageUrl,
        category: product.category,
        brand: product.brand,
        scannedAt: new Date(),
      };

      // Update session locally
      setActiveSession((prev) => {
        if (!prev) return prev;

        // Check if item exists
        const existingIndex = prev.items.findIndex(
          (item) => item.barcode === barcode && !item.weight
        );

        let newItems: GoCartItem[];
        if (existingIndex >= 0) {
          // Update quantity
          newItems = [...prev.items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + quantity,
          };
        } else {
          newItems = [...prev.items, cartItem];
        }

        // Recalculate totals
        const subtotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const mrpTotal = newItems.reduce(
          (sum, item) => sum + (item.mrp || item.price) * item.quantity,
          0
        );
        const tax = Math.round(subtotal * 0.18 * 100) / 100;
        const cashbackEarned = newItems.reduce(
          (sum, item) => sum + item.cashbackAmount * item.quantity,
          0
        );

        return {
          ...prev,
          items: newItems,
          subtotal,
          tax,
          total: subtotal + tax,
          cashbackEarned,
          savings: {
            totalMRP: mrpTotal,
            totalPaid: subtotal,
            totalSaved: mrpTotal - subtotal + cashbackEarned,
          },
        };
      });

      triggerHaptic('success');
      setLastSyncAt(new Date());

      // Sync with server
      if (REZ_GO_CONFIG.ENABLE_WEBSOCKET && isConnected) {
        goWebSocket.send('cart.item_added', { barcode, quantity });
      }

      return { success: true, product };
    } catch (err) {
      triggerHaptic('error');
      return { success: false, message: err instanceof Error ? err.message : 'Failed to add item' };
    } finally {
      setIsLoading(false);
    }
  }, [user, activeSession, budgetGuard, calculateCashback, isConnected]);

  // Start session
  const startSession = useCallback(async (storeId: string) => {
    if (!user) {
      setError('Please login to start shopping');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch store info
      const storeRes = await fetch(`${REZ_GO_CONFIG.REZ_GO_API}/stores/${storeId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (storeRes.ok) {
        const storeData = await storeRes.json();
        setCurrentStore(storeData.store);
      }

      // Start session via API
      const sessionRes = await fetch(`${REZ_GO_CONFIG.REZ_GO_API}/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ storeId }),
      });

      if (!sessionRes.ok) {
        const err = await sessionRes.json();
        throw new Error(err.error || 'Failed to start session');
      }

      const sessionData = await sessionRes.json();
      setActiveSession(sessionData.session);
      setLastSyncAt(new Date());

      // Fetch streak info
      if (REZ_GO_CONFIG.ENABLE_STREAKS) {
        const streakRes = await fetch(
          `${REZ_GO_CONFIG.REZ_GO_API}/users/${user.id}/streak`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        if (streakRes.ok) {
          const streakData = await streakRes.json();
          setStreak(streakData.streak);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Resume session
  const resumeSession = useCallback(async (sessionId: string, storeId: string) => {
    if (!user) {
      setError('Please login to resume shopping');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${REZ_GO_CONFIG.REZ_GO_API}/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (!res.ok) throw new Error('Failed to resume session');

      const data = await res.json();
      setActiveSession(data.session);
      setLastSyncAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume session');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (!user || !activeSession) return;

    setActiveSession((prev) => {
      if (!prev) return prev;

      const newItems = prev.items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );

      const subtotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const mrpTotal = newItems.reduce(
        (sum, item) => sum + (item.mrp || item.price) * item.quantity,
        0
      );
      const tax = Math.round(subtotal * 0.18 * 100) / 100;
      const cashbackEarned = newItems.reduce(
        (sum, item) => sum + item.cashbackAmount * item.quantity,
        0
      );

      return {
        ...prev,
        items: newItems,
        subtotal,
        tax,
        total: subtotal + tax,
        cashbackEarned,
        savings: {
          totalMRP: mrpTotal,
          totalPaid: subtotal,
          totalSaved: mrpTotal - subtotal + cashbackEarned,
        },
      };
    });
  }, [user, activeSession]);

  // Remove item
  const removeItem = useCallback(async (itemId: string) => {
    if (!activeSession) return;

    setActiveSession((prev) => {
      if (!prev) return prev;

      const newItems = prev.items.filter((item) => item.id !== itemId);

      const subtotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const mrpTotal = newItems.reduce(
        (sum, item) => sum + (item.mrp || item.price) * item.quantity,
        0
      );
      const tax = Math.round(subtotal * 0.18 * 100) / 100;
      const cashbackEarned = newItems.reduce(
        (sum, item) => sum + item.cashbackAmount * item.quantity,
        0
      );

      return {
        ...prev,
        items: newItems,
        subtotal,
        tax,
        total: subtotal + tax,
        cashbackEarned,
        savings: {
          totalMRP: mrpTotal,
          totalPaid: subtotal,
          totalSaved: mrpTotal - subtotal + cashbackEarned,
        },
      };
    });
  }, [activeSession]);

  // Cancel session
  const cancelSession = useCallback(async () => {
    if (!user || !activeSession) return;

    setIsLoading(true);

    try {
      await fetch(`${REZ_GO_CONFIG.REZ_GO_API}/sessions/${activeSession.sessionId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setActiveSession(null);
      setCurrentStore(null);
      setBudgetGuard(null);
      setComboSuggestions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel session');
    } finally {
      setIsLoading(false);
    }
  }, [user, activeSession]);

  // Checkout
  const checkout = useCallback(async (paymentMethod: 'upi' | 'wallet' | 'card'): Promise<boolean> => {
    if (!user || !activeSession) {
      setError('No active session');
      return false;
    }

    // Check exit verification
    if (REZ_GO_CONFIG.ENABLE_EXIT_VERIFICATION && currentStore?.exitRequired && !activeSession.exitVerified) {
      setError('Exit verification required before checkout');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${REZ_GO_CONFIG.REZ_GO_API}/checkout/${activeSession.sessionId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ paymentMethod }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Checkout failed');
      }

      triggerHaptic('success');
      return true;
    } catch (err) {
      triggerHaptic('error');
      setError(err instanceof Error ? err.message : 'Checkout failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, activeSession, currentStore]);

  // Verify exit
  const verifyExit = useCallback(async (exitCode: string): Promise<boolean> => {
    if (!user || !activeSession) return false;

    try {
      const res = await fetch(
        `${REZ_GO_CONFIG.REZ_GO_API}/checkout/${activeSession.sessionId}/exit-verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ exitCode }),
        }
      );

      if (!res.ok) return false;

      const data = await res.json();
      if (data.verified) {
        triggerHaptic('success');
        setActiveSession((prev) =>
          prev ? { ...prev, exitVerified: true, exitVerifiedAt: new Date() } : null
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [user, activeSession]);

  // Set budget limit
  const setBudgetLimit = useCallback((limit: number) => {
    setBudgetGuard({
      enabled: true,
      limit,
      current: activeSession?.total || 0,
      remaining: limit - (activeSession?.total || 0),
      warningShown: false,
    });
  }, [activeSession?.total]);

  const clearError = useCallback(() => setError(null), []);

  const value: GoContextValue = {
    activeSession,
    isLoading,
    error,
    cartSummary,
    currentStore,
    budgetGuard,
    streak,
    comboSuggestions,
    startSession,
    resumeSession,
    addItem,
    updateQuantity,
    removeItem,
    cancelSession,
    checkout,
    verifyExit,
    setBudgetLimit,
    clearError,
    isConnected,
    lastSyncAt,
  };

  return <GoContext.Provider value={value}>{children}</GoContext.Provider>;
}

export function useGo() {
  const context = useContext(GoContext);
  if (!context) {
    throw new Error('useGo must be used within a GoProvider');
  }
  return context;
}
