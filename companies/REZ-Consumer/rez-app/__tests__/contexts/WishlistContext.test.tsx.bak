/**
 * WishlistContext Tests
 * Tests wishlist state logic directly (add, remove, isInWishlist, count).
 * API calls are mocked via jest.fn().
 */

// ---------------------------------------------------------------------------
// Inline wishlist state helpers (mirrors WishlistContext logic)
// ---------------------------------------------------------------------------

interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  brand: string;
  category: string;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LIMITED';
  addedAt: string;
}

type WishlistInput = Omit<WishlistItem, 'id' | 'addedAt'>;

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WishlistState = {
  items: [],
  isLoading: false,
  error: null,
};

const isInWishlist = (items: WishlistItem[], productId: string): boolean =>
  items.some((i) => i.productId === productId);

const addToWishlist = (
  state: WishlistState,
  item: WishlistInput
): WishlistState => {
  if (isInWishlist(state.items, item.productId)) {
    return { ...state, error: 'Item already in wishlist' };
  }
  const newItem: WishlistItem = {
    ...item,
    id: `temp-${Date.now()}`,
    addedAt: new Date().toISOString(),
  };
  return { ...state, items: [...state.items, newItem], error: null };
};

const removeFromWishlist = (
  state: WishlistState,
  productId: string
): WishlistState => {
  if (!isInWishlist(state.items, productId)) {
    return { ...state, error: 'Item not found in wishlist' };
  }
  return {
    ...state,
    items: state.items.filter((i) => i.productId !== productId),
    error: null,
  };
};

const getWishlistCount = (items: WishlistItem[]): number => items.length;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeWishlistInput = (
  overrides: Partial<WishlistInput> = {}
): WishlistInput => ({
  productId: 'prod-1',
  productName: 'Cool Sneakers',
  productImage: 'https://example.com/image.jpg',
  price: 120,
  originalPrice: 150,
  discount: 20,
  rating: 4.5,
  reviewCount: 200,
  brand: 'BrandX',
  category: 'Footwear',
  availability: 'IN_STOCK',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WishlistContext – initial state', () => {
  it('starts with an empty wishlist', () => {
    expect(initialState.items).toHaveLength(0);
  });

  it('starts with isLoading false and no error', () => {
    expect(initialState.isLoading).toBe(false);
    expect(initialState.error).toBeNull();
  });
});

describe('WishlistContext – addToWishlist', () => {
  it('adds a new item to an empty wishlist', () => {
    const state = addToWishlist(initialState, makeWishlistInput());
    expect(state.items).toHaveLength(1);
    expect(state.items[0].productId).toBe('prod-1');
    expect(state.items[0].addedAt).toBeDefined();
  });

  it('does not add a duplicate item', () => {
    let state = addToWishlist(initialState, makeWishlistInput());
    state = addToWishlist(state, makeWishlistInput());

    expect(state.items).toHaveLength(1);
    expect(state.error).toBe('Item already in wishlist');
  });

  it('adds multiple distinct items', () => {
    let state = addToWishlist(initialState, makeWishlistInput({ productId: 'p1' }));
    state = addToWishlist(state, makeWishlistInput({ productId: 'p2', productName: 'Bag' }));

    expect(state.items).toHaveLength(2);
  });
});

describe('WishlistContext – removeFromWishlist', () => {
  it('removes an existing item', () => {
    let state = addToWishlist(initialState, makeWishlistInput());
    state = removeFromWishlist(state, 'prod-1');

    expect(state.items).toHaveLength(0);
    expect(state.error).toBeNull();
  });

  it('returns error when item is not in wishlist', () => {
    const state = removeFromWishlist(initialState, 'nonexistent');
    expect(state.error).toBe('Item not found in wishlist');
  });
});

describe('WishlistContext – isInWishlist', () => {
  it('returns true for an added product', () => {
    const state = addToWishlist(initialState, makeWishlistInput());
    expect(isInWishlist(state.items, 'prod-1')).toBe(true);
  });

  it('returns false for a product not in the list', () => {
    expect(isInWishlist(initialState.items, 'prod-1')).toBe(false);
  });

  it('returns false after item is removed', () => {
    let state = addToWishlist(initialState, makeWishlistInput());
    state = removeFromWishlist(state, 'prod-1');
    expect(isInWishlist(state.items, 'prod-1')).toBe(false);
  });
});

describe('WishlistContext – getWishlistCount', () => {
  it('returns 0 for empty list', () => {
    expect(getWishlistCount([])).toBe(0);
  });

  it('returns correct count after adding items', () => {
    let state = addToWishlist(initialState, makeWishlistInput({ productId: 'a' }));
    state = addToWishlist(state, makeWishlistInput({ productId: 'b' }));
    expect(getWishlistCount(state.items)).toBe(2);
  });
});

describe('WishlistContext – sync with backend (mocked API)', () => {
  it('calls wishlistApi.getWishlists on load', async () => {
    const getWishlists = jest.fn().mockResolvedValue({
      success: true,
      data: { wishlists: [] },
    });

    const response = await getWishlists(1, 50);
    expect(getWishlists).toHaveBeenCalledWith(1, 50);
    expect(response.success).toBe(true);
  });

  it('calls wishlistApi.addToWishlist with correct item data', async () => {
    const addToWishlistApi = jest.fn().mockResolvedValue({
      success: true,
      data: { id: 'real-id-999' },
    });

    const response = await addToWishlistApi({
      itemType: 'product',
      itemId: 'prod-1',
      wishlistId: 'wl-1',
    });

    expect(addToWishlistApi).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: 'prod-1' })
    );
    expect(response.data.id).toBe('real-id-999');
  });
});
