import { Router, Request, Response } from 'express';
import { Supplier, Product, Order, Review } from '../models/Supplier';

const router = Router();

// Suppliers
router.get('/suppliers', async (req: Request, res: Response) => {
  try {
    const { city, category, search, verified } = req.query;
    const query: Record<string, any> = { isActive: true };
    if (city) query['address.city'] = city;
    if (category) query.category = category;
    if (verified === 'true') query.isVerified = true;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { businessType: { $regex: search, $options: 'i' } }];

    const suppliers = await Supplier.find(query).sort({ rating: -1 });
    res.json({ success: true, data: suppliers, count: suppliers.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch suppliers' } });
  }
});

router.get('/suppliers/:id', async (req: Request, res: Response) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, error: { message: 'Supplier not found' } });
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch supplier' } });
  }
});

router.post('/suppliers', async (req: Request, res: Response) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Products
router.get('/products', async (req: Request, res: Response) => {
  try {
    const { supplierId, category, search, minPrice, maxPrice } = req.query;
    const query: Record<string, any> = { isActive: true };
    if (supplierId) query.supplierId = supplierId;
    if (category) query.category = category;
    if (minPrice || maxPrice) { query.price = {}; if (minPrice) query.price.$gte = Number(minPrice); if (maxPrice) query.price.$lte = Number(maxPrice); }
    if (search) query.$text = { $search: search as string };

    const products = await Product.find(query).populate('supplierId', 'name rating').sort({ price: 1 });
    res.json({ success: true, data: products, count: products.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch products' } });
  }
});

router.get('/suppliers/:id/products', async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ supplierId: req.params.id, isActive: true });
    res.json({ success: true, data: products, count: products.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch products' } });
  }
});

router.post('/products', async (req: Request, res: Response) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Orders
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const { buyerId, supplierId, items, deliveryAddress, notes } = req.body;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ success: false, error: { message: 'Supplier not found' } });

    let subtotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, error: { message: `Product ${item.productId} not found` } });
      item.name = product.name;
      item.unit = product.unit;
      item.price = product.price;
      item.total = product.price * item.quantity;
      subtotal += item.total;
    }

    const deliveryCharge = subtotal >= supplier.minOrderValue ? 0 : 50;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryCharge + tax;

    const order = await Order.create({
      buyerId, supplierId, items, subtotal, deliveryCharge, tax, total,
      status: 'pending', deliveryAddress, notes, paymentStatus: 'pending',
    });

    await Supplier.updateOne({ _id: supplierId }, { $inc: { totalOrders: 1 } });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyerId', 'name email')
      .populate('supplierId', 'name phone');
    if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' } });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch order' } });
  }
});

router.patch('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' } });

    if (status === 'delivered') {
      await Supplier.updateOne({ _id: order.supplierId }, { $inc: { totalRevenue: order.total } });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Reviews
router.post('/reviews', async (req: Request, res: Response) => {
  try {
    const review = await Review.create(req.body);

    const reviews = await Review.find({ supplierId: req.body.supplierId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Supplier.updateOne({ _id: req.body.supplierId }, { rating: Math.round(avgRating * 10) / 10 });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.get('/suppliers/:id/reviews', async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ supplierId: req.params.id })
      .populate('buyerId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews, count: reviews.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch reviews' } });
  }
});

export default router;
