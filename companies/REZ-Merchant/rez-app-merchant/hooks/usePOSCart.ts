/**
 * usePOSCart — Main POS cart hook (refactored into smaller modules)
 *
 * This file now composes the smaller hooks:
 * - usePOSCartState: Types and state definitions
 * - usePOSCartActions: Cart manipulation logic
 * - usePOSCartPayment: Payment flow logic
 *
 * Part of Phase 7: Large File Refactoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';
import { useStore } from '@/contexts/StoreContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { productsService } from '@/services/api/products';
import { offlineService } from '@/services/offline';
import { storageService } from '@/services/storage';
import type { Product } from '@/types/api';

export type {
  CartItem,
  SimpleProduct,
  ProductModifier,
  ProductModifierOption,
  UpsellSuggestion,
  SyncStatus,
  CustomerMode,
} from './usePOSCartState';

export { calcLineGST, calcBillGST, formatCurrency } from './usePOSCartState';

import { CartItem, SimpleProduct, UpsellSuggestion } from './usePOSCartState';

import { usePOSCartActions } from './usePOSCartActions';
import { usePOSCartPayment } from './usePOSCartPayment';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UsePOSCartReturn {
  // State
  activeStore: ReturnType<typeof useStore>['activeStore'];
  products: SimpleProduct[];
  loadingProducts: boolean;
  productError: string | null;
  search: string;
  setSearch: (s: string) => void;
  cart: CartItem[];
  showCart: boolean;
  setShowCart: (s: boolean) => void;
  charging: boolean;
  showBarcodeScanner: boolean;
  setShowBarcodeScanner: (s: boolean) => void;
  webBarcodeInput: string;
  setWebBarcodeInput: (s: string) => void;
  qtyModalVisible: boolean;
  setQtyModalVisible: (s: boolean) => void;
  qtyModalProduct: SimpleProduct | null;
  setQtyModalProduct: (p: SimpleProduct | null) => void;
  qtyInputValue: string;
  setQtyInputValue: (s: string) => void;
  customItemModalVisible: boolean;
  setCustomItemModalVisible: (s: boolean) => void;
  customItemName: string;
  setCustomItemName: (s: string) => void;
  customItemPrice: string;
  setCustomItemPrice: (s: string) => void;
  coinRedemptionAmount: string;
  setCoinRedemptionAmount: (s: string) => void;
  coinDiscountApplied: number;
  coinRedemptionConfirmed: boolean;
  isOffline: boolean;
  syncStatus: {
    isSyncing: boolean;
    pendingActions: number;
    lastSyncAt: Date | null;
    syncErrors: string[];
  };
  consumerIdForCoins: string | null;
  setConsumerIdForCoins: (s: string | null) => void;
  customerMode: 'none' | 'walk-in' | 'selected';
  setCustomerMode: (m: 'none' | 'walk-in' | 'selected') => void;
  customerId: string | null;
  setCustomerId: (s: string | null) => void;
  customerPhone: string | null;
  setCustomerPhone: (s: string | null) => void;
  splitModalVisible: boolean;
  setSplitModalVisible: (s: boolean) => void;
  splitWays: number;
  setSplitWays: (n: number) => void;
  confirmedSplitCount: number;
  setConfirmedSplitCount: (n: number) => void;
  tableNumber: string;
  setTableNumber: (s: string) => void;
  tableModalVisible: boolean;
  setTableModalVisible: (s: boolean) => void;
  upsellModalVisible: boolean;
  upsellSuggestions: UpsellSuggestion[];
  setUpsellSuggestions: React.Dispatch<React.SetStateAction<UpsellSuggestion[]>>;
  // Computed
  cartTotal: number;
  cartCount: number;
  perPersonAmount: number;
  filteredProducts: SimpleProduct[];
  // Handlers
  addToCart: (product: SimpleProduct) => void;
  addToCartDirect: (
    product: SimpleProduct,
    modifiers?: Array<{ name: string; price: number }>
  ) => void;
  setItemQty: (cartId: string, qty: number) => void;
  promptQty: (product: SimpleProduct) => void;
  handleQtyModalConfirm: () => void;
  handleAddCustomItem: () => void;
  handleOpenBarcodeScanner: () => Promise<void>;
  handleBarcodeScanned: (data: unknown) => void;
  handleApplyCoinRedemption: () => void;
  handleRemoveCoinRedemption: () => void;
  handleCharge: () => Promise<void>;
  handleUpsellAdd: (suggestion: {
    ruleId: string;
    productId: string;
    name: string;
    finalPrice: number;
  }) => void;
  handleUpsellDismiss: () => Promise<void>;
  handlePrintKOT: () => Promise<void>;
  clearCart: () => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  idempotencyKeyRef: React.MutableRefObject<string | null>;
  setModifierProduct: (p: SimpleProduct | null) => void;
  modifierProduct: SimpleProduct | null;
  selectedModifiers: Record<string, string[]>;
  setSelectedModifiers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  upsellModalVisibleState: boolean;
  setUpsellModalVisible: (s: boolean) => void;
}

export function usePOSCart(): UsePOSCartReturn {
  const { activeStore, isLoading: storeLoading } = useStore();
  const { isOffline, syncStatus } = useNetworkStatus();

  // ── Product State ────────────────────────────────────────────────────────

  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // ── Cart State ──────────────────────────────────────────────────────────

  const [cart, setCart] = useState<CartItem[]>([]);
  const cartLoadedRef = useRef(false);
  const cartPersistDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [charging, setCharging] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  // ── Scanner State ───────────────────────────────────────────────────────

  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const barcodeScanned = useRef(false);
  const barcodeScannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [webBarcodeInput, setWebBarcodeInput] = useState('');

  // ── Quantity Modal ──────────────────────────────────────────────────────

  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [qtyModalProduct, setQtyModalProduct] = useState<SimpleProduct | null>(null);
  const [qtyInputValue, setQtyInputValue] = useState('');

  // ── Custom Item ─────────────────────────────────────────────────────────

  const [customItemModalVisible, setCustomItemModalVisible] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  // ── Coin Redemption ────────────────────────────────────────────────────

  const [coinRedemptionAmount, setCoinRedemptionAmount] = useState('');
  const [coinDiscountApplied, setCoinDiscountApplied] = useState(0);
  const [coinRedemptionConfirmed, setCoinRedemptionConfirmed] = useState(false);
  const [consumerIdForCoins, setConsumerIdForCoins] = useState<string | null>(null);

  // ── Customer ───────────────────────────────────────────────────────────

  const [customerMode, setCustomerMode] = useState<'none' | 'walk-in' | 'selected'>('none');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);

  // ── Bill Split ─────────────────────────────────────────────────────────

  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [splitWays, setSplitWays] = useState(2);
  const [confirmedSplitCount, setConfirmedSplitCount] = useState(1);

  // ── Table ──────────────────────────────────────────────────────────────

  const [tableNumber, setTableNumber] = useState('');
  const [tableModalVisible, setTableModalVisible] = useState(false);

  // ── Upsell ─────────────────────────────────────────────────────────────

  const [upsellModalVisible, setUpsellModalVisible] = useState(false);
  const [upsellSuggestions, setUpsellSuggestions] = useState<UpsellSuggestion[]>([]);

  // ── Modifier ───────────────────────────────────────────────────────────

  const [modifierProduct, setModifierProduct] = useState<SimpleProduct | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});

  // ── Product Loading ────────────────────────────────────────────────────

  const mapProducts = useCallback((rawProducts: unknown[]): SimpleProduct[] => {
    return (rawProducts as Array<Record<string, unknown>>).map((p) => {
      const firstImage = (
        p.images as unknown as (Record<string, unknown> | string | undefined)[]
      )?.[0];
      const imageUrl =
        typeof firstImage === 'string'
          ? firstImage
          : (firstImage as Record<string, unknown>)?.url || p.imageUrl || p.image;
      const stock = (p.inventory as Record<string, unknown>)?.stock ?? p.stock;
      const isAvailable = (p.inventory as Record<string, unknown>)?.isAvailable !== false;
      const pricing = p.pricing as Record<string, unknown> | undefined;
      const gst = pricing?.gst as Record<string, unknown> | undefined;
      return {
        id: (p._id || p.id) as string,
        name: p.name as string,
        price: (pricing?.selling ?? p.price ?? p.basePrice ?? 0) as number,
        imageUrl: imageUrl as string | undefined,
        category: String(
          (p.category as Record<string, unknown>)?.name || (p.category as string) || ''
        ),
        inStock:
          stock !== undefined
            ? (stock as number) > 0
            : (p.isActive as boolean | undefined) !== false && isAvailable,
        stock: stock as number | undefined,
        modifiers: (p.modifiers as SimpleProduct['modifiers']) || [],
        gstRate: (p.gstRate ?? p.taxRate ?? gst?.rate ?? 0) as number,
      };
    });
  }, []);

  const loadProducts = useCallback(
    async (storeId?: string) => {
      setLoadingProducts(true);
      try {
        const result = await productsService.getProducts({
          limit: 100,
          status: 'active',
          ...(storeId ? { storeId } : {}),
        });
        const rawProducts: unknown[] =
          (result as unknown as { products?: unknown[] })?.products ||
          (result as unknown as { items?: unknown[] })?.items ||
          [];
        setProducts(mapProducts(rawProducts));
        offlineService
          .cacheData({ products: rawProducts as Product[] })
          .catch((e) => logger.warn('[POSCart] Product cache failed:', e));
      } catch (loadError: unknown) {
        const err = loadError as { message?: string };
        logger.warn(`[POS] Product load failed, trying offline cache: ${String(loadError)}`);
        setProductError(err?.message || 'Failed to load products');
        const cached = await offlineService.getCachedProducts();
        if (cached.length > 0) {
          setProducts(mapProducts(cached));
        } else if (__DEV__) {
          setProducts([
            { id: '1', name: 'Coffee', price: 80, inStock: true },
            { id: '2', name: 'Sandwich', price: 120, inStock: true },
            { id: '3', name: 'Juice', price: 60, inStock: true },
            { id: '4', name: 'Cake Slice', price: 90, inStock: true },
            { id: '5', name: 'Water Bottle', price: 20, inStock: true },
            { id: '6', name: 'Chips', price: 30, inStock: false },
          ]);
        }
      } finally {
        setLoadingProducts(false);
      }
    },
    [mapProducts]
  );

  // ── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeStore?._id) {
      loadProducts(activeStore._id);
    } else if (!storeLoading) {
      setLoadingProducts(false);
      setProducts([]);
    }

    return () => {
      if (barcodeScannerTimerRef.current) {
        clearTimeout(barcodeScannerTimerRef.current);
      }
    };
  }, [activeStore?._id, storeLoading, loadProducts]);

  // ── Cart Persistence ──────────────────────────────────────────────────

  const cartStorageKey = activeStore?._id ? `pos_cart_${activeStore._id}` : null;

  useEffect(() => {
    if (!cartStorageKey) return;
    cartLoadedRef.current = false;
    let cancelled = false;
    (async () => {
      try {
        const stored = await storageService.get<{
          cart: CartItem[];
          tableNumber?: string;
          confirmedSplitCount?: number;
        }>(cartStorageKey);
        if (cancelled) return;
        if (stored && Array.isArray(stored.cart)) {
          setCart(stored.cart);
          if (typeof stored.tableNumber === 'string') setTableNumber(stored.tableNumber);
          if (typeof stored.confirmedSplitCount === 'number') {
            setConfirmedSplitCount(stored.confirmedSplitCount);
          }
        }
      } catch (persistError: unknown) {
        logger.warn('[POS] Failed to hydrate cart from storage:', persistError);
      } finally {
        if (!cancelled) cartLoadedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cartStorageKey]);

  useEffect(() => {
    if (!cartStorageKey || !cartLoadedRef.current) return;
    if (cartPersistDebounceRef.current !== null) {
      clearTimeout(cartPersistDebounceRef.current);
    }
    if (cart.length === 0 && !tableNumber && confirmedSplitCount === 1) {
      storageService
        .remove(cartStorageKey)
        .catch((e) => logger.warn('[POSCart] Cart clear failed:', e));
      return;
    }
    cartPersistDebounceRef.current = setTimeout(() => {
      storageService.set(cartStorageKey, { cart, tableNumber, confirmedSplitCount }).catch((e) => {
        logger.warn('[POS] Failed to persist cart:', e);
      });
      cartPersistDebounceRef.current = null;
    }, 500);
    return () => {
      if (cartPersistDebounceRef.current !== null) {
        clearTimeout(cartPersistDebounceRef.current);
        cartPersistDebounceRef.current = null;
      }
    };
  }, [cart, tableNumber, confirmedSplitCount, cartStorageKey]);

  // ── Computed ───────────────────────────────────────────────────────────

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const perPersonAmount = splitWays > 0 ? cartTotal / splitWays : 0;
  const filteredProducts = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  // ── Use Extracted Hooks ───────────────────────────────────────────────

  const cartActions = usePOSCartActions({
    cart,
    setCart,
    modifierProduct,
    setModifierProduct,
    selectedModifiers,
    setSelectedModifiers,
    qtyModalProduct,
    setQtyModalProduct,
    setQtyModalVisible,
    qtyInputValue,
    setQtyInputValue,
    customItemModalVisible,
    setCustomItemModalVisible,
    customItemName,
    setCustomItemName,
    customItemPrice,
    setCustomItemPrice,
    products,
    setShowBarcodeScanner,
    barcodeScannerTimerRef,
    setUpsellSuggestions,
    setUpsellModalVisible,
    setCustomerMode,
    setCustomerId,
    setCustomerPhone,
    setCoinRedemptionAmount,
    setCoinDiscountApplied,
    setCoinRedemptionConfirmed,
    setConsumerIdForCoins,
    idempotencyKeyRef,
  });

  const paymentActions = usePOSCartPayment({
    cart,
    activeStore,
    isOffline,
    tableNumber,
    confirmedSplitCount,
    customerMode,
    customerPhone,
    coinDiscountApplied,
    consumerIdForCoins,
    cartTotal,
    setCharging,
    setShowCart,
    setTableNumber,
    setConfirmedSplitCount,
    setCoinRedemptionAmount,
    setCoinDiscountApplied,
    setCoinRedemptionConfirmed,
    setConsumerIdForCoins,
    idempotencyKeyRef,
    clearCart: cartActions.clearCart,
  });

  // ── Return ─────────────────────────────────────────────────────────────

  return {
    activeStore,
    products,
    loadingProducts,
    productError,
    search,
    setSearch,
    cart,
    showCart,
    setShowCart,
    charging,
    showBarcodeScanner,
    setShowBarcodeScanner,
    webBarcodeInput,
    setWebBarcodeInput,
    qtyModalVisible,
    setQtyModalVisible,
    qtyModalProduct,
    setQtyModalProduct,
    qtyInputValue,
    setQtyInputValue,
    customItemModalVisible,
    setCustomItemModalVisible,
    customItemName,
    setCustomItemName,
    customItemPrice,
    setCustomItemPrice,
    coinRedemptionAmount,
    setCoinRedemptionAmount,
    coinDiscountApplied,
    coinRedemptionConfirmed,
    isOffline,
    syncStatus,
    consumerIdForCoins,
    setConsumerIdForCoins,
    customerMode,
    setCustomerMode,
    customerId,
    setCustomerId,
    customerPhone,
    setCustomerPhone,
    splitModalVisible,
    setSplitModalVisible,
    splitWays,
    setSplitWays,
    confirmedSplitCount,
    setConfirmedSplitCount,
    tableNumber,
    setTableNumber,
    tableModalVisible,
    setTableModalVisible,
    upsellModalVisible,
    upsellSuggestions,
    setUpsellSuggestions,
    cartTotal,
    cartCount,
    perPersonAmount,
    filteredProducts,
    ...cartActions,
    ...paymentActions,
    setCart,
    idempotencyKeyRef,
    setModifierProduct,
    modifierProduct,
    selectedModifiers,
    setSelectedModifiers,
    upsellModalVisibleState: upsellModalVisible,
    setUpsellModalVisible,
  };
}
