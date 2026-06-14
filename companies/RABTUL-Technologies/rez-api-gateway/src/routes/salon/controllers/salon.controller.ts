/**
 * Salon Controller
 *
 * Handles salon-specific operations: get salon details, services, stylists, availability.
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
  SalonService,
  Stylist,
  Availability,
  TimeSlot,
} from './types';
import { salonsStore } from './search.controller';

// Service URL
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:4003';

// In-memory stores for demo
const servicesStore = new Map<string, SalonService[]>();
const stylistsStore = new Map<string, Stylist[]>();
const availabilityStore = new Map<string, Availability[]>();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const salonIdParamSchema = z.object({
  salonId: z.string().min(1, 'Salon ID is required'),
});

const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  serviceId: z.string().optional(),
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
 * Get salon by ID
 * GET /salons/:id
 */
export async function getSalon(req: Request, res: Response): Promise<void> {
  try {
    const { id: salonId } = req.params;

    const validation = salonIdParamSchema.safeParse({ salonId });
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
      return;
    }

    logger.info('[Salon] Get salon', { salonId });

    // Try circuit breaker call first, fall back to demo data
    let salon: Salon;

    try {
      salon = await callCatalogService<Salon>(`/api/salons/${salonId}`);
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
      salon = salonsStore.get(salonId) || generateDemoSalon(salonId);
      salonsStore.set(salonId, salon);
    }

    res.json({
      success: true,
      data: salon,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get salon';
    logger.error('[Salon] Get salon failed', { error: message });
    res.status(500).json({ success: false, message });
  }
}

/**
 * Get salon services
 * GET /salons/:id/services
 */
export async function getSalonServices(req: Request, res: Response): Promise<void> {
  try {
    const { id: salonId } = req.params;
    const { category } = req.query;

    const validation = salonIdParamSchema.safeParse({ salonId });
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
      return;
    }

    logger.info('[Salon] Get services', { salonId, category });

    // Try circuit breaker call first
    let services: SalonService[];

    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category as string);

      services = await callCatalogService<SalonService[]>(
        `/api/salons/${salonId}/services?${params}`
      );
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
      services = servicesStore.get(salonId) || generateDemoServices(salonId);
      servicesStore.set(salonId, services);

      // Filter by category if specified
      if (category) {
        services = services.filter(s => s.category === category);
      }
    }

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get services';
    logger.error('[Salon] Get services failed', { error: message });
    res.status(500).json({ success: false, message });
  }
}

/**
 * Get salon stylists
 * GET /salons/:id/stylists
 */
