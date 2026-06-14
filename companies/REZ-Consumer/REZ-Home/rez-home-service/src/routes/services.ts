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
export const servicesRouter = Router();

// Types
export enum ServiceCategory {
  PLUMBER = 'plumber',
  ELECTRICIAN = 'electrician',
  AC_SERVICE = 'ac_service',
  CLEANING = 'cleaning',
  PEST_CONTROL = 'pest_control',
  CARPENTRY = 'carpentry'
}

interface PricingTier {
  name: string;
  price: number;
  description: string;
}

interface Service {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  shortDescription: string;
  imageUrl?: string;
  basePrice: number;
  pricingTiers: PricingTier[];
  duration: number; // in minutes
  rating: number;
  totalBookings: number;
  isEmergencyAvailable: boolean;
  includesWarranty: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: ServiceCategory;
  name: string;
  description: string;
  icon: string;
  imageUrl?: string;
  serviceCount: number;
}

// Mock data - Service catalog
const services: Map<string, Service> = new Map();
const categories: Map<ServiceCategory, Category> = new Map();

// Initialize mock data
const initializeMockData = () => {
  // Categories
  const categoryData: Category[] = [
    {
      id: ServiceCategory.PLUMBER,
      name: 'Plumber',
      description: 'Expert plumbing services for repairs, installation, and maintenance',
      icon: '🔧',
      serviceCount: 12
    },
    {
      id: ServiceCategory.ELECTRICIAN,
      name: 'Electrician',
      description: 'Licensed electrical services for home and office',
      icon: '⚡',
      serviceCount: 15
    },
    {
      id: ServiceCategory.AC_SERVICE,
      name: 'AC Service',
      description: 'AC installation, repair, and maintenance services',
      icon: '❄️',
      serviceCount: 10
    },
    {
      id: ServiceCategory.CLEANING,
      name: 'Cleaning',
      description: 'Professional home and office cleaning services',
      icon: '🧹',
      serviceCount: 8
    },
    {
      id: ServiceCategory.PEST_CONTROL,
      name: 'Pest Control',
      description: 'Effective pest elimination and prevention services',
      icon: '🐜',
      serviceCount: 7
    },
    {
      id: ServiceCategory.CARPENTRY,
      name: 'Carpentry',
      description: 'Skilled carpentry for furniture, doors, and woodwork',
      icon: '🪚',
      serviceCount: 9
    }
  ];

  categoryData.forEach(cat => categories.set(cat.id, cat));

  // Services
  const serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>[] = [
    // Plumber services
    {
      category: ServiceCategory.PLUMBER,
      name: 'Pipe Repair',
      description: 'Fix leaking or damaged pipes with professional materials',
      shortDescription: 'Quick pipe repair service',
      basePrice: 350,
      pricingTiers: [
        { name: 'Basic', price: 350, description: 'Minor pipe repair' },
        { name: 'Standard', price: 600, description: 'Medium complexity repair' },
        { name: 'Premium', price: 1200, description: 'Major pipe replacement' }
      ],
      duration: 60,
      rating: 4.7,
      totalBookings: 2340,
      isEmergencyAvailable: true,
      includesWarranty: true,
      tags: ['pipe', 'repair', 'leak', 'water']
    },
    {
      category: ServiceCategory.PLUMBER,
      name: 'Drain Cleaning',
      description: 'Professional drain unblocking and cleaning service',
      shortDescription: 'Clear blocked drains',
      basePrice: 400,
      pricingTiers: [
        { name: 'Basic', price: 400, description: 'Single drain cleaning' },
        { name: 'Standard', price: 700, description: 'Multiple drain cleaning' },
        { name: 'Premium', price: 1100, description: 'Full system cleaning' }
      ],
      duration: 45,
      rating: 4.5,
      totalBookings: 1890,
      isEmergencyAvailable: true,
      includesWarranty: true,
      tags: ['drain', 'clog', 'unblock', 'cleaning']
    },
    // Electrician services
    {
      category: ServiceCategory.ELECTRICIAN,
      name: 'Wiring Service',
      description: 'Complete house wiring including new installations',
      shortDescription: 'Professional wiring installation',
      basePrice: 500,
      pricingTiers: [
        { name: 'Basic', price: 500, description: 'Minor wiring fix' },
        { name: 'Standard', price: 1500, description: 'Room wiring' },
        { name: 'Premium', price: 5000, description: 'Full house wiring' }
      ],
      duration: 180,
      rating: 4.8,
      totalBookings: 1560,
      isEmergencyAvailable: false,
      includesWarranty: true,
      tags: ['wiring', 'electrical', 'installation']
    },
    {
      category: ServiceCategory.ELECTRICIAN,
      name: 'Switch & Socket Repair',
      description: 'Fix faulty switches and power sockets',
      shortDescription: 'Repair switches and sockets',
      basePrice: 200,
      pricingTiers: [
        { name: 'Basic', price: 200, description: 'Single switch repair' },
        { name: 'Standard', price: 450, description: 'Up to 3 switches' },
        { name: 'Premium', price: 800, description: 'Up to 6 switches' }
      ],
      duration: 30,
      rating: 4.6,
      totalBookings: 3200,
      isEmergencyAvailable: true,
      includesWarranty: true,
      tags: ['switch', 'socket', 'repair', 'power']
    },
    // AC Service
    {
      category: ServiceCategory.AC_SERVICE,
      name: 'AC Installation',
      description: 'Professional split and window AC installation',
      shortDescription: 'Install new AC units',
      basePrice: 800,
      pricingTiers: [
        { name: 'Basic', price: 800, description: 'Window AC' },
        { name: 'Standard', price: 1200, description: 'Split AC' },
        { name: 'Premium', price: 2000, description: 'Inverter AC' }
      ],
      duration: 120,
      rating: 4.9,
      totalBookings: 890,
      isEmergencyAvailable: false,
      includesWarranty: true,
      tags: ['ac', 'installation', 'cooling']
    },
    {
      category: ServiceCategory.AC_SERVICE,
      name: 'AC Gas Refilling',
      description: 'Refill refrigerant gas for optimal cooling',
      shortDescription: 'AC gas refill service',
      basePrice: 1500,
      pricingTiers: [
        { name: 'Basic', price: 1500, description: 'R22 gas' },
        { name: 'Standard', price: 2000, description: 'R410 gas' },
        { name: 'Premium', price: 3500, description: 'Full gas change' }
      ],
      duration: 45,
      rating: 4.4,
      totalBookings: 2100,
      isEmergencyAvailable: true,
      includesWarranty: true,
      tags: ['ac', 'gas', 'refill', 'cooling']
    },
    // Cleaning
    {
      category: ServiceCategory.CLEANING,
      name: 'Home Deep Cleaning',
      description: 'Thorough deep cleaning for entire home',
      shortDescription: 'Complete home deep clean',
      basePrice: 2500,
      pricingTiers: [
        { name: '1BHK', price: 2500, description: '1 bedroom home' },
        { name: '2BHK', price: 4000, description: '2 bedroom home' },
        { name: '3BHK', price: 5500, description: '3 bedroom home' }
      ],
      duration: 240,
      rating: 4.8,
      totalBookings: 4500,
      isEmergencyAvailable: false,
      includesWarranty: false,
      tags: ['cleaning', 'deep', 'home', 'house']
    },
    {
      category: ServiceCategory.CLEANING,
      name: 'Sofa Cleaning',
      description: 'Professional sofa cleaning with stain removal',
      shortDescription: 'Clean and sanitize sofa',
      basePrice: 800,
      pricingTiers: [
        { name: 'Basic', price: 800, description: '3-seater sofa' },
        { name: 'Standard', price: 1200, description: '5-seater sofa' },
        { name: 'Premium', price: 1800, description: 'L-shape sofa' }
      ],
      duration: 90,
      rating: 4.6,
      totalBookings: 2800,
      isEmergencyAvailable: false,
      includesWarranty: false,
      tags: ['sofa', 'cleaning', 'furniture', 'stain']
    },
    // Pest Control
    {
      category: ServiceCategory.PEST_CONTROL,
      name: 'General Pest Control',
      description: 'Comprehensive pest elimination treatment',
      shortDescription: 'Remove all common pests',
      basePrice: 1200,
      pricingTiers: [
        { name: '1BHK', price: 1200, description: '1 bedroom home' },
        { name: '2BHK', price: 1800, description: '2 bedroom home' },
        { name: '3BHK', price: 2500, description: '3 bedroom home' }
      ],
      duration: 120,
      rating: 4.5,
      totalBookings: 3200,
      isEmergencyAvailable: true,
      includesWarranty: true,
      tags: ['pest', 'control', 'spray', 'elimination']
    },
    {
      category: ServiceCategory.PEST_CONTROL,
      name: 'Termite Control',
      description: 'Professional termite treatment and prevention',
      shortDescription: 'Termite elimination service',
      basePrice: 3000,
      pricingTiers: [
        { name: 'Basic', price: 3000, description: 'Spot treatment' },
        { name: 'Standard', price: 6000, description: 'Room treatment' },
        { name: 'Premium', price: 12000, description: 'Full house treatment' }
      ],
      duration: 180,
      rating: 4.7,
      totalBookings: 1200,
      isEmergencyAvailable: false,
      includesWarranty: true,
      tags: ['termite', 'pest', 'wood', 'control']
    },
    // Carpentry
    {
      category: ServiceCategory.CARPENTRY,
      name: 'Furniture Repair',
      description: 'Expert repair for all types of furniture',
      shortDescription: 'Fix damaged furniture',
      basePrice: 400,
      pricingTiers: [
        { name: 'Basic', price: 400, description: 'Minor repair' },
        { name: 'Standard', price: 800, description: 'Medium repair' },
        { name: 'Premium', price: 1500, description: 'Major repair' }
      ],
      duration: 60,
      rating: 4.6,
      totalBookings: 1650,
      isEmergencyAvailable: false,
      includesWarranty: true,
      tags: ['furniture', 'repair', 'wood', 'fix']
    },
    {
      category: ServiceCategory.CARPENTRY,
      name: 'Door/Window Repair',
      description: 'Fix and replace doors and windows',
      shortDescription: 'Repair doors and windows',
      basePrice: 300,
      pricingTiers: [
        { name: 'Basic', price: 300, description: 'Door adjustment' },
        { name: 'Standard', price: 600, description: 'Lock replacement' },
        { name: 'Premium', price: 1200, description: 'Full door repair' }
      ],
      duration: 45,
      rating: 4.4,
      totalBookings: 1980,
      isEmergencyAvailable: true,
      includesWarranty: true,
      tags: ['door', 'window', 'repair', 'lock']
    }
  ];

  const now = new Date().toISOString();
  serviceData.forEach(service => {
    const id = uuidv4();
    services.set(id, {
      ...service,
      id,
      createdAt: now,
      updatedAt: now
    });
  });
};

