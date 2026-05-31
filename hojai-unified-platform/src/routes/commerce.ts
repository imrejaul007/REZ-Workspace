import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  AuthenticatedRequest,
  requireAuth,
  successResponse
} from '../middleware/auth.js';
import { handleError } from '../utils/errors.js';

// ============================================================================
// TYPES
// ============================================================================

interface Product {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  currency: string;
  category: string;
  subcategory?: string;
  tags: string[];
  images: string[];
  video?: string;
  stock: number;
  trackInventory: boolean;
  status: 'active' | 'draft' | 'archived';
  variants?: ProductVariant[];
  attributes?: Record<string, string>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductVariant {
  id?: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: Record<string, string>;
  image?: string;
}

interface Cart {
  id: string;
  tenantId: string;
  sessionId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: 'active' | 'checkout' | 'completed' | 'abandoned';
  couponCode?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
}

interface Coupon {
  id: string;
  tenantId: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  startsAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'disabled';
  applicableProducts?: string[];
  applicableCategories?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface CatalogSettings {
  tenantId: string;
  currency: string;
  taxRate: number;
  defaultDeliveryFee: number;
  freeDeliveryThreshold?: number;
  maxCartItems: number;
  allowOutOfStock: boolean;
}

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

const products = new Map<string, Product>();
const carts = new Map<string, Cart>();
const coupons = new Map<string, Coupon>();

const catalogSettings = new Map<string, CatalogSettings>();

// Default catalog settings
const defaultCatalogSettings: CatalogSettings = {
  tenantId: 'default',
  currency: 'INR',
  taxRate: 0.18, // 18% GST
  defaultDeliveryFee: 50,
  freeDeliveryThreshold: 500,
  maxCartItems: 50,
  allowOutOfStock: false
};

// Seed demo products
function seedDemoProducts(tenantId: string): void {
  const demoProducts: Omit<Product, 'createdAt' | 'updatedAt'>[] = [
    {
      id: 'prod_1',
      tenantId,
      sku: 'PIZZA-MARGH',
      name: 'Margherita Pizza',
      description: 'Classic Italian pizza with tomato sauce, mozzarella, and fresh basil',
      price: 299,
      compareAtPrice: 349,
      currency: 'INR',
      category: 'food',
      subcategory: 'pizza',
      tags: ['veg', 'popular', 'bestseller'],
      images: ['https://example.com/pizza1.jpg'],
      stock: 100,
      trackInventory: true,
      status: 'active'
    },
    {
      id: 'prod_2',
      tenantId,
      sku: 'BURGER-VEG',
      name: 'Veggie Burger',
      description: 'Delicious plant-based burger with fresh vegetables and special sauce',
      price: 199,
      currency: 'INR',
      category: 'food',
      subcategory: 'burger',
      tags: ['veg', 'popular'],
      images: ['https://example.com/burger1.jpg'],
      stock: 50,
      trackInventory: true,
      status: 'active'
    },
    {
      id: 'prod_3',
      tenantId,
      sku: 'PASTA-CREAM',
      name: 'Creamy Pasta',
      description: 'Rich and creamy white sauce pasta with mushrooms and herbs',
      price: 249,
      currency: 'INR',
      category: 'food',
      subcategory: 'pasta',
      tags: ['veg'],
      images: ['https://example.com/pasta1.jpg'],
      stock: 75,
      trackInventory: true,
      status: 'active'
    }
  ];

  for (const product of demoProducts) {
    products.set(product.id, {
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateProductSchema = z.object({
  sku: z.string().min(2).max(50),
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  video: z.string().url().optional(),
  stock: z.number().int().min(0).default(0),
  trackInventory: z.boolean().default(true),
  variants: z.array(z.object({
    sku: z.string(),
    name: z.string(),
    price: z.number().positive(),
    compareAtPrice: z.number().positive().optional(),
    stock: z.number().int().min(0),
    attributes: z.record(z.string())
  })).optional(),
  attributes: z.record(z.string()).optional()
});

const UpdateProductSchema = z.object({
  sku: z.string().min(2).max(50).optional(),
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().positive().optional(),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  video: z.string().url().optional(),
  stock: z.number().int().min(0).optional(),
  trackInventory: z.boolean().optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  attributes: z.record(z.string()).optional()
});

const CreateCartSchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  customerPhone: z.string().optional(),
  sessionId: z.string().optional()
});

const AddToCartSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).default(1)
});

const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1)
});

