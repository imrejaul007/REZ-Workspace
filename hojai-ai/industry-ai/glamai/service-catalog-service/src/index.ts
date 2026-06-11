/**
 * Service Catalog Service
 *
 * Beauty salon service catalog management microservice for glamai.
 * Handles service definitions, pricing, duration, categories,
 * and availability for salon businesses.
 *
 * Features:
 * - Service CRUD operations
 * - Category management
 * - Pricing and duration management
 * - Service packages and combos
 * - Staff assignment
 * - Availability scheduling
 *
 * Port: 4622 (aligns with glamai port)
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import winston from 'winston';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Configuration
const PORT = parseInt(process.env.PORT || '4622', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Logger setup
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
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

// Express app setup
const app: Application = express();

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Types
interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  currency: string;
  duration: number; // in minutes
  bufferTime: number; // time between appointments
  gender: 'male' | 'female' | 'unisex';
  tags: string[];
  images?: string[];
  requiresConsultation: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentCategory?: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  services: string[]; // service IDs
  originalPrice: number;
  packagePrice: number;
  validFrom?: string;
  validTo?: string;
  active: boolean;
  createdAt: string;
}

interface StaffService {
  staffId: string;
  serviceId: string;
  customPrice?: number;
  customDuration?: number;
  available: boolean;
}

// In-memory storage (replace with MongoDB/PostgreSQL for production)
const services = new Map<string, Service>();
const categories = new Map<string, Category>();
const packages = new Map<string, ServicePackage>();
const staffServices = new Map<string, StaffService[]>();

// Initialize with sample data
function initializeSampleData() {
  // Sample categories
  const sampleCategories: Category[] = [
    {
      id: 'cat-hair',
      name: 'Hair',
      description: 'Hair cutting, styling, coloring, and treatments',
      icon: 'scissors',
      color: '#FF6B6B',
      sortOrder: 1,
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'cat-skin',
      name: 'Skin Care',
      description: 'Facials, cleanups, and skin treatments',
      icon: 'sparkles',
      color: '#4ECDC4',
      sortOrder: 2,
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'cat-nails',
      name: 'Nails',
      description: 'Manicure, pedicure, and nail art',
      icon: 'hand-sparkles',
      color: '#FFE66D',
      sortOrder: 3,
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'cat-makeup',
      name: 'Makeup',
      description: 'Professional makeup services',
      icon: 'palette',
      color: '#95E1D3',
      sortOrder: 4,
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'cat-body',
      name: 'Body Spa',
      description: 'Massage, body wraps, and spa treatments',
      icon: 'spa',
      color: '#DDA0DD',
      sortOrder: 5,
      active: true,
      createdAt: new Date().toISOString()
    }
  ];

  sampleCategories.forEach(cat => categories.set(cat.id, cat));

  // Sample services
  const sampleServices: Service[] = [
    {
      id: 'svc-haircut-women',
      name: 'Haircut & Styling (Women)',
      description: 'Professional haircut with wash, condition, and styling',
      category: 'cat-hair',
      subcategory: 'Haircut',
      price: 500,
      currency: 'INR',
      duration: 45,
      bufferTime: 10,
      gender: 'female',
      tags: ['haircut', 'styling', 'wash'],
      requiresConsultation: false,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'svc-haircut-men',
      name: 'Haircut (Men)',
      description: 'Quick and precise haircut for men',
      category: 'cat-hair',
      subcategory: 'Haircut',
      price: 250,
      currency: 'INR',
      duration: 30,
      bufferTime: 5,
      gender: 'male',
      tags: ['haircut', 'men'],
      requiresConsultation: false,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'svc-facial',
      name: 'Classic Facial',
      description: 'Deep cleansing facial with massage and mask',
      category: 'cat-skin',
      subcategory: 'Facial',
      price: 800,
      currency: 'INR',
      duration: 60,
      bufferTime: 10,
      gender: 'female',
      tags: ['facial', 'cleaning', 'glow'],
      requiresConsultation: false,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'svc-manicure',
      name: 'Classic Manicure',
      description: 'Nail shaping, cuticle care, and polish',
      category: 'cat-nails',
      subcategory: 'Manicure',
      price: 350,
      currency: 'INR',
      duration: 30,
      bufferTime: 5,
      gender: 'unisex',
      tags: ['nails', 'manicure', 'polish'],
      requiresConsultation: false,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'svc-pedicure',
      name: 'Spa Pedicure',
      description: 'Relaxing foot soak, scrub, massage, and polish',
      category: 'cat-nails',
      subcategory: 'Pedicure',
      price: 500,
      currency: 'INR',
      duration: 45,
      bufferTime: 5,
      gender: 'unisex',
      tags: ['nails', 'pedicure', 'spa'],
      requiresConsultation: false,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'svc-bridal-makeup',
      name: 'Bridal Makeup',
      description: 'Complete bridal makeup with trial session',
      category: 'cat-makeup',
      subcategory: 'Bridal',
      price: 5000,
      currency: 'INR',
      duration: 120,
      bufferTime: 15,
      gender: 'female',
      tags: ['bridal', 'makeup', 'premium'],
      requiresConsultation: true,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'svc-body-massage',
      name: 'Aromatherapy Massage',
      description: 'Full body massage with essential oils',
      category: 'cat-body',
      subcategory: 'Massage',
      price: 1500,
      currency: 'INR',
      duration: 60,
      bufferTime: 10,
      gender: 'unisex',
      tags: ['massage', 'spa', 'relaxation'],
      requiresConsultation: true,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  sampleServices.forEach(svc => services.set(svc.id, svc));

  // Sample package
  const samplePackage: ServicePackage = {
    id: 'pkg-bridal-complete',
    name: 'Complete Bridal Package',
    description: 'Full bridal preparation including hair, makeup, and nails',
    services: ['svc-haircut-women', 'svc-bridal-makeup', 'svc-manicure'],
    originalPrice: 5850,
    packagePrice: 4500,
    active: true,
    createdAt: new Date().toISOString()
  };

  packages.set(samplePackage.id, samplePackage);

  logger.info('Sample data initialized', {
    categories: sampleCategories.length,
    services: sampleServices.length,
    packages: 1
  });
}

// Initialize sample data
initializeSampleData();

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'service-catalog-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', (_req: Request, res: Response) => {
  res.json({ status: 'ready' });
});

// ==================== CATEGORIES ====================

/**
 * Get all categories
 */
