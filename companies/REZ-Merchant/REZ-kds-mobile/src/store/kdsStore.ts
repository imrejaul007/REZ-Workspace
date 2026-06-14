/**
 * KDS Mobile Zustand Store
 * Central state management for the Kitchen Display System
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  KDSOrder,
  KitchenStation,
  OrderStatus,
  OrderPriority,
  StationConfig,
  KDSSettings,
  OrderFilterOptions,
  SortOptions,
  KDSStats,
} from '../types';
import { DEFAULT_STATIONS } from '../utils/constants';
import { sortOrders, filterOrdersByStation } from '../utils/helpers';
import kdsApi from '../services/api';

interface KDSState {
  // Orders
  orders: KDSOrder[];
  selectedOrder: KDSOrder | null;
  recentOrders: KDSOrder[];

  // Stations
  stations: StationConfig[];
  activeStation: KitchenStation;
  allStationActive: boolean;

  // Filters & Sorting
  filters: OrderFilterOptions;
  sort: SortOptions;

  // Settings
  settings: KDSSettings;

  // Connection Status
  isOnline: boolean;
  isConnected: boolean;
  lastSyncTime: string | null;

  // Loading States
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Statistics
  stats: KDSStats | null;

  // Actions - Orders
  setOrders: (orders: KDSOrder[]) => void;
  addOrder: (order: KDSOrder) => void;
  updateOrder: (orderId: string, updates: Partial<KDSOrder>) => void;
  removeOrder: (orderId: string) => void;
  setSelectedOrder: (order: KDSOrder | null) => void;
  addToRecent: (order: KDSOrder) => void;
  clearRecent: () => void;

  // Actions - Stations
  setStations: (stations: StationConfig[]) => void;
  setActiveStation: (station: KitchenStation) => void;
  toggleAllStation: () => void;
  updateStationOrderCount: (station: KitchenStation, count: number) => void;

  // Actions - Filters & Sort
  setFilters: (filters: Partial<OrderFilterOptions>) => void;
  clearFilters: () => void;
  setSort: (sort: SortOptions) => void;

  // Actions - Settings
  updateSettings: (settings: Partial<KDSSettings>) => void;
  updateSoundSettings: (sound: Partial<KDSSettings['sound']>) => void;
  updateVoiceSettings: (voice: Partial<KDSSettings['voice']>) => void;

  // Actions - Connection
  setOnlineStatus: (isOnline: boolean) => void;
  setConnectedStatus: (isConnected: boolean) => void;
  setLastSyncTime: (time: string) => void;

  // Actions - Loading
  setLoading: (isLoading: boolean) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Stats
  setStats: (stats: KDSStats) => void;

  // Actions - Async
  fetchOrders: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  bumpOrder: (orderId: string) => Promise<void>;
  recallOrder: (orderId: string) => Promise<void>;
  acknowledgeOrder: (orderId: string) => Promise<void>;

  // Computed
  getFilteredOrders: () => KDSOrder[];
  getOrderById: (orderId: string) => KDSOrder | undefined;
  getOrdersByStation: (station: KitchenStation) => KDSOrder[];
  getActiveOrdersCount: () => number;
}

const defaultSettings: KDSSettings = {
  sound: {
    newOrder: true,
    urgentOrder: true,
    orderBumped: true,
    allDay: true,
    volume: 0.8,
  },
  voice: {
    enabled: true,
    language: 'en-IN',
    rate: 0.9,
    pitch: 1.0,
    announcePriority: true,
    announceOrderNumber: true,
    announceItems: true,
  },
  display: {
    theme: 'dark',
    showImages: true,
    showPrices: true,
    showCustomerInfo: true,
    cardLayout: 'grid',
    itemsPerRow: 4,
    autoScroll: false,
    scrollInterval: 30000,
  },
  notifications: {
    pushEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    urgentFlash: true,
  },
  offline: {
    enabled: true,
    syncInterval: 30000,
    maxCachedOrders: 100,
  },
};

const defaultFilters: OrderFilterOptions = {
  status: [OrderStatus.PENDING, OrderStatus.ACKNOWLEDGED, OrderStatus.IN_PROGRESS],
};

const defaultSort: SortOptions = {
  field: 'createdAt',
  direction: 'asc',
};

export const useKDSStore = create<KDSState>()(
  persist(
    (set, get) => ({
      // Initial State
      orders: [],
      selectedOrder: null,
      recentOrders: [],
      stations: DEFAULT_STATIONS,
      activeStation: KitchenStation.ALL,
      allStationActive: true,
      filters: defaultFilters,
      sort: defaultSort,
      settings: defaultSettings,
      isOnline: true,
      isConnected: false,
      lastSyncTime: null,
      isLoading: false,
      isRefreshing: false,
      error: null,
      stats: null,

      // Order Actions
      setOrders: (orders) => set({ orders }),

      addOrder: (order) =>
        set((state) => ({
          orders: sortOrders([order, ...state.orders], 'desc'),
        })),

      updateOrder: (orderId, updates) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, ...updates } : order
          ),
          selectedOrder:
            state.selectedOrder?.id === orderId
              ? { ...state.selectedOrder, ...updates }
              : state.selectedOrder,
        })),

      removeOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== orderId),
          selectedOrder:
            state.selectedOrder?.id === orderId ? null : state.selectedOrder,
        })),

      setSelectedOrder: (order) => set({ selectedOrder: order }),

      addToRecent: (order) =>
        set((state) => {
          const filtered = state.recentOrders.filter((o) => o.id !== order.id);
          return {
            recentOrders: [order, ...filtered].slice(0, 10),
          };
        }),

      clearRecent: () => set({ recentOrders: [] }),

      // Station Actions
      setStations: (stations) => set({ stations }),

      setActiveStation: (station) => set({ activeStation: station }),

      toggleAllStation: () =>
        set((state) => ({ allStationActive: !state.allStationActive })),

      updateStationOrderCount: (station, count) =>
        set((state) => ({
          stations: state.stations.map((s) =>
            s.type === station ? { ...s, orderCount: count } : s
          ),
        })),

      // Filter & Sort Actions
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      clearFilters: () => set({ filters: defaultFilters }),

      setSort: (sort) => set({ sort }),

      // Settings Actions
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),

      updateSoundSettings: (sound) =>
        set((state) => ({
          settings: {
            ...state.settings,
            sound: { ...state.settings.sound, ...sound },
          },
        })),

      updateVoiceSettings: (voice) =>
        set((state) => ({
          settings: {
            ...state.settings,
            voice: { ...state.settings.voice, ...voice },
          },
        })),

      // Connection Actions
      setOnlineStatus: (isOnline) => set({ isOnline }),
      setConnectedStatus: (isConnected) => set({ isConnected }),
      setLastSyncTime: (time) => set({ lastSyncTime: time }),

      // Loading Actions
      setLoading: (isLoading) => set({ isLoading }),
      setRefreshing: (isRefreshing) => set({ isRefreshing }),
      setError: (error) => set({ error }),

      // Stats Actions
      setStats: (stats) => set({ stats }),

      // Async Actions
      fetchOrders: async () => {
        const { filters, sort, activeStation, allStationActive, setOrders, setLoading, setError, setLastSyncTime, isOnline } = get();

        setLoading(true);
        setError(null);

        try {
          if (isOnline) {
            const { orders } = await kdsApi.getOrders(filters, sort);
            const finalOrders = allStationActive
              ? orders
              : filterOrdersByStation(orders, activeStation);

            setOrders(finalOrders);
            setLastSyncTime(new Date().toISOString());

            // Cache for offline
            await kdsApi.cacheOrders(finalOrders);
          } else {
            // Use cached orders
            const cachedOrders = await kdsApi.getCachedOrders();
            const finalOrders = allStationActive
              ? cachedOrders
              : filterOrdersByStation(cachedOrders, activeStation);
            setOrders(finalOrders);
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch orders');
          // Try to use cached orders on error
          try {
            const cachedOrders = await kdsApi.getCachedOrders();
            setOrders(cachedOrders);
          } catch {
            // Ignore cache errors
          }
        } finally {
          setLoading(false);
        }
      },

      refreshOrders: async () => {
        const { fetchOrders, setRefreshing } = get();
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
      },

      bumpOrder: async (orderId) => {
        const { updateOrder, addToRecent, isOnline, setError } = get();

        try {
          if (isOnline) {
            const updatedOrder = await kdsApi.bumpOrder(orderId);
            updateOrder(orderId, updatedOrder);
            addToRecent(updatedOrder);
          } else {
            // Offline: queue the action
            await kdsApi.queueOfflineAction({
              type: 'BUMP_ORDER',
              payload: { orderId },
              timestamp: new Date().toISOString(),
            });
            // Optimistically update
            const order = get().orders.find((o) => o.id === orderId);
            if (order) {
              const statusOrder = order.status;
              const nextStatus = {
                [OrderStatus.PENDING]: OrderStatus.ACKNOWLEDGED,
                [OrderStatus.ACKNOWLEDGED]: OrderStatus.IN_PROGRESS,
                [OrderStatus.IN_PROGRESS]: OrderStatus.READY,
                [OrderStatus.READY]: OrderStatus.COMPLETED,
              }[statusOrder];
              if (nextStatus) {
                updateOrder(orderId, { status: nextStatus });
              }
            }
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to bump order');
          throw error;
        }
      },

      recallOrder: async (orderId) => {
        const { updateOrder, setError } = get();

        try {
          if (isOnline) {
            const updatedOrder = await kdsApi.recallOrder(orderId);
            updateOrder(orderId, updatedOrder);
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to recall order');
          throw error;
        }
      },

      acknowledgeOrder: async (orderId) => {
        const { updateOrder, setError } = get();

        try {
          if (isOnline) {
            const updatedOrder = await kdsApi.updateOrderStatus(
              orderId,
              OrderStatus.ACKNOWLEDGED
            );
            updateOrder(orderId, {
              ...updatedOrder,
              acknowledgedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to acknowledge order');
          throw error;
        }
      },

      // Computed/Getters
      getFilteredOrders: () => {
        const { orders, filters, sort } = get();
        let filtered = [...orders];

        // Apply status filter
        if (filters.status?.length) {
          filtered = filtered.filter((order) => filters.status!.includes(order.status));
        }

        // Apply priority filter
        if (filters.priority?.length) {
          filtered = filtered.filter((order) => filters.priority!.includes(order.priority));
        }

        // Apply station filter
        if (filters.station?.length) {
          filtered = filtered.filter((order) => {
            const orderStations = Array.isArray(order.station)
              ? order.station
              : [order.station];
            return orderStations.some((s) => filters.station!.includes(s));
          });
        }

        // Apply search query
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (order) =>
              order.orderNumber.toLowerCase().includes(query) ||
              order.displayNumber.toLowerCase().includes(query) ||
              order.customer?.name?.toLowerCase().includes(query) ||
              order.items.some((item) => item.name.toLowerCase().includes(query))
          );
        }

        // Sort
        return sortOrders(filtered, sort.direction);
      },

      getOrderById: (orderId) => {
        return get().orders.find((order) => order.id === orderId);
      },

      getOrdersByStation: (station) => {
        return filterOrdersByStation(get().orders, station);
      },

      getActiveOrdersCount: () => {
        return get().orders.filter((order) =>
          [OrderStatus.PENDING, OrderStatus.ACKNOWLEDGED, OrderStatus.IN_PROGRESS].includes(
            order.status
          )
        ).length;
      },
    }),
    {
      name: 'kds-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        filters: state.filters,
        sort: state.sort,
        activeStation: state.activeStation,
        stations: state.stations,
        recentOrders: state.recentOrders,
      }),
    }
  )
);

export default useKDSStore;
