/**
 * Travel Finance Routes
 * API endpoints for BNPL, forex, and insurance
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  BNPLOffer,
  ForexCard,
  ForexOrder,
  InsuranceQuote,
  InsurancePurchase,
  TravelInsurance,
  FOREX_RATES,
} from './types';

const router = Router();

// In-memory stores
const bnplApplications = new Map<string, BNPLApplication>();
const forexCards = new Map<string, ForexCard>();
const forexOrders = new Map<string, ForexOrder>();
const insuranceQuotes = new Map<string, InsuranceQuote>();
const insurancePurchases = new Map<string, InsurancePurchase>();

// Travel insurance plans
const TRAVEL_INSURANCE_PLANS: TravelInsurance[] = [
  {
    id: 'basic-1',
    provider: 'Tata AIG',
    name: 'Basic Travel Cover',
    type: 'comprehensive',
    coverage: {
      medicalExpenses: 250000,
      emergencyEvacuation: 100000,
      tripCancellation: 10000,
      baggageLoss: 15000,
      personalLiability: 50000,
      flightDelay: 3000,
    },
    price: { amount: 299, currency: 'INR', perDay: true },
    duration: { minDays: 1, maxDays: 180 },
    eligibility: ['Indian citizens', 'Age 18-70'],
    exclusions: ['Pre-existing conditions', 'Adventure sports', 'Self-inflicted injuries'],
    claimsProcess: 'Online + Toll-free',
    destination: ['worldwide'],
  },
  {
    id: 'standard-1',
    provider: 'ICICI Lombard',
    name: 'Standard Travel Plus',
    type: 'comprehensive',
    coverage: {
      medicalExpenses: 500000,
      emergencyEvacuation: 250000,
      tripCancellation: 25000,
      baggageLoss: 30000,
      personalLiability: 100000,
      flightDelay: 5000,
    },
    price: { amount: 499, currency: 'INR', perDay: true },
    duration: { minDays: 1, maxDays: 365 },
    eligibility: ['Indian citizens', 'Age 18-80'],
    exclusions: ['Pre-existing conditions (30 days)', 'War/civil unrest'],
    claimsProcess: 'App + Online + Phone',
    destination: ['worldwide'],
  },
  {
    id: 'premium-1',
    provider: 'Bajaj Allianz',
    name: 'Premium Travel Shield',
    type: 'comprehensive',
    coverage: {
      medicalExpenses: 1000000,
      emergencyEvacuation: 500000,
      tripCancellation: 50000,
      baggageLoss: 50000,
      personalLiability: 250000,
      flightDelay: 10000,
    },
    price: { amount: 799, currency: 'INR', perDay: true },
    duration: { minDays: 1, maxDays: 365 },
    eligibility: ['Indian citizens', 'Age 18-85'],
    exclusions: ['Pre-existing conditions (60 days)', 'High-risk activities'],
    claimsProcess: '24/7 Support + App + Dedicated Manager',
    destination: ['worldwide'],
  },
  {
    id: 'schengen-1',
    provider: 'Reliance',
    name: 'Schengen Travel Insurance',
    type: 'medical',
    coverage: {
      medicalExpenses: 500000,
      emergencyEvacuation: 300000,
      tripCancellation: 20000,
      baggageLoss: 25000,
      personalLiability: 75000,
      flightDelay: 5000,
    },
    price: { amount: 599, currency: 'INR', perDay: true },
    duration: { minDays: 1, maxDays: 90 },
    eligibility: ['Indian citizens', 'Schengen visa required'],
    exclusions: ['Pre-existing conditions', 'Non-Schengen countries'],
    claimsProcess: 'App + Email + Phone',
    destination: ['schengen'],
  },
  {
    id: 'us-1',
    provider: 'Tata AIG',
    name: 'USA Travel Cover',
    type: 'medical',
    coverage: {
      medicalExpenses: 1500000,
      emergencyEvacuation: 750000,
      tripCancellation: 30000,
      baggageLoss: 40000,
      personalLiability: 200000,
      flightDelay: 7500,
    },
    price: { amount: 999, currency: 'INR', perDay: true },
    duration: { minDays: 1, maxDays: 180 },
    eligibility: ['Indian citizens', 'Age 18-70'],
    exclusions: ['Pre-existing conditions (60 days)'],
    claimsProcess: 'App + 24/7 Helpline',
    destination: ['US'],
  },
];

/**
 * Health check
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'airzy-travel-finance' });
});

// ===== BNPL =====

/**
 * Check BNPL eligibility
 */
