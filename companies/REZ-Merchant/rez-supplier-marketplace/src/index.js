/**
 * REZ Supplier Marketplace
 * B2B supplier directory and procurement platform
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// In-memory data stores
const suppliers = new Map();
const products = new Map();
const orders = new Map();
const categories = new Map();
const reviews = new Map();
const quotes = new Map();

// Mock data seeding
const seedData = () => {
  // Sample categories
  const sampleCategories = [
    { id: 'CAT001', name: 'Electronics', description: 'Electronic components and devices' },
    { id: 'CAT002', name: 'Raw Materials', description: 'Industrial raw materials' },
    { id: 'CAT003', name: 'Packaging', description: 'Packaging materials and supplies' },
    { id: 'CAT004', name: 'Office Supplies', description: 'Office and stationery items' },
    { id: 'CAT005', name: 'Cleaning Supplies', description: 'Cleaning and hygiene products' },
  ];

  sampleCategories.forEach(c => categories.set(c.id, c));

  // Sample suppliers
  const sampleSuppliers = [
    { id: 'SUP001', name: 'TechParts Inc', email: 'sales@techparts.com', phone: '9876543210', category: 'CAT001', rating: 4.5, verified: true, minOrder: 5000 },
    { id: 'SUP002', name: 'SteelWorks Ltd', email: 'orders@steelworks.com', phone: '9876543211', category: 'CAT002', rating: 4.2, verified: true, minOrder: 25000 },
    { id: 'SUP003', name: 'PackRight Solutions', email: 'contact@packright.com', phone: '9876543212', category: 'CAT003', rating: 4.8, verified: true, minOrder: 2000 },
  ];

  sampleSuppliers.forEach(s => {
    suppliers.set(s.id, {
      ...s,
      status: 'active',
      location: { city: 'Mumbai', state: 'Maharashtra' },
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  // Sample products
  const sampleProducts = [
    { id: 'PRD001', supplierId: 'SUP001', name: 'LED Display 7-segment', sku: 'LED-7SEG-001', price: 45, minQty: 100, category: 'CAT001' },
    { id: 'PRD002', supplierId: 'SUP001', name: 'Microcontroller ATmega328', sku: 'MCU-ATMEGA-328', price: 120, minQty: 50, category: 'CAT001' },
    { id: 'PRD003', supplierId: 'SUP002', name: 'Steel Sheet 2mm', sku: 'STL-SHT-2MM', price: 850, minQty: 10, category: 'CAT002' },
    { id: 'PRD004', supplierId: 'SUP003', name: 'Corrugated Box Large', sku: 'BOX-CRG-LRG', price: 25, minQty: 500, category: 'CAT003' },
  ];

  sampleProducts.forEach(p => {
    products.set(p.id, {
      ...p,
      status: 'active',
      stock: 1000,
      createdAt: new Date()
    });
  });
};

seedData();

// ============================================================================
// Health Endpoint
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-supplier-marketplace',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    suppliers: suppliers.size,
    products: products.size
  });
});

// ============================================================================
// Supplier Management
// ============================================================================

/**
 * Register new supplier
 * POST /api/suppliers
 */
