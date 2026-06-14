import { create } from 'zustand';
import { Agent, Category, InstallationConfig } from '@/types/agent';
import { agents, categories, getAgentsByCategory, searchAgents } from '@/data/agents';

interface MarketplaceState {
  // Catalog state
  allAgents: Agent[];
  filteredAgents: Agent[];
  categories: Category[];
  selectedCategory: string | null;
  searchQuery: string;
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'rating' | 'installs' | 'price';
  sortOrder: 'asc' | 'desc';
  priceFilter: 'all' | 'free' | 'paid';
  minRating: number;

  // Comparison state
  compareList: string[];
  isCompareMode: boolean;

  // Installation state
  installationConfig: InstallationConfig | null;
  isInstalling: boolean;
  installationStep: number;

  // Selected agent
  selectedAgent: Agent | null;

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSortBy: (sort: 'name' | 'rating' | 'installs' | 'price') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setPriceFilter: (filter: 'all' | 'free' | 'paid') => void;
  setMinRating: (rating: number) => void;
  applyFilters: () => void;

  // Compare actions
  addToCompare: (agentId: string) => void;
  removeFromCompare: (agentId: string) => void;
  clearCompare: () => void;
  toggleCompareMode: () => void;

  // Installation actions
  setSelectedAgent: (agent: Agent | null) => void;
  startInstallation: (agent: Agent) => void;
  updateInstallationConfig: (config: Partial<InstallationConfig>) => void;
  setInstallationStep: (step: number) => void;
  completeInstallation: () => void;
  cancelInstallation: () => void;

  // Reset
  resetFilters: () => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  // Initial state
  allAgents: agents,
  filteredAgents: agents,
  categories: categories,
  selectedCategory: null,
  searchQuery: '',
  viewMode: 'grid',
  sortBy: 'rating',
  sortOrder: 'desc',
  priceFilter: 'all',
  minRating: 0,

  compareList: [],
  isCompareMode: false,

  installationConfig: null,
  isInstalling: false,
  installationStep: 0,

  selectedAgent: null,

  // Filter actions
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().applyFilters();
  },

  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
    get().applyFilters();
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  setSortBy: (sort) => {
    set({ sortBy: sort });
    get().applyFilters();
  },

  setSortOrder: (order) => {
    set({ sortOrder: order });
    get().applyFilters();
  },

  setPriceFilter: (filter) => {
    set({ priceFilter: filter });
    get().applyFilters();
  },

  setMinRating: (rating) => {
    set({ minRating: rating });
    get().applyFilters();
  },

  applyFilters: () => {
    const { allAgents, selectedCategory, searchQuery, sortBy, sortOrder, priceFilter, minRating } = get();

    let filtered = [...allAgents];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(agent => agent.categorySlug === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        agent =>
          agent.name.toLowerCase().includes(lowerQuery) ||
          agent.description.toLowerCase().includes(lowerQuery) ||
          agent.capabilities.some(cap => cap.toLowerCase().includes(lowerQuery)) ||
          agent.category.toLowerCase().includes(lowerQuery)
      );
    }

    // Filter by price
    if (priceFilter === 'free') {
      filtered = filtered.filter(agent => agent.price === 0);
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter(agent => agent.price > 0);
    }

    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter(agent => agent.rating >= minRating);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'installs':
          comparison = a.installCount - b.installCount;
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    set({ filteredAgents: filtered });
  },

  // Compare actions
  addToCompare: (agentId) => {
    const { compareList } = get();
    if (compareList.length < 4 && !compareList.includes(agentId)) {
      set({ compareList: [...compareList, agentId] });
    }
  },

  removeFromCompare: (agentId) => {
    const { compareList } = get();
    set({ compareList: compareList.filter(id => id !== agentId) });
  },

  clearCompare: () => set({ compareList: [] }),

  toggleCompareMode: () => set((state) => ({ isCompareMode: !state.isCompareMode })),

  // Installation actions
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  startInstallation: (agent) => {
    set({
      selectedAgent: agent,
      installationConfig: {
        agentId: agent.id,
        businessName: '',
        locations: [],
        permissions: [],
        plan: agent.pricingPlans.find(p => p.recommended)?.id || agent.pricingPlans[0]?.id || '',
        trainingComplete: false,
      },
      isInstalling: true,
      installationStep: 0,
    });
  },

  updateInstallationConfig: (config) => {
    const { installationConfig } = get();
    if (installationConfig) {
      set({ installationConfig: { ...installationConfig, ...config } });
    }
  },

  setInstallationStep: (step) => set({ installationStep: step }),

  completeInstallation: () => {
    set({
      isInstalling: false,
      installationStep: 0,
      installationConfig: null,
    });
  },

  cancelInstallation: () => {
    set({
      isInstalling: false,
      installationStep: 0,
      installationConfig: null,
      selectedAgent: null,
    });
  },

  resetFilters: () => {
    set({
      selectedCategory: null,
      searchQuery: '',
      sortBy: 'rating',
      sortOrder: 'desc',
      priceFilter: 'all',
      minRating: 0,
      filteredAgents: get().allAgents,
    });
  },
}));
