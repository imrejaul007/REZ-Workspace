import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  Product,
  ProductCategory,
  ProductSchema,
  SearchParams,
  createProduct,
  calculateDiscountedPrice
} from '../models/Product';
import winston from 'winston';

const router = Router();

// Logger for this module
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// In-memory product storage (replace with database in production)
let products: Product[] = [];

// Initialize with sample products
const initializeSampleProducts = (): void => {
  if (products.length > 0) return;

  const sampleProducts: z.infer<typeof ProductSchema>[] = [
    {
      name: 'Organic Brown Rice 5kg',
      description: 'Premium quality organic brown rice, perfect for healthy meals',
      category: ProductCategory.GROCERIES,
      subcategory: 'rice',
      brand: 'Farm Fresh',
      sku: 'GR-RICE-001',
      unit: 'kg',
      unitValue: 5,
      price: 450,
      mrp: 500,
      discount: 10,
      images: ['https://example.com/rice.jpg'],
      thumbnail: 'https://example.com/rice-thumb.jpg',
      stock: 100,
      isOrganic: true,
      tags: ['organic', 'rice', 'healthy'],
      sellerId: 'seller-001',
      sellerName: 'Farm Fresh Foods'
    },
    {
      name: 'Fresh Whole Milk 1L',
      description: 'Farm fresh whole milk, rich in calcium and vitamins',
      category: ProductCategory.DAIRY,
      subcategory: 'milk',
      brand: 'Pure Dairy',
      sku: 'DY-MILK-001',
      unit: 'liter',
      unitValue: 1,
      price: 60,
      mrp: 65,
      stock: 200,
      isVeg: true,
      tags: ['milk', 'dairy', 'fresh'],
      sellerId: 'seller-002',
      sellerName: 'Pure Dairy Co.'
    },
    {
      name: 'Organic Bananas (Dozen)',
      description: 'Fresh organic bananas, naturally ripened',
      category: ProductCategory.FRESH_PRODUCE,
      subcategory: 'fruits',
      brand: 'Nature Best',
      sku: 'FP-BANA-001',
      unit: 'dozen',
      unitValue: 1,
      price: 80,
      stock: 150,
      isOrganic: true,
      isVeg: true,
      nutritionalInfo: {
        calories: 90,
        protein: 1.3,
        carbs: 23,
        fat: 0.3,
        fiber: 2.6
      },
      tags: ['organic', 'fruits', 'banana'],
      sellerId: 'seller-003'
    },
    {
      name: 'Whole Wheat Bread',
      description: 'Freshly baked whole wheat bread, high fiber content',
      category: ProductCategory.BAKERY,
      subcategory: 'bread',
      brand: 'Bakery Delight',
      sku: 'BK-BREA-001',
      unit: 'piece',
      unitValue: 1,
      price: 45,
      mrp: 50,
      stock: 80,
      isVeg: true,
      tags: ['bread', 'wheat', 'bakery'],
      shelfLife: '5 days',
      storageInfo: 'Store in cool, dry place'
    },
    {
      name: 'Mineral Water 20L Jar',
      description: 'Purified mineral water, government certified',
      category: ProductCategory.BEVERAGES,
      subcategory: 'water',
      brand: 'Aqua Pure',
      sku: 'BV-WATR-001',
      unit: 'liter',
      unitValue: 20,
      price: 120,
      stock: 50,
      tags: ['water', 'purified', 'jar']
    }
  ];

  products = sampleProducts.map(p => createProduct(p));
  logger.info(`Initialized ${products.length} sample products`);
};

initializeSampleProducts();

// Validation schemas
const searchQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  isOrganic: z.string().optional(),
  inStock: z.string().optional(),
  sortBy: z.enum(['price', 'name', 'rating', 'newest']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(Number).optional(),
  pageSize: z.string().transform(Number).optional()
});

const recommendationQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  category: z.string().optional(),
  limit: z.string().transform(Number).optional()
});