const ApplyCouponSchema = z.object({
  couponCode: z.string().min(1)
});

const CreateCouponSchema = z.object({
  code: z.string().min(2).max(50),
  type: z.enum(['percentage', 'fixed', 'free_shipping']),
  value: z.number().positive(),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().min(1).optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime(),
  applicableProducts: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional()
});

const UpdateCatalogSettingsSchema = z.object({
  currency: z.string().length(3).optional(),
  taxRate: z.number().min(0).max(1).optional(),
  defaultDeliveryFee: z.number().min(0).optional(),
  freeDeliveryThreshold: z.number().min(0).optional(),
  maxCartItems: z.number().int().min(1).optional(),
  allowOutOfStock: z.boolean().optional()
});

// ============================================================================
// ROUTER
// ============================================================================

const router = Router();

// ============================================================================
// CATALOG SETTINGS
// ============================================================================

// Get catalog settings
router.get('/settings', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const settings = catalogSettings.get(authReq.tenant.tenantId) || {
    ...defaultCatalogSettings,
    tenantId: authReq.tenant.tenantId
  };
  successResponse(res, settings);
});

// Update catalog settings
router.patch('/settings', requireAuth, requireAuth, (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const validated = UpdateCatalogSettingsSchema.parse(req.body);

    const settings = catalogSettings.get(authReq.tenant.tenantId) || {
      ...defaultCatalogSettings,
      tenantId: authReq.tenant.tenantId
    };

    Object.assign(settings, validated);
    catalogSettings.set(authReq.tenant.tenantId, settings);

    successResponse(res, settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});

// ============================================================================
// PRODUCTS
// ============================================================================

// List products
router.get('/products', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const { category, search, tags, status = 'active', limit = '50', offset = '0' } = req.query;

    // Seed if empty
    if (products.size === 0) {
      seedDemoProducts(tenantId);
    }

    let filtered = Array.from(products.values()).filter(
      p => p.tenantId === tenantId
    );

    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    if (tags) {
      const tagList = (tags as string).split(',');
      filtered = filtered.filter(p => tagList.some(t => p.tags.includes(t)));
    }
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        (p.description?.toLowerCase().includes(searchLower) ?? false) ||
        p.sku.toLowerCase().includes(searchLower)
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));

    successResponse(res, {
      products: paginated,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    handleError(res, error);
  }
});

// Get single product
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const product = products.get(req.params.id);

    if (!product || product.tenantId !== tenantId) {
      return handleError(res, 'Product not found', 404);
    }

    successResponse(res, product);
  } catch (error) {
    handleError(res, error);
  }
});

// Create product
router.post('/products', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const validated = CreateProductSchema.parse(req.body);

    const product: Product = {
      id: uuidv4(),
      tenantId: authReq.tenant.tenantId,
      ...validated,
      currency: 'INR',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    products.set(product.id, product);
    successResponse(res, product, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});

// Update product
router.patch('/products/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const product = products.get(req.params.id);

    if (!product || product.tenantId !== authReq.tenant.tenantId) {
      return handleError(res, 'Product not found', 404);
    }

    const validated = UpdateProductSchema.parse(req.body);
    Object.assign(product, validated);
    product.updatedAt = new Date();

    successResponse(res, product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});

// Delete product
router.delete('/products/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const product = products.get(req.params.id);

    if (!product || product.tenantId !== authReq.tenant.tenantId) {
      return handleError(res, 'Product not found', 404);
    }

    product.status = 'archived';
    product.updatedAt = new Date();

    successResponse(res, { deleted: true, productId: product.id });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// CART
// ============================================================================

// Get or create cart
router.post('/cart', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const sessionId = req.headers['x-session-id'] as string || uuidv4();
    const validated = CreateCartSchema.parse(req.body);

    // Check for existing active cart
    let cart = Array.from(carts.values()).find(
      c => c.customerId === validated.customerId &&
           c.tenantId === tenantId &&
           c.status === 'active'
    );

    if (!cart) {
      cart = {
        id: uuidv4(),
        tenantId,
        sessionId: validated.sessionId || sessionId,
        customerId: validated.customerId,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        items: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        deliveryFee: 0,
        total: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      carts.set(cart.id, cart);
    }

    successResponse(res, cart);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});

// Get cart by session
router.get('/cart/:sessionId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const cart = Array.from(carts.values()).find(
      c => c.sessionId === req.params.sessionId &&
           c.tenantId === tenantId &&
           c.status === 'active'
    );

    if (!cart) {
      return handleError(res, 'Cart not found', 404);
    }

    successResponse(res, cart);
  } catch (error) {
    handleError(res, error);
  }
});

