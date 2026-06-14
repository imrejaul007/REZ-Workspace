// NOTE: Contains unique data not in AuthContext. Consolidation deferred.
// AuthContext owns identity/session state (merchant profile, token, permissions).
// This context owns operational/transactional state (products, orders, cashback, analytics)
// and the CRUD actions that mutate them. There is no field-level duplication between the two.
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { Product, Order, CashbackRequest, OrderStatus } from '@/shared/types';
import {
  productsService,
  CreateProductRequest,
  UpdateProductRequest,
} from '@/services/api/products';
import { ordersService } from '@/services/api/orders';
import { cashbackService } from '@/services/api/cashback';
import { apiClient } from '@/services/api/client';
import { useAuth } from './AuthContext';
import { logger } from '@/utils/logger';

// Types
interface MerchantState {
  products: Product[];
  orders: Order[];
  cashbackRequests: CashbackRequest[];
  analytics: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    pendingCashback: number;
  };
  isLoading: boolean;
  error: string | null;
}

type MerchantAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'SET_CASHBACK_REQUESTS'; payload: CashbackRequest[] }
  | { type: 'UPDATE_CASHBACK_REQUEST'; payload: CashbackRequest }
  | { type: 'SET_ANALYTICS'; payload: MerchantState['analytics'] }
  | { type: 'RESET' };

interface MerchantContextType {
  state: MerchantState;
  // Product actions
  loadProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  // Order actions
  loadOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  // Cashback actions
  loadCashbackRequests: () => Promise<void>;
  approveCashback: (requestId: string, amount: number) => Promise<void>;
  rejectCashback: (requestId: string, reason: string) => Promise<void>;
  // Analytics
  loadAnalytics: () => Promise<void>;
  // Error handling
  clearError: () => void;
}

// Initial state
const initialState: MerchantState = {
  products: [],
  orders: [],
  cashbackRequests: [],
  analytics: {
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    pendingCashback: 0,
  },
  isLoading: false,
  error: null,
};

// Reducer
function merchantReducer(state: MerchantState, action: MerchantAction): MerchantState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload, isLoading: false };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map((p) => (p.id === action.payload.id ? action.payload : p)),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload, isLoading: false };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === action.payload.id ? action.payload : o)),
      };
    case 'SET_CASHBACK_REQUESTS':
      return { ...state, cashbackRequests: action.payload, isLoading: false };
    case 'UPDATE_CASHBACK_REQUEST':
      return {
        ...state,
        cashbackRequests: state.cashbackRequests.map((r) =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload, isLoading: false };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Context
const MerchantContext = createContext<MerchantContextType | undefined>(undefined);

// Provider
export function MerchantProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(merchantReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Reset all operational state on logout so a different merchant never sees stale data
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: 'RESET' });
    }
  }, [isAuthenticated]);

  // Product actions
  const loadProducts = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await productsService.getProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: response.products });
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[MerchantContext] loadProducts failed:', error);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to load products' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Cast to CreateProductRequest — the Omit shape is compatible at runtime
      const created = await productsService.createProduct(
        productData as unknown as CreateProductRequest
      );
      dispatch({ type: 'ADD_PRODUCT', payload: created });
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[MerchantContext] addProduct failed:', error);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to add product' });
      throw error;
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      // Cast to UpdateProductRequest — Product is a superset of the update shape
      const updated = await productsService.updateProduct(
        product.id,
        product as unknown as UpdateProductRequest
      );
      dispatch({ type: 'UPDATE_PRODUCT', payload: updated });
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[MerchantContext] updateProduct failed:', error);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to update product' });
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await productsService.deleteProduct(productId);
      dispatch({ type: 'DELETE_PRODUCT', payload: productId });
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[MerchantContext] deleteProduct failed:', error);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to delete product' });
      throw error;
    }
  };

  // Order actions
  const loadOrders = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // ordersService.getOrders() returns OrderListResponse which has an `orders` field
      const response = await ordersService.getOrders();
      dispatch({ type: 'SET_ORDERS', payload: response.orders ?? [] });
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[MerchantContext] loadOrders failed:', error);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to load orders' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const updated = await ordersService.updateOrderStatus(orderId, {
        status: status as OrderStatus,
        notifyCustomer: true,
      });
      dispatch({ type: 'UPDATE_ORDER', payload: updated });
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[MerchantContext] updateOrderStatus failed:', error);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to update order status' });
      throw error;
    }
  };

  // Cashback actions
  const loadCashbackRequests = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Fixed: correct endpoint is merchant/cashback (not merchant/cashback/requests)
      const result = await cashbackService.getCashbackRequests();
      dispatch({ type: 'SET_CASHBACK_REQUESTS', payload: result.requests ?? [] });
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[MerchantContext] loadCashbackRequests failed:', error);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to load cashback requests' });
    }
  };

  const approveCashback = async (requestId: string, amount: number) => {
    try {
      // Fixed: was a mock — now calls real API
      const updated = await cashbackService.approveCashbackRequest(requestId, {
        approvedAmount: amount,
      });
      dispatch({ type: 'UPDATE_CASHBACK_REQUEST', payload: updated });
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[MerchantContext] approveCashback failed:', error);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to approve cashback' });
      throw error;
    }
  };

  const rejectCashback = async (requestId: string, reason: string) => {
    try {
      // Fixed: was a mock — now calls real API
      const updated = await cashbackService.rejectCashbackRequest(requestId, {
        rejectionReason: reason,
      });
      dispatch({ type: 'UPDATE_CASHBACK_REQUEST', payload: updated });
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[MerchantContext] rejectCashback failed:', error);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to reject cashback' });
      throw error;
    }
  };

  // Analytics
  const loadAnalytics = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await apiClient.get<{
        revenue?: { total?: number };
        orders?: { total?: number; pending?: number };
        cashback?: { totalPending?: number };
      }>('/merchant/analytics');

      const payload = response.data;
      const analyticsData = {
        totalRevenue: payload?.revenue?.total || 0,
        totalOrders: payload?.orders?.total || 0,
        pendingOrders: payload?.orders?.pending || 0,
        pendingCashback: payload?.cashback?.totalPending || 0,
      };

      dispatch({ type: 'SET_ANALYTICS', payload: analyticsData });
    } catch (error) {
      logger.error('[MerchantContext] loadAnalytics failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load analytics' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value: MerchantContextType = {
    state,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    loadOrders,
    updateOrderStatus,
    loadCashbackRequests,
    approveCashback,
    rejectCashback,
    loadAnalytics,
    clearError,
  };

  return <MerchantContext.Provider value={value}>{children}</MerchantContext.Provider>;
}

// Hook
export function useMerchant() {
  const context = useContext(MerchantContext);
  if (context === undefined) {
    throw new Error('useMerchant must be used within a MerchantProvider');
  }
  return context;
}
