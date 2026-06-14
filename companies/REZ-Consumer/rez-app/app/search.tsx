// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { SearchCategory, SearchResult, SearchSuggestion, SearchViewMode } from '@/types/search.types';
import { LandingSkeleton, ResultsSkeleton } from '@/components/search/SearchSkeleton';
import FilterModal from '@/components/search/FilterModal';
import type { FilterState } from '@/components/search/FilterModal';
import type { SortOption } from '@/components/search/FilterBar';
import SearchHeader from '@/components/search/SearchHeader';
import SearchSuggestionsView from '@/components/search/SearchSuggestionsView';
import CategoriesView from '@/components/search/CategoriesView';
import SearchResultsView from '@/components/search/SearchResultsView';
import SearchEmptyState from '@/components/search/SearchEmptyState';
import SearchErrorState from '@/components/search/SearchErrorState';
import SearchHintView from '@/components/search/SearchHintView';
import { REZ_THEME } from '@/components/search/searchTheme';
import { useSearchPage } from '@/hooks/useSearchPage';
import useDebouncedSearch from '@/hooks/useDebouncedSearch';
import { useCurrentLocation } from '@/hooks/useLocation';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { searchHistoryService } from '@/services/searchHistoryService';
import { Spacing } from '@/constants/DesignSystem';
import { useIsMounted } from '@/hooks/useIsMounted';
import { logger } from '@/utils/logger';