app.post('/api/suppliers', (req, res) => {
  try {
    const { name, email, phone, category, minOrder, address, city, state } = req.body;

    if (!name || !email || !phone || !category) {
      return res.status(400).json({ error: 'Missing required fields: name, email, phone, category' });
    }

    const supplierId = `SUP-${uuidv4().slice(0, 8).toUpperCase()}`;

    const supplier = {
      id: supplierId,
      name,
      email,
      phone,
      category,
      minOrder: minOrder || 0,
      rating: 0,
      verified: false,
      status: 'active',
      address: address || null,
      location: { city: city || 'N/A', state: state || 'N/A' },
      totalOrders: 0,
      totalRevenue: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    suppliers.set(supplierId, supplier);

    res.status(201).json({ success: true, supplierId, supplier });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register supplier' });
  }
});

/**
 * Get all suppliers
 * GET /api/suppliers
 */
app.get('/api/suppliers', (req, res) => {
  try {
    const { category, verified, status, minRating, city } = req.query;
    let result = Array.from(suppliers.values());

    if (category) {
      result = result.filter(s => s.category === category);
    }
    if (verified === 'true') {
      result = result.filter(s => s.verified);
    }
    if (status) {
      result = result.filter(s => s.status === status);
    }
    if (minRating) {
      result = result.filter(s => s.rating >= parseFloat(minRating));
    }
    if (city) {
      result = result.filter(s => s.location?.city?.toLowerCase() === city.toLowerCase());
    }

    res.json({ suppliers: result, total: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

/**
 * Get supplier by ID
 * GET /api/suppliers/:supplierId
 */
app.get('/api/suppliers/:supplierId', (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = suppliers.get(supplierId);

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Get supplier products
    const supplierProducts = Array.from(products.values()).filter(p => p.supplierId === supplierId);

    res.json({
      ...supplier,
      products: supplierProducts,
      productCount: supplierProducts.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
});

/**
 * Update supplier
 * PUT /api/suppliers/:supplierId
 */
app.put('/api/suppliers/:supplierId', (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = suppliers.get(supplierId);

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const { name, email, phone, category, minOrder, status, verified, address } = req.body;

    if (name) supplier.name = name;
    if (email) supplier.email = email;
    if (phone) supplier.phone = phone;
    if (category) supplier.category = category;
    if (minOrder !== undefined) supplier.minOrder = minOrder;
    if (status) supplier.status = status;
    if (verified !== undefined) supplier.verified = verified;
    if (address) supplier.address = address;
    supplier.updatedAt = new Date();

    suppliers.set(supplierId, supplier);

    res.json({ success: true, supplier });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

/**
 * Verify supplier
 * POST /api/suppliers/:supplierId/verify
 */
app.post('/api/suppliers/:supplierId/verify', (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = suppliers.get(supplierId);

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    supplier.verified = true;
    supplier.verifiedAt = new Date();
    supplier.updatedAt = new Date();

    suppliers.set(supplierId, supplier);

    res.json({ success: true, supplier });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify supplier' });
  }
});

/**
 * Delete supplier
 * DELETE /api/suppliers/:supplierId
 */
app.delete('/api/suppliers/:supplierId', (req, res) => {
  try {
    const { supplierId } = req.params;

    if (!suppliers.has(supplierId)) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    suppliers.delete(supplierId);

    res.json({ success: true, message: 'Supplier deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

// ============================================================================
// Product Management
// ============================================================================

/**
 * Add product to marketplace
 * POST /api/products
 */
app.post('/api/products', (req, res) => {
  try {
    const { supplierId, name, sku, price, minQty, category, description, stock, unit } = req.body;

    if (!supplierId || !name || !sku || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields: supplierId, name, sku, price' });
    }

    const supplier = suppliers.get(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const productId = `PRD-${uuidv4().slice(0, 8).toUpperCase()}`;

    const product = {
      id: productId,
      supplierId,
      supplierName: supplier.name,
      name,
      sku,
      price: parseFloat(price),
      minQty: minQty || 1,
      category: category || supplier.category,
      description: description || null,
      stock: stock || 0,
      unit: unit || 'units',
      status: 'active',
      createdAt: new Date()
    };

    products.set(productId, product);

    res.status(201).json({ success: true, productId, product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add product' });
  }
});

/**
 * Search products
 * GET /api/products
 */
app.get('/api/products', (req, res) => {
  try {
    const { category, supplierId, minPrice, maxPrice, search, inStock, limit, offset } = req.query;
    let result = Array.from(products.values());

    if (category) {
      result = result.filter(p => p.category === category);
    }
    if (supplierId) {
      result = result.filter(p => p.supplierId === supplierId);
    }
    if (minPrice) {
      result = result.filter(p => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      result = result.filter(p => p.price <= parseFloat(maxPrice));
    }
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }
    if (inStock === 'true') {
      result = result.filter(p => p.stock > 0);
    }

    // Pagination
    const limitNum = parseInt(limit) || 50;
    const offsetNum = parseInt(offset) || 0;
    const paginated = result.slice(offsetNum, offsetNum + limitNum);

    res.json({
      products: paginated,
      total: result.length,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search products' });
  }
});

/**
 * Get product by ID
 * GET /api/products/:productId
 */
app.get('/api/products/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    const product = products.get(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get supplier info
    const supplier = suppliers.get(product.supplierId);

    // Get reviews
    const productReviews = Array.from(reviews.values()).filter(r => r.productId === productId);

    res.json({
      ...product,
      supplier: supplier || null,
      reviews: productReviews,
      reviewCount: productReviews.length,
      avgRating: productReviews.length > 0
        ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
        : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

/**
 * Update product
 * PUT /api/products/:productId
 */
app.put('/api/products/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    const product = products.get(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, sku, price, minQty, category, description, stock, status } = req.body;

    if (name) product.name = name;
    if (sku) product.sku = sku;
    if (price !== undefined) product.price = parseFloat(price);
    if (minQty !== undefined) product.minQty = minQty;
    if (category) product.category = category;
    if (description !== undefined) product.description = description;
    if (stock !== undefined) product.stock = stock;
    if (status) product.status = status;

    products.set(productId, product);

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/**
 * Delete product
 * DELETE /api/products/:productId
 */
app.delete('/api/products/:productId', (req, res) => {
  try {
    const { productId } = req.params;

    if (!products.has(productId)) {
      return res.status(404).json({ error: 'Product not found' });
    }

    products.delete(productId);

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ============================================================================
// Order Management
// ============================================================================

/**
 * Place order
 * POST /api/orders
 */
app.post('/api/orders', (req, res) => {
  try {
    const { supplierId, items, shippingAddress, merchantId, notes } = req.body;

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: supplierId, items' });
    }

    const supplier = suppliers.get(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Calculate total
    let total = 0;
    const orderItems = items.map(item => {
      const product = products.get(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      const itemTotal = product.price * item.quantity;
      total += itemTotal;
      return {
        productId: item.productId,
        productName: product.name,
        sku: product.sku,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      };
    });

    // Check minimum order
    if (total < supplier.minOrder) {
      return res.status(400).json({
        error: `Order total must be at least ${supplier.minOrder}`,
        minimumOrder: supplier.minOrder,
        currentTotal: total
      });
    }

    const orderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;

    const order = {
      id: orderId,
      supplierId,
      supplierName: supplier.name,
      merchantId: merchantId || null,
      items: orderItems,
      total,
      status: 'pending',
      shippingAddress: shippingAddress || null,
      notes: notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    orders.set(orderId, order);

    // Update supplier stats
    supplier.totalOrders++;
    supplier.totalRevenue += total;
    suppliers.set(supplierId, supplier);

    res.status(201).json({ success: true, orderId, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get orders
 * GET /api/orders
 */
app.get('/api/orders', (req, res) => {
  try {
    const { supplierId, merchantId, status } = req.query;
    let result = Array.from(orders.values());

    if (supplierId) {
      result = result.filter(o => o.supplierId === supplierId);
    }
    if (merchantId) {
      result = result.filter(o => o.merchantId === merchantId);
    }
    if (status) {
      result = result.filter(o => o.status === status);
    }

    res.json({ orders: result, total: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * Get order by ID
 * GET /api/orders/:orderId
 */
app.get('/api/orders/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders.get(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * Update order status
 * PUT /api/orders/:orderId
 */
app.put('/api/orders/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingInfo } = req.body;
    const order = orders.get(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (status) order.status = status;
    if (trackingInfo) order.trackingInfo = trackingInfo;
    order.updatedAt = new Date();

    orders.set(orderId, order);

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ============================================================================
// Quote Management
// ============================================================================

/**
 * Request quote
 * POST /api/quotes
 */
app.post('/api/quotes', (req, res) => {
  try {
    const { supplierId, items, merchantId, notes } = req.body;

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: supplierId, items' });
    }

    const supplier = suppliers.get(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const quoteId = `QT-${uuidv4().slice(0, 8).toUpperCase()}`;

    const quote = {
      id: quoteId,
      supplierId,
      supplierName: supplier.name,
      merchantId: merchantId || null,
      items: items.map(item => ({
        productId: item.productId || null,
        productName: item.productName || null,
        description: item.description || null,
        quantity: item.quantity,
        estimatedPrice: item.estimatedPrice || null
      })),
      status: 'pending',
      notes: notes || null,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date()
    };

    quotes.set(quoteId, quote);

    res.status(201).json({ success: true, quoteId, quote });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

/**
 * Get quotes
 * GET /api/quotes
 */
app.get('/api/quotes', (req, res) => {
  try {
    const { supplierId, merchantId, status } = req.query;
    let result = Array.from(quotes.values());

    if (supplierId) {
      result = result.filter(q => q.supplierId === supplierId);
    }
    if (merchantId) {
      result = result.filter(q => q.merchantId === merchantId);
    }
    if (status) {
      result = result.filter(q => q.status === status);
    }

    res.json({ quotes: result, total: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

/**
 * Respond to quote
 * PUT /api/quotes/:quoteId
 */
app.put('/api/quotes/:quoteId', (req, res) => {
  try {
    const { quoteId } = req.params;
    const { status, proposedPrice, items } = req.body;
    const quote = quotes.get(quoteId);

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (status) quote.status = status;
    if (proposedPrice !== undefined) quote.proposedPrice = proposedPrice;
    if (items) quote.items = items;

    quotes.set(quoteId, quote);

    res.json({ success: true, quote });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update quote' });
  }
});

// ============================================================================
// Reviews
// ============================================================================

/**
 * Add review
 * POST /api/reviews
 */
app.post('/api/reviews', (req, res) => {
  try {
    const { productId, supplierId, orderId, rating, comment, merchantId } = req.body;

    if (!rating || (!productId && !supplierId)) {
      return res.status(400).json({ error: 'Missing required fields: rating, and either productId or supplierId' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const reviewId = `REV-${uuidv4().slice(0, 8).toUpperCase()}`;

    const review = {
      id: reviewId,
      productId: productId || null,
      supplierId: supplierId || null,
      orderId: orderId || null,
      merchantId: merchantId || null,
      rating,
      comment: comment || null,
      status: 'active',
      createdAt: new Date()
    };

    reviews.set(reviewId, review);

    // Update supplier rating
    if (supplierId) {
      const supplier = suppliers.get(supplierId);
      if (supplier) {
        const supplierReviews = Array.from(reviews.values()).filter(r => r.supplierId === supplierId);
        supplier.rating = supplierReviews.reduce((sum, r) => sum + r.rating, 0) / supplierReviews.length;
        suppliers.set(supplierId, supplier);
      }
    }

    res.status(201).json({ success: true, reviewId, review });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add review' });
  }
});

/**
 * Get reviews
 * GET /api/reviews
 */
app.get('/api/reviews', (req, res) => {
  try {
    const { productId, supplierId } = req.query;
    let result = Array.from(reviews.values());

    if (productId) {
      result = result.filter(r => r.productId === productId);
    }
    if (supplierId) {
      result = result.filter(r => r.supplierId === supplierId);
    }

    res.json({ reviews: result, total: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ============================================================================
// Categories
// ============================================================================

/**
 * Get all categories
 * GET /api/categories
 */
app.get('/api/categories', (req, res) => {
  try {
    const categoryList = Array.from(categories.values());
    const result = categoryList.map(cat => {
      const supplierCount = Array.from(suppliers.values()).filter(s => s.category === cat.id).length;
      const productCount = Array.from(products.values()).filter(p => p.category === cat.id).length;
      return { ...cat, supplierCount, productCount };
    });

    res.json({ categories: result, total: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ============================================================================
// Reports & Analytics
// ============================================================================

/**
 * Get marketplace statistics
 * GET /api/reports/stats
 */
app.get('/api/reports/stats', (req, res) => {
  try {
    const totalSuppliers = suppliers.size;
    const verifiedSuppliers = Array.from(suppliers.values()).filter(s => s.verified).length;
    const totalProducts = products.size;
    const totalOrders = orders.size;
    const totalRevenue = Array.from(orders.values()).reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = Array.from(orders.values()).filter(o => o.status === 'pending').length;
    const completedOrders = Array.from(orders.values()).filter(o => o.status === 'delivered' || o.status === 'completed').length;

    res.json({
      suppliers: { total: totalSuppliers, verified: verifiedSuppliers },
      products: { total: totalProducts },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        revenue: totalRevenue
      },
      categories: categories.size,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * Get top suppliers
 * GET /api/reports/top-suppliers
 */
app.get('/api/reports/top-suppliers', (req, res) => {
  try {
    const { limit } = req.query;
    const limitNum = parseInt(limit) || 10;

    const topSuppliers = Array.from(suppliers.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limitNum)
      .map(s => ({
        id: s.id,
        name: s.name,
        rating: s.rating,
        verified: s.verified,
        totalOrders: s.totalOrders,
        totalRevenue: s.totalRevenue
      }));

    res.json({ suppliers: topSuppliers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch top suppliers' });
  }
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 4630;

const server = app.listen(PORT, () => {
  console.log(`REZ Supplier Marketplace running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
export { server };