initializeMockData();

// Schemas
const estimateSchema = z.object({
  serviceId: z.string().uuid(),
  category: z.nativeEnum(ServiceCategory).optional(),
  address: z.object({
    city: z.string(),
    pincode: z.string().length(6)
  }).optional()
});

// GET /services - List all services
servicesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as ServiceCategory | undefined;
    const minPrice = parseInt(req.query.minPrice as string) || undefined;
    const maxPrice = parseInt(req.query.maxPrice as string) || undefined;
    const emergency = req.query.emergency === 'true';
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    let filteredServices = Array.from(services.values());

    if (category) {
      filteredServices = filteredServices.filter(s => s.category === category);
    }

    if (emergency) {
      filteredServices = filteredServices.filter(s => s.isEmergencyAvailable);
    }

    if (minPrice !== undefined) {
      filteredServices = filteredServices.filter(s => s.basePrice >= minPrice);
    }

    if (maxPrice !== undefined) {
      filteredServices = filteredServices.filter(s => s.basePrice <= maxPrice);
    }

    // Sort by rating
    filteredServices.sort((a, b) => b.rating - a.rating);

    const total = filteredServices.length;
    const paginatedServices = filteredServices.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedServices,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error: any) {
    logger.error({ message: 'Error fetching services', error: error.message });
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// GET /services/:id - Get service details
servicesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.id;

    const service = services.get(serviceId);

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error: any) {
    logger.error({ message: 'Error fetching service', error: error.message });
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// GET /services/categories - List all categories
servicesRouter.get('/categories', async (req: Request, res: Response) => {
  try {
    const allCategories = Array.from(categories.values());

    res.json({
      success: true,
      data: allCategories
    });
  } catch (error: any) {
    logger.error({ message: 'Error fetching categories', error: error.message });
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /services/categories/:id - Get category details
servicesRouter.get('/categories/:id', async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.id as ServiceCategory;

    const category = categories.get(categoryId);

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Get services in this category
    const categoryServices = Array.from(services.values())
      .filter(s => s.category === categoryId);

    res.json({
      success: true,
      data: {
        ...category,
        services: categoryServices
      }
    });
  } catch (error: any) {
    logger.error({ message: 'Error fetching category', error: error.message });
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// GET /services/search - Search services
servicesRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || '').toLowerCase();
    const category = req.query.category as ServiceCategory | undefined;

    if (!query) {
      res.status(400).json({ error: 'Search query required' });
      return;
    }

    let searchResults = Array.from(services.values());

    // Filter by query
    searchResults = searchResults.filter(service =>
      service.name.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query) ||
      service.tags.some(tag => tag.toLowerCase().includes(query))
    );

    // Filter by category if provided
    if (category) {
      searchResults = searchResults.filter(s => s.category === category);
    }

    // Sort by relevance (simple: exact match first, then by rating)
    searchResults.sort((a, b) => {
      const aExact = a.name.toLowerCase().includes(query) ? 1 : 0;
      const bExact = b.name.toLowerCase().includes(query) ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      return b.rating - a.rating;
    });

    res.json({
      success: true,
      data: searchResults,
      query
    });
  } catch (error: any) {
    logger.error({ message: 'Error searching services', error: error.message });
    res.status(500).json({ error: 'Failed to search services' });
  }
});

