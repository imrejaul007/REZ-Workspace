// @ts-nocheck
import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import { OfferState, OffersPageData, OfferFilters } from '@/types/offers.types';
import realOffersApi from '@/services/realOffersApi';

// Action Types
type OffersAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_OFFERS'; payload: OffersPageData }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: OfferFilters }
  | { type: 'ADD_FAVORITE'; payload: string }
  | { type: 'REMOVE_FAVORITE'; payload: string }
  | { type: 'CLEAR_FAVORITES' }
  | { type: 'RESET_FILTERS' };

// Initial State
const initialState: OfferState = {
  offers: null,
  loading: false,
  error: null,
  filters: {},
  favorites: [],
};

// Reducer
function offersReducer(state: OfferState, action: OffersAction): OfferState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_OFFERS':
      return { ...state, offers: action.payload, loading: false, error: null };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    
    case 'ADD_FAVORITE':
      return {
        ...state,
        favorites: [...state.favorites, action.payload]
      };
    
    case 'REMOVE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.filter(id => id !== action.payload)
      };
    
    case 'CLEAR_FAVORITES':
      return { ...state, favorites: [] };
    
    case 'RESET_FILTERS':
      return { ...state, filters: {} };
    
    default:
      return state;
  }
}

// Context
interface OffersContextType {
  state: OfferState;
  dispatch: React.Dispatch<OffersAction>;
  actions: {
    loadOffers: () => Promise<void>;
    setFilters: (filters: OfferFilters) => void;
    toggleFavorite: (offerId: string) => void;
    clearFavorites: () => void;
    resetFilters: () => void;
  };
}

const OffersContext = createContext<OffersContextType | undefined>(undefined);

// Provider
interface OffersProviderProps {
  children: ReactNode;
}

export function OffersProvider({ children }: OffersProviderProps) {
  const [state, dispatch] = useReducer(offersReducer, initialState);

  // Actions — wrapped in useCallback to stabilize references
  const loadOffers = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Try the single-call page-data endpoint first (most efficient)
      const pageDataResponse = await realOffersApi.getOffersPageData();

      if (pageDataResponse.success && pageDataResponse.data) {
        // Type-safe dispatch: assume response data structure matches OffersPageData
        const offersData = pageDataResponse.data as unknown as OffersPageData;
        dispatch({ type: 'SET_OFFERS', payload: offersData });
        return;
      }

      // Fallback: compose from individual endpoints if page-data is unavailable
      const [offersResponse, trendingResponse] = await Promise.all([
        realOffersApi.getOffers({ page: 1, limit: 30 }),
        realOffersApi.getTrendingOffers(10).catch(() => ({ success: false, data: [] })),
      ]);

      if (!offersResponse.success || !offersResponse.data) {
        throw new Error('Failed to fetch offers from backend');
      }

      const fallbackPageData: OffersPageData = {
        heroBanner: {
          id: 'hero-banner-1',
          title: 'Special Offers',
          subtitle: 'Exclusive deals and cashback offers',
          image: '',
          ctaText: 'View All',
          ctaAction: '/offers',
          backgroundColor: '#FF6B6B',
        },
        categories: [],
        sections: [
          {
            id: 'featured-offers',
            title: 'Featured Offers',
            subtitle: 'Best deals available now',
            offers: (offersResponse.data as unknown)?.items ?? offersResponse.data ?? [],
            viewAllEnabled: true,
          },
          ...(trendingResponse.success && (trendingResponse as unknown).data?.length
            ? [{
                id: 'trending-offers',
                title: 'Trending Now',
                subtitle: 'Popular with shoppers',
                offers: (trendingResponse as unknown).data,
                viewAllEnabled: true,
              }]
            : []),
        ],
        userPoints: 0,
      };

      dispatch({ type: 'SET_OFFERS', payload: fallbackPageData });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to load offers',
      });
    }
  }, []);

  const setFilters = useCallback((filters: OfferFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const toggleFavorite = useCallback((offerId: string) => {
    if (state.favorites.includes(offerId)) {
      dispatch({ type: 'REMOVE_FAVORITE', payload: offerId });
    } else {
      dispatch({ type: 'ADD_FAVORITE', payload: offerId });
    }
  }, [state.favorites]);

  const clearFavorites = useCallback(() => {
    dispatch({ type: 'CLEAR_FAVORITES' });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  const actions = useMemo(() => ({
    loadOffers,
    setFilters,
    toggleFavorite,
    clearFavorites,
    resetFilters,
  }), [loadOffers, setFilters, toggleFavorite, clearFavorites, resetFilters]);

  const contextValue: OffersContextType = useMemo(() => ({
    state,
    dispatch,
    actions,
  }), [state, dispatch, actions]);

  return (
    <OffersContext.Provider value={contextValue}>
      {children}
    </OffersContext.Provider>
  );
}

const noopDispatch: React.Dispatch<OffersAction> = () => {};
const OFFERS_DEFAULTS: OffersContextType = {
  state: { offers: null, loading: false, error: null, filters: {}, favorites: [] },
  dispatch: noopDispatch,
  actions: {
    loadOffers: async () => {},
    setFilters: () => {},
    toggleFavorite: () => {},
    clearFavorites: () => {},
    resetFilters: () => {},
  },
};

// Hook
export function useOffers() {
  const context = useContext(OffersContext);
  if (context === undefined) return OFFERS_DEFAULTS;
  return context;
}

export { OffersContext };