/**
 * BIZORA Procurement OS
 * B2B Procurement Marketplace
 * Suppliers, RFQ, Purchase Orders, Inventory
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// ============================================================================
// Types
// ============================================================================

interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  moq: number;
  price: number;
  supplierId: string;
  supplier: string;
  rating: number;
  verified: boolean;
}

interface Supplier {
  id: string;
  name: string;
  category: string[];
  location: { city: string; state: string };
  rating: number;
  completedOrders: number;
  verified: boolean;
  responseTime: number;
  minOrder: number;
  deliveryTime: string;
}

interface RFQ {
  id: string;
  buyerId: string;
  products: { name: string; quantity: number; unit: string }[];
  status: 'open' | 'quotes_received' | 'awarded' | 'closed';
  quotes: Quote[];
  createdAt: Date;
}

interface Quote {
  supplierId: string;
  supplierName: string;
  items: { name: string; quantity: number; unitPrice: number; total: number }[];
  totalAmount: number;
  deliveryTime: string;
  validUntil: Date;
}

interface PurchaseOrder {
  id: string;
  rfqId: string;
  supplierId: string;
  buyerId: string;
  items: { productId: string; name: string; quantity: number; unitPrice: number; total: number }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'completed';
  paymentStatus: 'pending' | 'partial' | 'paid';
  timeline: { status: string; date: Date }[];
}

// ============================================================================
// Sample Data
// ============================================================================

const SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'FoodPro Supplies', category: ['Food', 'Packaging'], location: { city: 'Mumbai', state: 'Maharashtra' }, rating: 4.5, completedOrders: 234, verified: true, responseTime: 2, minOrder: 5000, deliveryTime: '2-3 days' },
  { id: 's2', name: 'PackMart India', category: ['Packaging', 'Disposables'], location: { city: 'Delhi', state: 'Delhi' }, rating: 4.2, completedOrders: 156, verified: true, responseTime: 4, minOrder: 3000, deliveryTime: '3-5 days' },
  { id: 's3', name: 'HotelStore Pro', category: ['Equipment', 'Linens'], location: { city: 'Bangalore', state: 'Karnataka' }, rating: 4.7, completedOrders: 312, verified: true, responseTime: 1, minOrder: 10000, deliveryTime: '5-7 days' },
  { id: 's4', name: 'ChefChoice Supplies', category: ['Ingredients', 'Spices'], location: { city: 'Hyderabad', state: 'Telangana' }, rating: 4.3, completedOrders: 89, verified: true, responseTime: 3, minOrder: 5000, deliveryTime: '2-4 days' },
  { id: 's5', name: 'SafetyFirst Corp', category: ['Safety', 'Equipment'], location: { city: 'Pune', state: 'Maharashtra' }, rating: 4.6, completedOrders: 178, verified: true, responseTime: 2, minOrder: 2000, deliveryTime: '3-5 days' },
];

const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Disposable Gloves (100 pcs)', category: 'Packaging', brand: 'SafeTouch', unit: 'box', moq: 10, price: 250, supplierId: 's1', supplier: 'FoodPro Supplies', rating: 4.5, verified: true },
  { id: 'p2', name: 'Takeaway Containers (500ml)', category: 'Packaging', brand: 'EcoPack', unit: 'box', moq: 20, price: 450, supplierId: 's2', supplier: 'PackMart India', rating: 4.2, verified: true },
  { id: 'p3', name: 'Kitchen Aprons (Set of 5)', category: 'Uniforms', brand: 'ChefStyle', unit: 'set', moq: 5, price: 1200, supplierId: 's3', supplier: 'HotelStore Pro', rating: 4.7, verified: true },
  { id: 'p4', name: 'Ginger-Garlic Paste (1kg)', category: 'Ingredients', brand: 'FreshFirst', unit: 'kg', moq: 10, price: 180, supplierId: 's4', supplier: 'ChefChoice Supplies', rating: 4.3, verified: true },
  { id: 'p5', name: 'First Aid Kit', category: 'Safety', brand: 'SafetyFirst', unit: 'unit', moq: 2, price: 850, supplierId: 's5', supplier: 'SafetyFirst Corp', rating: 4.6, verified: true },
  { id: 'p6', name: 'Hand Sanitizer (5L)', category: 'Safety', brand: 'Sanigel', unit: 'can', moq: 5, price: 650, supplierId: 's5', supplier: 'SafetyFirst Corp', rating: 4.6, verified: true },
  { id: 'p7', name: 'Cooking Oil (15L)', category: 'Ingredients', brand: 'SunGrow', unit: 'drum', moq: 3, price: 2100, supplierId: 's1', supplier: 'FoodPro Supplies', rating: 4.5, verified: true },
  { id: 'p8', name: 'Paper Napkins (1000 pcs)', category: 'Disposables', brand: 'SoftTouch', unit: 'pack', moq: 10, price: 380, supplierId: 's2', supplier: 'PackMart India', rating: 4.2, verified: true },
];

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'procurement-os',
    suppliers: SUPPLIERS.length,
    products: PRODUCTS.length,
    timestamp: new Date().toISOString(),
  });
});

// Get categories
app.get('/api/categories', (_req: Request, res: Response) => {
  const categories = [...new Set(PRODUCTS.map(p => p.category)];
  res.json({ categories });
});

// Get suppliers
app.get('/api/suppliers', (req: Request, res: Response) => {
  const { category, city } = req.query;
  let suppliers = [...SUPPLIERS];
  if (category) suppliers = suppliers.filter(s => s.category.includes(category as string));
  if (city) suppliers = suppliers.filter(s => s.location.city === city);
  res.json({ suppliers });
});

// Get products
app.get('/api/products', (req: Request, res: Response) => {
  const { category, supplierId, search } = req.query;
  let products = [...PRODUCTS];
  if (category) products = products.filter(p => p.category === category);
  if (supplierId) products = products.filter(p => p.supplierId === supplierId);
  if (search) products = products.filter(p =>
    p.name.toLowerCase().includes((search as string).toLowerCase())
  );
  res.json({ products });
});

// Create RFQ
app.post('/api/rfq', (req: Request, res: Response) => {
  const { buyerId, items } = req.body;
  const rfq: RFQ = {
    id: `rfq_${Date.now()}`,
    buyerId,
    products: items,
    status: 'open',
    quotes: [],
    createdAt: new Date(),
  };
  res.status(201).json({
    rfqId: rfq.id,
    status: 'created',
    message: `RFQ created. ${items.length} items. Waiting for supplier quotes.`,
  });
});

// Get quotes for RFQ
app.get('/api/rfq/:id/quotes', (req: Request, res: Response) => {
  // Mock quotes
  const quotes: Quote[] = [
    {
      supplierId: 's1',
      supplierName: 'FoodPro Supplies',
      items: req.body?.items?.map((i: any) => ({ name: i.name, quantity: i.quantity, unitPrice: 100 + Math.random() * 200, total: 0 })) || [],
      totalAmount: 15000 + Math.random() * 10000,
      deliveryTime: '2-3 days',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  ];
  res.json({ quotes });
});

// Create Purchase Order
app.post('/api/orders', (req: Request, res: Response) => {
  const { buyerId, supplierId, items, totalAmount } = req.body;
  const order: PurchaseOrder = {
    id: `po_${Date.now()}`,
    rfqId: req.body.rfqId,
    supplierId,
    buyerId,
    items,
    totalAmount,
    status: 'pending',
    paymentStatus: 'pending',
    timeline: [{ status: 'Order Created', date: new Date() }],
  };
  res.status(201).json({
    orderId: order.id,
    status: 'created',
    message: 'Purchase order created. Awaiting confirmation.',
  });
});

// Get orders
app.get('/api/orders', (req: Request, res: Response) => {
  const { buyerId } = req.query;
  res.json({
    orders: [
      {
        id: 'po_001',
        supplier: 'FoodPro Supplies',
        items: 5,
        totalAmount: 25000,
        status: 'shipped',
        paymentStatus: 'pending',
        deliveryDate: '2026-05-27',
      },
    ],
    summary: { pending: 3, shipped: 2, delivered: 12 },
  });
});

// Business insights from REZ Intelligence
app.get('/api/insights', (_req: Request, res: Response) => {
  res.json({
    insights: [
      { type: 'price_alert', message: 'Cooking oil prices up 8% this month. Consider bulk buying.' },
      { type: 'supplier_match', message: 'FoodPro Supplies has 5 products you frequently buy. 3% loyalty discount available.' },
      { type: 'demand_forecast', message: 'Ramadan approaching - demand for packaging will increase 40%. Stock up now.' },
    ],
    recommendations: [
      { action: 'Bulk Order', potential: 'Save 12%', reason: 'Volume discount' },
      { action: 'Switch Supplier', potential: 'Save 8%', reason: 'Better rates nearby' },
    ],
  });
});

// Track delivery
app.get('/api/orders/:id/track', (_req: Request, res: Response) => {
  res.json({
    status: 'shipped',
    eta: '2026-05-27 3:00 PM',
    lastUpdate: 'Out for delivery',
    tracking: [
      { status: 'Order Confirmed', time: '2026-05-24 10:00 AM' },
      { status: 'Processing', time: '2026-05-24 2:00 PM' },
      { status: 'Shipped', time: '2026-05-25 9:00 AM' },
      { status: 'Out for Delivery', time: '2026-05-27 8:00 AM' },
    ],
  });
});

app.listen(4053, () => {
  logger.info(`
╔═══════════════════════════════════════════════╗
║  📦 Procurement OS                            ║
║  B2B Marketplace for Businesses             ║
║  Port: 4053                                ║
║                                             ║
║  Features:                                  ║
║  • Supplier directory                        ║
║  • RFQ management                          ║
║  • Purchase orders                          ║
║  • Delivery tracking                        ║
║  • AI insights                             ║
╚═══════════════════════════════════════════════╝
  `);
});
