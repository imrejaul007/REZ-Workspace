/**
 * MIND-GROCERY Service - Grocery Vertical AI
 *
 * REE Service for grocery-specific intelligence:
 * - Product recommendations
 * - Demand forecasting
 * - Inventory optimization
 * - Category insights
 *
 * Port: 3008
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3008;
const SERVICE_KEY = process.env.SERVICE_KEY || 'ree-mind-grocery-key';

// ============================================
// IN-MEMORY STORAGE
// ============================================

interface GroceryProduct {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  stock: number;
  reorderPoint: number;
  salesHistory: { date: string; quantity: number; revenue: number }[];
  supplier: string;
  lastRestocked: string;
  expiryDays?: number;
  isOrganic?: boolean;
  brand: string;
}

interface DemandForecast {
  productId: string;
  date: string;
  predictedDemand: number;
  confidence: number;
  factors: string[];
  season?: string;
  trend?: 'up' | 'down' | 'stable';
}

interface Recommendation {
  id: string;
  userId: string;
  productId: string;
  score: number;
  reason: 'frequently_bought' | 'similar_users' | 'seasonal' | 'promotion' | 'complementary';
  expiresAt: string;
}

interface InventoryAlert {
  id: string;
  productId: string;
  type: 'low_stock' | 'overstock' | 'expiring' | 'out_of_stock';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  createdAt: string;
  resolved: boolean;
}

interface CategoryInsight {
  category: string;
  totalProducts: number;
  totalRevenue: number;
  avgPrice: number;
  topProducts: string[];
  trending: boolean;
  growthRate: number;
  seasonality: { peak: string; low: string };
}

// Storage
const products: Map<string, GroceryProduct> = new Map();
const forecasts: Map<string, DemandForecast> = new Map();
const recommendations: Map<string, Recommendation> = new Map();
const alerts: Map<string, InventoryAlert> = new Map();
const categoryInsights: Map<string, CategoryInsight> = new Map();

// ============================================
// SEED DATA
// ============================================

function seedInitialData() {
  // Seed grocery products
  const seedProducts: GroceryProduct[] = [
    {
      id: 'grc-001',
      name: 'Organic Whole Milk 1L',
      category: 'dairy',
      subcategory: 'milk',
      price: 85,
      stock: 150,
      reorderPoint: 50,
      salesHistory: [
        { date: '2026-06-01', quantity: 45, revenue: 3825 },
        { date: '2026-06-02', quantity: 52, revenue: 4420 },
        { date: '2026-06-03', quantity: 48, revenue: 4080 },
        { date: '2026-06-04', quantity: 61, revenue: 5185 },
        { date: '2026-06-05', quantity: 55, revenue: 4675 },
        { date: '2026-06-06', quantity: 78, revenue: 6630 },
        { date: '2026-06-07', quantity: 82, revenue: 6970 }
      ],
      supplier: 'FreshFarm Dairy',
      lastRestocked: '2026-06-08',
      expiryDays: 7,
      isOrganic: true,
      brand: 'FreshFarm'
    },
    {
      id: 'grc-002',
      name: 'Basmati Rice5kg',
      category: 'grains',
      subcategory: 'rice',
      price: 450,
      stock: 80,
      reorderPoint: 30,
      salesHistory: [
        { date: '2026-06-01', quantity: 12, revenue: 5400 },
        { date: '2026-06-02', quantity: 15, revenue: 6750 },
        { date: '2026-06-03', quantity: 18, revenue: 8100 },
        { date: '2026-06-04', quantity: 14, revenue: 6300 },
        { date: '2026-06-05', quantity: 22, revenue: 9900 },
        { date: '2026-06-06', quantity: 19, revenue: 8550 },
        { date: '2026-06-07', quantity: 25, revenue: 11250 }
      ],
      supplier: 'Royal grains',
      lastRestocked: '2026-06-05',
      brand: 'Royal'
    },
    {
      id: 'grc-003',
      name: 'Fresh Tomatoes 500g',
      category: 'vegetables',
      subcategory: 'tomatoes',
      price: 45,
      stock: 200,
      reorderPoint: 75,
      salesHistory: [
        { date: '2026-06-01', quantity: 85, revenue: 3825 },
        { date: '2026-06-02', quantity: 92, revenue: 4140 },
        { date: '2026-06-03', quantity: 78, revenue: 3510 },
        { date: '2026-06-04', quantity: 105, revenue: 4725 },
        { date: '2026-06-05', quantity: 88, revenue: 3960 },
        { date: '2026-06-06', quantity: 120, revenue: 5400 },
        { date: '2026-06-07', quantity: 135, revenue: 6075 }
      ],
      supplier: 'Farm Fresh',
      lastRestocked: '2026-06-10',
      expiryDays: 5,
      brand: 'Local Farm'
    },
    {
      id: 'grc-004',
      name: 'Organic Bananas 1kg',
      category: 'fruits',
      subcategory: 'bananas',
      price: 65,
      stock: 180,
      reorderPoint: 60,
      salesHistory: [
        { date: '2026-06-01', quantity: 72, revenue: 4680 },
        { date: '2026-06-02', quantity: 68, revenue: 4420 },
        { date: '2026-06-03', quantity: 85, revenue: 5525 },
        { date: '2026-06-04', quantity: 90, revenue: 5850 },
        { date: '2026-06-05', quantity: 75, revenue: 4875 },
        { date: '2026-06-06', quantity: 95, revenue: 6175 },
        { date: '2026-06-07', quantity: 110, revenue: 7150 }
      ],
      supplier: 'Tropical Farms',
      lastRestocked: '2026-06-09',
      expiryDays: 4,
      isOrganic: true,
      brand: 'EcoBanana'
    },
    {
      id: 'grc-005',
      name: 'Whole Wheat Bread',
      category: 'bakery',
      subcategory: 'bread',
      price: 35,
      stock: 45,
      reorderPoint: 40,
      salesHistory: [
        { date: '2026-06-01', quantity: 38, revenue: 1330 },
        { date: '2026-06-02', quantity: 42, revenue: 1470 },
        { date: '2026-06-03', quantity: 35, revenue: 1225 },
        { date: '2026-06-04', quantity: 50, revenue: 1750 },
        { date: '2026-06-05', quantity: 48, revenue: 1680 },
        { date: '2026-06-06', quantity: 55, revenue: 1925 },
        { date: '2026-06-07', quantity: 60, revenue: 2100 }
      ],
      supplier: 'Artisan Bakery',
      lastRestocked: '2026-06-10',
      expiryDays: 3,
      brand: 'Artisan'
    },
    {
      id: 'grc-006',
      name: 'Green Tea 100 bags',
      category: 'beverages',
      subcategory: 'tea',
      price: 180,
      stock: 120,
      reorderPoint: 40,
      salesHistory: [
        { date: '2026-06-01', quantity: 25, revenue: 4500 },
        { date: '2026-06-02', quantity: 28, revenue: 5040 },
        { date: '2026-06-03', quantity: 22, revenue: 3960 },
        { date: '2026-06-04', quantity: 30, revenue: 5400 },
        { date: '2026-06-05', quantity: 35, revenue: 6300 },
        { date: '2026-06-06', quantity: 32, revenue: 5760 },
        { date: '2026-06-07', quantity: 40, revenue: 7200 }
      ],
      supplier: 'Tea Gardens Co',
      lastRestocked: '2026-06-06',
      brand: 'GreenLeaf'
    },
    {
      id: 'grc-007',
      name: 'Chicken Breast 500g',
      category: 'meat',
      subcategory: 'chicken',
      price: 220,
      stock: 60,
      reorderPoint: 35,
      salesHistory: [
        { date: '2026-06-01', quantity: 42, revenue: 9240 },
        { date: '2026-06-02', quantity: 38, revenue: 8360 },
        { date: '2026-06-03', quantity: 55, revenue: 12100 },
        { date: '2026-06-04', quantity: 48, revenue: 10560 },
        { date: '2026-06-05', quantity: 65, revenue: 14300 },
        { date: '2026-06-06', quantity: 72, revenue: 15840 },
        { date: '2026-06-07', quantity: 80, revenue: 17600 }
      ],
      supplier: 'Fresh Poultry',
      lastRestocked: '2026-06-10',
      expiryDays: 3,
      brand: 'FarmFresh'
    },
    {
      id: 'grc-008',
      name: 'Almond Milk 1L',
      category: 'dairy',
      subcategory: 'milk_alternatives',
      price: 120,
      stock: 90,
      reorderPoint: 30,
      salesHistory: [
        { date: '2026-06-01', quantity: 28, revenue: 3360 },
        { date: '2026-06-02', quantity: 32, revenue: 3840 },
        { date: '2026-03', quantity: 25, revenue: 3000 },
        { date: '2026-06-04', quantity: 38, revenue: 4560 },
        { date: '2026-06-05', quantity: 42, revenue: 5040 },
        { date: '2026-06-06', quantity: 35, revenue: 4200 },
        { date: '2026-06-07', quantity: 48, revenue: 5760 }
      ],
      supplier: 'Nutty Foods',
      lastRestocked: '2026-06-08',
      expiryDays: 14,
      isOrganic: true,
      brand: 'NuttyDelight'
    }
  ];

  seedProducts.forEach(p => products.set(p.id, p));

  // Seed category insights
  const categories = ['dairy', 'grains', 'vegetables', 'fruits', 'bakery', 'beverages', 'meat'];
  categories.forEach(cat => {
    const catProducts = Array.from(products.values()).filter(p => p.category === cat);
    const totalRevenue = catProducts.reduce((sum, p) =>
      sum + p.salesHistory.reduce((s, h) => s + h.revenue, 0), 0);
    const avgPrice = catProducts.length > 0
      ? catProducts.reduce((sum, p) => sum + p.price, 0) / catProducts.length : 0;

    categoryInsights.set(cat, {
      category: cat,
      totalProducts: catProducts.length,
      totalRevenue,
      avgPrice,
      topProducts: catProducts.sort((a, b) => {
        const aRev = a.salesHistory.reduce((s, h) => s + h.revenue, 0);
        const bRev = b.salesHistory.reduce((s, h) => s + h.revenue, 0);
        return bRev - aRev;
      }).slice(0, 3).map(p => p.id),
      trending: Math.random() > 0.3,
      growthRate: (Math.random() * 30 - 10) / 100,
      seasonality: { peak: 'June', low: 'February' }
    });
  });

  console.log(`[Mind-Grocery] Seeded ${products.size} products and ${categoryInsights.size} category insights`);
}

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Auth middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-service-key'];
  if (key !== SERVICE_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'mind-grocery',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', (req, res) => {
  res.json({
    status: 'ready',
    products: products.size,
    forecasts: forecasts.size,
    recommendations: recommendations.size
  });
});

// ============================================
// PRODUCT ENDPOINTS
// ============================================

// Get all products
app.get('/api/products', (req, res) => {
  const { category, subcategory, organic, minPrice, maxPrice, inStock } = req.query;

  let result = Array.from(products.values());

  if (category) {
    result = result.filter(p => p.category === category);
  }
  if (subcategory) {
    result = result.filter(p => p.subcategory === subcategory);
  }
  if (organic === 'true') {
    result = result.filter(p => p.isOrganic);
  }
  if (minPrice) {
    result = result.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    result = result.filter(p => p.price <= Number(maxPrice));
  }
  if (inStock === 'true') {
    result = result.filter(p => p.stock > 0);
  }

  res.json({ success: true, data: result, total: result.length });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const product = products.get(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  res.json({ success: true, data: product });
});

// Create product
app.post('/api/products', authMiddleware, (req, res) => {
  const { name, category, subcategory, price, stock, reorderPoint, supplier, brand, expiryDays, isOrganic } = req.body;

  if (!name || !category || !price) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const id = `grc-${Date.now()}`;
  const product: GroceryProduct = {
    id,
    name,
    category,
    subcategory: subcategory || category,
    price,
    stock: stock || 0,
    reorderPoint: reorderPoint || 20,
    salesHistory: [],
    supplier: supplier || 'Unknown',
    lastRestocked: new Date().toISOString().split('T')[0],
    brand: brand || 'Generic',
    expiryDays,
    isOrganic
  };

  products.set(id, product);
  res.status(201).json({ success: true, data: product });
});

// Update product
app.put('/api/products/:id', authMiddleware, (req, res) => {
  const product = products.get(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const updated = { ...product, ...req.body, id: product.id };
  products.set(product.id, updated);
  res.json({ success: true, data: updated });
});

// Delete product
app.delete('/api/products/:id', authMiddleware, (req, res) => {
  if (!products.has(req.params.id)) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  products.delete(req.params.id);
  res.json({ success: true, message: 'Product deleted' });
});

// Record sale
app.post('/api/products/:id/sale', authMiddleware, (req, res) => {
  const product = products.get(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const { quantity } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid quantity' });
  }

  product.stock = Math.max(0, product.stock - quantity);
  product.salesHistory.push({
    date: new Date().toISOString().split('T')[0],
    quantity,
    revenue: quantity * product.price
  });

  // Check for low stock alert
  if (product.stock <= product.reorderPoint) {
    const alert: InventoryAlert = {
      id: `alert-${Date.now()}`,
      productId: product.id,
      type: product.stock === 0 ? 'out_of_stock' : 'low_stock',
      severity: product.stock === 0 ? 'critical' : 'high',
      message: `${product.name} is ${product.stock === 0 ? 'out of stock' : 'running low'} (${product.stock} remaining)`,
      createdAt: new Date().toISOString(),
      resolved: false
    };
    alerts.set(alert.id, alert);
  }

  products.set(product.id, product);
  res.json({ success: true, data: product });
});

// Restock product
app.post('/api/products/:id/restock', authMiddleware, (req, res) => {
  const product = products.get(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const { quantity } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid quantity' });
  }

  product.stock += quantity;
  product.lastRestocked = new Date().toISOString().split('T')[0];

  // Resolve any low stock alerts
  for (const [id, alert] of alerts) {
    if (alert.productId === product.id && !alert.resolved) {
      alerts.set(id, { ...alert, resolved: true });
    }
  }

  products.set(product.id, product);
  res.json({ success: true, data: product });
});

// ============================================
// DEMAND FORECASTING
// ============================================

// Get demand forecast
app.get('/api/forecast/demand', (req, res) => {
  const { productId, days } = req.query;
  const forecastDays = Number(days) || 7;

  if (productId) {
    const product = products.get(productId as string);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const forecast = generateForecast(product, forecastDays);
    res.json({ success: true, data: forecast });
  } else {
    // Generate forecasts for all products
    const allForecasts: DemandForecast[] = [];
    for (const product of products.values()) {
      allForecasts.push(...generateForecast(product, forecastDays));
    }
    res.json({ success: true, data: allForecasts });
  }
});

// Generate forecast for a product
function generateForecast(product: GroceryProduct, days: number): DemandForecast[] {
  const forecasts: DemandForecast[] = [];
  const avgDailySales = product.salesHistory.length > 0
    ? product.salesHistory.reduce((s, h) => s + h.quantity, 0) / product.salesHistory.length
    : 10;

  // Calculate trend
  const recentSales = product.salesHistory.slice(-3);
  const olderSales = product.salesHistory.slice(0, 3);
  const recentAvg = recentSales.reduce((s, h) => s + h.quantity, 0) / (recentSales.length || 1);
  const olderAvg = olderSales.reduce((s, h) => s + h.quantity, 0) / (olderSales.length || 1);
  const trend: 'up' | 'down' | 'stable' = recentAvg > olderAvg * 1.1 ? 'up'
    : recentAvg < olderAvg * 0.9 ? 'down' : 'stable';

  // Seasonality factor (simplified)
  const month = new Date().getMonth();
  const seasonalFactor = [0.8, 0.75, 0.85, 0.9, 0.95, 1.1, 1.2, 1.15, 1.0, 0.95, 0.9, 1.1][month];

  for (let i = 1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const baseDemand = avgDailySales * seasonalFactor;
    const trendFactor = trend === 'up' ? 1 + (i * 0.02) : trend === 'down' ? 1 - (i * 0.02) : 1;
    const predictedDemand = Math.round(baseDemand * trendFactor);

    forecasts.push({
      productId: product.id,
      date: date.toISOString().split('T')[0],
      predictedDemand,
      confidence: 0.85 - (i * 0.02), // Confidence decreases over time
      factors: [
        trend === 'up' ? 'Upward sales trend' : trend === 'down' ? 'Downward sales trend' : 'Stable sales',
        `Seasonal factor: ${seasonalFactor.toFixed(2)}`,
        `Historical avg: ${avgDailySales.toFixed(1)} units/day`
      ],
      season: getSeason(month),
      trend
    });
  }

  return forecasts;
}

function getSeason(month: number): string {
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
}

// ============================================
// INVENTORY OPTIMIZATION
// ============================================

// Get inventory status
app.get('/api/inventory/status', (req, res) => {
  const allProducts = Array.from(products.values());

  const overstocked = allProducts.filter(p => p.stock > p.reorderPoint * 5);
  const lowStock = allProducts.filter(p => p.stock > 0 && p.stock <= p.reorderPoint);
  const outOfStock = allProducts.filter(p => p.stock === 0);
  const healthy = allProducts.filter(p => p.stock > p.reorderPoint && p.stock <= p.reorderPoint * 5);

  res.json({
    success: true,
    data: {
      total: allProducts.length,
      overstocked: overstocked.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      healthy: healthy.length,
      inventoryValue: allProducts.reduce((s, p) => s + p.stock * p.price, 0),
      products: {
        overstocked,
        lowStock,
        outOfStock,
        healthy
      }
    }
  });
});

// Get reorder recommendations
app.get('/api/inventory/reorder', (req, res) => {
  const reorderList: Array<{
    product: GroceryProduct;
    recommendedQuantity: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
  }> = [];

  for (const product of products.values()) {
    if (product.stock <= product.reorderPoint) {
      // Calculate recommended quantity based on sales velocity
      const avgDailySales = product.salesHistory.length > 0
        ? product.salesHistory.reduce((s, h) => s + h.quantity, 0) / product.salesHistory.length
        : 10;

      const daysUntilRestock = 3; // Assume restock takes 3 days
      const recommendedQuantity = Math.ceil(avgDailySales *14); // 2 weeks stock
 const daysOfStock = product.stock / avgDailySales;

      let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      let reason = `Stock will last ${daysOfStock.toFixed(1)} days`;

      if (daysOfStock <= 1) {
        urgency = 'critical';
        reason = 'Critical: Stock depleted within 1 day';
      } else if (daysOfStock <= 2) {
        urgency = 'high';
        reason = 'Urgent: Stock will last less than 2 days';
      } else if (daysOfStock <= daysUntilRestock) {
        urgency = 'high';
        reason = 'Reorder needed before next delivery';
      }

      reorderList.push({ product, recommendedQuantity, urgency, reason });
    }
  }

  // Sort by urgency
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  reorderList.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  res.json({ success: true, data: reorderList });
});

// ============================================
// RECOMMENDATIONS
// ============================================

// Get recommendations for user
app.get('/api/recommendations/:userId', (req, res) => {
  const userRecs = Array.from(recommendations.values())
    .filter(r => r.userId === req.params.userId)
    .filter(r => new Date(r.expiresAt) > new Date());

  // If no recommendations, generate some
  if (userRecs.length === 0) {
    const topProducts = Array.from(products.values())
      .sort((a, b) => {
        const aRev = a.salesHistory.reduce((s, h) => s + h.revenue, 0);
        const bRev = b.salesHistory.reduce((s, h) => s + h.revenue, 0);
        return bRev - aRev;
      })
      .slice(0, 5);

    const newRecs = topProducts.map((p, i) => ({
      id: `rec-${Date.now()}-${i}`,
      userId: req.params.userId,
      productId: p.id,
      score: 0.9 - (i * 0.1),
      reason: 'frequently_bought' as const,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }));

    newRecs.forEach(r => recommendations.set(r.id, r));
    return res.json({ success: true, data: newRecs });
  }

  res.json({ success: true, data: userRecs });
});

// Create recommendation
app.post('/api/recommendations', authMiddleware, (req, res) => {
  const { userId, productId, score, reason } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const product = products.get(productId);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const recommendation: Recommendation = {
    id: `rec-${Date.now()}`,
    userId,
    productId,
    score: score || 0.5,
    reason: reason || 'frequently_bought',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  recommendations.set(recommendation.id, recommendation);
  res.status(201).json({ success: true, data: recommendation });
});

// ============================================
// CATEGORY INSIGHTS
// ============================================

// Get category insights
app.get('/api/insights/categories', (req, res) => {
  const { category } = req.query;

  if (category) {
    const insight = categoryInsights.get(category as string);
    if (!insight) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    return res.json({ success: true, data: insight });
  }

  res.json({
    success: true,
    data: Array.from(categoryInsights.values())
  });
});

// Get trending products
app.get('/api/insights/trending', (req, res) => {
  const trending = Array.from(products.values())
    .map(p => {
      const recentSales = p.salesHistory.slice(-3);
      const olderSales = p.salesHistory.slice(-7, -3);
      const recentAvg = recentSales.reduce((s, h) => s + h.quantity, 0) / (recentSales.length || 1);
      const olderAvg = olderSales.reduce((s, h) => s + h.quantity, 0) / (olderSales.length || 1);
      const growthRate = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;

      return {
        ...p,
        growthRate,
        recentAvg,
        olderAvg
      };
    })
    .filter(p => p.growthRate > 0.1)
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, 10);

  res.json({ success: true, data: trending });
});

// ============================================
// ALERTS
// ============================================

// Get all alerts
app.get('/api/alerts', (req, res) => {
  const { resolved, type, severity } = req.query;

  let result = Array.from(alerts.values());

  if (resolved !== undefined) {
    result = result.filter(a => a.resolved === (resolved === 'true'));
  }
  if (type) {
    result = result.filter(a => a.type === type);
  }
  if (severity) {
    result = result.filter(a => a.severity === severity);
  }

  res.json({ success: true, data: result });
});

// Resolve alert
app.put('/api/alerts/:id/resolve', authMiddleware, (req, res) => {
  const alert = alerts.get(req.params.id);
  if (!alert) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }

  alerts.set(alert.id, { ...alert, resolved: true });
  res.json({ success: true, data: alert });
});

// ============================================
// ANALYTICS
// ============================================

// Get analytics dashboard
app.get('/api/analytics/dashboard', (req, res) => {
  const allProducts = Array.from(products.values());

  const totalRevenue = allProducts.reduce((s, p) =>
    s + p.salesHistory.reduce((ss, h) => ss + h.revenue, 0), 0);
  const totalUnitsSold = allProducts.reduce((s, p) =>
    s + p.salesHistory.reduce((ss, h) => ss + h.quantity, 0), 0);
  const avgOrderValue = totalUnitsSold > 0 ? totalRevenue / totalUnitsSold : 0;

  // Top selling products
  const topProducts = allProducts
    .map(p => ({
      ...p,
      totalRevenue: p.salesHistory.reduce((s, h) => s + h.revenue, 0),
      totalUnits: p.salesHistory.reduce((s, h) => s + h.quantity, 0)
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  // Category performance
  const categoryPerformance = Array.from(categoryInsights.values())
    .map(c => ({
      ...c,
      avgDailySales: c.totalRevenue / (7 * c.totalProducts)
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  res.json({
    success: true,
    data: {
      summary: {
        totalProducts: allProducts.length,
        totalRevenue,
        totalUnitsSold,
        avgOrderValue
      },
      topProducts,
      categoryPerformance,
      alerts: {
        total: alerts.size,
        unresolved: Array.from(alerts.values()).filter(a => !a.resolved).length,
        critical: Array.from(alerts.values()).filter(a => a.severity === 'critical' && !a.resolved).length
      }
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Mind-Grocery] Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// ============================================
// SERVER START
// ============================================

function startServer() {
  seedInitialData();

  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║              MIND-GROCERY - Grocery Vertical AI          ║
╠════════════════════════════════════════════════════════════╣
║  Port:     ${PORT} ║
║  Health:   http://localhost:${PORT}/health                    ║
║  API:      http://localhost:${PORT}/api                       ║
║  Products: ${products.size}                                       ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
}

process.on('SIGTERM', () => {
  console.log('[Mind-Grocery] SIGTERM received, shutting down...');
  process.exit(0);
});

startServer();

export default app;
