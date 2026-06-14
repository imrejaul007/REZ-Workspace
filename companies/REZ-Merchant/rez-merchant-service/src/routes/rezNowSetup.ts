/**
 * REZ Now Setup — quick-add a menu item during onboarding wizard.
 *
 * PATCH /rez-now-setup/menu
 * Body: { categoryName: string; itemName: string; itemPrice: number }
 *
 * Creates the category if it doesn't exist, then creates the product.
 * Resolves the merchant's active store from merchantAuth middleware.
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

async function resolveStore(merchantId: string): Promise<InstanceType<typeof Store> | null> {
  return Store.findOne({
    merchantId: new mongoose.Types.ObjectId(merchantId),
    isActive: true,
  }).sort({ createdAt: 1 });
}

router.patch('/menu', async (req: Request, res: Response) => {
  try {
    const { categoryName, itemName, itemPrice } = req.body as {
      categoryName?: string;
      itemName?: string;
      itemPrice?: number;
    };

    if (!categoryName?.trim()) {
      res.status(400).json({ success: false, message: 'categoryName is required' });
      return;
    }
    if (!itemName?.trim()) {
      res.status(400).json({ success: false, message: 'itemName is required' });
      return;
    }
    if (typeof itemPrice !== 'number' || isNaN(itemPrice) || itemPrice < 0) {
      res.status(400).json({ success: false, message: 'itemPrice must be a positive number' });
      return;
    }

    const store = await resolveStore(req.merchantId!);
    if (!store) {
      res.status(404).json({ success: false, message: 'No active store found for merchant' });
      return;
    }

    // Find or create the category
    let category = await Category.findOne({
      merchant: req.merchantId,
      store: store._id,
      name: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') },
    });

    if (!category) {
      const maxSort = await Category.findOne({ store: store._id }).sort({ sortOrder: -1 }).lean();
      category = await Category.create({
        merchant: req.merchantId,
        store: store._id,
        name: categoryName.trim(),
        slug: categoryName.trim().toLowerCase().replace(/\s+/g, '-'),
        description: '',
        isActive: true,
        sortOrder: ((maxSort as unknown)?.sortOrder ?? -1) + 1,
      });
    }

    // Find max sortOrder for products
    const maxProductSort = await Product.findOne({ store: store._id }).sort({ sortOrder: -1 }).lean();

    // Create the product
    const product = await Product.create({
      store: store._id,
      merchant: req.merchantId,
      name: itemName.trim(),
      slug: itemName.trim().toLowerCase().replace(/\s+/g, '-'),
      category: categoryName.trim(),
      description: '',
      images: [],
      pricing: {
        original: itemPrice,
        selling: itemPrice,
        currency: 'INR',
      },
      inventory: {
        stock: 100,
        isAvailable: true,
        unlimited: true,
      },
      isActive: true,
      isVeg: false,
      isFeatured: false,
      sortOrder: ((maxProductSort as unknown)?.sortOrder ?? -1) + 1,
    });

    // Increment category productCount
    await Category.updateOne({ _id: category._id }, { $inc: { productCount: 1 } });

    res.json({
      success: true,
      data: {
        category: { id: category._id, name: category.name },
        product: { id: product._id, name: product.name, price: itemPrice },
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