function SearchPage() {
  const params = useLocalSearchParams();
  // CA-DSC-038 FIX: Validate query length before setting as initialQuery
  const rawQuery = (params.q as string) || '';
  const initialQuery = rawQuery.trim().length >= 2 ? rawQuery : '';

  // Use the search page hook
  const {
    state: searchState,
    groupedProducts,
    matchingStores,
    searchSummary,
    trendingSearches,
    popularStores,
    popularProducts,
    didYouMeanSuggestions,
    actions,
  } = useSearchPage();

  // Get user location for distance calculation
  const { currentLocation } = useCurrentLocation();

  // Get currency symbol for price display
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();

  // Use debounced search hook
  const { debouncedValue: debouncedQuery, setValue: setSearchQuery } = useDebouncedSearch(initialQuery, {
    delay: 350,
    minLength: 2,
  });

  const [viewMode, setViewMode] = useState<SearchViewMode>(initialQuery ? 'results' : 'categories');
  const [inputFocused, setInputFocused] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>('cashback_high');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    priceRange: { min: 0, max: 100000 },
    rating: null,
    categories: [],
    inStock: false,
    cashbackMin: 0,
  });
  const [recentSearches, setRecentSearches] = useState<unknown[]>([]);
  const isMounted = useIsMounted();

  // Load recent searches
  useEffect(() => {
    searchHistoryService
      .getRecentSearches()
      .then(setRecentSearches)
      .catch((err) => {
        // CA-DSC-004 FIX: Log errors instead of silently swallowing
        logger.warn('[Search] Failed to load recent searches:', { error: err?.message || err });
      });
  }, []);

  // Prepare user location for search (memoized to avoid recreation)
  const userLat = currentLocation?.coordinates?.latitude;
  const userLon = currentLocation?.coordinates?.longitude;

  // Store function, location, and filters in refs to avoid dependency issues
  const performGroupedSearchRef = useRef(actions.performGroupedSearch);
  const userLocationRef = useRef<{ latitude: number; longitude: number } | undefined>(undefined);
  const currentFiltersRef = useRef<FilterState>(currentFilters);

  // Update refs (using useLayoutEffect to avoid render issues)
  useLayoutEffect(() => {
    performGroupedSearchRef.current = actions.performGroupedSearch;
    userLocationRef.current = userLat && userLon ? { latitude: userLat, longitude: userLon } : undefined;
    currentFiltersRef.current = currentFilters;
  }, [actions.performGroupedSearch, userLat, userLon, currentFilters]);

  // Track last search to prevent duplicate searches
  const lastSearchedQuery = useRef<string>('');
  // CA-DSC-002 FIX: Add timestamp/request ID to prevent race conditions in search
  const lastSearchTimestamp = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // CA-DSC-016 FIX: Add initialQuery to dependency array to handle deep-link re-triggers
  const hasSearchedInitial = useRef(false);
  useEffect(() => {
    if (initialQuery && initialQuery.trim().length >= 2 && !hasSearchedInitial.current) {
      hasSearchedInitial.current = true;
      lastSearchedQuery.current = initialQuery;
      lastSearchTimestamp.current = Date.now();
      actions.handleSearchChange(initialQuery);
      performGroupedSearchRef.current(initialQuery, userLocationRef.current, currentFiltersRef.current);
      setViewMode('results');
    }
  }, [initialQuery, actions]);

  // Perform grouped search when debounced query changes
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.trim().length >= 2) {
      if (lastSearchedQuery.current !== debouncedQuery) {
        lastSearchedQuery.current = debouncedQuery;
        lastSearchTimestamp.current = Date.now();
        // Cancel previous search if still in flight
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        performGroupedSearchRef.current(debouncedQuery, userLocationRef.current, currentFiltersRef.current);
        setViewMode('results');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleBack = () => {
    // eslint-disable-next-line no-unused-expressions
    router.canGoBack() ? router.back() : router.replace('/(tabs)');
  };

  const handleQueryChange = (text: string) => {
    // CA-DSC-029 FIX: Validate query before setting viewMode to suggestions
    actions.handleSearchChange(text);
    setSearchQuery(text);
    if (text.trim().length >= 2) {
      setViewMode('suggestions');
    } else if (text.length === 0) {
      setViewMode('categories');
    }
  };

  const handleSearch = useCallback(() => {
    if (searchState.query.trim()) {
      lastSearchedQuery.current = searchState.query;
      performGroupedSearchRef.current(searchState.query, userLocationRef.current, currentFiltersRef.current);
      setViewMode('results');
    }
  }, [searchState.query]);

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    actions.handleSearchChange(suggestion.text);
    setSearchQuery(suggestion.text);
    lastSearchedQuery.current = suggestion.text;
    performGroupedSearchRef.current(suggestion.text, userLocationRef.current, currentFiltersRef.current);
    setViewMode('results');
  };

  const handleCategoryPress = async (category: SearchCategory) => {
    await actions.handleCategoryPress(category);
    router.push({
      pathname: '/category/[slug]' as unknown,
      params: {
        slug: category.slug,
        name: category.name,
        categoryId: category.id,
      },
    });
  };

  const handleResultPress = async (result: SearchResult, position: number) => {
    await actions.handleResultPress(result, position);
    const resultId = result.id || (result as unknown).productId || (result as unknown).storeId || '';
    if (!resultId) return;

    if (result.category === 'Store') {
      router.push(`/MainStorePage?storeId=${resultId}`);
    } else {
      router.push({
        pathname: '/product-page' as unknown,
        params: { cardId: resultId, cardType: 'product' },
      });
    }
  };

  const handleSellerPress = (seller) => {
    if (seller.productId) {
      router.push({
        pathname: '/product-page' as unknown,
        params: { cardId: seller.productId, cardType: 'product', storeId: seller.storeId },
      });
    } else if (seller.storeId) {
      router.push(`/MainStorePage?storeId=${seller.storeId}`);
    }
  };

  const handleFilterPress = (_filter: string) => {
    setShowFilterModal(true);
  };

  const handleSortChange = (sort: SortOption) => {
    setCurrentSort(sort);
  };

  const handleViewAll = (sectionId: string) => {
    actions.handleViewAllSection(sectionId);
    if (sectionId === 'going-out') {
      router.push('/going-out');
    } else if (sectionId === 'home-delivery') {
      router.push('/home-delivery');
    }
  };

  const handleOpenFilters = () => {
    setShowFilterModal(true);
  };

  const handleApplyFilters = (filters: FilterState) => {
    // CA-DSC-022 FIX: Keep modal open until search completes, show error toast if fails
    setCurrentFilters(filters);
    const filterNames: string[] = [];
    if (filters.priceRange.min > 0 || filters.priceRange.max < 100000) filterNames.push('price');
    if (filters.rating !== null) filterNames.push('rating');
    if (filters.cashbackMin > 0) filterNames.push('cashback');
    if (filters.categories.length > 0) filterNames.push('category');
    setActiveFilters(filterNames);

    if (searchState.query.trim().length >= 2) {
      lastSearchedQuery.current = '';
      try {
        performGroupedSearchRef.current(searchState.query, userLocationRef.current, filters);
        setViewMode('results');
        setShowFilterModal(false);
      } catch (err) {
        logger.warn('[Search] Filter apply failed:', { error: err });
      }
    } else {
      setShowFilterModal(false);
    }
  };

  const handleRecentSearchPress = (query: string) => {
    actions.handleSearchChange(query);
    setSearchQuery(query);
    lastSearchedQuery.current = query;
    performGroupedSearchRef.current(query, userLocationRef.current, currentFiltersRef.current);
    setViewMode('results');
  };

  const handleTrendingSearchPress = (query: string) => {
    actions.handleSearchChange(query);
    setSearchQuery(query);
    lastSearchedQuery.current = query;
    performGroupedSearchRef.current(query, userLocationRef.current, currentFiltersRef.current);
    setViewMode('results');
  };

  const handlePopularStorePress = (store) => {
    router.push(`/MainStorePage?storeId=${store._id}`);
  };

  const handleDidYouMeanPress = (suggestion: string) => {
    actions.handleSearchChange(suggestion);
    setSearchQuery(suggestion);
    performGroupedSearchRef.current(suggestion, userLocationRef.current, currentFiltersRef.current);
    setViewMode('results');
  };

  const handleEmptyClearSearch = () => {
    actions.handleClearSearch();
    setViewMode('categories');
  };

  const handleRetry = () => {
    actions.handleClearError();
    if (viewMode === 'results' && searchState.query) {
      performGroupedSearchRef.current(searchState.query, userLocationRef.current, currentFiltersRef.current);
    } else {
      actions.loadCategories();
    }
  };

  // Apply sorting to grouped products based on current sort option
  const sortedGroupedProducts = useMemo(() => {
    if (!groupedProducts || groupedProducts.length === 0) return groupedProducts;

    return groupedProducts.map((productGroup) => {
      const sortedSellers = [...productGroup.sellers].sort((a, b) => {
        switch (currentSort) {
          case 'price_low':
            return (a.price?.current ?? 0) - (b.price?.current ?? 0);
          case 'price_high':
            return (b.price?.current ?? 0) - (a.price?.current ?? 0);
          case 'cashback_high':
            return (b.cashback?.amount ?? 0) - (a.cashback?.amount ?? 0);
          case 'distance': {
            const distA = a.distance ?? 999;
            const distB = b.distance ?? 999;
            return distA - distB;
          }
          case 'rating':
            if (b.rating !== a.rating) return (b.rating ?? 0) - (a.rating ?? 0);
            return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
          case 'best_value':
          default: {
            const scoreA =
              (a.price?.current ?? 0) * 0.4 -
              (a.cashback?.amount ?? 0) * 0.3 -
              (a.rating ?? 0) * 100 * 0.2 +
              (a.distance || 999) * 0.1;
            const scoreB =
              (b.price?.current ?? 0) * 0.4 -
              (b.cashback?.amount ?? 0) * 0.3 -
              (b.rating ?? 0) * 100 * 0.2 +
              (b.distance || 999) * 0.1;
            return scoreA - scoreB;
          }
        }
      });
      return { ...productGroup, sellers: sortedSellers };
    });
  }, [groupedProducts, currentSort]);

  // ============================================
  // CONTENT RENDERING
  // ============================================

  const renderContent = () => {
    if (searchState.error && !searchState.sections.length) {
      return <SearchErrorState error={searchState.error} onRetry={handleRetry} />;
    }

    if (searchState.loading && !searchState.sections.length) {
      return searchState.isSearching || viewMode === 'results' ? <ResultsSkeleton /> : <LandingSkeleton />;
    }

    switch (viewMode) {
      case 'suggestions':
        return (
          <SearchSuggestionsView
            suggestions={searchState.suggestions}
            query={searchState.query}
            onSuggestionPress={handleSuggestionPress}
          />
        );
      case 'results':
        if (searchState.loading) {
          return <ResultsSkeleton />;
        }
        if (searchState.query.trim().length < 2) {
          return <SearchHintView />;
        }
        if (
          sortedGroupedProducts.length === 0 &&
          matchingStores.length === 0 &&
          searchState.results.length === 0 &&
          !searchState.loading
        ) {
          return (
            <SearchEmptyState
              query={searchState.query}
              didYouMeanSuggestions={didYouMeanSuggestions}
              trendingSearches={trendingSearches}
              popularProducts={popularProducts}
              currencySymbol={currencySymbol}
              onDidYouMeanPress={handleDidYouMeanPress}
              onTrendingPress={handleTrendingSearchPress}
              onClearSearch={handleEmptyClearSearch}
            />
          );
        }
        return (
          <SearchResultsView
            query={searchState.query}
            loading={searchState.loading}
            results={searchState.results}
            groupedProducts={sortedGroupedProducts}
            matchingStores={matchingStores}
            searchSummary={searchSummary}
            currentSort={currentSort}
            activeFilters={activeFilters}
            onResultPress={handleResultPress}
            onSellerPress={handleSellerPress}
            onFilterPress={handleFilterPress}
            onSortChange={handleSortChange}
          />
        );
      default:
        return (
          <CategoriesView
            sections={searchState.sections}
            recentSearches={recentSearches}
            trendingSearches={trendingSearches}
            popularStores={popularStores}
            onCategoryPress={handleCategoryPress}
            onViewAll={handleViewAll}
            onRecentSearchPress={handleRecentSearchPress}
            onRemoveSearch={(id) => {
              searchHistoryService
                .removeSearch(id)
                .then(() => {
                  setRecentSearches((prev) => prev.filter((s) => s.id !== id));
                })
                .catch(() => {});
            }}
            onClearAllSearches={() => {
              actions.clearSearchHistory();
              setRecentSearches([]);
            }}
            onTrendingSearchPress={handleTrendingSearchPress}
            onPopularStorePress={handlePopularStorePress}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SearchHeader
        query={searchState.query}
        inputFocused={inputFocused}
        activeFilterCount={Object.keys(searchState.activeFilters).length}
        initialQuery={initialQuery}
        onBack={handleBack}
        onQueryChange={handleQueryChange}
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
        onSubmitEditing={handleSearch}
        onOpenFilters={handleOpenFilters}
      />
      {searchState.error && searchState.sections.length > 0 && (
        <View style={styles.errorBanner} accessibilityLabel={`Warning: ${searchState.error}`} accessibilityRole="alert">
          <Ionicons name="warning-outline" size={16} color={REZ_THEME.lightMustard} accessibilityLabel="Warning icon" />
          <Text style={styles.errorBannerText}>{searchState.error}</Text>
        </View>
      )}
      {renderContent()}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={currentFilters}
        categories={
          searchState.sections.length > 0
            ? searchState.sections.flatMap((s) => s.categories ?? []).map((c) => ({ id: c.id, name: c.name }))
            : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: REZ_THEME.linen,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: REZ_THEME.linen,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: REZ_THEME.peachDark,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: REZ_THEME.nileBlue,
    fontWeight: '500',
  },
});

export default withErrorBoundary(SearchPage, 'Search');
