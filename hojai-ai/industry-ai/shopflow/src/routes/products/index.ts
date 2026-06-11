import { Router, Request, Response } from 'express';
import { Product, Inventory } from '../../models';
import { productSchema, updateStockSchema } from '../../utils/validators';
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { apiLimiter } from '../../middleware/rateLimit';
import { NotFoundError, ConflictError } from '../../middleware/errorHandler';

const router = Router();

// POST /api/products - Create product
router.post('/', apiLimiter, validate(productSchema), async (req: Request, res: Response) => {
  try {
    const productData = req.body;

    // Check for duplicate SKU
    const existingProduct = await Product.findOne({ sku: productData.sku });
    if (existingProduct) {
      throw new ConflictError(`Product with SKU ${productData.sku} already exists`);
    }

    const product = new Product(productData);
    await product.save();

    // Create inventory record
    await Inventory.create({
      productId: product._id,
      quantity: product.stock,
      minStock: product.lowStockThreshold,
      maxStock: product.stock * 5 || 100,
    });

    logger.info('Product created', { productId: product._id, sku: product.sku });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error: any) {
    logger.error('Create product failed', { error });
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        error: 'Duplicate SKU',
        code: 'DUPLICATE_SKU',
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create product',
    });
  }
});

// GET /api/products - List products
router.get('/', apiLimiter, async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      isActive,
      sortBy = 'createdAt',
      order = 'desc',
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[sortBy as string] = order === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasMore: skip + products.length < total,
        },
      },
    });
  } catch (error: any) {
    logger.error('List products failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to list products',
    });
  }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', apiLimiter, async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Get inventory info
    const inventory = await Inventory.findOne({ productId: product._id });

    res.json({
      success: true,
      data: {
        ...product.toJSON(),
        inventory: inventory ? {
          quantity: inventory.quantity,
          lastRestocked: inventory.lastRestocked,
          minStock: inventory.minStock,
          maxStock: inventory.maxStock,
          status: (inventory as any).status,
        } : null,
      },
    });
  } catch (error: any) {
    logger.error('Get product failed', { error });
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid product ID',
        code: 'INVALID_ID',
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get product',
    });
  }
});

// PATCH /api/products/:id - Update product
router.patch('/:id', apiLimiter, async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'category', 'price', 'cost', 'stock', 'lowStockThreshold', 'isActive'];
    const updateData: any = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    logger.info('Product updated', { productId: product._id });

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    logger.error('Update product failed', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update product',
    });
  }
});

// PATCH /api/products/:id/stock - Update stock
router.patch('/:id/stock', apiLimiter, validate(updateStockSchema), async (req: Request, res: Response) => {
  try {
    const { quantity, operation = 'add' } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    let newQuantity: number;

    switch (operation) {
      case 'add':
        newQuantity = product.stock + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, product.stock - quantity);
        break;
      case 'set':
        newQuantity = quantity;
        break;
      default:
        newQuantity = product.stock + quantity;
    }

    // Update product stock
    product.stock = newQuantity;
    await product.save();

    // Update inventory
    const inventory = await Inventory.findOne({ productId });
    if (inventory) {
      switch (operation) {
        case 'add':
          inventory.quantity += quantity;
          break;
        case 'subtract':
          inventory.quantity = Math.max(0, inventory.quantity - quantity);
          break;
        case 'set':
          inventory.quantity = quantity;
          break;
      }
      if (operation === 'add') {
        inventory.lastRestocked = new Date();
      }
      await inventory.save();
    }

    logger.info('Stock updated', { productId, operation, quantity, newQuantity });

    res.json({
      success: true,
      data: {
        productId,
        previousStock: product.stock - quantity,
        newQuantity,
        operation,
        quantity,
      },
      message: 'Stock updated successfully',
    });
  } catch (error: any) {
    logger.error('Update stock failed', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update stock',
    });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', apiLimiter, async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Delete inventory record
    await Inventory.findOneAndDelete({ productId: req.params.id });

    logger.info('Product deleted', { productId: req.params.id });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete product failed', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete product',
    });
  }
});

export default router;