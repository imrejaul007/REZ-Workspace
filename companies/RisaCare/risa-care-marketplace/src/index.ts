/**
 * RisaCare Health Marketplace
 * Healthcare products, equipment, supplements
 */
import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { RisaCareEcosystemClient } from '../../risa-care-shared/src/index';

const ecosystem = new RisaCareEcosystemClient();
const PORT = parseInt(process.env.PORT || '4774', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_marketplace';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
app.use(express.json());

const ProductSchema = new mongoose.Schema({
  productId: String, sellerId: String, name: String, description: String, category: String,
  price: Number, mrp: Number, images: [String], stock: Number, rating: Number, reviewCount: Number,
  brand: String, sellerName: String, sellerRating: Number
});
const OrderSchema = new mongoose.Schema({
  orderId: String, userId: String, items: [{ productId: String, name: String, quantity: Number, price: Number }],
  total: Number, status: String, paymentStatus: String, address: mongoose.Schema.Types.Mixed
});
const ReviewSchema = new mongoose.Schema({
  reviewId: String, productId: String, userId: String, userName: String, rating: Number, review: String
});
const CartSchema = new mongoose.Schema({
  cartId: String, userId: String, items: [{ productId: String, name: String, quantity: Number, price: Number }]
});

const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);
const Review = mongoose.model('Review', ReviewSchema);
const Cart = mongoose.model('Cart', CartSchema);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'marketplace' }));

// Products
app.get('/api/products', async (req, res) => {
  const { category, search, limit = '20', sort = 'relevance' } = req.query;
  const query: any = {};
  if (category) query.category = category;
  if (search) query.name = { $regex: search, $options: 'i' };

  let products = await Product.find(query).limit(parseInt(limit as string));
  if (sort === 'price_low') products.sort((a: any, b: any) => a.price - b.price);
  if (sort === 'price_high') products.sort((a: any, b: any) => b.price - a.price);
  if (sort === 'rating') products.sort((a: any, b: any) => b.rating - a.rating);

  res.json({ success: true, products });
});

app.get('/api/products/:id', async (req, res) => {
  const product = await Product.findOne({ productId: req.params.id });
  if (!product) return res.status(404).json({ error: 'Not found' });
  const reviews = await Review.find({ productId: req.params.id }).limit(10);
  res.json({ success: true, product, reviews });
});

app.post('/api/products', async (req, res) => {
  const product = await Product.create({ productId: `prod_${uuidv4()}`, rating: 0, reviewCount: 0, ...req.body });
  res.status(201).json({ success: true, product });
});

// Cart
app.get('/api/cart/:userId', async (req, res) => {
  let cart = await Cart.findOne({ userId: req.params.userId });
  if (!cart) cart = await Cart.create({ cartId: `cart_${uuidv4()}`, userId: req.params.userId, items: [] });
  res.json({ success: true, cart });
});

app.post('/api/cart/:userId/items', async (req, res) => {
  const { productId, name, quantity, price } = req.body;
  let cart = await Cart.findOne({ userId: req.params.userId });
  if (!cart) cart = await Cart.create({ cartId: `cart_${uuidv4()}`, userId: req.params.userId, items: [] });

  cart.items.push({ productId, name, quantity, price });
  await cart.save();
  res.json({ success: true, cart });
});

// Orders
app.post('/api/orders', async (req, res) => {
  const { userId, items, address } = req.body;
  const total = items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0);
  const order = await Order.create({
    orderId: `ord_${uuidv4()}`,
    userId, items, total, status: 'confirmed', paymentStatus: 'pending', address
  });
  ecosystem.rabtul.sendPushNotification(userId, 'Order Placed', `Your order #${order.orderId} is confirmed`).catch(() => {});
  res.status(201).json({ success: true, order });
});

app.get('/api/orders/:userId', async (req, res) => {
  const orders = await Order.find({ userId: req.params.userId }).sort({ _id: -1 });
  res.json({ success: true, orders });
});

// Reviews
app.post('/api/reviews', async (req, res) => {
  const review = await Review.create({ reviewId: `rev_${uuidv4()}`, ...req.body });
  const avgRating = (await Review.find({ productId: req.body.productId })).reduce((s, r) => s + r.rating, 0) / (await Review.countDocuments({ productId: req.body.productId }));
  await Product.updateOne({ productId: req.body.productId }, { rating: avgRating, $inc: { reviewCount: 1 } });
  res.status(201).json({ success: true, review });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => logger.info(`Marketplace started on port ${PORT}`));
}
start();
export default app;
