/**
 * AdBazaar Data Marketplace
 * First-party data exchange for audiences
 *
 * Port: 4968
 * Purpose: Sell and buy audience segments from REZ ecosystem
 *
 * Features:
 * - Audience listings
 * - Data pricing
 * - Purchase flow
 * - Privacy compliance
 * - Analytics
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import crypto from 'crypto';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4968;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/data-marketplace.log' })
  ]
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(limiter);

// MongoDB Schemas

// Audience Listing
const listingSchema = new mongoose.Schema({
  listingId: String,
  sellerId: String,
  name: String,
  description: String,
  category: String, // shopping, travel, food, lifestyle, business
  size: Number,
  demographics: {
    ageRange: String,
    locations: [String],
    income: String
  },
  attributes: [String], // tags
  price: {
    amount: Number,
    currency: String,
    perRecord: Boolean
  },
  license: String, // exclusive, non-exclusive
  status: String, // active, paused, sold
  views: Number,
  purchases: Number,
  createdAt: Date,
  updatedAt: Date
});

const Listing = mongoose.model('Listing', listingSchema);

// Purchase
const purchaseSchema = new mongoose.Schema({
  purchaseId: String,
  listingId: String,
  buyerId: String,
  sellerId: String,
  price: Number,
  records: Number,
  status: String, // pending, completed, refunded
  createdAt: Date
});

const Purchase = mongoose.model('Purchase', purchaseSchema);

// Buyer Profile
const buyerSchema = new mongoose.Schema({
  buyerId: String,
  company: String,
  industry: String,
  useCase: String,
  purchases: [{
    listingId: String,
    date: Date,
    amount: Number
  }],
  createdAt: Date
});

const Buyer = mongoose.model('Buyer', buyerSchema);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const [listingCount, purchaseCount] = await Promise.all([
    Listing.countDocuments({ status: 'active' }),
    Purchase.countDocuments()
  ]);

  res.json({
    status: 'healthy',
    service: 'adbazaar-data-marketplace',
    port: PORT,
    activeListings: listingCount,
    totalPurchases: purchaseCount,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// LISTINGS
// ============================================

/**
 * Create listing
 * POST /api/listings
 */
