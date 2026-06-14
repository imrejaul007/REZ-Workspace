import { Router, Request, Response } from 'express';
import { ProductModel } from '../models/Product';
import { SupplierModel } from '../models/Supplier';
import { CreateProductSchema, UpdateProductSchema, CreateSupplierSchema } from '../types';
import { ZodError } from 'zod';

const router = Router();

router.get('/products', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const supplierId = req.query.supplierId as string;
    const search = req.query.search as string;

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (supplierId) query.supplierId = supplierId;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      ProductModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ProductModel.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/products/low-stock', async (_req: Request, res: Response) => {
  try {
    const products = await ProductModel.findLowStock();
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findById(req.params.id);
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
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.post('/products', async (req: Request, res: Response) => {
  try {
    const data = await CreateProductSchema.parseAsync(req.body);
    if (data.expiryDate) {
      data.expiryDate = new Date(data.expiryDate).toISOString();
    }
    const product = new ProductModel(data);
    await product.save();
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const data = await UpdateProductSchema.parseAsync(req.body);
    const product = await ProductModel.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.patch('/products/:id/stock', async (req: Request, res: Response) => {
  try {
    const { quantity, adjustment } = req.body;
    const product = await ProductModel.findById(req.params.id);

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }

    if (typeof quantity === 'number') {
      product.quantity = quantity;
    } else if (typeof adjustment === 'number') {
      product.quantity = Math.max(0, product.quantity + adjustment);
    }

    await product.save();

    res.json({
      success: true,
      data: product,
      message: 'Stock updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/suppliers', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [suppliers, total] = await Promise.all([
      SupplierModel.find(query)
        .sort({ rating: -1, name: 1 })
        .skip(skip)
        .limit(limit),
      SupplierModel.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/suppliers/:id', async (req: Request, res: Response) => {
  try {
    const supplier = await SupplierModel.findById(req.params.id).populate('products');
    if (!supplier) {
      res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
      return;
    }
    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.post('/suppliers', async (req: Request, res: Response) => {
  try {
    const data = await CreateSupplierSchema.parseAsync(req.body);
    const supplier = new SupplierModel(data);
    await supplier.save();
    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully'
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.put('/suppliers/:id', async (req: Request, res: Response) => {
  try {
    const supplier = await SupplierModel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
      return;
    }

    res.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.delete('/suppliers/:id', async (req: Request, res: Response) => {
  try {
    const supplier = await SupplierModel.findByIdAndDelete(req.params.id);
    if (!supplier) {
      res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
      return;
    }
    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
