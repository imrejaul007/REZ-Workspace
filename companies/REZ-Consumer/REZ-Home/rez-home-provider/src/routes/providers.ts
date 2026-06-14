import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize router
export const providersRouter = Router();

// Types
export enum ServiceCategory {
  PLUMBER = 'plumber',
  ELECTRICIAN = 'electrician',
  AC_SERVICE = 'ac_service',
  CLEANING = 'cleaning',
  PEST_CONTROL = 'pest_control',
  CARPENTRY = 'carpentry'
}

interface GeoLocation {
  latitude: number;
  longitude: number;
}

interface Document {
  type: string;
  number: string;
  url: string;
  verified: boolean;
}

interface AvailabilitySlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

interface WalletBalance {
  available: number;
  pending: number;
  totalEarned: number;
}

interface Review {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Provider {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  profileImage?: string;
  categories: ServiceCategory[];
  skills: string[];
  experience: number; // years
  rating: number;
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  verified: boolean;
  documents: Document[];
  serviceArea: {
    city: string;
    locations: GeoLocation[];
    maxDistance: number; // km
  };
  availability: AvailabilitySlot[];
  currentLocation?: GeoLocation;
  isOnline: boolean;
  earnings: WalletBalance;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory storage
const providers: Map<string, Provider> = new Map();
const reviews: Map<string, Review[]> = new Map();

// Zod Schemas
const registerProviderSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email().optional(),
  profileImage: z.string().url().optional(),
  categories: z.array(z.nativeEnum(ServiceCategory)).min(1),
  skills: z.array(z.string()).min(1),
  experience: z.number().min(0).max(50),
  serviceArea: z.object({
    city: z.string(),
    locations: z.array(z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    })),
    maxDistance: z.number().min(1).max(100).default(10)
  }),
  documents: z.array(z.object({
    type: z.string(),
    number: z.string(),
    url: z.string().url()
  })).optional()
});

const updateProviderSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  profileImage: z.string().url().optional(),
  categories: z.array(z.nativeEnum(ServiceCategory)).min(1).optional(),
  skills: z.array(z.string()).min(1).optional(),
  serviceArea: z.object({
    city: z.string(),
    locations: z.array(z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    })),
    maxDistance: z.number().min(1).max(100)
  }).optional()
});

const availabilitySchema = z.object({
  slots: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/)
  }))
});

const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(500)
});

// Helper function
const getUserId = (req: Request): string => {
  return req.headers['x-user-id'] as string || '';
};

// POST /providers/register - Register a new provider
providersRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const validationResult = registerProviderSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const data = validationResult.data;

    // Check if provider already exists for this user
    const existingProvider = Array.from(providers.values())
      .find(p => p.userId === data.userId);

    if (existingProvider) {
      res.status(409).json({
        error: 'Provider already registered',
        providerId: existingProvider.id
      });
      return;
    }

    const provider: Provider = {
      id: uuidv4(),
      userId: data.userId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      profileImage: data.profileImage,
      categories: data.categories,
      skills: data.skills,
      experience: data.experience,
      rating: 0,
      totalJobs: 0,
      completedJobs: 0,
      cancelledJobs: 0,
      verified: false,
      documents: data.documents?.map(d => ({ ...d, verified: false })) || [],
      serviceArea: data.serviceArea,
      availability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 6, startTime: '10:00', endTime: '16:00' }
      ],
      isOnline: false,
      earnings: {
        available: 0,
        pending: 0,
        totalEarned: 0
      },
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    providers.set(provider.id, provider);
    reviews.set(provider.id, []);

    logger.info({
      message: 'Provider registered',
      providerId: provider.id,
      userId: data.userId
    });

    res.status(201).json({
      success: true,
      data: provider
    });
  } catch (error: any) {
    logger.error({ message: 'Error registering provider', error: error.message });
    res.status(500).json({ error: 'Failed to register provider' });
  }
});

// GET /providers/:id - Get provider profile
providersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const providerId = req.params.id;
    const provider = providers.get(providerId);

    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    // Get provider reviews
    const providerReviews = reviews.get(providerId) || [];

    res.json({
      success: true,
      data: {
        ...provider,
        recentReviews: providerReviews.slice(-5).reverse()
      }
    });
  } catch (error: any) {
    logger.error({ message: 'Error fetching provider', error: error.message });
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

// PATCH /providers/:id - Update provider profile
providersRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const providerId = req.params.id;

    const provider = providers.get(providerId);

    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    // Check ownership
    if (provider.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const validationResult = updateProviderSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const updates = validationResult.data;
    Object.assign(provider, updates, { updatedAt: new Date().toISOString() });
    providers.set(providerId, provider);

    logger.info({
      message: 'Provider profile updated',
      providerId,
      updates
    });

    res.json({
      success: true,
      data: provider
    });
  } catch (error: any) {
    logger.error({ message: 'Error updating provider', error: error.message });
    res.status(500).json({ error: 'Failed to update provider' });
  }
});

