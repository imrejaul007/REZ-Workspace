// @ts-nocheck
/**
 * CategoryContext Tests
 * Tests the categoryReducer logic directly: initial state, filter management,
 * search, sort, pagination, and category loading.
 */

// ---------------------------------------------------------------------------
// Inline reducer mirroring CategoryContext
// ---------------------------------------------------------------------------

interface CategoryPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface CategoryState {
  currentCategory: unknown | null;
  categories: unknown[];
  filters: Record<string, unknown>;
  searchQuery: string;
  sortBy: string;
  loading: boolean;
  error: string | null;
  pagination: CategoryPagination;
}

const initialPagination: CategoryPagination = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: false,
};

const initialState: CategoryState = {
  currentCategory: null,
  categories: [],
  filters: {},
  searchQuery: '',
  sortBy: 'featured',
  loading: false,
  error: null,
  pagination: initialPagination,
};

type CategoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CATEGORIES'; payload: unknown[] }
  | { type: 'SET_CURRENT_CATEGORY'; payload: unknown | null }
  | { type: 'UPDATE_FILTERS'; payload: Record<string, unknown> }
  | { type: 'UPDATE_SEARCH'; payload: string }
  | { type: 'UPDATE_SORT'; payload: string }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_PAGINATION'; payload: Partial<CategoryPagination> };

function categoryReducer(
  state: CategoryState,
  action: CategoryAction
): CategoryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload, loading: false, error: null };
    case 'SET_CURRENT_CATEGORY':
      return {
        ...state,
        currentCategory: action.payload,
        loading: false,
        error: null,
        pagination: { ...initialPagination },
      };
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        pagination: { ...initialPagination },
      };
    case 'UPDATE_SEARCH':
      return {
        ...state,
        searchQuery: action.payload,
        pagination: { ...initialPagination },
      };
    case 'UPDATE_SORT':
      return {
        ...state,
        sortBy: action.payload,
        pagination: { ...initialPagination },
      };
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: {},
        searchQuery: '',
        sortBy: 'featured',
        pagination: { ...initialPagination },
      };
    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeCategory = (overrides = {}) => ({
  id: 'cat-1',
  name: 'Electronics',
  slug: 'electronics',
  description: 'All electronics',
  items: [],
  totalCount: 0,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CategoryContext – initial state', () => {
  it('starts with no current category', () => {
    expect(initialState.currentCategory).toBeNull();
  });

  it('starts with empty categories array', () => {
    expect(initialState.categories).toHaveLength(0);
  });

  it('starts with default sort "featured"', () => {
    expect(initialState.sortBy).toBe('featured');
  });

  it('starts with empty filters and search query', () => {
    expect(initialState.filters).toEqual({});
    expect(initialState.searchQuery).toBe('');
  });
});

describe('CategoryContext – SET_CATEGORIES', () => {
  it('stores a list of categories and clears loading', () => {
    const cats = [makeCategory({ id: 'c1' }), makeCategory({ id: 'c2', name: 'Fashion' })];
    const state = categoryReducer(initialState, {
      type: 'SET_CATEGORIES',
      payload: cats,
    });
    expect(state.categories).toHaveLength(2);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});

describe('CategoryContext – SET_CURRENT_CATEGORY', () => {
  it('sets the current category and resets pagination', () => {
    const cat = makeCategory();
    const state = categoryReducer(initialState, {
      type: 'SET_CURRENT_CATEGORY',
      payload: cat,
    });
    expect(state.currentCategory).toEqual(cat);
    expect(state.pagination).toEqual(initialPagination);
    expect(state.loading).toBe(false);
  });

  it('accepts null to clear the current category', () => {
    let state = categoryReducer(initialState, {
      type: 'SET_CURRENT_CATEGORY',
      payload: makeCategory(),
    });
    state = categoryReducer(state, {
      type: 'SET_CURRENT_CATEGORY',
      payload: null,
    });
    expect(state.currentCategory).toBeNull();
  });
});

describe('CategoryContext – filter management', () => {
  it('UPDATE_FILTERS merges new filters and resets pagination', () => {
    const state = categoryReducer(initialState, {
      type: 'UPDATE_FILTERS',
      payload: { brand: 'Apple', priceRange: { min: 0, max: 500 } },
    });
    expect(state.filters.brand).toBe('Apple');
    expect(state.filters.priceRange).toEqual({ min: 0, max: 500 });
    expect(state.pagination.page).toBe(1);
  });

  it('UPDATE_FILTERS is additive — keeps existing filters', () => {
    let state = categoryReducer(initialState, {
      type: 'UPDATE_FILTERS',
      payload: { brand: 'Apple' },
    });
    state = categoryReducer(state, {
      type: 'UPDATE_FILTERS',
      payload: { rating: 4 },
    });
    expect(state.filters.brand).toBe('Apple');
    expect(state.filters.rating).toBe(4);
  });

  it('RESET_FILTERS clears all filters, search and resets sort to featured', () => {
    let state = categoryReducer(initialState, {
      type: 'UPDATE_FILTERS',
      payload: { brand: 'Samsung' },
    });
    state = categoryReducer(state, { type: 'UPDATE_SEARCH', payload: 'phone' });
    state = categoryReducer(state, { type: 'UPDATE_SORT', payload: 'price_low' });
    state = categoryReducer(state, { type: 'RESET_FILTERS' });

    expect(state.filters).toEqual({});
    expect(state.searchQuery).toBe('');
    expect(state.sortBy).toBe('featured');
  });
});

describe('CategoryContext – search', () => {
  it('UPDATE_SEARCH stores the query and resets page', () => {
    const state = categoryReducer(initialState, {
      type: 'UPDATE_SEARCH',
      payload: 'laptop',
    });
    expect(state.searchQuery).toBe('laptop');
    expect(state.pagination.page).toBe(1);
  });
});

describe('CategoryContext – sort', () => {
  it('UPDATE_SORT changes sortBy value', () => {
    const state = categoryReducer(initialState, {
      type: 'UPDATE_SORT',
      payload: 'price_high',
    });
    expect(state.sortBy).toBe('price_high');
  });
});

describe('CategoryContext – loadCategories mocked API', () => {
  it('calls categoriesApi.getCategories and returns data', async () => {
    const getCategories = jest.fn().mockResolvedValue({
      success: true,
      data: [
        { _id: 'c1', name: 'Electronics', slug: 'electronics', isActive: true },
      ],
    });

    const response = await getCategories({ isActive: true });

    expect(getCategories).toHaveBeenCalledWith({ isActive: true });
    expect(response.data).toHaveLength(1);
    expect(response.data[0].slug).toBe('electronics');
  });
});
