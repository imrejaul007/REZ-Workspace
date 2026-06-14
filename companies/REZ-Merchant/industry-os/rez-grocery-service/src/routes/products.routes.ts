import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'csv-parse/sync';
import { Product, GroceryCategory, ProductStatus, ProductUnit, IProduct } from '../models';
import { authenticateToken } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation Schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.nativeEnum(GroceryCategory),
  brand: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().min(1, 'Barcode is required'),
  unit: z.nativeEnum(ProductUnit),
  weight: z.number().positive().optional(),
  mrp: z.number().positive('MRP must be positive'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  costPrice: z.number().nonnegative('Cost price must be non-negative'),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(10),
  reorderLevel: z.number().int().min(0).default(20),
  expiryDate: z.string().transform(s => new Date(s)).optional(),
  batchNumber: z.string().optional(),
  supplierId: z.string().optional(),
  merchantId: z.string().min(1, 'Merchant ID is required'),
  isOrganic: z.boolean().default(false),
  isImported: z.boolean().default(false),
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    isPrimary: z.boolean().optional()
  })).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.nativeEnum(GroceryCategory).optional(),
  brand: z.string().optional(),
  sku: z.string().min(1).optional(),
  barcode: z.string().min(1).optional(),
  unit: z.nativeEnum(ProductUnit).optional(),
  weight: z.number().positive().optional(),
  mrp: z.number().positive().optional(),
  sellingPrice: z.number().positive().optional(),
  costPrice: z.number().nonnegative().optional(),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  expiryDate: z.string().transform(s => new Date(s)).optional().nullable(),
  batchNumber: z.string().optional(),
  supplierId: z.string().optional(),
  isOrganic: z.boolean().optional(),
  isImported: z.boolean().optional(),
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    isPrimary: z.boolean().optional()
  })).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.nativeEnum(ProductStatus).optional()
});

const searchQuerySchema = z.object({
  merchantId: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  inStock: z.string().optional(),
  isOrganic: z.string().optional(),
  isImported: z.string().optional(),
  status: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

const stockAdjustSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int(),
  reason: z.enum(['PURCHASE', 'SALE', 'RETURN', 'DAMAGE', 'EXPIRY', 'ADJUSTMENT', 'RECEIVED']),
  notes: z.string().optional()
});

/**
 * POST /api/products - Create a new product
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createProductSchema.parse(req.body);

    // Check if barcode already exists
    const existingProduct = await Product.findOne({ barcode: validatedData.barcode });
    if (existingProduct) {
      res.status(409).json({
        success: false,
        error: 'Product with this barcode already exists',
        existingProductId: existingProduct.productId
      });
      return;
    }

    const productId = `GRP-${uuidv4().substring(0, 8).toUpperCase()}`;

    const product = new Product({
      ...validatedData,
      productId,
      status: validatedData.stock === 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.ACTIVE
    });

    await product.save();

    logger.info(`Product created: ${productId} - ${validatedData.name}`);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else if (error instanceof Error && error.message.includes('duplicate')) {
      res.status(409).json({
        success: false,
        error: 'Product with this barcode or SKU already exists'
      });
    } else {
      logger.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/products - List products with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = searchQuerySchema.parse(req.query);

    const filter: Record<string, unknown> = {};

    // Merchant filter
    if (query.merchantId) {
      filter.merchantId = query.merchantId;
    }

    // Category filter
    if (query.category) {
      filter.category = query.category as GroceryCategory;
    }

    // Status filter
    if (query.status) {
      filter.status = query.status as ProductStatus;
    } else {
      filter.status = ProductStatus.ACTIVE;
    }

    // In stock filter
    if (query.inStock === 'true') {
      filter.stock = { $gt: 0 };
    } else if (query.inStock === 'false') {
      filter.stock = 0;
    }

    // Organic filter
    if (query.isOrganic === 'true') {
      filter.isOrganic = true;
    } else if (query.isOrganic === 'false') {
      filter.isOrganic = false;
    }

    // Imported filter
    if (query.isImported === 'true') {
      filter.isImported = true;
    } else if (query.isImported === 'false') {
      filter.isImported = false;
    }

    // Price range filter
    if (query.minPrice || query.maxPrice) {
      filter.sellingPrice = {};
      if (query.minPrice) {
        (filter.sellingPrice as Record<string, number>).$gte = parseFloat(query.minPrice);
      }
      if (query.maxPrice) {
        (filter.sellingPrice as Record<string, number>).$lte = parseFloat(query.maxPrice);
      }
    }

    // Text search
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 20;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    } else {
      logger.error('Error listing products:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/products/barcode/:barcode - Scan product by barcode
 */
