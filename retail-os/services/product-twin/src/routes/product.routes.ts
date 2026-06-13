import { Router, Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { validateCreateProduct, validateUpdateProduct } from '../schemas/product.schema';

const router = Router();
const productService = new ProductService();

export function getProductRouter(): Router {
  return router;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const valid = validateCreateProduct(req.body);
    if (!valid) {
      return res.status(400).json({ errors: validateCreateProduct.errors });
    }

    const product = await productService.createProduct(req.body);
    return res.status(201).json(product);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const category = req.query.category as string;
    const brand = req.query.brand as string;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const sortBy = req.query.sortBy as any;
    const sortOrder = req.query.sortOrder as any;

    const results = await productService.search(query, {
      page, pageSize, category, brand, minPrice, maxPrice, sortBy, sortOrder,
    });

    return res.json(results);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.category) filter.category = req.query.category as string;
    if (req.query.brand) filter.brand = req.query.brand as string;
    if (req.query.status) filter.status = req.query.status as string;
    if (req.query.visibility) filter.visibility = req.query.visibility as string;
    if (req.query.inStock) filter.inStock = req.query.inStock === 'true';

    const products = await productService.listProducts(filter);
    return res.json({ products, count: products.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/low-stock', async (req: Request, res: Response) => {
  try {
    const products = await productService.getLowStockProducts();
    return res.json({ products, count: products.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/out-of-stock', async (req: Request, res: Response) => {
  try {
    const products = await productService.getOutOfStockProducts();
    return res.json({ products, count: products.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await productService.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/sku/:sku', async (req: Request, res: Response) => {
  try {
    const product = await productService.getProductBySku(req.params.sku);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const valid = validateUpdateProduct(req.body);
    if (!valid) {
      return res.status(400).json({ errors: validateUpdateProduct.errors });
    }

    const product = await productService.updateProduct(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/pricing', async (req: Request, res: Response) => {
  try {
    const product = await productService.updatePricing(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product.pricing);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/inventory', async (req: Request, res: Response) => {
  try {
    const { adjustment, warehouseId } = req.body;
    const product = await productService.adjustInventory(req.params.id, adjustment, warehouseId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product.inventory);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/warehouse-stock', async (req: Request, res: Response) => {
  try {
    const { warehouseId, location, quantity } = req.body;
    const product = await productService.setWarehouseStock(req.params.id, warehouseId, location, quantity);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product.inventory);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/images', async (req: Request, res: Response) => {
  try {
    const product = await productService.addImage(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.status(201).json(product.media.images);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/images/:imageId', async (req: Request, res: Response) => {
  try {
    const product = await productService.removeImage(req.params.id, req.params.imageId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product.media.images);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/images/:imageId/primary', async (req: Request, res: Response) => {
  try {
    const product = await productService.setPrimaryImage(req.params.id, req.params.imageId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product.media.images);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/variants', async (req: Request, res: Response) => {
  try {
    const product = await productService.addVariant(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.status(201).json(product.variants);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/variants/:variantId', async (req: Request, res: Response) => {
  try {
    const product = await productService.updateVariant(req.params.id, req.params.variantId, req.body);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product.variants);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/variants/:variantId', async (req: Request, res: Response) => {
  try {
    const product = await productService.removeVariant(req.params.id, req.params.variantId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product.variants);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/activate', async (req: Request, res: Response) => {
  try {
    const product = await productService.activateProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/discontinue', async (req: Request, res: Response) => {
  try {
    const product = await productService.discontinueProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/archive', async (req: Request, res: Response) => {
  try {
    const product = await productService.archiveProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export { productService };