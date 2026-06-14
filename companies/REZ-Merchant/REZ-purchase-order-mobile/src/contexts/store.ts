import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  PurchaseOrder,
  POListFilters,
  Supplier,
  ProductSearchResult,
  DashboardStats,
  POStatus,
  PaymentStatus,
} from '../types';
import { purchaseOrderApi, supplierApi, productApi, syncQueue } from '../services/api';

interface POState {
  // Purchase Orders
  purchaseOrders: PurchaseOrder[];
  currentPO: PurchaseOrder | null;
  poListFilters: POListFilters;
  poListPage: number;
  poListTotalPages: number;
  poListTotal: number;

  // Suppliers
  selectedSupplier: Supplier | null;
  supplierSearchResults: Supplier[];
  supplierSearchQuery: string;

  // Products
  productSearchResults: ProductSearchResult[];
  productSearchQuery: string;

  // Dashboard
  dashboardStats: DashboardStats | null;

  // Sync
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  lastSyncTime: string | null;

  // UI State
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  setPurchaseOrders: (orders: PurchaseOrder[]) => void;
  addPurchaseOrder: (order: PurchaseOrder) => void;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  removePurchaseOrder: (id: string) => void;
  setCurrentPO: (po: PurchaseOrder | null) => void;
  setPOListFilters: (filters: POListFilters) => void;
  setPOListPage: (page: number) => void;
  setPOListMeta: (total: number, totalPages: number) => void;

  setSelectedSupplier: (supplier: Supplier | null) => void;
  setSupplierSearchResults: (results: Supplier[]) => void;
  setSupplierSearchQuery: (query: string) => void;

  setProductSearchResults: (results: ProductSearchResult[]) => void;
  setProductSearchQuery: (query: string) => void;

  setDashboardStats: (stats: DashboardStats | null) => void;

  setIsOnline: (isOnline: boolean) => void;
  setPendingSyncCount: (count: number) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  setLastSyncTime: (time: string | null) => void;