// GET /services/:id/pricing - Get service pricing
servicesRouter.get('/:id/pricing', async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.id;

    const service = services.get(serviceId);

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        serviceId: service.id,
        serviceName: service.name,
        basePrice: service.basePrice,
        pricingTiers: service.pricingTiers,
        includesWarranty: service.includesWarranty
      }
    });
  } catch (error: any) {
    logger.error({ message: 'Error fetching pricing', error: error.message });
    res.status(500).json({ error: 'Failed to fetch pricing' });
  }
});

// POST /services/estimate - Get price estimation
servicesRouter.post('/estimate', async (req: Request, res: Response) => {
  try {
    const validationResult = estimateSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const { serviceId, category, address } = validationResult.data;

    let service: Service | undefined;
    let matchedServices: Service[] = [];

    if (serviceId) {
      service = services.get(serviceId);
      if (!service) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }
      matchedServices = [service];
    } else if (category) {
      matchedServices = Array.from(services.values())
        .filter(s => s.category === category);
    }

    // Calculate estimates
    const estimates = matchedServices.map(svc => {
      // Mock price modifiers
      let priceModifier = 1;
      if (address?.city === 'Mumbai' || address?.city === 'Delhi') {
        priceModifier = 1.1; // 10% higher in metros
      }
      if (address?.pincode?.startsWith('11') || address?.pincode?.startsWith('40')) {
        priceModifier *= 1.05; // 5% higher in certain areas
      }

      const estimatedPrice = Math.round(svc.basePrice * priceModifier);
      const serviceCharge = Math.round(estimatedPrice * 0.05);
      const tax = Math.round((estimatedPrice + serviceCharge) * 0.18);
      const total = estimatedPrice + serviceCharge + tax;

      return {
        serviceId: svc.id,
        serviceName: svc.name,
        category: svc.category,
        estimatedPrice,
        priceBreakdown: {
          basePrice: estimatedPrice,
          serviceCharge,
          tax,
          total
        },
        duration: svc.duration,
        isEmergencyAvailable: svc.isEmergencyAvailable,
        emergencySurcharge: svc.isEmergencyAvailable ? Math.round(estimatedPrice * 0.5) : 0
      };
    });

    res.json({
      success: true,
      data: estimates,
      location: address || null
    });
  } catch (error: any) {
    logger.error({ message: 'Error generating estimate', error: error.message });
    res.status(500).json({ error: 'Failed to generate estimate' });
  }
});