export async function getSalonStylists(req: Request, res: Response): Promise<void> {
  try {
    const { id: salonId } = req.params;
    const { specialty } = req.query;

    const validation = salonIdParamSchema.safeParse({ salonId });
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
      return;
    }

    logger.info('[Salon] Get stylists', { salonId, specialty });

    // Try circuit breaker call first
    let stylists: Stylist[];

    try {
      const params = new URLSearchParams();
      if (specialty) params.set('specialty', specialty as string);

      stylists = await callCatalogService<Stylist[]>(
        `/api/salons/${salonId}/stylists?${params}`
      );
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
      stylists = stylistsStore.get(salonId) || generateDemoStylists(salonId);
      stylistsStore.set(salonId, stylists);

      // Filter by specialty if specified
      if (specialty) {
        stylists = stylists.filter(s =>
          s.specialties.some(sp => sp.toLowerCase().includes((specialty as string).toLowerCase()))
        );
      }
    }

    res.json({
      success: true,
      data: stylists,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get stylists';
    logger.error('[Salon] Get stylists failed', { error: message });
    res.status(500).json({ success: false, message });
  }
}

/**
 * Get salon availability
 * GET /salons/:id/availability
 */
export async function getSalonAvailability(req: Request, res: Response): Promise<void> {
  try {
    const { id: salonId } = req.params;

    const validation = salonIdParamSchema.safeParse({ salonId });
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
      return;
    }

    const queryValidation = availabilityQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      res.status(400).json({
        success: false,
        message: queryValidation.error.errors[0].message,
      });
      return;
    }

    const { date, serviceId } = queryValidation.data;
    const targetDate = date || new Date().toISOString().split('T')[0];

    logger.info('[Salon] Get availability', { salonId, date: targetDate, serviceId });

    // Try circuit breaker call first
    let availability: Availability[];

    try {
      const params = new URLSearchParams({ date: targetDate });
      if (serviceId) params.set('serviceId', serviceId);

      availability = await callCatalogService<Availability[]>(
        `/api/salons/${salonId}/availability?${params}`
      );
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
      availability = generateDemoAvailability(salonId, targetDate);
    }

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get availability';
    logger.error('[Salon] Get availability failed', { error: message });
    res.status(500).json({ success: false, message });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateDemoSalon(salonId: string): Salon {
  return {
    id: salonId,
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
    services: [],
    stylists: [],
    verified: true,
    isOpen: true,
    priceRange: 2,
    tags: ['hair', 'beauty', 'spa'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  };
}

function generateDemoServices(salonId: string): SalonService[] {
  return [
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
    {
      id: 'SVC003',
      name: 'Classic Facial',
      description: 'Deep cleansing facial treatment',
      category: 'skin',
      duration: 50,
      price: 600,
      isAvailable: true,
      isPackage: false,
    },
    {
      id: 'SVC004',
      name: 'Manicure',
      description: 'Professional nail care',
      category: 'nails',
      duration: 30,
      price: 300,
      isAvailable: true,
      isPackage: false,
    },
    {
      id: 'SVC005',
      name: 'Pedicure',
      description: 'Relaxing foot care treatment',
      category: 'nails',
      duration: 35,
      price: 350,
      isAvailable: true,
      isPackage: false,
    },
    {
      id: 'SVC006',
      name: 'Bridal Package',
      description: 'Complete bridal makeup and hair package',
      category: 'makeup',
      duration: 180,
      price: 5000,
      discountedPrice: 4500,
      isAvailable: true,
      isPackage: true,
      packageItems: ['Hair styling', 'Makeup', 'Mehendi', 'Saree draping'],
    },
  ];
}

function generateDemoStylists(salonId: string): Stylist[] {
  return [
    {
      id: 'STYLIST001',
      name: 'Priya Sharma',
      avatar: 'https://example.com/avatar1.jpg',
      bio: 'Expert hair stylist with 8 years of experience',
      specialties: ['hair', 'coloring', 'styling'],
      rating: 4.8,
      reviewCount: 156,
      yearsOfExperience: 8,
      isAvailable: true,
      availableSlots: generateTimeSlots(),
    },
    {
      id: 'STYLIST002',
      name: 'Rahul Verma',
      avatar: 'https://example.com/avatar2.jpg',
      bio: 'Specializes in modern and trendy hairstyles',
      specialties: ['hair', 'modern', 'trendy'],
      rating: 4.6,
      reviewCount: 98,
      yearsOfExperience: 5,
      isAvailable: true,
      availableSlots: generateTimeSlots(),
    },
    {
      id: 'STYLIST003',
      name: 'Anita Desai',
      avatar: 'https://example.com/avatar3.jpg',
      bio: 'Bridal makeup specialist',
      specialties: ['makeup', 'bridal', 'skincare'],
      rating: 4.9,
      reviewCount: 234,
      yearsOfExperience: 10,
      isAvailable: false,
      availableSlots: [],
    },
  ];
}

function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const times = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  times.forEach(time => {
    slots.push({
      date: new Date().toISOString().split('T')[0],
      time,
      available: Math.random() > 0.3,
    });
  });

  return slots;
}

function generateDemoAvailability(salonId: string, date: string): Availability[] {
  const availability: Availability[] = [];
  const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

  const slots: TimeSlot[] = times.map(time => ({
    date,
    time,
    available: Math.random() > 0.4,
  }));

  availability.push({
    date,
    slots,
    isAvailable: slots.some(s => s.available),
  });

  return availability;
}

export { servicesStore, stylistsStore, availabilityStore };
