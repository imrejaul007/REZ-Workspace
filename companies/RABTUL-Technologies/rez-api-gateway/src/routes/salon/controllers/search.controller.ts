/**
 * Search Controller
 *
 * Handles salon search functionality with filtering, sorting, and pagination.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../../config/logger';
import {
  circuitBreaker,
  CircuitOpenError,
} from '../../utils/circuitBreaker';
import {
  Salon,
  SearchFilters,
  SearchResult,
} from './types';

// Service URL
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:4003';

// In-memory store for demo
const salonsStore = new Map<string, Salon>();
const searchResultsCache = new Map<string, SearchResult>();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const searchQuerySchema = z.object({
  query: z.string().optional(),
  latitude: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  longitude: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  radius: z.string().optional().transform(val => val ? parseFloat(val) : 10),
  category: z.string().optional(),
  minRating: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  amenities: z.string().optional().transform(val => val ? val.split(',') : undefined),
  sortBy: z.enum(['distance', 'rating', 'price_low', 'price_high', 'popular']).optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
});

// ============================================
// CATALOG SERVICE CALL
// ============================================

async function callCatalogService<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<T> {
  return circuitBreaker(
    'catalog-service',
    async () => {
      const response = await fetch(`${CATALOG_SERVICE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Catalog service error: ${response.status}`);
      }

      return response.json() as Promise<T>;
    }
  );
}

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

/**
 * Search salons with filters
 * GET /salons/search
 */
