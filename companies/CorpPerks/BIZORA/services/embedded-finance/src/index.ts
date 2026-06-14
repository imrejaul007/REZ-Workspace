/**
 * BIZORA Embedded Finance Service
 * "The massive enterprise value layer"
 * Working capital, invoice financing, payroll advances, BNPL, vendor credit
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// ============================================================================
// Types
// ============================================================================

interface FinanceProduct {
  productId: string;
  name: string;
  tagline: string;
  type: 'working_capital' | 'invoice_financing' | 'payroll_advance' | 'vendor_credit' | 'bnpl' | 'ad_credit';
  description: string;
  eligibility: {
    minTrustScore: number;
    minMonths: number;
    minMRR: number;
    businessTypes: string[];
  };
  limits: {
    min: number;
    max: number;
    tenureDays: number;
  };
  pricing: {
    processingFee: number;
    interestRate: number;
    platformFee: number;
  };
  features: string[];
  documents: string[];
}

interface LoanApplication {
  id: string;
  businessId: string;
  productId: string;
  amount: number;
  purpose: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'defaulted';
  trustScore: number;
  eligibility: {
    eligible: boolean;
    reasons: string[];
  };
  terms: {
    amount: number;
    interestRate: number;
    tenureDays: number;
    emi: number;
  };
  timeline: { status: string; date: string }[];
  createdAt: string;
}

interface BNPLOrder {
  id: string;
  businessId: string;
  customerId: string;
  orderId: string;
  amount: number;
  tenure: number;
  installments: { due: string; amount: number; status: 'pending' | 'paid' | 'overdue' }[];
  status: 'active' | 'completed' | 'defaulted';
  merchantCommission: number;
}

// ============================================================================
// Finance Products
// ============================================================================

const products: FinanceProduct[] = [
  {
    productId: 'wc_basic',
    name: 'Working Capital Loan',
    tagline: 'Fuel your business growth',
    type: 'working_capital',
    description: 'Quick access to working capital for inventory, equipment, or expansion',
    eligibility: { minTrustScore: 70, minMonths: 6, minMRR: 50000, businessTypes: ['all'] },
    limits: { min: 100000, max: 5000000, tenureDays: 180 },
    pricing: { processingFee: 2, interestRate: 1.5, platformFee: 0.5 },
    features: ['Minimal documentation', '48-hour approval', 'Flexible repayment', 'No prepayment penalty'],
    documents: ['GST returns', 'Bank statements', 'Business proof'],
  },
  {
    productId: 'if_invoice',
    name: 'Invoice Financing',
    tagline: 'Get paid, not stuck waiting',
    type: 'invoice_financing',
    description: 'Convert unpaid invoices to immediate cash',
    eligibility: { minTrustScore: 65, minMonths: 3, minMRR: 30000, businessTypes: ['all'] },
    limits: { min: 25000, max: 2000000, tenureDays: 90 },
    pricing: { processingFee: 1, interestRate: 1.2, platformFee: 0.3 },
    features: ['Up to 90% invoice value', 'No collateral', 'Auto reconciliation', 'Digital process'],
    documents: ['Invoice copy', 'Delivery proof', 'Customer confirmation'],
  },
  {
    productId: 'pa_payroll',
    name: 'Payroll Advance',
    tagline: 'Never miss payroll again',
    type: 'payroll_advance',
    description: 'Cover payroll gaps without stress',
    eligibility: { minTrustScore: 75, minMonths: 6, minMRR: 100000, businessTypes: ['all'] },
    limits: { min: 50000, max: 5000000, tenureDays: 30 },
    pricing: { processingFee: 1.5, interestRate: 1.0, platformFee: 0.2 },
    features: ['Same-day approval', 'Auto salary credit', 'Staff never knows', 'Payroll integration'],
    documents: ['Staff list', 'Salary register', 'Bank statements'],
  },
  {
    productId: 'vc_vendor',
    name: 'Vendor Credit',
    tagline: 'Better terms with suppliers',
    type: 'vendor_credit',
    description: 'BIZORA pays vendors, you pay us later',
    eligibility: { minTrustScore: 70, minMonths: 6, minMRR: 50000, businessTypes: ['all'] },
    limits: { min: 50000, max: 1000000, tenureDays: 60 },
    pricing: { processingFee: 1, interestRate: 1.3, platformFee: 0.3 },
    features: ['Net-60 terms', 'Vendor benefits', 'Early payment discounts', 'Bulk ordering power'],
    documents: ['Vendor agreements', 'PO history'],
  },
  {
    productId: 'bnpl_merchant',
    name: 'BNPL for Customers',
    tagline: 'Boost sales with easy EMIs',
    type: 'bnpl',
    description: 'Offer your customers easy installments, we handle the rest',
    eligibility: { minTrustScore: 75, minMonths: 6, minMRR: 100000, businessTypes: ['retail', 'electronics', 'furniture', 'restaurant'] },
    limits: { min: 100000, max: 10000000, tenureDays: 180 },
    pricing: { processingFee: 2, interestRate: 1.5, platformFee: 0.5 },
    features: ['0% EMI options', 'Credit check customers', 'Default protection', 'Instant activation'],
    documents: ['Business registration', 'Product catalog', 'Processing history'],
  },
  {
    productId: 'ac_ad',
    name: 'Ad Credit Line',
    tagline: 'Scale your marketing',
    type: 'ad_credit',
    description: 'Finance your ad campaigns, pay from returns',
    eligibility: { minTrustScore: 72, minMonths: 3, minMRR: 50000, businessTypes: ['all'] },
    limits: { min: 25000, max: 500000, tenureDays: 90 },
    pricing: { processingFee: 1.5, interestRate: 1.8, platformFee: 0.5 },
    features: ['Direct to Google/Meta', 'Performance capped', 'Auto-optimization', 'ROI tracking'],
    documents: ['Ad account proof', 'Business verification'],
  },
];

// In-memory store
const applications: Map<string, LoanApplication> = new Map();
const bnplOrders: Map<string, BNPLOrder> = new Map();

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'embedded-finance',
    products: products.length,
    applications: applications.size,
  });
});

// List products
app.get('/api/products', (req: Request, res: Response) => {
  const { type, businessType } = req.query;

  let filtered = [...products];

  if (type) filtered = filtered.filter(p => p.type === type);
  if (businessType) filtered = filtered.filter(p =>
    p.eligibility.businessTypes.includes('all') || p.eligibility.businessTypes.includes(businessType as string)
  );

  res.json({
    products: filtered,
    categories: [...new Set(filtered.map(p => p.type))],
  });
});

// Get product details
app.get('/api/products/:id', (req: Request, res: Response) => {
  const product = products.find(p => p.productId === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Check eligibility
app.post('/api/check-eligibility', (req: Request, res: Response) => {
  const { businessId, productId, trustScore, mrr, monthsOnBizora } = req.body;

  const product = products.find(p => p.productId === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const reasons: string[] = [];
  let eligible = true;

  if ((trustScore || 0) < product.eligibility.minTrustScore) {
    eligible = false;
    reasons.push(`Trust Score ${trustScore} below minimum ${product.eligibility.minTrustScore}`);
  }

  if ((monthsOnBizora || 0) < product.eligibility.minMonths) {
    eligible = false;
    reasons.push(`Need ${product.eligibility.minMonths} months (you have ${monthsOnBizora})`);
  }

  if ((mrr || 0) < product.eligibility.minMRR) {
    eligible = false;
    reasons.push(`MRR ₹${(mrr || 0).toLocaleString()} below minimum ₹${product.eligibility.minMRR.toLocaleString()}`);
  }

  const maxAmount = eligible ? product.limits.max : 0;

  res.json({
    eligible,
    productId,
    reasons,
    maxAmount,
    suggestedAmount: eligible ? Math.min(maxAmount, (mrr || 0) * 3) : 0,
  });
});

// Apply for loan
app.post('/api/apply', (req: Request, res: Response) => {
  const { businessId, productId, amount, purpose } = req.body;

  const product = products.find(p => p.productId === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const id = `loan_${Date.now()}`;

  // Mock trust score check
  const trustScore = 70 + Math.random() * 25;
  const eligible = trustScore >= product.eligibility.minTrustScore;

  const application: LoanApplication = {
    id,
    businessId,
    productId,
    amount,
    purpose,
    status: eligible ? 'under_review' : 'rejected',
    trustScore: Math.round(trustScore),
    eligibility: {
      eligible,
      reasons: eligible ? ['Trust score meets requirements'] : ['Trust score below minimum'],
    },
    terms: eligible ? {
      amount,
      interestRate: product.pricing.interestRate,
      tenureDays: product.limits.tenureDays,
      emi: calculateEMI(amount, product.pricing.interestRate, product.limits.tenureDays),
    } : { amount: 0, interestRate: 0, tenureDays: 0, emi: 0 },
    timeline: [{ status: 'Application submitted', date: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
  };

  applications.set(id, application);

  res.status(201).json({
    applicationId: id,
    status: application.status,
    eligibility: application.eligibility,
    terms: application.terms,
    message: eligible
      ? 'Application under review. Decision in 24-48 hours.'
      : 'Unfortunately, you do not meet eligibility criteria. Work on improving your trust score.',
  });
});

// Get application status
app.get('/api/applications/:id', (req: Request, res: Response) => {
  const application = applications.get(req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  res.json(application);
});

// Get business applications
app.get('/api/businesses/:id/applications', (req: Request, res: Response) => {
  const businessApps = Array.from(applications.values())
    .filter(a => a.businessId === req.params.id);

  res.json({
    applications: businessApps,
    summary: {
      total: businessApps.length,
      approved: businessApps.filter(a => a.status === 'approved' || a.status === 'disbursed').length,
      pending: businessApps.filter(a => a.status === 'under_review' || a.status === 'submitted').length,
      disbursed: businessApps.filter(a => a.status === 'disbursed').reduce((sum, a) => sum + a.terms.amount, 0),
    },
  });
});

// BNPL: Customer checkout
app.post('/api/bnpl/checkout', (req: Request, res: Response) => {
  const { businessId, customerId, orderId, amount, tenure } = req.body;

  const installmentAmount = Math.round(amount / tenure);
  const installments = Array.from({ length: tenure }, (_, i) => ({
    due: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amount: installmentAmount,
    status: 'pending' as const,
  }));

  const bnpl: BNPLOrder = {
    id: `bnpl_${Date.now()}`,
    businessId,
    customerId,
    orderId,
    amount,
    tenure,
    installments,
    status: 'active',
    merchantCommission: amount * 0.01,
  };

  bnplOrders.set(bnpl.id, bnpl);

  res.status(201).json({
    bnplId: bnpl.id,
    installments: bnpl.installments,
    customerPays: installments.map(i => i.amount),
    merchantCommission: bnpl.merchantCommission,
    message: 'BNPL activated for customer',
  });
});

// Get BNPL orders
app.get('/api/businesses/:id/bnpl', (req: Request, res: Response) => {
  const orders = Array.from(bnplOrders.values())
    .filter(o => o.businessId === req.params.id);

  res.json({
    orders,
    summary: {
      total: orders.length,
      active: orders.filter(o => o.status === 'active').length,
      defaulted: orders.filter(o => o.status === 'defaulted').length,
      totalMerchantCommission: orders.reduce((sum, o) => sum + o.merchantCommission, 0),
    },
  });
});

// Dashboard
app.get('/api/dashboard/:businessId', (req: Request, res: Response) => {
  const apps = Array.from(applications.values())
    .filter(a => a.businessId === req.params.businessId);

  res.json({
    availableCredit: 500000,
    usedCredit: apps.filter(a => a.status === 'disbursed').reduce((sum, a) => sum + a.terms.amount, 0),
    pendingApplications: apps.filter(a => a.status === 'under_review' || a.status === 'submitted').length,
    recentActivity: apps.slice(-5),
    recommendations: [
      { product: 'invoice_financing', reason: 'Based on your unpaid invoices' },
      { product: 'ad_credit', reason: 'Scale your marketing during peak season' },
    ],
  });
});

function calculateEMI(principal: number, monthlyRate: number, days: number): number {
  const months = days / 30;
  const r = monthlyRate / 100;
  return Math.round(principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1));
}

const PORT = process.env.PORT || 4083;
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════╗
║  💰 Embedded Finance Service              ║
║  Working Capital + Invoice Finance + BNPL  ║
║  Port: ${PORT}                               ║
╚═══════════════════════════════════════════════╝
  `);
});
