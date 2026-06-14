/**
 * Mock Data for REZ NOW
 * Used when backend services are not available
 */

import type { StoreInfo, MenuCategory, MenuItem, WebOrder } from '@/lib/types';
import type { StoreMenuResponse } from './store';

// ─── Mock Store Data ─────────────────────────────────────────────────────────────

export const MOCK_STORES: Record<string, StoreInfo> = {
  'cafe-blue': {
    id: 'store_001',
    name: 'Cafe Blue',
    slug: 'cafe-blue',
    logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=400&fit=crop',
    address: '123 MG Road, Bangalore, Karnataka 560001',
    phone: '+91 98765 43210',
    storeType: 'cafe',
    displayMode: 'menu',
    hasMenu: true,
    isProgramMerchant: true,
    estimatedPrepMinutes: 25,
    gstEnabled: true,
    gstPercent: 18,
    isOpen: true,
    nextChangeLabel: 'Closes at 10 PM',
    operatingHours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '23:00', closed: false },
      saturday: { open: '08:00', close: '23:00', closed: false },
      sunday: { open: '08:00', close: '21:00', closed: false },
    },
    socialLinks: {
      instagram: 'https://instagram.com/cafeblue',
      facebook: 'https://facebook.com/cafeblue',
      website: 'https://cafeblue.example.com',
    },
    googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    rewardRules: {
      baseCashbackPercent: 5,
      coinsEnabled: true,
    },
    activePromos: [
      { text: '20% OFF on first order', code: 'WELCOME20' },
    ],
    deliveryEnabled: true,
    deliveryRadiusKm: 5,
    deliveryFee: 0,
    reservationsEnabled: true,
    maxTableCapacity: 8,
  },
  'pizza-palace': {
    id: 'store_002',
    name: 'Pizza Palace',
    slug: 'pizza-palace',
    logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=400&fit=crop',
    address: '456 Indiranagar, Bangalore, Karnataka 560038',
    phone: '+91 87654 32109',
    storeType: 'restaurant',
    displayMode: 'menu',
    hasMenu: true,
    isProgramMerchant: true,
    estimatedPrepMinutes: 30,
    gstEnabled: true,
    gstPercent: 18,
    isOpen: true,
    nextChangeLabel: 'Open until 11 PM',
    operatingHours: {
      monday: { open: '11:00', close: '23:00', closed: false },
      tuesday: { open: '11:00', close: '23:00', closed: false },
      wednesday: { open: '11:00', close: '23:00', closed: false },
      thursday: { open: '11:00', close: '23:00', closed: false },
      friday: { open: '11:00', close: '00:00', closed: false },
      saturday: { open: '11:00', close: '00:00', closed: false },
      sunday: { open: '11:00', close: '22:00', closed: false },
    },
    socialLinks: {
      instagram: 'https://instagram.com/pizzapalace',
    },
    googlePlaceId: 'ChIJAQAAAIYuEmsRUsoyG83frY4',
    rewardRules: {
      baseCashbackPercent: 3,
      coinsEnabled: true,
    },
    activePromos: [],
    deliveryEnabled: true,
    deliveryRadiusKm: 8,
    deliveryFee: 49,
    reservationsEnabled: false,
  },
};

// ─── Mock Menu Data ─────────────────────────────────────────────────────────────

