import { create } from 'zustand';
import { Deal, DealStage } from './api';

interface DealStore {
  deals: Deal[];
  selectedDeal: Deal | null;
  filters: {
    stage: DealStage | null;
    broker: string | null;
    search: string;
    dateRange: { start: string | null; end: string | null };
    valueMin: number | null;
    valueMax: number | null;
  };
  pagination: {
    page: number;
    limit: number;
  };
  isLoading: boolean;
  error: string | null;

  // Actions
  setDeals: (deals: Deal[]) => void;
  setSelectedDeal: (deal: Deal | null) => void;
  updateDealStage: (dealId: string, stage: DealStage) => void;
  setFilters: (filters: Partial<DealStore['filters']>) => void;
  resetFilters: () => void;
  setPagination: (pagination: Partial<DealStore['pagination']>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialFilters = {
  stage: null,
  broker: null,
  search: '',
  dateRange: { start: null, end: null },
  valueMin: null,
  valueMax: null,
};

export const useDealStore = create<DealStore>((set) => ({
  deals: [],
  selectedDeal: null,
  filters: initialFilters,
  pagination: { page: 1, limit: 20 },
  isLoading: false,
  error: null,

  setDeals: (deals) => set({ deals }),

  setSelectedDeal: (deal) => set({ selectedDeal: deal }),

  updateDealStage: (dealId, stage) =>
    set((state) => ({
      deals: state.deals.map((deal) =>
        deal.id === dealId ? { ...deal, stage, updatedAt: new Date().toISOString() } : deal
      ),
      selectedDeal:
        state.selectedDeal?.id === dealId
          ? { ...state.selectedDeal, stage, updatedAt: new Date().toISOString() }
          : state.selectedDeal,
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }, // Reset to page 1 when filters change
    })),

  resetFilters: () => set({ filters: initialFilters, pagination: { page: 1, limit: 20 } }),

  setPagination: (pagination) =>
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));

interface UIStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
