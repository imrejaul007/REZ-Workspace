/**
 * REE Franchise Mode
 *
 * Franchise management and operations
 * Port: 3006
 *
 * Features:
 * - Franchisee onboarding
 * - Royalty calculations
 * - Territory management
 * - Performance tracking
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const PORT = parseInt(process.env.PORT || '3006', 10);

// Types
type FranchiseeStatus = 'applicant' | 'approved' | 'active' | 'suspended' | 'terminated';
type RoyaltyType = 'fixed' | 'percentage' | 'tiered';

interface Franchisee {
  id: string;
  name: string;
  business_name: string;
  status: FranchiseeStatus;
  franchise_type: string;
  territory: {
    region: string;
    city: string;
    zones: string[];
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  financial: {
    initial_fee: number;
    royalty_type: RoyaltyType;
    royalty_rate: number;
    monthly_sales: number;
    total_revenue: number;
  };
  performance: {
    score: number;
    rank: number;
    orders: number;
    customers: number;
    avg_order_value: number;
    growth_rate: number;
  };
  metrics: {
    months_active: number;
    total_orders: number;
    total_customers: number;
    total_revenue_generated: number;
  };
  created_at: string;
  approved_at?: string;
  last_activity?: string;
}

interface Territory {
  id: string;
  region: string;
  city: string;
  zones: string[];
  franchisee_id?: string;
  population?: number;
  potential_revenue: number;
  status: 'available' | 'assigned' | 'reserved';
}

interface RoyaltyPayment {
  id: string;
  franchisee_id: string;
  period: string;
  sales_amount: number;
  royalty_amount: number;
  status: 'pending' | 'processed' | 'disputed';
  due_date: string;
  paid_at?: string;
}

// In-memory storage
const franchisees = new Map<string, Franchisee>();
const territories = new Map<string, Territory>();
const royaltyPayments = new Map<string, RoyaltyPayment[]>();

// Initialize with sample data
const sampleFranchisees: Franchisee[] = [
  {
    id: 'franchise_mumbai_001',
    name: 'Rajesh Kumar',
    business_name: 'Mumbai Central REZ Store',
    status: 'active',
    franchise_type: 'standard',
    territory: { region: 'west', city: 'Mumbai', zones: ['central', 'south'] },
    contact: { email: 'rajesh@rezstore.in', phone: '+919876543210', address: 'Shop 12, Main Road, Mumbai' },
    financial: { initial_fee: 500000, royalty_type: 'percentage', royalty_rate: 8, monthly_sales: 2500000, total_revenue: 30000000 },
    performance: { score: 85, rank: 3, orders: 45000, customers: 12000, avg_order_value: 550, growth_rate: 15 },
    metrics: { months_active: 18, total_orders: 45000, total_customers: 12000, total_revenue_generated: 30000000 },
    created_at: new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    approved_at: new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    last_activity: new Date().toISOString()
  },
  {
    id: 'franchise_delhi_001',
    name: 'Priya Sharma',
    business_name: 'Delhi NCR REZ Hub',
    status: 'active',
    franchise_type: 'premium',
    territory: { region: 'north', city: 'Delhi', zones: ['noida', 'gurgaon'] },
    contact: { email: 'priya@rezhub.in', phone: '+919876543211', address: 'B-12, Sector 18, Noida' },
    financial: { initial_fee: 1000000, royalty_type: 'tiered', royalty_rate: 6, monthly_sales: 5000000, total_revenue: 60000000 },
    performance: { score: 92, rank: 1, orders: 85000, customers: 25000, avg_order_value: 590, growth_rate: 22 },
    metrics: { months_active: 24, total_orders: 85000, total_customers: 25000, total_revenue_generated: 60000000 },
    created_at: new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    approved_at: new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    last_activity: new Date().toISOString()
  },
  {
    id: 'franchise_bangalore_001',
    name: 'Arun Patel',
    business_name: 'Bangalore Tech REZ',
    status: 'active',
    franchise_type: 'standard',
    territory: { region: 'south', city: 'Bangalore', zones: ['whitefield', 'marathahalli'] },
    contact: { email: 'arun@techrez.in', phone: '+919876543212', address: '44, IT Park Road, Bangalore' },
    financial: { initial_fee: 750000, royalty_type: 'percentage', royalty_rate: 7, monthly_sales: 3000000, total_revenue: 36000000 },
    performance: { score: 78, rank: 5, orders: 52000, customers: 15000, avg_order_value: 580, growth_rate: 12 },
    metrics: { months_active: 14, total_orders: 52000, total_customers: 15000, total_revenue_generated: 36000000 },
    created_at: new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    approved_at: new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    last_activity: new Date().toISOString()
  }
];

sampleFranchisees.forEach(f => {
  franchisees.set(f.id, f);
  royaltyPayments.set(f.id, []);
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  const list = Array.from(franchisees.values());
  res.json({
    status: 'healthy',
    service: 'franchise-mode',
    version: '1.0.0',
    franchisees_count: list.length,
    active_count: list.filter(f => f.status === 'active').length,
    total_revenue: list.reduce((sum, f) => sum + f.financial.total_revenue, 0),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// FRANCHISEE MANAGEMENT
// ============================================

app.get('/api/franchisees', (req: Request, res: Response) => {
  const { status, city, franchise_type, min_score } = req.query;

  let result = Array.from(franchisees.values());

  if (status) result = result.filter(f => f.status === status);
  if (city) result = result.filter(f => f.territory.city.toLowerCase() === (city as string).toLowerCase());
  if (franchise_type) result = result.filter(f => f.franchise_type === franchise_type);
  if (min_score) result = result.filter(f => f.performance.score >= parseFloat(min_score as string));

  result.sort((a, b) => b.performance.score - a.performance.score);

  res.json({ franchisees: result, count: result.length });
});

app.get('/api/franchisees/:id', (req: Request, res: Response) => {
  const franchisee = franchisees.get(req.params.id);
  if (!franchisee) {
    res.status(404).json({ error: 'Franchisee not found' });
    return;
  }
  res.json({ franchisee });
});

app.post('/api/franchisees', (req: Request, res: Response) => {
  try {
    const { name, business_name, franchise_type, territory, contact, financial } = req.body;

    if (!name || !business_name || !franchise_type) {
      res.status(400).json({ error: 'Missing required fields: name, business_name, franchise_type' });
      return;
    }

    const franchisee: Franchisee = {
      id: `franchise_${uuidv4()}`,
      name,
      business_name,
      status: 'applicant',
      franchise_type,
      territory: territory || { region: '', city: '', zones: [] },
      contact: contact || { email: '', phone: '', address: '' },
      financial: financial || { initial_fee: 0, royalty_type: 'percentage', royalty_rate: 0, monthly_sales: 0, total_revenue: 0 },
      performance: { score: 0, rank: 0, orders: 0, customers: 0, avg_order_value: 0, growth_rate: 0 },
      metrics: { months_active: 0, total_orders: 0, total_customers: 0, total_revenue_generated: 0 },
      created_at: new Date().toISOString()
    };

    franchisees.set(franchisee.id, franchisee);
    royaltyPayments.set(franchisee.id, []);

    res.json({ success: true, franchisee });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put('/api/franchisees/:id', (req: Request, res: Response) => {
  const franchisee = franchisees.get(req.params.id);
  if (!franchisee) {
    res.status(404).json({ error: 'Franchisee not found' });
    return;
  }

  const { status, territory, contact, financial } = req.body;

  if (status) {
    franchisee.status = status;
    if (status === 'active' && !franchisee.approved_at) {
      franchisee.approved_at = new Date().toISOString();
    }
  }
  if (territory) franchisee.territory = { ...franchisee.territory, ...territory };
  if (contact) franchisee.contact = { ...franchisee.contact, ...contact };
  if (financial) franchisee.financial = { ...franchisee.financial, ...financial };

  franchisee.last_activity = new Date().toISOString();
  franchisees.set(franchisee.id, franchisee);

  res.json({ success: true, franchisee });
});

// ============================================
// TERRITORY MANAGEMENT
// ============================================

app.get('/api/territories', (req: Request, res: Response) => {
  const { city, status } = req.query;

  let result = Array.from(territories.values());

  if (city) result = result.filter(t => t.city.toLowerCase() === (city as string).toLowerCase());
  if (status) result = result.filter(t => t.status === status);

  res.json({ territories: result, count: result.length });
});

app.post('/api/territories', (req: Request, res: Response) => {
  const { region, city, zones, population, potential_revenue } = req.body;

  if (!region || !city) {
    res.status(400).json({ error: 'Missing required fields: region, city' });
    return;
  }

  const territory: Territory = {
    id: `territory_${uuidv4()}`,
    region,
    city,
    zones: zones || [],
    population,
    potential_revenue: potential_revenue || 0,
    status: 'available'
  };

  territories.set(territory.id, territory);

  res.json({ success: true, territory });
});

app.post('/api/territories/:id/assign', (req: Request, res: Response) => {
  const territory = territories.get(req.params.id);
  if (!territory) {
    res.status(404).json({ error: 'Territory not found' });
    return;
  }

  const { franchisee_id } = req.body;

  if (!franchisee_id) {
    res.status(400).json({ error: 'Missing required field: franchisee_id' });
    return;
  }

  const franchisee = franchisees.get(franchisee_id);
  if (!franchisee) {
    res.status(404).json({ error: 'Franchisee not found' });
    return;
  }

  territory.franchisee_id = franchisee_id;
  territory.status = 'assigned';
  territories.set(territory.id, territory);

  franchisee.territory = {
    region: territory.region,
    city: territory.city,
    zones: territory.zones
  };
  franchisees.set(franchisee.id, franchisee);

  res.json({ success: true, territory });
});

// ============================================
// ROYALTY MANAGEMENT
// ============================================

app.get('/api/franchisees/:id/royalties', (req: Request, res: Response) => {
  const payments = royaltyPayments.get(req.params.id) || [];
  const { status, period } = req.query;

  let result = payments;

  if (status) result = result.filter(p => p.status === status);
  if (period) result = result.filter(p => p.period === period);

  res.json({ payments: result, count: result.length });
});

app.post('/api/royalties/calculate', (req: Request, res: Response) => {
  const { franchisee_id, period, sales_amount } = req.body;

  if (!franchisee_id || !period || sales_amount === undefined) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const franchisee = franchisees.get(franchisee_id);
  if (!franchisee) {
    res.status(404).json({ error: 'Franchisee not found' });
    return;
  }

  let royaltyAmount = 0;

  switch (franchisee.financial.royalty_type) {
    case 'percentage':
      royaltyAmount = sales_amount * (franchisee.financial.royalty_rate / 100);
      break;
    case 'fixed':
      royaltyAmount = franchisee.financial.royalty_rate;
      break;
    case 'tiered':
      // Tiered calculation
      if (sales_amount > 5000000) {
        royaltyAmount = sales_amount * 0.08;
      } else if (sales_amount > 2000000) {
        royaltyAmount = sales_amount * 0.06;
      } else {
        royaltyAmount = sales_amount * 0.05;
      }
      break;
  }

  const payment: RoyaltyPayment = {
    id: `payment_${uuidv4()}`,
    franchisee_id,
    period,
    sales_amount,
    royalty_amount: royaltyAmount,
    status: 'pending',
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
  };

  const payments = royaltyPayments.get(franchisee_id) || [];
  payments.push(payment);
  royaltyPayments.set(franchisee_id, payments);

  res.json({
    success: true,
    payment,
    franchisee: {
      id: franchisee.id,
      name: franchisee.business_name,
      royalty_type: franchisee.financial.royalty_type,
      royalty_rate: franchisee.financial.royalty_rate
    }
  });
});

app.post('/api/royalties/:id/process', (req: Request, res: Response) => {
  let found = false;

  for (const [franchiseeId, payments] of royaltyPayments.entries()) {
    const payment = payments.find(p => p.id === req.params.id);
    if (payment) {
      payment.status = 'processed';
      payment.paid_at = new Date().toISOString();
      royaltyPayments.set(franchiseeId, payments);
      found = true;
      break;
    }
  }

  if (!found) {
    res.status(404).json({ error: 'Payment not found' });
    return;
  }

  res.json({ success: true });
});

// ============================================
// PERFORMANCE
// ============================================

app.get('/api/leaderboard', (req: Request, res: Response) => {
  const list = Array.from(franchisees.values())
    .filter(f => f.status === 'active')
    .sort((a, b) => b.performance.score - a.performance.score)
    .map((f, i) => ({ ...f, rank: i + 1 }));

  res.json({ leaderboard: list });
});

app.get('/api/franchisees/:id/performance', (req: Request, res: Response) => {
  const franchisee = franchisees.get(req.params.id);
  if (!franchisee) {
    res.status(404).json({ error: 'Franchisee not found' });
    return;
  }

  res.json({
    franchisee_id: franchisee.id,
    business_name: franchisee.business_name,
    performance: franchisee.performance,
    metrics: franchisee.metrics,
    financial: {
      monthly_sales: franchisee.financial.monthly_sales,
      total_revenue: franchisee.financial.total_revenue,
      royalty_rate: franchisee.financial.royalty_rate
    },
    territory: franchisee.territory
  });
});

app.post('/api/franchisees/:id/sync-metrics', (req: Request, res: Response) => {
  const franchisee = franchisees.get(req.params.id);
  if (!franchisee) {
    res.status(404).json({ error: 'Franchisee not found' });
    return;
  }

  const { orders, customers, avg_order_value, monthly_sales } = req.body;

  if (orders !== undefined) {
    const orderDiff = orders - franchisee.metrics.total_orders;
    franchisee.performance.orders = orders;
    franchisee.metrics.total_orders = orders;
    if (orderDiff > 0 && franchisee.metrics.months_active > 0) {
      franchisee.performance.growth_rate = ((orders / franchisee.metrics.months_active) / 30) * 100;
    }
  }

  if (customers !== undefined) {
    franchisee.performance.customers = customers;
    franchisee.metrics.total_customers = customers;
  }

  if (avg_order_value !== undefined) {
    franchisee.performance.avg_order_value = avg_order_value;
  }

  if (monthly_sales !== undefined) {
    franchisee.financial.monthly_sales = monthly_sales;
    franchisee.financial.total_revenue += monthly_sales;
    franchisee.metrics.total_revenue_generated = franchisee.financial.total_revenue;
  }

  // Recalculate score
  franchisee.performance.score = calculateScore(franchisee);

  franchisee.last_activity = new Date().toISOString();
  franchisees.set(franchisee.id, franchisee);

  res.json({ success: true, performance: franchisee.performance });
});

function calculateScore(f: Franchisee): number {
  let score = 50; // Base

  // Growth rate contribution
  score += Math.min(20, f.performance.growth_rate * 0.5);

  // Order volume contribution
  score += Math.min(15, f.performance.orders / 1000);

  // Customer satisfaction (implied by growth)
  score += f.performance.growth_rate > 15 ? 10 : f.performance.growth_rate > 10 ? 5 : 0;

  // Avg order value contribution
  score += f.performance.avg_order_value > 500 ? 5 : 0;

  return Math.min(100, Math.round(score));
}

// ============================================
// ANALYTICS
// ============================================

app.get('/api/analytics/dashboard', (req: Request, res: Response) => {
  const list = Array.from(franchisees.values());

  const byCity = list.reduce((acc, f) => {
    acc[f.territory.city] = (acc[f.territory.city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalRevenue = list.reduce((sum, f) => sum + f.financial.total_revenue, 0);
  const totalOrders = list.reduce((sum, f) => sum + f.metrics.total_orders, 0);
  const avgScore = list.length > 0 ? list.reduce((sum, f) => sum + f.performance.score, 0) / list.length : 0;

  res.json({
    summary: {
      total_franchisees: list.length,
      active: list.filter(f => f.status === 'active').length,
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      avg_performance_score: Math.round(avgScore),
      total_royalty_revenue: totalRevenue * 0.07
    },
    by_city: byCity,
    top_performers: [...list]
      .sort((a, b) => b.performance.score - a.performance.score)
      .slice(0, 5)
      .map(f => ({ id: f.id, name: f.business_name, score: f.performance.score }))
  });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Franchise Mode Error]', err);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`REE Franchise Mode - Port ${PORT}`);
  console.log(`  → Franchisees: GET/POST /api/franchisees`);
  console.log(`  → Territories: GET/POST /api/territories`);
  console.log(`  → Royalties: POST /api/royalties/calculate`);
  console.log(`  → Leaderboard: GET /api/leaderboard`);
  console.log(`  → Analytics: GET /api/analytics/dashboard`);
});

export default app;