export const MOCK_MENU: Record<string, MenuCategory[]> = {
  'cafe-blue': [
    {
      id: 'cat_001',
      name: 'Hot Beverages',
      sortOrder: 1,
      items: [
        {
          id: 'item_001',
          name: 'Espresso',
          description: 'Rich and bold single shot espresso',
          price: 12000, // ₹120 in paise
          originalPrice: 15000,
          isVeg: true,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=300&h=300&fit=crop',
          categoryId: 'cat_001',
          available: true,
          isFeatured: true,
          preparationTime: 5,
          calories: 5,
          allergens: [],
        },
        {
          id: 'item_002',
          name: 'Cappuccino',
          description: 'Espresso with steamed milk and foam',
          price: 18000,
          originalPrice: null,
          isVeg: true,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=300&fit=crop',
          categoryId: 'cat_001',
          available: true,
          isFeatured: false,
          preparationTime: 7,
          calories: 120,
          allergens: ['milk'],
        },
        {
          id: 'item_003',
          name: 'Masala Chai',
          description: 'Traditional Indian spiced tea',
          price: 8000,
          originalPrice: null,
          isVeg: true,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=300&h=300&fit=crop',
          categoryId: 'cat_001',
          available: true,
          isFeatured: false,
          preparationTime: 5,
          calories: 100,
          allergens: ['milk'],
        },
      ],
    },
    {
      id: 'cat_002',
      name: 'Snacks',
      sortOrder: 2,
      items: [
        {
          id: 'item_004',
          name: 'Veg Sandwich',
          description: 'Grilled vegetable sandwich with cheese',
          price: 15000,
          originalPrice: 18000,
          isVeg: true,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=300&fit=crop',
          categoryId: 'cat_002',
          available: true,
          isFeatured: true,
          preparationTime: 10,
          calories: 350,
          allergens: ['gluten', 'dairy'],
          customizableGroups: [
            {
              id: 'bread',
              name: 'Bread Type',
              required: true,
              min: 1,
              max: 1,
              options: [
                { id: 'white', name: 'White Bread', price: 0 },
                { id: 'brown', name: 'Brown Bread', price: 0 },
                { id: 'multigrain', name: 'Multigrain', price: 2000 },
              ],
            },
          ],
        },
        {
          id: 'item_005',
          name: 'French Fries',
          description: 'Crispy golden french fries',
          price: 12000,
          originalPrice: null,
          isVeg: true,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=300&fit=crop',
          categoryId: 'cat_002',
          available: true,
          isFeatured: false,
          preparationTime: 8,
          calories: 450,
          allergens: [],
        },
        {
          id: 'item_006',
          name: 'Chicken Sandwich',
          description: 'Grilled chicken with fresh vegetables',
          price: 20000,
          originalPrice: 22000,
          isVeg: false,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1619860860774-1e5f63a555e4?w=300&h=300&fit=crop',
          categoryId: 'cat_002',
          available: true,
          isFeatured: false,
          preparationTime: 12,
          calories: 420,
          allergens: ['gluten', 'dairy'],
        },
      ],
    },
    {
      id: 'cat_003',
      name: 'Desserts',
      sortOrder: 3,
      items: [
        {
          id: 'item_007',
          name: 'Chocolate Cake',
          description: 'Rich layered chocolate cake',
          price: 25000,
          originalPrice: null,
          isVeg: true,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop',
          categoryId: 'cat_003',
          available: true,
          isFeatured: true,
          preparationTime: 5,
          calories: 520,
          allergens: ['gluten', 'dairy', 'eggs'],
        },
        {
          id: 'item_008',
          name: 'Ice Cream Sundae',
          description: 'Vanilla ice cream with chocolate sauce',
          price: 18000,
          originalPrice: null,
          isVeg: true,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=300&fit=crop',
          categoryId: 'cat_003',
          available: true,
          isFeatured: false,
          preparationTime: 5,
          calories: 380,
          allergens: ['dairy'],
        },
      ],
    },
  ],
  'pizza-palace': [
    {
      id: 'pizza_cat_001',
      name: 'Pizzas',
      sortOrder: 1,
      items: [
        {
          id: 'pizza_001',
          name: 'Margherita',
          description: 'Classic tomato, mozzarella, and basil',
          price: 29900,
          originalPrice: 34900,
          isVeg: true,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=300&fit=crop',
          categoryId: 'pizza_cat_001',
          available: true,
          isFeatured: true,
          preparationTime: 15,
          calories: 800,
          allergens: ['gluten', 'dairy'],
          customizableGroups: [
            {
              id: 'size',
              name: 'Size',
              required: true,
              min: 1,
              max: 1,
              options: [
                { id: 'regular', name: 'Regular (8")', price: 0 },
                { id: 'medium', name: 'Medium (10")', price: 10000 },
                { id: 'large', name: 'Large (12")', price: 18000 },
              ],
            },
            {
              id: 'crust',
              name: 'Crust',
              required: true,
              min: 1,
              max: 1,
              options: [
                { id: 'regular', name: 'Regular', price: 0 },
                { id: 'thin', name: 'Thin Crust', price: 0 },
                { id: 'stuffed', name: 'Stuffed Crust', price: 5000 },
              ],
            },
          ],
        },
        {
          id: 'pizza_002',
          name: 'Peppy Paneer',
          description: 'Spicy paneer with capsicum and onions',
          price: 34900,
          originalPrice: null,
          isVeg: true,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=300&fit=crop',
          categoryId: 'pizza_cat_001',
          available: true,
          isFeatured: true,
          preparationTime: 18,
          calories: 920,
          allergens: ['gluten', 'dairy'],
        },
        {
          id: 'pizza_003',
          name: 'Chicken Tikka',
          description: 'Tandoori chicken with onions and peppers',
          price: 39900,
          originalPrice: 44900,
          isVeg: false,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=300&h=300&fit=crop',
          categoryId: 'pizza_cat_001',
          available: true,
          isFeatured: false,
          preparationTime: 20,
          calories: 1050,
          allergens: ['gluten', 'dairy'],
        },
      ],
    },
    {
      id: 'pizza_cat_002',
      name: 'Sides',
      sortOrder: 2,
      items: [
        {
          id: 'side_001',
          name: 'Garlic Bread',
          description: 'Crispy garlic bread with cheese',
          price: 14900,
          originalPrice: null,
          isVeg: true,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1619531040576-f9416740668d?w=300&h=300&fit=crop',
          categoryId: 'pizza_cat_002',
          available: true,
          isFeatured: false,
          preparationTime: 8,
          calories: 280,
          allergens: ['gluten', 'dairy'],
        },
        {
          id: 'side_002',
          name: 'Chicken Wings',
          description: 'Crispy fried chicken wings',
          price: 19900,
          originalPrice: null,
          isVeg: false,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=300&h=300&fit=crop',
          categoryId: 'pizza_cat_002',
          available: true,
          isFeatured: false,
          preparationTime: 12,
          calories: 450,
          allergens: [],
        },
      ],
    },
    {
      id: 'pizza_cat_003',
      name: 'Beverages',
      sortOrder: 3,
      items: [
        {
          id: 'bev_001',
          name: 'Coke',
          description: '330ml bottle',
          price: 6000,
          originalPrice: null,
          isVeg: true,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300&h=300&fit=crop',
          categoryId: 'pizza_cat_003',
          available: true,
          isFeatured: false,
          preparationTime: 1,
          calories: 140,
          allergens: [],
        },
        {
          id: 'bev_002',
          name: 'Pepsi',
          description: '330ml bottle',
          price: 6000,
          originalPrice: null,
          isVeg: true,
          isAvailable: true,
          spicyLevel: 0,
          image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&h=300&fit=crop',
          categoryId: 'pizza_cat_003',
          available: true,
          isFeatured: false,
          preparationTime: 1,
          calories: 150,
          allergens: [],
        },
      ],
    },
  ],
};