app.get('/api/categories', (req: Request, res: Response) => {
  try {
    const { active, parent } = req.query;

    let result = Array.from(categories.values());

    if (active !== undefined) {
      result = result.filter(c => c.active === (active === 'true'));
    }

    if (parent !== undefined) {
      result = result.filter(c => c.parentCategory === parent);
    } else {
      // By default, return only root categories
      result = result.filter(c => !c.parentCategory);
    }

    // Sort by order
    result.sort((a, b) => a.sortOrder - b.sortOrder);

    res.json({
      success: true,
      categories: result,
      count: result.length
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get category by ID
 */
app.get('/api/categories/:id', (req: Request, res: Response) => {
  try {
    const category = categories.get(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      category
    });
  } catch (error) {
    logger.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create a new category
 */
app.post('/api/categories', (req: Request, res: Response) => {
  try {
    const { name, description, icon, color, parentCategory, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const category: Category = {
      id: `cat-${uuidv4().substring(0, 8)}`,
      name,
      description,
      icon,
      color,
      parentCategory,
      sortOrder: sortOrder || 99,
      active: true,
      createdAt: new Date().toISOString()
    };

    categories.set(category.id, category);

    logger.info('Category created', { id: category.id, name });

    res.status(201).json({
      success: true,
      category
    });
  } catch (error) {
    logger.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update a category
 */
app.put('/api/categories/:id', (req: Request, res: Response) => {
  try {
    const category = categories.get(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updatedCategory: Category = {
      ...category,
      ...req.body,
      id: category.id, // Prevent ID change
      createdAt: category.createdAt,
      updatedAt: new Date().toISOString()
    };

    categories.set(req.params.id, updatedCategory);

    logger.info('Category updated', { id: category.id });

    res.json({
      success: true,
      category: updatedCategory
    });
  } catch (error) {
    logger.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete a category
 */
app.delete('/api/categories/:id', (req: Request, res: Response) => {
  try {
    if (!categories.has(req.params.id)) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has services
    const hasServices = Array.from(services.values()).some(
      s => s.category === req.params.id
    );

    if (hasServices) {
      return res.status(400).json({
        error: 'Cannot delete category with associated services'
      });
    }

    categories.delete(req.params.id);

    logger.info('Category deleted', { id: req.params.id });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== SERVICES ====================

/**
 * Get all services
 */
app.get('/api/services', (req: Request, res: Response) => {
  try {
    const { category, gender, active, tags, search } = req.query;

    let result = Array.from(services.values());

    if (category) {
      result = result.filter(s => s.category === category);
    }

    if (gender) {
      result = result.filter(s => s.gender === gender || s.gender === 'unisex');
    }

    if (active !== undefined) {
      result = result.filter(s => s.active === (active === 'true'));
    }

    if (tags) {
      const tagList = (tags as string).split(',');
      result = result.filter(s =>
        tagList.some(tag => s.tags.includes(tag.trim()))
      );
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower) ||
        s.tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    res.json({
      success: true,
      services: result,
      count: result.length
    });
  } catch (error) {
    logger.error('Error fetching services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get service by ID
 */
app.get('/api/services/:id', (req: Request, res: Response) => {
  try {
    const service = services.get(req.params.id);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      success: true,
      service
    });
  } catch (error) {
    logger.error('Error fetching service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create a new service
 */
app.post('/api/services', (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      price,
      currency,
      duration,
      bufferTime,
      gender,
      tags,
      images,
      requiresConsultation
    } = req.body;

    // Validation
    if (!name || !category || price === undefined || !duration) {
      return res.status(400).json({
        error: 'Missing required fields: name, category, price, duration'
      });
    }

    if (!categories.has(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const service: Service = {
      id: `svc-${uuidv4().substring(0, 8)}`,
      name,
      description,
      category,
      subcategory,
      price,
      currency: currency || 'INR',
      duration,
      bufferTime: bufferTime || 5,
      gender: gender || 'unisex',
      tags: tags || [],
      images,
      requiresConsultation: requiresConsultation || false,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    services.set(service.id, service);

    logger.info('Service created', { id: service.id, name, price });

    res.status(201).json({
      success: true,
      service
    });
  } catch (error) {
    logger.error('Error creating service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update a service
 */
app.put('/api/services/:id', (req: Request, res: Response) => {
  try {
    const service = services.get(req.params.id);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Validate category if being changed
    if (req.body.category && !categories.has(req.body.category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const updatedService: Service = {
      ...service,
      ...req.body,
      id: service.id,
      createdAt: service.createdAt,
      updatedAt: new Date().toISOString()
    };

    services.set(req.params.id, updatedService);

    logger.info('Service updated', { id: service.id });

    res.json({
      success: true,
      service: updatedService
    });
  } catch (error) {
    logger.error('Error updating service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete a service
 */
app.delete('/api/services/:id', (req: Request, res: Response) => {
  try {
    if (!services.has(req.params.id)) {
      return res.status(404).json({ error: 'Service not found' });
    }

    services.delete(req.params.id);

    logger.info('Service deleted', { id: req.params.id });

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get services by category with full details
 */
app.get('/api/catalog/:categoryId', (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { gender } = req.query;

    const category = categories.get(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    let categoryServices = Array.from(services.values()).filter(
      s => s.category === categoryId
    );

    if (gender) {
      categoryServices = categoryServices.filter(
        s => s.gender === gender || s.gender === 'unisex'
      );
    }

    res.json({
      success: true,
      category,
      services: categoryServices,
      count: categoryServices.length
    });
  } catch (error) {
    logger.error('Error fetching catalog:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== PACKAGES ====================

/**
 * Get all packages
 */
app.get('/api/packages', (req: Request, res: Response) => {
  try {
    const { active } = req.query;

    let result = Array.from(packages.values());

    if (active !== undefined) {
      result = result.filter(p => p.active === (active === 'true'));
    }

    // Check validity
    const now = new Date();
    result = result.filter(pkg => {
      if (pkg.validFrom && new Date(pkg.validFrom) > now) return false;
      if (pkg.validTo && new Date(pkg.validTo) < now) return false;
      return true;
    });

    res.json({
      success: true,
      packages: result,
      count: result.length
    });
  } catch (error) {
    logger.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get package by ID
 */
app.get('/api/packages/:id', (req: Request, res: Response) => {
  try {
    const pkg = packages.get(req.params.id);

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Get full service details
    const packageServices = pkg.services
      .map(svcId => services.get(svcId))
      .filter(Boolean);

    res.json({
      success: true,
      package: {
        ...pkg,
        serviceDetails: packageServices
      }
    });
  } catch (error) {
    logger.error('Error fetching package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create a new package
 */
app.post('/api/packages', (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      services: serviceIds,
      packagePrice,
      validFrom,
      validTo
    } = req.body;

    if (!name || !serviceIds || serviceIds.length === 0 || !packagePrice) {
      return res.status(400).json({
        error: 'Missing required fields: name, services, packagePrice'
      });
    }

    // Validate all services exist
    const invalidServices = serviceIds.filter(id => !services.has(id));
    if (invalidServices.length > 0) {
      return res.status(400).json({
        error: 'Invalid service IDs',
        invalidServices
      });
    }

    const originalPrice = serviceIds.reduce((sum, id) => {
      const svc = services.get(id);
      return sum + (svc?.price || 0);
    }, 0);

    const pkg: ServicePackage = {
      id: `pkg-${uuidv4().substring(0, 8)}`,
      name,
      description,
      services: serviceIds,
      originalPrice,
      packagePrice,
      validFrom,
      validTo,
      active: true,
      createdAt: new Date().toISOString()
    };

    packages.set(pkg.id, pkg);

    logger.info('Package created', { id: pkg.id, name });

    res.status(201).json({
      success: true,
      package: pkg
    });
  } catch (error) {
    logger.error('Error creating package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update a package
 */
app.put('/api/packages/:id', (req: Request, res: Response) => {
  try {
    const pkg = packages.get(req.params.id);

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const updatedPackage: ServicePackage = {
      ...pkg,
      ...req.body,
      id: pkg.id,
      createdAt: pkg.createdAt
    };

    // Recalculate original price if services changed
    if (req.body.services) {
      updatedPackage.originalPrice = req.body.services.reduce((sum: number, id: string) => {
        const svc = services.get(id);
        return sum + (svc?.price || 0);
      }, 0);
    }

    packages.set(req.params.id, updatedPackage);

    logger.info('Package updated', { id: pkg.id });

    res.json({
      success: true,
      package: updatedPackage
    });
  } catch (error) {
    logger.error('Error updating package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete a package
 */
app.delete('/api/packages/:id', (req: Request, res: Response) => {
  try {
    if (!packages.has(req.params.id)) {
      return res.status(404).json({ error: 'Package not found' });
    }

    packages.delete(req.params.id);

    logger.info('Package deleted', { id: req.params.id });

    res.json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== STAFF SERVICES ====================

/**
 * Assign services to staff
 */
app.post('/api/staff/:staffId/services', (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const { services: serviceAssignments } = req.body;

    if (!serviceAssignments || !Array.isArray(serviceAssignments)) {
      return res.status(400).json({
        error: 'services array is required'
      });
    }

    // Validate all services
    for (const assignment of serviceAssignments) {
      if (!services.has(assignment.serviceId)) {
        return res.status(400).json({
          error: 'Invalid service ID',
          serviceId: assignment.serviceId
        });
      }
    }

    const key = `staff_${staffId}`;
    staffServices.set(key, serviceAssignments);

    logger.info('Staff services assigned', {
      staffId,
      serviceCount: serviceAssignments.length
    });

    res.json({
      success: true,
      staffId,
      services: serviceAssignments
    });
  } catch (error) {
    logger.error('Error assigning staff services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get staff services
 */
app.get('/api/staff/:staffId/services', (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const key = `staff_${staffId}`;
    const staffSvc = staffServices.get(key) || [];

    // Enrich with service details
    const enrichedServices = staffSvc
      .map(ss => {
        const service = services.get(ss.serviceId);
        if (!service) return null;
        return {
          ...ss,
          service
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      staffId,
      services: enrichedServices
    });
  } catch (error) {
    logger.error('Error fetching staff services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== SEARCH ====================

/**
 * Search services
 */
app.get('/api/search', (req: Request, res: Response) => {
  try {
    const { q, category, minPrice, maxPrice, maxDuration, gender } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    const searchLower = (q as string).toLowerCase();
    let results = Array.from(services.values()).filter(s =>
      s.name.toLowerCase().includes(searchLower) ||
      s.description.toLowerCase().includes(searchLower) ||
      s.tags.some(t => t.toLowerCase().includes(searchLower))
    );

    // Apply filters
    if (category) {
      results = results.filter(s => s.category === category);
    }

    if (minPrice) {
      results = results.filter(s => s.price >= Number(minPrice));
    }

    if (maxPrice) {
      results = results.filter(s => s.price <= Number(maxPrice));
    }

    if (maxDuration) {
      results = results.filter(s => s.duration <= Number(maxDuration));
    }

    if (gender) {
      results = results.filter(s =>
        s.gender === gender || s.gender === 'unisex'
      );
    }

    res.json({
      success: true,
      query: q,
      results,
      count: results.length
    });
  } catch (error) {
    logger.error('Error searching services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== STATS ====================

/**
 * Get catalog statistics
 */
app.get('/api/stats', (req: Request, res: Response) => {
  try {
    const allServices = Array.from(services.values());
    const activeServices = allServices.filter(s => s.active);

    const categoryStats = Array.from(categories.values()).map(cat => ({
      category: cat,
      serviceCount: allServices.filter(s => s.category === cat.id).length
    }));

    res.json({
      success: true,
      stats: {
        totalServices: allServices.length,
        activeServices: activeServices.length,
        totalCategories: categories.size,
        activeCategories: Array.from(categories.values()).filter(c => c.active).length,
        totalPackages: packages.size,
        avgServicePrice: activeServices.length > 0
          ? Math.round(activeServices.reduce((sum, s) => sum + s.price, 0) / activeServices.length)
          : 0,
        avgServiceDuration: activeServices.length > 0
          ? Math.round(activeServices.reduce((sum, s) => sum + s.duration, 0) / activeServices.length)
          : 0,
        categoryStats
      }
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : undefined
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`Service Catalog Service running on port ${PORT}`);
  logger.info(`Environment: ${NODE_ENV}`);
});

export default app;