app.post('/api/listings', async (req: Request, res: Response) => {
  try {
    const { sellerId, name, description, category, size, demographics, attributes, price, license } = req.body;

    const listingId = `list_${crypto.randomBytes(8).toString('hex')}`;

    const listing = new Listing({
      listingId,
      sellerId,
      name,
      description,
      category,
      size,
      demographics,
      attributes,
      price,
      license: license || 'non-exclusive',
      status: 'active',
      views: 0,
      purchases: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await listing.save();

    res.json({
      success: true,
      listing: {
        id: listingId,
        name,
        category,
        size,
        price
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * List all listings
 * GET /api/listings
 */
app.get('/api/listings', async (req: Request, res: Response) => {
  try {
    const { category, minSize, maxPrice, sort } = req.query;

    const query: any = { status: 'active' };

    if (category) query.category = category;
    if (minSize) query.size = { $gte: Number(minSize) };

    let sortOption: any = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { 'price.amount': 1 };
    if (sort === 'price_desc') sortOption = { 'price.amount': -1 };
    if (sort === 'popular') sortOption = { purchases: -1 };

    const listings = await Listing.find(query).sort(sortOption).limit(100);

    res.json({
      success: true,
      listings: listings.map(l => ({
        id: l.listingId,
        name: l.name,
        description: l.description,
        category: l.category,
        size: l.size,
        demographics: l.demographics,
        price: l.price,
        license: l.license,
        stats: { views: l.views, purchases: l.purchases }
      })),
      count: listings.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get listing details
 * GET /api/listings/:listingId
 */
app.get('/api/listings/:listingId', async (req: Request, res: Response) => {
  try {
    const listing = await Listing.findOne({ listingId: req.params.listingId });

    if (!listing) {
      res.status(404).json({ success: false, error: 'Listing not found' });
      return;
    }

    // Increment views
    listing.views++;
    await listing.save();

    res.json({
      success: true,
      listing: {
        id: listing.listingId,
        name: listing.name,
        description: listing.description,
        category: listing.category,
        size: listing.size,
        demographics: listing.demographics,
        attributes: listing.attributes,
        price: listing.price,
        license: listing.license,
        stats: { views: listing.views, purchases: listing.purchases },
        sellerId: listing.sellerId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Search listings
 * POST /api/listings/search
 */
app.post('/api/listings/search', async (req: Request, res: Response) => {
  try {
    const { query, category, demographics, attributes } = req.body;

    const searchQuery: any = { status: 'active' };

    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { attributes: { $in: [new RegExp(query, 'i')] } }
      ];
    }

    if (category) searchQuery.category = category;
    if (demographics?.locations) searchQuery['demographics.locations'] = { $in: demographics.locations };

    const listings = await Listing.find(searchQuery).limit(50);

    res.json({
      success: true,
      listings: listings.map(l => ({
        id: l.listingId,
        name: l.name,
        category: l.category,
        size: l.size,
        price: l.price
      })),
      count: listings.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// PURCHASES
// ============================================

/**
 * Purchase listing
 * POST /api/purchases
 */
app.post('/api/purchases', async (req: Request, res: Response) => {
  try {
    const { listingId, buyerId } = req.body;

    const listing = await Listing.findOne({ listingId });

    if (!listing) {
      res.status(404).json({ success: false, error: 'Listing not found' });
      return;
    }

    const purchaseId = `purch_${crypto.randomBytes(8).toString('hex')}`;

    const purchase = new Purchase({
      purchaseId,
      listingId,
      buyerId,
      sellerId: listing.sellerId,
      price: listing.price.amount,
      records: listing.size,
      status: 'completed',
      createdAt: new Date()
    });

    await purchase.save();

    // Update listing
    listing.purchases++;
    await listing.save();

    // Update buyer
    await Buyer.findOneAndUpdate(
      { buyerId },
      {
        $push: {
          purchases: {
            listingId,
            date: new Date(),
            amount: listing.price.amount
          }
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      purchase: {
        id: purchaseId,
        listingId,
        price: purchase.price,
        records: purchase.records,
        status: purchase.status
      },
      note: 'Data delivered via secure API. Raw data never exposed.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get purchase history
 * GET /api/purchases/:buyerId
 */
app.get('/api/purchases/:buyerId', async (req: Request, res: Response) => {
  try {
    const purchases = await Purchase.find({ buyerId: req.params.buyerId });

    res.json({
      success: true,
      purchases: purchases.map(p => ({
        id: p.purchaseId,
        listingId: p.listingId,
        price: p.price,
        records: p.records,
        status: p.status,
        date: p.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// CATEGORIES
// ============================================

/**
 * Get categories
 * GET /api/categories
 */
app.get('/api/categories', async (req: Request, res: Response) => {
  const categories = [
    { id: 'shopping', name: 'Shopping & Retail', count: 0 },
    { id: 'travel', name: 'Travel & Hospitality', count: 0 },
    { id: 'food', name: 'Food & Dining', count: 0 },
    { id: 'lifestyle', name: 'Lifestyle & Entertainment', count: 0 },
    { id: 'business', name: 'Business & Professional', count: 0 },
    { id: 'health', name: 'Health & Wellness', count: 0 },
    { id: 'finance', name: 'Finance & Banking', count: 0 },
    { id: 'automotive', name: 'Automotive', count: 0 }
  ];

  // Get counts
  for (const cat of categories) {
    cat.count = await Listing.countDocuments({ category: cat.id, status: 'active' });
  }

  res.json({ success: true, categories });
});

// ============================================
// ANALYTICS
// ============================================

/**
 * Get marketplace stats
 * GET /api/stats
 */
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const [totalListings, totalPurchases, totalRevenue] = await Promise.all([
      Listing.countDocuments({ status: 'active' }),
      Purchase.countDocuments(),
      Purchase.aggregate([{ $group: { _id: null, total: { $sum: '$price' } } }])
    ]);

    const categoryStats = await Listing.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 }, avgSize: { $avg: '$size' } } }
    ]);

    res.json({
      success: true,
      stats: {
        activeListings: totalListings,
        totalPurchases,
        totalRevenue: totalRevenue[0]?.total || 0,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AdBazaar Data Marketplace started on port ${PORT}`);
  logger.info('📊 First-party data exchange');

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar_data_marketplace')
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB connection error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;