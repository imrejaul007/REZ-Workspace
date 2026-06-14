/**
 * REZ Nearby - Types
 */

export interface Place {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  address: string;
  city: string;
  area: string;
  latitude: number;
  longitude: number;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  images?: string[];
  phone?: string;
  website?: string;
  hours?: string;
  distance?: number; // km from user
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  placeCount: number;
}

export interface SearchResult {
  places: Place[];
  total: number;
  page: number;
}