// Get cart by customer
router.get('/cart', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const customerId = req.query.customerId as string;

    if (!customerId) {
      return handleError(res, 'customerId is required', 400);
    }

    const cart = Array.from(carts.values()).find(
      c => c.customerId === customerId &&
           c.tenantId === tenantId &&
           c.status === 'active'
    );

    if (!cart) {
      return handleError(res, 'Cart not found', 404);
    }

    successResponse(res, cart);
  } catch (error) {
    handleError(res, error);
  }
});

// Add to cart
router.post('/cart/:id/items', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const cart = carts.get(req.params.id);

    if (!cart || cart.tenantId !== tenantId) {
      return handleError(res, 'Cart not found', 404);
    }

    const validated = AddToCartSchema.parse(req.body);
    const product = products.get(validated.productId);

    if (!product) {
      return handleError(res, 'Product not found', 404);
    }

    if (product.trackInventory && product.stock < validated.quantity) {
      return handleError(res, 'Insufficient stock', 400);
    }

    // Find existing item
    const existingItem = cart.items.find(
      i => i.productId === validated.productId && i.variantId === validated.variantId
    );

    if (existingItem) {
      existingItem.quantity += validated.quantity;
    } else {
      cart.items.push({
        productId: product.id,
        variantId: validated.variantId,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: validated.quantity,
        image: product.images[0]
      });
    }

    // Recalculate totals
    recalculateCart(cart);

    successResponse(res, cart);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});

// Update cart item
router.patch('/cart/:id/items/:itemIndex', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const cart = carts.get(req.params.id);

    if (!cart || cart.tenantId !== tenantId) {
      return handleError(res, 'Cart not found', 404);
    }

    const itemIndex = parseInt(req.params.itemIndex);
    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      return handleError(res, 'Item not found', 404);
    }

    const validated = UpdateCartItemSchema.parse(req.body);
    const item = cart.items[itemIndex];

    if (item) {
      const product = products.get(item.productId);
      if (product && product.trackInventory && product.stock < validated.quantity) {
        return handleError(res, 'Insufficient stock', 400);
      }
      item.quantity = validated.quantity;
    }

    recalculateCart(cart);
    successResponse(res, cart);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});

// Remove from cart
router.delete('/cart/:id/items/:itemIndex', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const cart = carts.get(req.params.id);

    if (!cart || cart.tenantId !== tenantId) {
      return handleError(res, 'Cart not found', 404);
    }

    const itemIndex = parseInt(req.params.itemIndex);
    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      return handleError(res, 'Item not found', 404);
    }

    cart.items.splice(itemIndex, 1);
    recalculateCart(cart);

    successResponse(res, cart);
  } catch (error) {
    handleError(res, error);
  }
});

// Apply coupon
router.post('/cart/:id/coupon', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const cart = carts.get(req.params.id);

    if (!cart || cart.tenantId !== tenantId) {
      return handleError(res, 'Cart not found', 404);
    }

    const validated = ApplyCouponSchema.parse(req.body);
    const coupon = Array.from(coupons.values()).find(
      c => c.code === validated.couponCode &&
           c.tenantId === tenantId &&
           c.status === 'active'
    );

    if (!coupon) {
      return handleError(res, 'Invalid coupon code', 400);
    }

    const now = new Date();
    if (coupon.expiresAt < now) {
      return handleError(res, 'Coupon has expired', 400);
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return handleError(res, 'Coupon usage limit reached', 400);
    }
    if (coupon.minOrderValue && cart.subtotal < coupon.minOrderValue) {
      return handleError(res, `Minimum order value of ${coupon.minOrderValue} required`, 400);
    }

    cart.couponCode = coupon.code;
    recalculateCart(cart);

    successResponse(res, cart);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});

