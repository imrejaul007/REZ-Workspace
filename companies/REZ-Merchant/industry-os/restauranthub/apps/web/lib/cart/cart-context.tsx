'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  minOrderQty: number;
  maxOrderQty?: number;
  vendor: {
    id: string;
    name: string;
    verified: boolean;
  };
  image?: string;
  category: string;
  inStock: boolean;
  notes?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'UPDATE_NOTES'; payload: { id: string; notes: string } }
  | { type: 'CALCULATE_TOTALS' };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  shipping: 0,
  tax: 0,
  grandTotal: 0
};

const TAX_RATE = 0.18; // 18% GST
const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 50;

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item => item.productId === action.payload.productId);
      let newItems: CartItem[];
      
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = state.items.map((item, index) => 
          index === existingItemIndex 
            ? { 
                ...item, 
                quantity: Math.min(
                  item.quantity + (action.payload.quantity || 1), 
                  item.maxOrderQty || 999
                )
              }
            : item
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          ...action.payload,
          id: `cart_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
          quantity: Math.max(action.payload.quantity || 1, action.payload.minOrderQty)
        };
        newItems = [...state.items, newItem];
      }
      
      return calculateTotals({ ...state, items: newItems });
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      return calculateTotals({ ...state, items: newItems });
    }
    
    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item => 
        item.id === action.payload.id 
          ? { 
              ...item, 
              quantity: Math.max(
                Math.min(action.payload.quantity, item.maxOrderQty || 999), 
                item.minOrderQty
              )
            }
          : item
      );
      return calculateTotals({ ...state, items: newItems });
    }
    
    case 'UPDATE_NOTES': {
      const newItems = state.items.map(item => 
        item.id === action.payload.id 
          ? { ...item, notes: action.payload.notes }
          : item
      );
      return { ...state, items: newItems };
    }
    
    case 'CLEAR_CART': {
      return initialState;
    }
    
    case 'CALCULATE_TOTALS': {
      return calculateTotals(state);
    }
    
    default:
      return state;
  }
}

function calculateTotals(state: CartState): CartState {
  const total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = total * TAX_RATE;
  const grandTotal = total + shipping + tax;
  
  return {
    ...state,
    total,
    itemCount,
    shipping,
    tax,
    grandTotal
  };
}

interface CartContextType {
  state: CartState;
  addItem: (product: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
  getCartItem: (productId: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('restauranthub_cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        cartData.items.forEach((item: CartItem) => {
          dispatch({ type: 'ADD_ITEM', payload: item });
        });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (state.items.length > 0) {
      localStorage.setItem('restauranthub_cart', JSON.stringify(state));
    } else {
      localStorage.removeItem('restauranthub_cart');
    }
  }, [state]);

  const addItem = (product: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => {
    if (!product.inStock) {
      toast.error('This item is currently out of stock');
      return;
    }
    
    dispatch({ type: 'ADD_ITEM', payload: product });
    toast.success('Item added to cart');
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    toast.success('Item removed from cart');
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
  };

  const updateNotes = (itemId: string, notes: string) => {
    dispatch({ type: 'UPDATE_NOTES', payload: { id: itemId, notes } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast.success('Cart cleared');
  };

  const getItemQuantity = (productId: string): number => {
    const item = state.items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const isInCart = (productId: string): boolean => {
    return state.items.some(item => item.productId === productId);
  };

  const getCartItem = (productId: string): CartItem | undefined => {
    return state.items.find(item => item.productId === productId);
  };

  const value: CartContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    clearCart,
    getItemQuantity,
    isInCart,
    getCartItem
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}