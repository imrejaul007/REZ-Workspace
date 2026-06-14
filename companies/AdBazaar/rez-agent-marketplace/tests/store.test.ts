import { describe, it, expect, beforeEach } from 'vitest';
import { useMarketplaceStore } from '../src/store/marketplaceStore';

describe('Marketplace Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useMarketplaceStore.setState({
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
      filteredAgents: useMarketplaceStore.getState().allAgents,
    });
  });

  describe('Filtering', () => {
    it('should set search query and filter agents', () => {
      const { setSearchQuery, filteredAgents } = useMarketplaceStore.getState();
      setSearchQuery('Restaurant');
      const state = useMarketplaceStore.getState();
      expect(state.searchQuery).toBe('Restaurant');
    });

    it('should set selected category', () => {
      const { setSelectedCategory } = useMarketplaceStore.getState();
      setSelectedCategory('restaurant-food');
      const state = useMarketplaceStore.getState();
      expect(state.selectedCategory).toBe('restaurant-food');
    });

    it('should toggle view mode', () => {
      const { setViewMode } = useMarketplaceStore.getState();
      setViewMode('list');
      let state = useMarketplaceStore.getState();
      expect(state.viewMode).toBe('list');

      setViewMode('grid');
      state = useMarketplaceStore.getState();
      expect(state.viewMode).toBe('grid');
    });

    it('should set sort by', () => {
      const { setSortBy } = useMarketplaceStore.getState();
      setSortBy('installs');
      const state = useMarketplaceStore.getState();
      expect(state.sortBy).toBe('installs');
    });

    it('should set price filter', () => {
      const { setPriceFilter } = useMarketplaceStore.getState();
      setPriceFilter('free');
      let state = useMarketplaceStore.getState();
      expect(state.priceFilter).toBe('free');

      setPriceFilter('paid');
      state = useMarketplaceStore.getState();
      expect(state.priceFilter).toBe('paid');
    });

    it('should reset filters', () => {
      const { setSearchQuery, setSelectedCategory, resetFilters } = useMarketplaceStore.getState();
      setSearchQuery('test');
      setSelectedCategory('restaurant-food');

      resetFilters();

      const state = useMarketplaceStore.getState();
      expect(state.searchQuery).toBe('');
      expect(state.selectedCategory).toBeNull();
      expect(state.priceFilter).toBe('all');
      expect(state.minRating).toBe(0);
    });
  });

  describe('Comparison', () => {
    it('should add agent to compare list', () => {
      const { addToCompare, compareList } = useMarketplaceStore.getState();
      addToCompare('restaurant-optimizer');
      const state = useMarketplaceStore.getState();
      expect(state.compareList).toContain('restaurant-optimizer');
    });

    it('should not add duplicate agents to compare', () => {
      const { addToCompare } = useMarketplaceStore.getState();
      addToCompare('restaurant-optimizer');
      addToCompare('restaurant-optimizer');
      const state = useMarketplaceStore.getState();
      expect(state.compareList.filter(id => id === 'restaurant-optimizer').length).toBe(1);
    });

    it('should not add more than 4 agents to compare', () => {
      const { addToCompare } = useMarketplaceStore.getState();
      addToCompare('agent-1');
      addToCompare('agent-2');
      addToCompare('agent-3');
      addToCompare('agent-4');
      addToCompare('agent-5');
      const state = useMarketplaceStore.getState();
      expect(state.compareList.length).toBe(4);
    });

    it('should remove agent from compare list', () => {
      const { addToCompare, removeFromCompare } = useMarketplaceStore.getState();
      addToCompare('restaurant-optimizer');
      removeFromCompare('restaurant-optimizer');
      const state = useMarketplaceStore.getState();
      expect(state.compareList).not.toContain('restaurant-optimizer');
    });

    it('should clear compare list', () => {
      const { addToCompare, clearCompare } = useMarketplaceStore.getState();
      addToCompare('agent-1');
      addToCompare('agent-2');
      clearCompare();
      const state = useMarketplaceStore.getState();
      expect(state.compareList.length).toBe(0);
    });
  });

  describe('Installation', () => {
    it('should start installation with agent', () => {
      const { startInstallation } = useMarketplaceStore.getState();
      const agent = useMarketplaceStore.getState().allAgents[0];
      startInstallation(agent);

      const state = useMarketplaceStore.getState();
      expect(state.isInstalling).toBe(true);
      expect(state.selectedAgent).toBeDefined();
      expect(state.installationConfig).toBeDefined();
      expect(state.installationStep).toBe(0);
    });

    it('should update installation config', () => {
      const { startInstallation, updateInstallationConfig } = useMarketplaceStore.getState();
      const agent = useMarketplaceStore.getState().allAgents[0];
      startInstallation(agent);

      updateInstallationConfig({ businessName: 'Test Business' });
      const state = useMarketplaceStore.getState();
      expect(state.installationConfig?.businessName).toBe('Test Business');
    });

    it('should set installation step', () => {
      const { startInstallation, setInstallationStep } = useMarketplaceStore.getState();
      const agent = useMarketplaceStore.getState().allAgents[0];
      startInstallation(agent);

      setInstallationStep(2);
      let state = useMarketplaceStore.getState();
      expect(state.installationStep).toBe(2);

      setInstallationStep(3);
      state = useMarketplaceStore.getState();
      expect(state.installationStep).toBe(3);
    });

    it('should complete installation', () => {
      const { startInstallation, completeInstallation } = useMarketplaceStore.getState();
      const agent = useMarketplaceStore.getState().allAgents[0];
      startInstallation(agent);

      completeInstallation();

      const state = useMarketplaceStore.getState();
      expect(state.isInstalling).toBe(false);
      expect(state.installationConfig).toBeNull();
      expect(state.selectedAgent).toBeNull();
    });

    it('should cancel installation', () => {
      const { startInstallation, cancelInstallation } = useMarketplaceStore.getState();
      const agent = useMarketplaceStore.getState().allAgents[0];
      startInstallation(agent);

      cancelInstallation();

      const state = useMarketplaceStore.getState();
      expect(state.isInstalling).toBe(false);
      expect(state.installationConfig).toBeNull();
      expect(state.selectedAgent).toBeNull();
    });
  });
});