// Remove coupon
router.delete('/cart/:id/coupon', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const cart = carts.get(req.params.id);

    if (!cart || cart.tenantId !== tenantId) {
      return handleError(res, 'Cart not found', 404);
    }

    cart.couponCode = undefined;
    cart.discount = 0;
    recalculateCart(cart);

    successResponse(res, cart);
  } catch (error) {
    handleError(res, error);
  }
});

// Clear cart
router.delete('/cart/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const cart = carts.get(req.params.id);

    if (!cart || cart.tenantId !== tenantId) {
      return handleError(res, 'Cart not found', 404);
    }

    cart.items = [];
    cart.couponCode = undefined;
    recalculateCart(cart);

    successResponse(res, cart);
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// COUPONS
// ============================================================================

// List coupons
router.get('/coupons', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const couponsList = Array.from(coupons.values()).filter(
      c => c.tenantId === authReq.tenant.tenantId
    );
    successResponse(res, { coupons: couponsList });
  } catch (error) {
    handleError(res, error);
  }
});

// Create coupon
router.post('/coupons', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const validated = CreateCouponSchema.parse(req.body);

    const coupon: Coupon = {
      id: uuidv4(),
      tenantId: authReq.tenant.tenantId,
      code: validated.code.toUpperCase(),
      type: validated.type,
      value: validated.value,
      minOrderValue: validated.minOrderValue,
      maxDiscount: validated.maxDiscount,
      usageLimit: validated.usageLimit,
      usedCount: 0,
      startsAt: validated.startsAt ? new Date(validated.startsAt) : new Date(),
      expiresAt: new Date(validated.expiresAt),
      status: 'active',
      applicableProducts: validated.applicableProducts,
      applicableCategories: validated.applicableCategories,
      createdAt: new Date()
    };

    coupons.set(coupon.id, coupon);
    successResponse(res, coupon, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});

// Delete coupon
router.delete('/coupons/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const coupon = coupons.get(req.params.id);

    if (!coupon || coupon.tenantId !== authReq.tenant.tenantId) {
      return handleError(res, 'Coupon not found', 404);
    }

    coupon.status = 'expired';
    successResponse(res, { deleted: true });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function recalculateCart(cart: Cart): void {
  const settings = catalogSettings.get(cart.tenantId) || defaultCatalogSettings;

  // Calculate subtotal
  cart.subtotal = cart.items.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );

  // Calculate discount
  cart.discount = 0;
  if (cart.couponCode) {
    const coupon = Array.from(coupons.values()).find(
      c => c.code === cart.couponCode && c.status === 'active'
    );
    if (coupon) {
      switch (coupon.type) {
        case 'percentage':
          cart.discount = (cart.subtotal * coupon.value) / 100;
          if (coupon.maxDiscount) {
            cart.discount = Math.min(cart.discount, coupon.maxDiscount);
          }
          break;
        case 'fixed':
          cart.discount = coupon.value;
          break;
        case 'free_shipping':
          cart.discount = 0; // Delivery fee will be 0
          break;
      }
    }
  }

  // Calculate delivery fee
  cart.deliveryFee = settings.defaultDeliveryFee;
  if (settings.freeDeliveryThreshold && cart.subtotal >= settings.freeDeliveryThreshold) {
    cart.deliveryFee = 0;
  }
  if (cart.couponCode) {
    const coupon = Array.from(coupons.values()).find(
      c => c.code === cart.couponCode && c.status === 'active' && c.type === 'free_shipping'
    );
    if (coupon) {
      cart.deliveryFee = 0;
    }
  }

  // Calculate tax
  cart.tax = Math.round((cart.subtotal - cart.discount) * settings.taxRate);

  // Calculate total
  cart.total = cart.subtotal - cart.discount + cart.tax + cart.deliveryFee;

  // Ensure non-negative
  cart.discount = Math.max(0, cart.discount);
  cart.total = Math.max(0, cart.total);

  cart.updatedAt = new Date();
}

// ============================================================================
// EXPORT
// ============================================================================

export default router;
