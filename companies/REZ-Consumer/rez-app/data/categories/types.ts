/**
 * Category Data Types
 * Central type definitions for category data
 */

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image: string;
  itemCount?: number;
  isActive: boolean;
  items?: CategoryItem[];
  filters?: CategoryFilter[];
  banners?: CategoryBanner[];
  carouselItems?: CategoryCarouselItem[];
}

export interface CategoryItem {
  id: string;
  name: string;
  image: string;
  price: { current: number; original: number; currency: string };
  rating?: { value: number; count: number; maxValue: number };
  timing?: { deliveryTime: string };
  cashback?: { percentage: number };
  metadata?: {
    mealType?: string;
    cuisine?: string;
    isVeg?: boolean;
    tags?: string[];
    description?: string;
  };
  isFeatured?: boolean;
  isPopular?: boolean;
}

export interface CategoryFilter {
  id: string;
  name: string;
  type: 'radio' | 'checkbox' | 'range';
  options: Array<{ label: string; value: string }>;
  defaultValue?: string | string[];
}

export interface CategoryBanner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  action?: { type: string; payload?: unknown };
}

export interface CategoryCarouselItem {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  badge?: string;
  action?: { type: string; payload?: unknown };
}