// ─── Mock Promotions ─────────────────────────────────────────────────────────────

export const MOCK_PROMOTIONS: Record<string, Array<{ id: string; title: string; isAvailable: boolean; spicyLevel: number; image: string; description: string }>> = {
  'cafe-blue': [
    {
      id: 'promo_001',
      title: 'Morning Special',
      isAvailable: true,
      spicyLevel: 0,
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop',
      description: 'Get 20% off on all coffees before 11 AM',
    },
    {
      id: 'promo_002',
      title: 'Happy Hours',
      isAvailable: true,
      spicyLevel: 0,
      image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=200&fit=crop',
      description: 'Buy 1 Get 1 Free from 3-6 PM',
    },
  ],
};

// ─── Mock Orders ─────────────────────────────────────────────────────────────

export const MOCK_ORDERS: WebOrder[] = [
  {
    id: 'order_001',
    orderNumber: 'CB-2024-0001',
    storeId: 'store_001',
    storeName: 'Cafe Blue',
    items: [
      {
        id: 'order_item_001',
        menuItemId: 'item_001',
        name: 'Espresso',
        price: 12000,
        quantity: 2,
        customizations: {},
      },
      {
        id: 'order_item_002',
        menuItemId: 'item_004',
        name: 'Veg Sandwich',
        price: 15000,
        quantity: 1,
        customizations: { bread: ['White Bread'] },
      },
    ],
    subtotal: 39000,
    gst: 7020,
    tip: 0,
    donation: 0,
    discount: 0,
    total: 46020,
    customerPhone: null,
    tableNumber: 'T1',
    storeSlug: 'cafe-blue',
    status: 'completed',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'order_002',
    orderNumber: 'CB-2024-0002',
    storeId: 'store_001',
    storeName: 'Cafe Blue',
    items: [
      {
        id: 'order_item_003',
        menuItemId: 'item_002',
        name: 'Cappuccino',
        price: 18000,
        quantity: 1,
        customizations: {},
      },
      {
        id: 'order_item_004',
        menuItemId: 'item_007',
        name: 'Chocolate Cake',
        price: 25000,
        quantity: 1,
        customizations: {},
      },
    ],
    subtotal: 43000,
    gst: 7740,
    tip: 0,
    donation: 0,
    discount: 4300,
    total: 46440,
    customerPhone: null,
    tableNumber: 'T2',
    storeSlug: 'cafe-blue',
    status: 'completed',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

// ─── Mock Cart Functions ─────────────────────────────────────────────────────

export function getMockStoreMenu(storeSlug: string): StoreMenuResponse | null {
  const store = MOCK_STORES[storeSlug];
  const categories = MOCK_MENU[storeSlug] || [];
  const promotions = MOCK_PROMOTIONS[storeSlug] || [];

  if (!store) return null;

  return {
    store,
    categories,
    promotions,
  };
}

export function getMockStore(storeSlug: string): StoreInfo | null {
  return MOCK_STORES[storeSlug] || null;
}

export function getMockOrders(): WebOrder[] {
  return MOCK_ORDERS;
}

export function getMockMenuItem(storeSlug: string, itemId: string): MenuItem | null {
  const categories = MOCK_MENU[storeSlug] || [];
  for (const category of categories) {
    const item = category.items.find((i) => i.id === itemId);
    if (item) return item;
  }
  return null;
}
