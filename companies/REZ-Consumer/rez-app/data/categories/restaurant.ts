/**
 * Restaurant Category Data
 * Extracted from categoryData.ts
 */

import { CategoryItem, CategoryFilter, CategoryCarouselItem } from './types';

export const restaurantItems: CategoryItem[] = [
  {
    id: 'rest_001',
    name: 'Crispy Morning Delight',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    price: { current: 200, original: 300, currency: '₹' },
    rating: { value: 8.6, count: 148, maxValue: 10 },
    timing: { deliveryTime: '6 mins' },
    cashback: { percentage: 12 },
    metadata: {
      mealType: 'breakfast',
      cuisine: 'Continental',
      isVeg: false,
      tags: ['crispy', 'morning', 'popular'],
      description: 'Perfectly crispy and delicious morning breakfast'
    },
    isFeatured: true
  },
];

export const restaurantFilters: CategoryFilter[] = [
  { id: 'sort', name: 'Sort By', type: 'radio', options: [
    { label: 'Relevance', value: 'relevance' },
    { label: 'Rating', value: 'rating' },
    { label: 'Delivery Time', value: 'delivery' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
  ]},
  { id: 'cuisine', name: 'Cuisine', type: 'checkbox', options: [
    { label: 'North Indian', value: 'north_indian' },
    { label: 'South Indian', value: 'south_indian' },
    { label: 'Chinese', value: 'chinese' },
    { label: 'Continental', value: 'continental' },
    { label: 'Fast Food', value: 'fast_food' },
  ]},
  { id: 'rating', name: 'Rating', type: 'radio', options: [
    { label: '4+', value: '4' },
    { label: '3+', value: '3' },
  ]},
];

export const restaurantCarouselItems: CategoryCarouselItem[] = [
  {
    id: 'carousel_1',
    title: '50% Off',
    subtitle: 'On your first order',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b',
    badge: 'NEW',
  },
];