/**
 * GET /products
 * List all products with pagination and filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const params = searchQuerySchema.parse(req.query);
    let filtered = [...products];

    // Filter by category
    if (params.category) {
      filtered = filtered.filter(p => p.category === params.category);
    }

    // Filter by subcategory
    if (params.subcategory) {
      filtered = filtered.filter(p => p.subcategory === params.subcategory);
    }

    // Filter by brand
    if (params.brand) {
      filtered = filtered.filter(p =>
        p.brand?.toLowerCase().includes(params.brand!.toLowerCase())
      );
    }

    // Filter by price range
    if (params.minPrice !== undefined) {
      filtered = filtered.filter(p => calculateDiscountedPrice(p.price, p.discount) >= params.minPrice!);
    }
    if (params.maxPrice !== undefined) {
      filtered = filtered.filter(p => calculateDiscountedPrice(p.price, p.discount) <= params.maxPrice!);
    }

    // Filter by organic
    if (params.isOrganic === 'true') {
      filtered = filtered.filter(p => p.isOrganic);
    }

    // Filter by stock availability
    if (params.inStock === 'true') {
      filtered = filtered.filter(p => p.stock > 0 && p.isAvailable);
    }

    // Sort
    const sortBy = params.sortBy || 'newest';
    const sortOrder = params.sortOrder || 'asc';
    const sortMultiplier = sortOrder === 'desc' ? -1 : 1;

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return sortMultiplier * (a.price - b.price);
        case 'name':
          return sortMultiplier * a.name.localeCompare(b.name);
        case 'rating':
          return sortMultiplier * ((a.rating || 0) - (b.rating || 0));
        case 'newest':
        default:
          return sortMultiplier * (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    });

    // Pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedProducts = filtered.slice(startIndex, startIndex + pageSize);

    res.json({
      products: paginatedProducts,
      total,
      page,
      pageSize,
      totalPages
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
      return;
    }
    logger.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /products/search
 * Search products by name, description, or tags
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, category, brand, minPrice, maxPrice, page, pageSize } = searchQuerySchema.parse(req.query);

    if (!q && !category && !brand) {
      res.status(400).json({ error: 'At least one search parameter required (q, category, or brand)' });
      return;
    }

    let filtered = [...products];

    // Text search in name, description, and tags
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        p.brand?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }

    // Filter by brand
    if (brand) {
      filtered = filtered.filter(p =>
        p.brand?.toLowerCase().includes(brand.toLowerCase())
      );
    }

    // Price range
    if (minPrice !== undefined) {
      filtered = filtered.filter(p => calculateDiscountedPrice(p.price, p.discount) >= minPrice);
    }
    if (maxPrice !== undefined) {
      filtered = filtered.filter(p => calculateDiscountedPrice(p.price, p.discount) <= maxPrice);
    }

    // Pagination
    const pageNum = page || 1;
    const pageSizeNum = pageSize || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSizeNum);
    const startIndex = (pageNum - 1) * pageSizeNum;

    res.json({
      products: filtered.slice(startIndex, startIndex + pageSizeNum),
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
      query: q
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid search parameters', details: error.errors });
      return;
    }
    logger.error('Error searching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /products/recommendations
 * Get personalized product recommendations
 */
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const params = recommendationQuerySchema.parse(req.query);
    const { userId, category, limit } = params;
    const maxLimit = Math.min(limit || 20, 50);

    let recommended = [...products];

    // Filter available products
    recommended = recommended.filter(p => p.isAvailable && p.stock > 0);

    // If userId provided, integrate with REZ Intelligence for personalization
    if (userId) {
      // TODO: Integrate with REZ Mind/Intent Graph for personalized recommendations
      // const intentGraphResponse = await axios.get(`${REZ_INTELLIGENCE_URL}/api/user/${userId}/intents`);
      // Use intent data to weight recommendations
      logger.info(`Getting recommendations for user: ${userId}`);
    }

    // Filter by category if specified
    if (category) {
      recommended = recommended.filter(p => p.category === category);
    }

    // Score and sort by recommendation factors
    const scored = recommended.map(p => {
      let score = 0;

      // Higher rating = higher score
      score += (p.rating || 3) * 10;

      // More reviews = higher score
      score += Math.min(p.reviewCount, 100) * 0.5;

      // In-stock bonus
      if (p.stockStatus === 'in_stock') score += 20;

      // Organic bonus
      if (p.isOrganic) score += 10;

      // Discounted items bonus
      if (p.discount && p.discount > 0) score += p.discount;

      return { product: p, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    res.json({
      products: scored.slice(0, maxLimit).map(s => ({
        ...s.product,
        recommendationScore: s.score
      })),
      count: Math.min(maxLimit, scored.length),
      personalized: !!userId
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid parameters', details: error.errors });
      return;
    }
    logger.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /products/:id
 * Get a single product by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = products.find(p => p.id === id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Get related products from same category
    const relatedProducts = products
      .filter(p => p.id !== id && p.category === product.category)
      .slice(0, 5);

    res.json({
      product,
      relatedProducts
    });
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /products
 * Create a new product (admin only)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = ProductSchema.parse(req.body);
    const newProduct = createProduct(validatedData);
    products.push(newProduct);

    logger.info(`Created product: ${newProduct.id}`);

    res.status(201).json({ product: newProduct });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    logger.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /products/categories
 * Get all available categories
 */
router.get('/meta/categories', async (req: Request, res: Response) => {
  const categories = Object.values(ProductCategory).map(cat => ({
    id: cat,
    name: cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    productCount: products.filter(p => p.category === cat).length
  }));

  res.json({ categories });
});

export default router;