router.get('/bnpl/eligibility/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;

  // Mock eligibility check
  const offer: BNPLOffer = {
    id: uuidv4(),
    userId,
    eligibility: {
      eligible: true,
      maxAmount: 100000,
      minAmount: 5000,
      maxTenure: 12,
      interestRate: 1.5,
      processingFee: 2,
    },
    offers: [
      { tenure: 3, emiAmount: 35000, totalAmount: 105000, interestAmount: 5000 },
      { tenure: 6, emiAmount: 18000, totalAmount: 108000, interestAmount: 8000 },
      { tenure: 12, emiAmount: 9500, totalAmount: 114000, interestAmount: 14000 },
    ],
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  res.json({ offer });
});

/**
 * Apply for BNPL
 */
router.post('/bnpl/apply', (req: Request, res: Response) => {
  const { userId, amount, purpose, tenure } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ error: 'userId and amount are required' });
  }

  const application: BNPLApplication = {
    id: uuidv4(),
    userId,
    amount,
    currency: 'INR',
    purpose: purpose || 'other',
    tenure: tenure || 6,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // Mock approval (90% approved)
  const approved = Math.random() > 0.1;
  application.status = approved ? 'approved' : 'rejected';
  if (approved) {
    const interest = application.amount * 0.15;
    application.emiAmount = Math.ceil((application.amount + interest) / application.tenure);
    application.interestRate = 15;
    application.processingFee = application.amount * 0.02;
    application.approvedAt = new Date().toISOString();
  } else {
    application.rejectedReason = 'Insufficient credit history';
  }

  bnplApplications.set(application.id, application);

  res.status(201).json({ application });
});

/**
 * Get BNPL applications
 */
router.get('/bnpl/applications/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const applications = Array.from(bnplApplications.values())
    .filter(a => a.userId === userId);
  res.json({ applications });
});

// ===== FOREX =====

/**
 * Get forex rates
 */
router.get('/forex/rates', (req: Request, res: Response) => {
  const { from, to } = req.query;

  if (from && to) {
    const fromRate = FOREX_RATES[from as string]?.rate || 1;
    const toRate = FOREX_RATES[to as string]?.rate || 1;
    const converted = toRate / fromRate;

    return res.json({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate: converted,
      inverseRate: 1 / converted,
      updatedAt: new Date().toISOString(),
    });
  }

  res.json({ rates: FOREX_RATES, updatedAt: new Date().toISOString() });
});

/**
 * Convert forex
 */
router.post('/forex/convert', (req: Request, res: Response) => {
  const { from, to, amount } = req.body;

  if (!from || !to || !amount) {
    return res.status(400).json({ error: 'from, to, and amount are required' });
  }

  const fromRate = FOREX_RATES[from]?.rate || 1;
  const toRate = FOREX_RATES[to]?.rate || 1;

  const converted = (amount * toRate) / fromRate;
  const fee = converted * 0.01;

  res.json({
    from,
    to,
    amount,
    converted: converted - fee,
    fee,
    rate: toRate / fromRate,
  });
});

/**
 * Order forex
 */