  setIsLoading: (isLoading: boolean) => void;
  setIsRefreshing: (isRefreshing: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Async Actions
  fetchPurchaseOrders: (filters?: POListFilters, page?: number, append?: boolean) => Promise<void>;
  fetchPurchaseOrder: (id: string) => Promise<PurchaseOrder | null>;
  fetchDashboardStats: () => Promise<void>;
  searchSuppliers: (query: string) => Promise<void>;
  searchProducts: (query: string) => Promise<void>;

  // Sync Actions
  initializeNetworkListener: () => () => void;
  syncPendingData: () => Promise<void>;

  // Reset
  reset: () => void;
}

const initialState = {
  purchaseOrders: [],
  currentPO: null,
  poListFilters: {},
  poListPage: 1,
  poListTotalPages: 1,
  poListTotal: 0,
  selectedSupplier: null,
  supplierSearchResults: [],
  supplierSearchQuery: '',
  productSearchResults: [],
  productSearchQuery: '',
  dashboardStats: null,
  isOnline: true,
  pendingSyncCount: 0,
  isSyncing: false,
  lastSyncTime: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
};

export const usePOStore = create<POState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPurchaseOrders: (orders) => set({ purchaseOrders: orders }),
      addPurchaseOrder: (order) =>
        set((state) => ({ purchaseOrders: [order, ...state.purchaseOrders] })),
      updatePurchaseOrder: (id, updates) =>
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === id ? { ...po, ...updates, syncStatus: 'pending' } : po
          ),
          currentPO:
            state.currentPO?.id === id
              ? { ...state.currentPO, ...updates, syncStatus: 'pending' }
              : state.currentPO,
        })),
      removePurchaseOrder: (id) =>
        set((state) => ({
          purchaseOrders: state.purchaseOrders.filter((po) => po.id !== id),
          currentPO: state.currentPO?.id === id ? null : state.currentPO,
        })),
      setCurrentPO: (po) => set({ currentPO: po }),
      setPOListFilters: (filters) => set({ poListFilters: filters, poListPage: 1 }),
      setPOListPage: (page) => set({ poListPage: page }),
      setPOListMeta: (total, totalPages) => set({ poListTotal: total, poListTotalPages: totalPages }),

      setSelectedSupplier: (supplier) => set({ selectedSupplier: supplier }),
      setSupplierSearchResults: (results) => set({ supplierSearchResults: results }),
      setSupplierSearchQuery: (query) => set({ supplierSearchQuery: query }),

      setProductSearchResults: (results) => set({ productSearchResults: results }),
      setProductSearchQuery: (query) => set({ productSearchQuery: query }),

      setDashboardStats: (stats) => set({ dashboardStats: stats }),

      setIsOnline: (isOnline) => set({ isOnline }),
      setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
      setIsSyncing: (isSyncing) => set({ isSyncing }),
      setLastSyncTime: (time) => set({ lastSyncTime: time }),

      setIsLoading: (isLoading) => set({ isLoading }),
      setIsRefreshing: (isRefreshing) => set({ isRefreshing }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      fetchPurchaseOrders: async (filters, page = 1, append = false) => {
        const state = get();
        if (state.isLoading) return;

        set({ isLoading: !append, isRefreshing: page === 1 && !append });

        const response = await purchaseOrderApi.getPurchaseOrders(
          filters || state.poListFilters,
          page
        );

        if (response.success && response.data) {
          const newOrders = append
            ? [...state.purchaseOrders, ...response.data.purchaseOrders]
            : response.data.purchaseOrders;
          set({
            purchaseOrders: newOrders,
            poListPage: response.data.page,
            poListTotalPages: response.data.totalPages,
            poListTotal: response.data.total,
            isLoading: false,
            isRefreshing: false,
          });
        } else {
          set({
            error: response.error?.message || 'Failed to fetch purchase orders',
            isLoading: false,
            isRefreshing: false,
          });
        }
      },

      fetchPurchaseOrder: async (id) => {
        set({ isLoading: true });
        const response = await purchaseOrderApi.getPurchaseOrder(id);

        if (response.success && response.data) {
          set({ currentPO: response.data, isLoading: false });
          return response.data;
        } else {
          set({
            error: response.error?.message || 'Failed to fetch purchase order',
            isLoading: false,
          });
          return null;
        }
      },

      fetchDashboardStats: async () => {
        const response = await purchaseOrderApi.getDashboardStats();

        if (response.success && response.data) {
          set({ dashboardStats: response.data });
        }
      },

      searchSuppliers: async (query) => {
        if (!query.trim()) {
          set({ supplierSearchResults: [] });
          return;
        }

        set({ supplierSearchQuery: query });
        const response = await supplierApi.searchSuppliers(query);

        if (response.success && response.data) {
          set({ supplierSearchResults: response.data.suppliers });
        }
      },

      searchProducts: async (query) => {
        if (!query.trim()) {
          set({ productSearchResults: [] });
          return;
        }

        set({ productSearchQuery: query });
        const response = await productApi.searchProducts(query);

        if (response.success && response.data) {
          set({ productSearchResults: response.data.products || [] });
        }
      },

      initializeNetworkListener: () => {
        const unsubscribe = NetInfo.addEventListener((state) => {
          const isOnline = state.isConnected && state.isInternetReachable;
          set({ isOnline });

          if (isOnline) {
            get().syncPendingData();
          }
        });
        return unsubscribe;
      },

      syncPendingData: async () => {
        const state = get();
        if (state.isSyncing || !state.isOnline) return;

        set({ isSyncing: true });

        const results = await syncQueue.process(async (item) => {
          switch (item.type) {
            case 'create':
              return purchaseOrderApi.createPurchaseOrder(item.data);
            case 'update':
              return purchaseOrderApi.updatePurchaseOrder(item.data.id, item.data);
            case 'delete':
              return purchaseOrderApi.deletePurchaseOrder(item.data.id);
            case 'photo':
              return purchaseOrderApi.uploadDeliveryPhoto(item.data.poId, item.data.photo);
            default:
              throw new Error(`Unknown sync type: ${item.type}`);
          }
        });

        set({
          isSyncing: false,
          pendingSyncCount: syncQueue.getPendingCount(),
          lastSyncTime: new Date().toISOString(),
        });

        if (results.success.length > 0) {
          get().fetchPurchaseOrders();
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'po-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        purchaseOrders: state.purchaseOrders,
        poListFilters: state.poListFilters,
        selectedSupplier: state.selectedSupplier,
        dashboardStats: state.dashboardStats,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);

// Selector hooks for common use cases
export const usePurchaseOrders = () => usePOStore((state) => state.purchaseOrders);
export const useCurrentPO = () => usePOStore((state) => state.currentPO);
export const usePOFilters = () => usePOStore((state) => state.poListFilters);
export const useDashboardStats = () => usePOStore((state) => state.dashboardStats);
export const useNetworkStatus = () => usePOStore((state) => state.isOnline);
export const useSyncStatus = () =>
  usePOStore((state) => ({
    isOnline: state.isOnline,
    pendingCount: state.pendingSyncCount,
    isSyncing: state.isSyncing,
    lastSync: state.lastSyncTime,
  }));
