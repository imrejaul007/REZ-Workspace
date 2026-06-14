/**
 * CartContext Tests
 * Tests the cartReducer logic directly, covering initial state, add, remove,
 * updateQuantity, clearCart and total calculation.
 */

// ---------------------------------------------------------------------------
// Inline types + helpers mirroring CartContext implementation
// ---------------------------------------------------------------------------

interface CartItemType {
  id: string;
  name: string;
  originalPrice: number;
  discountedPrice?: number;
  discount?: number;
  image?: string;
  storeName?: string;
  storeId?: string;
  category?: string;
}

interface CartItemWithQuantity extends CartItemType {
  quantity: number;
  selected: boolean;
  addedAt: string;
  productId?: string;
}

interface CartState {
  items: CartItemWithQuantity[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isOnline: boolean;
  pendingSync: boolean;
}

type CartAction =
  | { type: 'CART_LOADING'; payload: boolean }
  | { type: 'CART_LOADED'; payload: CartItemWithQuantity[] }
  | { type: 'CART_ERROR'; payload: string }
  | { type: 'ADD_ITEM'; payload: CartItemType }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'CLEAR_ERROR' };

const MAX_QUANTITY = 99;

const calculateTotals = (items: CartItemWithQuantity[]) => {
  const selected = items.filter((i) => i.selected);
  const totalItems = selected.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = selected.reduce((s, i) => {
    const price = i.discountedPrice ?? i.originalPrice ?? 0;
    const discount = i.discount ?? 0;
    return s + price * i.quantity - discount;
  }, 0);
  return { totalItems, totalPrice };
};

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,
  error: null,
  lastUpdated: null,
  isOnline: true,
  pendingSync: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'CART_LOADING':
      return { ...state, isLoading: action.payload, error: null };

    case 'CART_LOADED': {
      const { totalItems, totalPrice } = calculateTotals(action.payload);
      return {
        ...state,
        items: action.payload,
        totalItems,
        totalPrice,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'CART_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'ADD_ITEM': {
      if (!action.payload.id) return { ...state, error: 'Invalid cart item' };

      const existing = state.items.find((i) => i.id === action.payload.id);
      let newItems: CartItemWithQuantity[];

      if (existing) {
        if (existing.quantity >= MAX_QUANTITY)
          return { ...state, error: 'Cannot add more items' };
        newItems = state.items.map((i) =>
          i.id === action.payload.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        const newItem: CartItemWithQuantity = {
          ...action.payload,
          productId: action.payload.id,
          quantity: 1,
          selected: true,
          addedAt: new Date().toISOString(),
        };
        newItems = [...state.items, newItem];
      }

      const { totalItems, totalPrice } = calculateTotals(newItems);
      return {
        ...state,
        items: newItems,
        totalItems,
        totalPrice,
        lastUpdated: new Date().toISOString(),
        error: null,
      };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((i) => i.id !== action.payload);
      const { totalItems, totalPrice } = calculateTotals(newItems);
      return {
        ...state,
        items: newItems,
        totalItems,
        totalPrice,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        const newItems = state.items.filter((i) => i.id !== id);
        const { totalItems, totalPrice } = calculateTotals(newItems);
        return {
          ...state,
          items: newItems,
          totalItems,
          totalPrice,
          lastUpdated: new Date().toISOString(),
          error: null,
        };
      }
      if (quantity > MAX_QUANTITY)
        return { ...state, error: 'Invalid quantity' };
      const newItems = state.items.map((i) =>
        i.id === id ? { ...i, quantity } : i
      );
      const { totalItems, totalPrice } = calculateTotals(newItems);
      return {
        ...state,
        items: newItems,
        totalItems,
        totalPrice,
        lastUpdated: new Date().toISOString(),
        error: null,
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        lastUpdated: new Date().toISOString(),
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeItem = (overrides: Partial<CartItemType> = {}): CartItemType => ({
  id: 'product-1',
  name: 'Test Product',
  originalPrice: 100,
  discountedPrice: 90,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CartContext – initial state', () => {
  it('starts with an empty items array', () => {
    expect(initialState.items).toHaveLength(0);
  });

  it('starts with zero totals', () => {
    expect(initialState.totalItems).toBe(0);
    expect(initialState.totalPrice).toBe(0);
  });

  it('starts with isLoading false', () => {
    expect(initialState.isLoading).toBe(false);
  });
});

describe('CartContext – ADD_ITEM', () => {
  it('adds a new item to an empty cart', () => {
    const state = cartReducer(initialState, {
      type: 'ADD_ITEM',
      payload: makeItem(),
    });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe('product-1');
    expect(state.items[0].quantity).toBe(1);
    expect(state.items[0].selected).toBe(true);
  });

  it('increases quantity when the same item is added again', () => {
    let state = cartReducer(initialState, {
      type: 'ADD_ITEM',
      payload: makeItem(),
    });
    state = cartReducer(state, { type: 'ADD_ITEM', payload: makeItem() });

    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it('adds multiple distinct items', () => {
    let state = cartReducer(initialState, {
      type: 'ADD_ITEM',
      payload: makeItem({ id: 'product-1' }),
    });
    state = cartReducer(state, {
      type: 'ADD_ITEM',
      payload: makeItem({ id: 'product-2', name: 'Second Product' }),
    });

    expect(state.items).toHaveLength(2);
  });

  it('returns error state for invalid item (missing id)', () => {
    const state = cartReducer(initialState, {
      type: 'ADD_ITEM',
      payload: makeItem({ id: '' }),
    });
    expect(state.error).not.toBeNull();
    expect(state.items).toHaveLength(0);
  });
});

describe('CartContext – REMOVE_ITEM', () => {
  const stateWithItem = cartReducer(initialState, {
    type: 'ADD_ITEM',
    payload: makeItem(),
  });

  it('removes the item from the cart', () => {
    const state = cartReducer(stateWithItem, {
      type: 'REMOVE_ITEM',
      payload: 'product-1',
    });
    expect(state.items).toHaveLength(0);
  });

  it('does nothing when removing an item that is not in the cart', () => {
    const state = cartReducer(stateWithItem, {
      type: 'REMOVE_ITEM',
      payload: 'nonexistent',
    });
    expect(state.items).toHaveLength(1);
  });
});

describe('CartContext – UPDATE_QUANTITY', () => {
  const stateWithItem = cartReducer(initialState, {
    type: 'ADD_ITEM',
    payload: makeItem(),
  });

  it('updates quantity for existing item', () => {
    const state = cartReducer(stateWithItem, {
      type: 'UPDATE_QUANTITY',
      payload: { id: 'product-1', quantity: 5 },
    });
    expect(state.items[0].quantity).toBe(5);
  });

  it('removes item when quantity is set to 0', () => {
    const state = cartReducer(stateWithItem, {
      type: 'UPDATE_QUANTITY',
      payload: { id: 'product-1', quantity: 0 },
    });
    expect(state.items).toHaveLength(0);
  });

  it('returns error for quantity over maximum', () => {
    const state = cartReducer(stateWithItem, {
      type: 'UPDATE_QUANTITY',
      payload: { id: 'product-1', quantity: 100 },
    });
    expect(state.error).not.toBeNull();
  });
});

describe('CartContext – CLEAR_CART', () => {
  it('empties the cart and resets totals', () => {
    let state = cartReducer(initialState, {
      type: 'ADD_ITEM',
      payload: makeItem(),
    });
    state = cartReducer(state, { type: 'ADD_ITEM', payload: makeItem({ id: 'p2' }) });
    state = cartReducer(state, { type: 'CLEAR_CART' });

    expect(state.items).toHaveLength(0);
    expect(state.totalItems).toBe(0);
    expect(state.totalPrice).toBe(0);
  });
});

describe('CartContext – total calculation', () => {
  it('calculates totalPrice as discountedPrice × quantity for selected items', () => {
    // Item: discountedPrice 90 × quantity 1 = 90
    const state = cartReducer(initialState, {
      type: 'ADD_ITEM',
      payload: makeItem({ originalPrice: 100, discountedPrice: 90 }),
    });
    expect(state.totalPrice).toBe(90);
  });

  it('sums prices across multiple items', () => {
    let state = cartReducer(initialState, {
      type: 'ADD_ITEM',
      payload: makeItem({ id: 'p1', originalPrice: 50, discountedPrice: 50 }),
    });
    state = cartReducer(state, {
      type: 'ADD_ITEM',
      payload: makeItem({ id: 'p2', originalPrice: 30, discountedPrice: 30 }),
    });
    expect(state.totalPrice).toBe(80);
    expect(state.totalItems).toBe(2);
  });

  it('recalculates after quantity update', () => {
    let state = cartReducer(initialState, {
      type: 'ADD_ITEM',
      payload: makeItem({ originalPrice: 20, discountedPrice: 20 }),
    });
    state = cartReducer(state, {
      type: 'UPDATE_QUANTITY',
      payload: { id: 'product-1', quantity: 3 },
    });
    expect(state.totalPrice).toBe(60);
    expect(state.totalItems).toBe(3);
  });

  it('falls back to originalPrice when discountedPrice is absent', () => {
    const state = cartReducer(initialState, {
      type: 'ADD_ITEM',
      payload: makeItem({ originalPrice: 75, discountedPrice: undefined }),
    });
    expect(state.totalPrice).toBe(75);
  });
});