router.post('/forex/order', (req: Request, res: Response) => {
  const { userId, toCurrency, amount, deliveryMethod } = req.body;

  if (!userId || !toCurrency || !amount) {
    return res.status(400).json({ error: 'userId, toCurrency, and amount are required' });
  }

  const rate = FOREX_RATES[toCurrency]?.rate || 83;
  const totalAmount = amount * rate;
  const fee = totalAmount > 50000 ? 0 : 250;

  const order: ForexOrder = {
    id: uuidv4(),
    userId,
    fromCurrency: 'INR',
    toCurrency,
    amount,
    rate,
    totalAmount: totalAmount + fee,
    fee,
    deliveryMethod: deliveryMethod || 'card',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  forexOrders.set(order.id, order);

  res.status(201).json({ order });
});

/**
 * Get forex cards
 */
router.get('/forex/cards/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const cards = Array.from(forexCards.values())
    .filter(c => c.userId === userId);
  res.json({ cards });
});

/**
 * Apply for forex card
 */
router.post('/forex/cards', (req: Request, res: Response) => {
  const { userId, currency } = req.body;

  if (!userId || !currency) {
    return res.status(400).json({ error: 'userId and currency are required' });
  }

  const card: ForexCard = {
    id: uuidv4(),
    userId,
    currency,
    cardNumber: Math.floor(1000 + Math.random() * 9000).toString(),
    balance: 0,
    cardStatus: 'active',
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString(),
  };

  forexCards.set(card.id, card);

  res.status(201).json({ card });
});

// ===== INSURANCE =====

/**
 * Get insurance plans
 */
router.get('/insurance/plans', (req: Request, res: Response) => {
  const { destination, type } = req.query;

  let plans = TRAVEL_INSURANCE_PLANS;

  if (destination) {
    plans = plans.filter(p =>
      p.destination.some(d =>
        d === 'worldwide' ||
        d.toLowerCase().includes((destination as string).toLowerCase())
      )
    );
  }

  if (type) {
    plans = plans.filter(p => p.type === type);
  }

  res.json({ plans });
});

/**
 * Get insurance quote
 */
router.post('/insurance/quote', (req: Request, res: Response) => {
  const { userId, destination, startDate, endDate, travelers, type } = req.body;

  if (!userId || !destination || !startDate || !endDate) {
    return res.status(400).json({ error: 'userId, destination, startDate, and endDate are required' });
  }

  const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));

  const quotes = TRAVEL_INSURANCE_PLANS
    .filter(p => days >= p.duration.minDays && days <= p.duration.maxDays)
    .map(plan => ({
      plan,
      totalPrice: plan.price.amount * days * (travelers?.length || 1),
    }));

  const quote: InsuranceQuote = {
    id: uuidv4(),
    userId,
    destination,
    startDate,
    endDate,
    travelers: travelers || 1,
    ages: [],
    type: type || 'comprehensive',
    quotes,
    createdAt: new Date().toISOString(),
  };

  insuranceQuotes.set(quote.id, quote);

  res.status(201).json({ quote });
});

/**
 * Purchase insurance
 */
router.post('/insurance/purchase', (req: Request, res: Response) => {
  const { userId, quoteId, planId, travelers, startDate, endDate } = req.body;

  if (!userId || !planId) {
    return res.status(400).json({ error: 'userId and planId are required' });
  }

  const plan = TRAVEL_INSURANCE_PLANS.find(p => p.id === planId);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  const premium = plan.price.amount * days * (travelers?.length || 1);

  const purchase: InsurancePurchase = {
    id: uuidv4(),
    userId,
    insuranceId: plan.id,
    planName: plan.name,
    destination: 'worldwide',
    startDate,
    endDate,
    travelers: travelers || [],
    premium,
    policyNumber: `AIRZY${Date.now()}${Math.floor(Math.random() * 10000)}`,
    coverage: plan.coverage,
    status: 'active',
    purchasedAt: new Date().toISOString(),
  };

  insurancePurchases.set(purchase.id, purchase);

  res.status(201).json({ purchase });
});

/**
 * Get insurance purchases
 */
router.get('/insurance/purchases/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const purchases = Array.from(insurancePurchases.values())
    .filter(p => p.userId === userId);
  res.json({ purchases });
});

export default router;
