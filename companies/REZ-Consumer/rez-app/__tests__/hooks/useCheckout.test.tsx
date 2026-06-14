// @ts-nocheck
/**
 * Unit Tests for useCheckout hook
 *
 * Note: useCheckout delegates to useCheckoutState (696 lines) and useCheckoutActions (400+ lines).
 * Mocking the sub-hooks directly avoids the deep dependency chain (stores, API services, etc.).
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCheckout } from '@/hooks/useCheckout';

// ── Mock sub-hooks to avoid deep dependency chain ───────────────────────────────

// Mock the store selectors used by the sub-hooks
jest.mock('@/stores/selectors', () => ({
  useCartActions: jest.fn(() => ({
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateQuantity: jest.fn(),
    clearCart: jest.fn(),
    refreshCart: jest.fn(),
  })),
  useCartState: jest.fn(() => ({
    items: [],
    totalPrice: 0,
    isLoading: false,
  })),
  useCartItemCount: jest.fn(() => 0),
  useCartTotal: jest.fn(() => 0),
  useCartLoading: jest.fn(() => false),
  useRefreshWallet: jest.fn(() => jest.fn()),
  useWalletData: jest.fn(() => null),
  useRawWalletData: jest.fn(() => null),
  useGetCurrencySymbol: jest.fn(() => 'Rs.'),
  useCurrency: jest.fn(() => 'inr'),
  useAuthUser: jest.fn(() => ({ id: 'user-1' })),
  useIsAuthenticated: jest.fn(() => true),
  useAuthLoading: jest.fn(() => false),
}));

// Mock checkout draft store
jest.mock('@/stores/checkoutDraftStore', () => ({
  useCheckoutDraftStore: jest.fn(() => ({
    saveDraft: jest.fn(),
    clearDraft: jest.fn(),
  })),
}));

// Mock useCheckoutState — the hook has too many dependencies to mock individually
jest.mock('@/hooks/useCheckoutState', () => ({
  useCheckoutState: jest.fn(() => ({
    state: {
      items: [],
      loading: false,
      error: null,
      store: null,
      billSummary: {
        itemTotal: 0,
        deliveryFee: 0,
        taxes: 0,
        totalPayable: 0,
        promoDiscount: 0,
        coinDiscount: 0,
        cardOfferDiscount: 0,
      },
      selectedAddress: null,
      availableAddresses: [],
      fulfillment: { selectedType: 'delivery', availableTypes: [] },
      appliedPromoCode: null,
      availablePromoCodes: [],
      coinSystem: {
        rezCoin: { available: 0, used: 0 },
        promoCoin: { available: 0, used: 0 },
        storePromoCoin: { available: 0, used: 0 },
      },
      availablePaymentMethods: [],
      recentPaymentMethods: [],
      currentStep: 'checkout',
    },
    setState: jest.fn(),
    isSubmittingRef: { current: false },
    initializeCheckout: jest.fn(() => Promise.resolve()),
    autoApplyCoinsInOrder: jest.fn((cs) => cs),
    currencySymbol: 'Rs.',
    walletDataRef: { current: null },
    walletRawDataRef: { current: null },
    orderIdempotencyKeyRef: { current: '' },
    walletIdempotencyKeyRef: { current: '' },
    assertOnline: jest.fn(() => Promise.resolve(true)),
  })),
}));

// Mock useCheckoutActions
jest.mock('@/hooks/useCheckoutActions', () => ({
  useCheckoutActions: jest.fn(() => ({
    applyPromoCode: jest.fn(),
    removePromoCode: jest.fn(),
    toggleRezCoin: jest.fn(),
    togglePromoCoin: jest.fn(),
    selectPaymentMethod: jest.fn(),
    selectAddress: jest.fn(),
    updateBillSummary: jest.fn(),
    proceedToPayment: jest.fn(),
    processPayment: jest.fn(),
    setFulfillmentType: jest.fn(),
    setFulfillmentDetails: jest.fn(),
    handlePromoCodeApply: jest.fn(),
    handleCoinToggle: jest.fn(),
    handleCustomCoinAmount: jest.fn(),
    handlePaymentMethodSelect: jest.fn(),
    handleAddressSelect: jest.fn(),
    handleProceedToPayment: jest.fn(),
    handleBackNavigation: jest.fn(),
    handleWalletPayment: jest.fn(),
    handleCODPayment: jest.fn(),
    handleRazorpayPayment: jest.fn(),
    navigateToOtherPaymentMethods: jest.fn(),
    applyCardOffer: jest.fn(),
    removeCardOffer: jest.fn(),
  })),
}));

// Mock analytics service
jest.mock('@/services/analyticsService', () => ({
  __esModule: true,
  default: {
    trackEvent: jest.fn(),
    trackScreen: jest.fn(),
  },
}));

// Mock checkout config
jest.mock('@/config/checkout.config', () => ({
  TAX_RATE: 0.18,
  MIN_ORDER_AMOUNT: 0,
  REZ_COIN_MAX_USAGE_PERCENTAGE: 20,
  PROMO_COIN_MAX_USAGE_PERCENTAGE: 20,
  STORE_PROMO_COIN_MAX_USAGE_PERCENTAGE: 10,
  getCoinConversionRate: jest.fn(() => 1),
  setCoinConversionRate: jest.fn(),
}));

// Mock ToastManager
jest.mock('@/components/common/ToastManager', () => ({
  showToast: jest.fn(),
}));

// Mock razorpay
jest.mock('@/services/razorpayApi', () => ({
  razorpayApi: {
    verifyPayment: jest.fn(() => Promise.resolve({ success: false })),
    createOrder: jest.fn(() => Promise.resolve({ success: false })),
  },
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// ── Wrapper factory ────────────────────────────────────────────────────────────

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCheckout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return state', async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    expect(result.current.state).toBeDefined();
    expect(Array.isArray(result.current.state.items)).toBe(true);
  });

  it('should return actions', async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    expect(result.current.actions).toBeDefined();
    expect(typeof result.current.actions.applyPromoCode).toBe('function');
    expect(typeof result.current.actions.removePromoCode).toBe('function');
    expect(typeof result.current.actions.toggleRezCoin).toBe('function');
    expect(typeof result.current.actions.selectPaymentMethod).toBe('function');
    expect(typeof result.current.actions.selectAddress).toBe('function');
  });

  it('should return handlers', async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    expect(result.current.handlers).toBeDefined();
    expect(typeof result.current.handlers.handlePromoCodeApply).toBe('function');
    expect(typeof result.current.handlers.handleCoinToggle).toBe('function');
    expect(typeof result.current.handlers.handleProceedToPayment).toBe('function');
    expect(typeof result.current.handlers.handleAddressSelect).toBe('function');
  });

  it('should have bill summary in state', async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    expect(result.current.state.billSummary).toBeDefined();
    expect(typeof result.current.state.billSummary.itemTotal).toBe('number');
  });

  it('should have coin system in state', async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    expect(result.current.state.coinSystem).toBeDefined();
    expect(result.current.state.coinSystem.rezCoin).toBeDefined();
  });

  it('should have fulfillment state', async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    expect(result.current.state.fulfillment).toBeDefined();
  });

  it('should have empty items initially', async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    expect(Array.isArray(result.current.state.items)).toBe(true);
    expect(result.current.state.items.length).toBe(0);
  });

  it('should have payment methods', async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    expect(result.current.state.availablePaymentMethods).toBeDefined();
  });
});