router.get('/barcode/:barcode', async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;

    const product = await Product.findOne({
      $or: [
        { barcode },
        { sku: barcode }
      ]
    });

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
        scannedBarcode: barcode
      });
      return;
    }

    // Check if product is expired
    if (product.expiryDate && new Date() > product.expiryDate) {
      res.json({
        success: true,
        data: product,
        warning: 'This product has expired',
        expiryDate: product.expiryDate
      });
      return;
    }

    // Check if product is low on stock
    if (product.stock <= product.reorderLevel) {
      res.json({
        success: true,
        data: product,
        warning: 'Low stock alert',
        currentStock: product.stock,
        reorderLevel: product.reorderLevel
      });
      return;
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Error scanning barcode:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/products/category/:category - Get products by category
 */
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const merchantId = req.query.merchantId as string;

    const filter: Record<string, unknown> = {
      category: category.toUpperCase(),
      status: ProductStatus.ACTIVE
    };

    if (merchantId) {
      filter.merchantId = merchantId;
    }

    const products = await Product.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      data: {
        category: category.toUpperCase(),
        count: products.length,
        products
      }
    });
  } catch (error) {
    logger.error('Error getting products by category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/products/:id - Get product by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ productId: req.params.id });

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/products/:id - Update product
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = updateProductSchema.parse(req.body);

    const product = await Product.findOneAndUpdate(
      { productId: req.params.id },
      { $set: validatedData },
      { new: true, runValidators: true }
    );

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }

    logger.info(`Product updated: ${req.params.id}`);

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      logger.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * DELETE /api/products/:id - Soft delete product
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findOneAndUpdate(
      { productId: req.params.id },
      { $set: { status: ProductStatus.DISCONTINUED } },
      { new: true }
    );

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }

    logger.info(`Product discontinued: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Product discontinued successfully',
      data: product
    });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/products/stock-adjust - Adjust stock quantity
 */
router.post('/stock-adjust', async (req: Request, res: Response) => {
  try {
    const validatedData = stockAdjustSchema.parse(req.body);

    const product = await Product.findOne({ productId: validatedData.productId });

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }

    let newStock: number;

    switch (validatedData.reason) {
      case 'PURCHASE':
      case 'RECEIVED':
      case 'RETURN':
        newStock = product.stock + Math.abs(validatedData.quantity);
        break;
      case 'SALE':
        newStock = product.stock - Math.abs(validatedData.quantity);
        if (newStock < 0) {
          res.status(400).json({
            success: false,
            error: 'Insufficient stock',
            availableStock: product.stock,
            requestedQuantity: Math.abs(validatedData.quantity)
          });
          return;
        }
        break;
      case 'DAMAGE':
      case 'EXPIRY':
      case 'ADJUSTMENT':
        newStock = product.stock + validatedData.quantity;
        if (newStock < 0) {
          res.status(400).json({
            success: false,
            error: 'Adjustment would result in negative stock'
          });
          return;
        }
        break;
      default:
        newStock = product.stock;
    }

    product.stock = Math.max(0, newStock);
    product.markModified('stock');
    await product.save();

    logger.info(`Stock adjusted for ${validatedData.productId}: ${product.stock} (${validatedData.reason})`);

    res.json({
      success: true,
      data: {
        productId: product.productId,
        name: product.name,
        previousStock: product.stock - (validatedData.reason === 'SALE' ? validatedData.quantity : -validatedData.quantity),
        newStock: product.stock,
        adjustment: validatedData.quantity,
        reason: validatedData.reason
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      logger.error('Error adjusting stock:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * POST /api/products/bulk - Bulk import from CSV
 */
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { csvData, merchantId } = req.body;

    if (!csvData || !merchantId) {
      res.status(400).json({
        success: false,
        error: 'CSV data and merchantId are required'
      });
      return;
    }

    // Parse CSV data
    let records: Record<string, string>[];
    try {
      records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } catch (parseError) {
      res.status(400).json({
        success: false,
        error: 'Invalid CSV format',
        details: parseError instanceof Error ? parseError.message : 'Parse error'
      });
      return;
    }

    const results = {
      imported: 0,
      updated: 0,
      failed: 0,
      errors: [] as { row: number; error: string }[]
    };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];

      try {
        // Validate required fields
        if (!row.name || !row.sku || !row.barcode || !row.category || !row.mrp || !row.sellingPrice) {
          results.failed++;
          results.errors.push({
            row: i + 2, // +2 for header row and 0-index
            error: 'Missing required fields: name, sku, barcode, category, mrp, sellingPrice'
          });
          continue;
        }

        // Check if product exists
        const existingProduct = await Product.findOne({
          $or: [{ barcode: row.barcode }, { sku: row.sku }]
        });

        const productData = {
          name: row.name,
          category: row.category.toUpperCase() as GroceryCategory,
          brand: row.brand || undefined,
          sku: row.sku,
          barcode: row.barcode,
          unit: (row.unit?.toUpperCase() || 'PCS') as ProductUnit,
          weight: row.weight ? parseFloat(row.weight) : undefined,
          mrp: parseFloat(row.mrp),
          sellingPrice: parseFloat(row.sellingPrice),
          costPrice: parseFloat(row.costPrice || row.mrp),
          stock: parseInt(row.stock || '0'),
          minStock: parseInt(row.minStock || '10'),
          reorderLevel: parseInt(row.reorderLevel || '20'),
          expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
          batchNumber: row.batchNumber || undefined,
          supplierId: row.supplierId || undefined,
          merchantId,
          isOrganic: row.isOrganic?.toLowerCase() === 'true',
          isImported: row.isImported?.toLowerCase() === 'true',
          description: row.description || undefined,
          tags: row.tags ? row.tags.split(',').map(t => t.trim()) : undefined
        };

        if (existingProduct) {
          // Update existing product
          await Product.findByIdAndUpdate(existingProduct._id, productData);
          results.updated++;
        } else {
          // Create new product
          const productId = `GRP-${uuidv4().substring(0, 8).toUpperCase()}`;
          const product = new Product({
            ...productData,
            productId
          });
          await product.save();
          results.imported++;
        }
      } catch (rowError) {
        results.failed++;
        results.errors.push({
          row: i + 2,
          error: rowError instanceof Error ? rowError.message : 'Unknown error'
        });
      }
    }

    logger.info(`Bulk import completed: ${results.imported} imported, ${results.updated} updated, ${results.failed} failed`);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error in bulk import:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/products/stats/summary - Get product statistics
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: 'merchantId is required'
      });
      return;
    }

    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
      expiringProducts,
      organicProducts,
      importedProducts
    ] = await Promise.all([
      Product.countDocuments({ merchantId }),
      Product.countDocuments({ merchantId, status: ProductStatus.ACTIVE }),
      Product.countDocuments({ merchantId, status: ProductStatus.OUT_OF_STOCK }),
      Product.countDocuments({ merchantId, stock: { $lte: '$reorderLevel' } }),
      Product.countDocuments({
        merchantId,
        expiryDate: {
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          $gt: new Date()
        }
      }),
      Product.countDocuments({ merchantId, isOrganic: true }),
      Product.countDocuments({ merchantId, isImported: true })
    ]);

    // Get category breakdown
    const categoryBreakdown = await Product.aggregate([
      { $match: { merchantId } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        outOfStockProducts,
        lowStockProducts: lowStockProducts || 0,
        expiringProducts: expiringProducts || 0,
        organicProducts,
        importedProducts,
        categoryBreakdown: categoryBreakdown.map(c => ({
          category: c._id,
          count: c.count,
          totalStock: c.totalStock
        }))
      }
    });
  } catch (error) {
    logger.error('Error getting product stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;