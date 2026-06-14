// ==========================================
// CorpPerks Client App - Zustand Store
// ==========================================

import { create } from 'zustand';
import {
  Client,
  Project,
  Invoice,
  Conversation,
  DashboardStats,
} from '../types';

interface AppState {
  // Auth
  client: Client | null;
  isAuthenticated: boolean;

  // Data
  dashboardStats: DashboardStats | null;
  projects: Project[];
  invoices: Invoice[];
  conversations: Conversation[];

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;

  // Actions
  setClient: (client: Client | null) => void;
  setDashboardStats: (stats: DashboardStats | null) => void;
  setProjects: (projects: Project[]) => void;
  setInvoices: (invoices: Invoice[]) => void;
  setConversations: (conversations: Conversation[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  clearStore: () => void;
}

const initialState = {
  client: null,
  isAuthenticated: false,
  dashboardStats: null,
  projects: [],
  invoices: [],
  conversations: [],
  isLoading: false,
  isRefreshing: false,
};

export const useStore = create<AppState>((set) => ({
  ...initialState,

  setClient: (client) => set({ client, isAuthenticated: !!client }),
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setProjects: (projects) => set({ projects }),
  setInvoices: (invoices) => set({ invoices }),
  setConversations: (conversations) => set({ conversations }),
  setLoading: (loading) => set({ isLoading: loading }),
  setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
  clearStore: () => set(initialState),
}));

export default useStore;
