/**
 * BIZORA BusinessOS Dashboard Service
 * Unified Dashboard Aggregating All Services
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.PORT || 4030;
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const TAXFLOW_SERVICE = process.env.TAXFLOW_SERVICE_URL || 'http://localhost:4004';
const INVOICEFLOW_SERVICE = process.env.INVOICEFLOW_SERVICE_URL || 'http://localhost:4005';
const FINANCE_SERVICE = process.env.FINANCE_SERVICE_URL || 'http://localhost:4022';
const VENDOR_MATCH = process.env.VENDOR_MATCH_URL || 'http://localhost:4020';
const ADVISOR = process.env.ADVISOR_URL || 'http://localhost:4021';

// ============================================================================
// Express App
// ============================================================================

const app = express();
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  // Check all services
  const services = {
    auth: await checkService(AUTH_SERVICE),
    taxflow: await checkService(TAXFLOW_SERVICE),
    invoiceflow: await checkService(INVOICEFLOW_SERVICE),
    finance: await checkService(FINANCE_SERVICE),
    vendorMatch: await checkService(VENDOR_MATCH),
    advisor: await checkService(ADVISOR),
  };

  const allHealthy = Object.values(services).every(s => s.status === 'ok');

  res.json({
    status: allHealthy ? 'ok' : 'degraded',
    service: 'businessos-dashboard',
    timestamp: new Date().toISOString(),
    services,
  });
});

// ============================================================================
// Dashboard API
// ============================================================================

// Get complete business dashboard
app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId || 'demo-business';

    // Fetch data from all services in parallel
    const [taxflowData, invoiceData, financeData] = await Promise.allSettled([
      axios.get(`${TAXFLOW_SERVICE}/api/dashboard/stats`, {
        params: { businessId },
        timeout: 5000,
      }).catch(() => ({ data: null })),

      axios.get(`${INVOICEFLOW_SERVICE}/api/dashboard/stats`, {
        params: { businessId },
        timeout: 5000,
      }).catch(() => ({ data: null })),

      axios.get(`${FINANCE_SERVICE}/api/dashboard/stats`, {
        params: { businessId },
        timeout: 5000,
      }).catch(() => ({ data: null })),
    ]);

    // Aggregate dashboard data
    const dashboard = {
      timestamp: new Date().toISOString(),

      // Compliance Summary
      compliance: {
        status: 'compliant',
        nextDue: taxflowData.data?.upcomingDeadlines?.[0] || null,
        pendingFilings: taxflowData.data?.pendingFilings || 0,
      },

      // Financial Summary
      financials: {
        revenue: invoiceData.data?.totalRevenue || 0,
        outstanding: invoiceData.data?.totalOutstanding || 0,
        expenses: financeData.data?.totalExpenses || 0,
        netIncome: (invoiceData.data?.totalRevenue || 0) - (financeData.data?.totalExpenses || 0),
        currency: 'INR',
      },

      // Quick Stats
      stats: {
        invoices: {
          total: invoiceData.data?.totalInvoices || 0,
          paid: invoiceData.data?.paidInvoices || 0,
          pending: invoiceData.data?.overdueInvoices || 0,
        },
        tax: {
          pendingFilings: taxflowData.data?.pendingFilings || 0,
          totalTaxPayable: taxflowData.data?.totalTaxPayable || 0,
        },
      },

      // Recent Activity
      recentActivity: [
        { type: 'invoice', message: 'Invoice #INV-2026-001 paid', time: '2 hours ago' },
        { type: 'tax', message: 'GSTR-3B filing completed', time: '1 day ago' },
        { type: 'payment', message: 'Payment received ₹15,000', time: '2 days ago' },
      ],

      // Quick Actions
      quickActions: [
        { id: 'create-invoice', label: 'Create Invoice', icon: '📄', service: 'invoiceflow' },
        { id: 'file-tax', label: 'File GST Return', icon: '📜', service: 'taxflow' },
        { id: 'add-expense', label: 'Add Expense', icon: '💰', service: 'finance' },
        { id: 'find-vendor', label: 'Find Vendor', icon: '🔍', service: 'vendor-match' },
      ],
    };

    res.json(dashboard);
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get business profile
app.get('/api/profile', async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId || 'demo-business';

    // In production, this would fetch from TaxFlow or Auth service
    const profile = {
      id: businessId,
      name: 'Sample Restaurant Pvt Ltd',
      type: 'pvt_ltd',
      industry: 'restaurant',
      gstin: '27AAACH1234P1Z5',
      pan: 'AAACH1234P',
      email: 'accounts@samplerestaurant.com',
      phone: '+919876543210',
      address: {
        city: 'Mumbai',
        state: 'Maharashtra',
      },
      plan: 'growth',
      joinedAt: '2024-01-15',
    };

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get metrics for charts
app.get('/api/metrics', async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId || 'demo-business';
    const period = req.query.period || '30d';

    // Generate mock metrics data
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

    const labels: string[] = [];
    const revenue: number[] = [];
    const expenses: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));

      // Generate realistic mock data
      revenue.push(Math.floor(5000 + Math.random() * 15000));
      expenses.push(Math.floor(3000 + Math.random() * 8000));
    }

    res.json({
      period,
      labels,
      datasets: [
        { label: 'Revenue', data: revenue, color: '#10b981' },
        { label: 'Expenses', data: expenses, color: '#ef4444' },
      ],
      summary: {
        totalRevenue: revenue.reduce((a, b) => a + b, 0),
        totalExpenses: expenses.reduce((a, b) => a + b, 0),
        avgRevenue: Math.round(revenue.reduce((a, b) => a + b, 0) / revenue.length),
        avgExpenses: Math.round(expenses.reduce((a, b) => a + b, 0) / expenses.length),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get compliance status
app.get('/api/compliance', async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId || 'demo-business';

    const compliance = {
      status: 'compliant',
      score: 95,
      items: [
        {
          type: 'gst',
          name: 'GST Registration',
          status: 'active',
          number: '27AAACH1234P1Z5',
          nextDue: '2026-06-20',
          daysLeft: 28,
        },
        {
          type: 'pan',
          name: 'PAN Card',
          status: 'active',
          number: 'AAACH1234P',
        },
        {
          type: 'tds',
          name: 'TDS Compliance',
          status: 'compliant',
          nextDue: '2026-06-30',
          daysLeft: 38,
        },
      ],
      upcomingDeadlines: [
        { type: 'GSTR-3B', dueDate: '2026-06-20', daysLeft: 28 },
        { type: 'TDS', dueDate: '2026-06-30', daysLeft: 38 },
        { type: 'GSTR-1', dueDate: '2026-06-11', daysLeft: 19 },
      ],
      recentFilings: [
        { type: 'GSTR-3B', period: 'May 2026', status: 'filed', date: '2026-05-20' },
        { type: 'GSTR-1', period: 'May 2026', status: 'filed', date: '2026-05-11' },
      ],
    };

    res.json(compliance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch compliance status' });
  }
});

// Get invoices summary
app.get('/api/invoices/summary', async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId || 'demo-business';

    const summary = {
      total: 156,
      paid: 142,
      pending: 8,
      overdue: 6,
      totalRevenue: 4580000,
      totalOutstanding: 125000,
      currency: 'INR',
      byStatus: {
        draft: 12,
        issued: 45,
        paid: 142,
        overdue: 6,
        cancelled: 3,
      },
      recentInvoices: [
        { id: 'inv-1', number: 'INV-2026-156', customer: 'Tech Solutions', amount: 88500, status: 'issued', date: '2026-05-23' },
        { id: 'inv-2', number: 'INV-2026-155', customer: 'Food Supplies', amount: 47200, status: 'paid', date: '2026-05-20' },
        { id: 'inv-3', number: 'INV-2026-154', customer: 'Global Retail', amount: 125000, status: 'overdue', date: '2026-05-10' },
      ],
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get vendor recommendations
app.get('/api/vendors/recommendations', async (req: Request, res: Response) => {
  try {
    const { category, location } = req.query;

    // In production, this would call VendorMatch service
    const recommendations = {
      basedOn: { category: category || 'marketing', location: location || 'Mumbai' },
      topMatches: [
        {
          id: 'vendor-1',
          name: 'DigitalBuzz Agency',
          category: 'marketing',
          rating: 4.8,
          reviewCount: 127,
          priceRange: '₹5,000 - ₹1,00,000',
          badges: ['Top Rated', 'Fast Response'],
          matchScore: 95,
        },
        {
          id: 'vendor-2',
          name: 'TechServe Solutions',
          category: 'technology',
          rating: 4.6,
          reviewCount: 89,
          priceRange: '₹15,000 - ₹5,00,000',
          badges: ['Verified', 'Tech Expert'],
          matchScore: 88,
        },
        {
          id: 'vendor-3',
          name: 'CorpAssist CA',
          category: 'compliance',
          rating: 4.9,
          reviewCount: 245,
          priceRange: '₹2,000 - ₹50,000',
          badges: ['Top Rated', 'CA Verified'],
          matchScore: 92,
        },
      ],
    };

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendor recommendations' });
  }
});

// Get AI insights
app.get('/api/insights', async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId || 'demo-business';

    const insights = {
      healthScore: 85,
      level: 'good',
      summary: 'Your business is performing well with strong revenue growth.',
      insights: [
        {
          type: 'opportunity',
          title: 'Peak Season Opportunity',
          description: 'Festival season approaching - consider increasing marketing budget by 20%.',
          impact: 'high',
          action: 'Increase ad budget',
        },
        {
          type: 'tip',
          title: 'Invoice Reminders',
          description: '3 invoices are overdue. Send automated reminders to improve cash flow.',
          impact: 'medium',
          action: 'Send reminders',
        },
        {
          type: 'warning',
          title: 'GST Filing Due',
          description: 'GSTR-3B for May 2026 is due in 28 days.',
          impact: 'high',
          action: 'Prepare filing',
        },
      ],
      benchmarks: {
        revenueGrowth: { value: 25, percentile: 78 },
        profitMargin: { value: 18, percentile: 65 },
        customerRetention: { value: 42, percentile: 72 },
      },
    };

    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

async function checkService(url: string): Promise<{ status: string; latency?: number; error?: string }> {
  const start = Date.now();
  try {
    await axios.get(`${url}/health`, { timeout: 2000 });
    return { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    return { status: 'error', error: error instanceof Error ? error.message : 'Unknown' };
  }
}

// ============================================================================
// Start Server
// ============================================================================

const PORT_NUM = parseInt(String(PORT));

app.listen(PORT_NUM, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📊 BIZORA BusinessOS Dashboard Service              ║
║   Unified Dashboard for All Services                   ║
║                                                           ║
║   Port: ${PORT_NUM}                                             ║
║   Status: Running                                      ║
║                                                           ║
║   Aggregates data from:                               ║
║   • Auth Service                                      ║
║   • TaxFlow                                          ║
║   • InvoiceFlow                                      ║
║   • Finance                                          ║
║   • VendorMatch                                      ║
║   • Advisor                                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