export async function searchSalons(req: Request, res: Response): Promise<void> {
  try {
    const validation = searchQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
      return;
    }

    const {
      query,
      latitude,
      longitude,
      radius,
      category,
      minRating,
      maxPrice,
      amenities,
      sortBy = 'rating',
      page = 1,
      limit = 20,
    } = validation.data;

    logger.info('[Salon] Search salons', {
      query,
      location: latitude && longitude ? { lat: latitude, lng: longitude } : undefined,
      category,
      sortBy,
      page,
      limit,
    });

    // Try circuit breaker call first, fall back to demo data
    let result: SearchResult;

    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (category) params.set('category', category);
      if (minRating) params.set('minRating', String(minRating));
      if (maxPrice) params.set('maxPrice', String(maxPrice));
      if (sortBy) params.set('sortBy', sortBy);
      params.set('page', String(page));
      params.set('limit', String(limit));

      result = await callCatalogService<SearchResult>(`/api/salons/search?${params}`);
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
        res.status(503).json({
          success: false,
          error: 'Catalog service temporarily unavailable',
          circuitState: error.circuitState,
          retryAfterMs: error.retryAfter,
        });
        return;
      }

      // Fallback to demo data
      result = generateDemoSearchResults(page, limit, sortBy);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    logger.error('[Salon] Search failed', { error: message });
    res.status(500).json({ success: false, message });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateDemoSearchResults(page: number, limit: number, sortBy: string): SearchResult {
  const demoSalons: Salon[] = [
    {
      id: 'SALON001',
      name: 'Glamour Studio',
      slug: 'glamour-studio',
      description: 'Premium hair and beauty salon offering expert styling services',
      address: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      },
      contact: {
        phone: '+91 9876543210',
        email: 'info@glamourstudio.com',
      },
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760],
      },
      rating: 4.5,
      reviewCount: 234,
      images: ['https://example.com/salon1.jpg'],
      amenities: ['wifi', 'parking', 'ac', 'wheelchair'],
      openingHours: {
        monday: { open: '09:00', close: '20:00', isClosed: false },
        tuesday: { open: '09:00', close: '20:00', isClosed: false },
        wednesday: { open: '09:00', close: '20:00', isClosed: false },
        thursday: { open: '09:00', close: '20:00', isClosed: false },
        friday: { open: '09:00', close: '21:00', isClosed: false },
        saturday: { open: '10:00', close: '21:00', isClosed: false },
        sunday: { open: '10:00', close: '18:00', isClosed: false },
      },
      services: [
        {
          id: 'SVC001',
          name: 'Haircut & Styling',
          description: 'Professional haircut with styling',
          category: 'hair',
          duration: 45,
          price: 500,
          isAvailable: true,
          isPackage: false,
        },
        {
          id: 'SVC002',
          name: 'Hair Spa',
          description: 'Relaxing hair spa treatment',
          category: 'hair',
          duration: 60,
          price: 800,
          discountedPrice: 650,
          isAvailable: true,
          isPackage: false,
        },
      ],
      stylists: [],
      verified: true,
      isOpen: true,
      priceRange: 2,
      tags: ['hair', 'beauty', 'spa'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    },
    {
      id: 'SALON002',
      name: 'Style Lounge',
      slug: 'style-lounge',
      description: 'Modern salon with latest trends and techniques',
      address: {
        street: '456 Fashion Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400002',
        country: 'India',
      },
      contact: {
        phone: '+91 9876543211',
        email: 'contact@stylelounge.com',
      },
      location: {
        type: 'Point',
        coordinates: [72.8850, 19.0800],
      },
      rating: 4.8,
      reviewCount: 567,
      images: ['https://example.com/salon2.jpg'],
      amenities: ['wifi', 'parking', 'ac', 'coffee'],
      openingHours: {
        monday: { open: '10:00', close: '19:00', isClosed: false },
        tuesday: { open: '10:00', close: '19:00', isClosed: false },
        wednesday: { open: '10:00', close: '19:00', isClosed: false },
        thursday: { open: '10:00', close: '19:00', isClosed: false },
        friday: { open: '10:00', close: '20:00', isClosed: false },
        saturday: { open: '09:00', close: '20:00', isClosed: false },
        sunday: { open: '09:00', close: '17:00', isClosed: false },
      },
      services: [],
      stylists: [],
      verified: true,
      isOpen: true,
      priceRange: 3,
      tags: ['trending', 'modern', 'trendy'],
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-20T00:00:00Z',
    },
    {
      id: 'SALON003',
      name: 'Natural Beauty',
      slug: 'natural-beauty',
      description: 'Organic and natural beauty treatments',
      address: {
        street: '789 Green Avenue',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400003',
        country: 'India',
      },
      contact: {
        phone: '+91 9876543212',
        email: 'hello@naturalbeauty.com',
      },
      location: {
        type: 'Point',
        coordinates: [72.8700, 19.0700],
      },
      rating: 4.2,
      reviewCount: 123,
      images: ['https://example.com/salon3.jpg'],
      amenities: ['ac', 'organic', 'vegan'],
      openingHours: {
        monday: { open: '09:00', close: '18:00', isClosed: false },
        tuesday: { open: '09:00', close: '18:00', isClosed: false },
        wednesday: { open: '09:00', close: '18:00', isClosed: false },
        thursday: { open: '09:00', close: '18:00', isClosed: false },
        friday: { open: '09:00', close: '19:00', isClosed: false },
        saturday: { open: '10:00', close: '19:00', isClosed: false },
        sunday: { open: '10:00', close: '16:00', isClosed: false },
      },
      services: [],
      stylists: [],
      verified: true,
      isOpen: false,
      priceRange: 2,
      tags: ['organic', 'natural', 'vegan'],
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-25T00:00:00Z',
    },
  ];

  // Sort based on criteria
  let sortedSalons = [...demoSalons];
  switch (sortBy) {
    case 'rating':
      sortedSalons.sort((a, b) => b.rating - a.rating);
      break;
    case 'price_low':
      sortedSalons.sort((a, b) => a.priceRange - b.priceRange);
      break;
    case 'price_high':
      sortedSalons.sort((a, b) => b.priceRange - a.priceRange);
      break;
    case 'popular':
      sortedSalons.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const paginatedSalons = sortedSalons.slice(startIndex, startIndex + limit);

  // Store for later access
  paginatedSalons.forEach(salon => salonsStore.set(salon.id, salon));

  return {
    salons: paginatedSalons,
    total: demoSalons.length,
    page,
    limit,
    hasMore: startIndex + limit < demoSalons.length,
  };
}

export { salonsStore };