// GET /providers/:id/availability - Get provider availability
providersRouter.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const providerId = req.params.id;
    const provider = providers.get(providerId);

    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        providerId: provider.id,
        isOnline: provider.isOnline,
        currentLocation: provider.currentLocation,
        availability: provider.availability
      }
    });
  } catch (error: any) {
    logger.error({ message: 'Error fetching availability', error: error.message });
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// POST /providers/:id/availability - Set provider availability
providersRouter.post('/:id/availability', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const providerId = req.params.id;

    const provider = providers.get(providerId);

    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    // Check ownership
    if (provider.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const validationResult = availabilitySchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    provider.availability = validationResult.data.slots;
    provider.updatedAt = new Date().toISOString();
    providers.set(providerId, provider);

    logger.info({
      message: 'Provider availability updated',
      providerId
    });

    res.json({
      success: true,
      data: provider.availability
    });
  } catch (error: any) {
    logger.error({ message: 'Error updating availability', error: error.message });
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// GET /providers/:id/earnings - Get provider earnings
providersRouter.get('/:id/earnings', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const providerId = req.params.id;

    const provider = providers.get(providerId);

    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    // Check ownership
    if (provider.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Mock earnings history
    const earningsHistory = [
      { date: '2026-06-01', amount: 2500, jobs: 5 },
      { date: '2026-06-02', amount: 1800, jobs: 3 },
      { date: '2026-06-03', amount: 3200, jobs: 6 },
      { date: '2026-06-04', amount: 1500, jobs: 2 }
    ];

    res.json({
      success: true,
      data: {
        wallet: provider.earnings,
        history: earningsHistory,
        stats: {
          totalJobs: provider.totalJobs,
          completedJobs: provider.completedJobs,
          cancelledJobs: provider.cancelledJobs,
          averagePerJob: provider.completedJobs > 0
            ? Math.round(provider.earnings.totalEarned / provider.completedJobs)
            : 0
        }
      }
    });
  } catch (error: any) {
    logger.error({ message: 'Error fetching earnings', error: error.message });
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

// GET /providers/:id/reviews - Get provider reviews
providersRouter.get('/:id/reviews', async (req: Request, res: Response) => {
  try {
    const providerId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const provider = providers.get(providerId);

    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    const providerReviews = reviews.get(providerId) || [];
    const paginatedReviews = providerReviews.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedReviews,
      pagination: {
        total: providerReviews.length,
        limit,
        offset,
        hasMore: offset + limit < providerReviews.length
      },
      summary: {
        averageRating: provider.rating,
        totalReviews: providerReviews.length
      }
    });
  } catch (error: any) {
    logger.error({ message: 'Error fetching reviews', error: error.message });
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /providers/:id/reviews - Add a review
providersRouter.post('/:id/reviews', async (req: Request, res: Response) => {
  try {
    const providerId = req.params.id;
    const provider = providers.get(providerId);

    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    const validationResult = reviewSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const data = validationResult.data;

    const review: Review = {
      id: uuidv4(),
      bookingId: data.bookingId,
      userId: data.userId,
      userName: data.userName,
      rating: data.rating,
      comment: data.comment,
      createdAt: new Date().toISOString()
    };

    const providerReviews = reviews.get(providerId) || [];
    providerReviews.push(review);
    reviews.set(providerId, providerReviews);

    // Update provider rating
    const totalRating = providerReviews.reduce((sum, r) => sum + r.rating, 0);
    provider.rating = Math.round((totalRating / providerReviews.length) * 10) / 10;
    providers.set(providerId, provider);

    logger.info({
      message: 'Review added',
      providerId,
      rating: data.rating
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error: any) {
    logger.error({ message: 'Error adding review', error: error.message });
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// GET /providers/nearby - Find nearby providers
providersRouter.get('/nearby', async (req: Request, res: Response) => {
  try {
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const category = req.query.category as ServiceCategory | undefined;
    const maxDistance = parseFloat(req.query.maxDistance as string) || 10;
    const limit = parseInt(req.query.limit as string) || 10;

    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({ error: 'Valid latitude and longitude required' });
      return;
    }

    // Calculate distance between two points (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    let nearbyProviders = Array.from(providers.values())
      .filter(p => p.verified && p.isOnline);

    // Filter by category
    if (category) {
      nearbyProviders = nearbyProviders.filter(p => p.categories.includes(category));
    }

    // Calculate distances and filter
    nearbyProviders = nearbyProviders
      .map(p => {
        const distance = p.currentLocation
          ? calculateDistance(latitude, longitude, p.currentLocation.latitude, p.currentLocation.longitude)
          : 0;
        return { provider: p, distance };
      })
      .filter(p => p.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map(p => ({
        ...p.provider,
        distance: Math.round(p.distance * 10) / 10
      }));

    res.json({
      success: true,
      data: nearbyProviders,
      search: {
        latitude,
        longitude,
        category: category || 'all',
        maxDistance
      }
    });
  } catch (error: any) {
    logger.error({ message: 'Error finding nearby providers', error: error.message });
    res.status(500).json({ error: 'Failed to find nearby providers' });
  }
});
