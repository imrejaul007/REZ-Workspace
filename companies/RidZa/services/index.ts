import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.PORT || '5200', 10);

// ============================================
// TYPES & INTERFACES
// ============================================

interface CreditApplication {
  id: string;
  customerId: string;
  amount: number;
  purpose: string;
  term: number;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  interestRate: number;
  monthlyIncome: number;
  employmentStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface InsurancePolicy {
  id: string;
  customerId: string;
  type: 'life' | 'health' | 'car' | 'home' | 'travel';
  coverage: number;
  premium: number;
  term: number;
  status: 'active' | 'expired' | 'cancelled' | 'claimed';
  startDate: string;
  endDate: string;
  claims: Claim[];
}

interface Claim {
  id: string;
  policyId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  documents: string[];
  createdAt: string;
}

interface Loan {
  id: string;
  customerId: string;
  principal: number;
  interestRate: number;
  term: number;
  emi: number;
  type: 'personal' | 'business' | 'home' | 'car' | 'education';
  status: 'pending' | 'approved' | 'active' | 'completed' | 'defaulted';
  disbursedAt: string;
  nextPaymentDate: string;
  remainingAmount: number;
  paymentSchedule: PaymentSchedule[];
}

interface PaymentSchedule {
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  balance: number;
  status: 'pending' | 'paid' | 'overdue';
}

interface BNPLOrder {
  id: string;
  customerId: string;
  merchantId: string;
  amount: number;
  installments: number;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'defaulted';
  dueDates: BNPLDueDate[];
}

interface BNPLDueDate {
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
}

interface IslamicFinance {
  id: string;
  customerId: string;
  type: 'zakat' | 'takaful' | 'ijara' | 'mudarabah' | 'murabaha';
  amount: number;
  status: 'active' | 'completed';
  profitRate: number;
  tenure: number;
}

interface Remittance {
  id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  currency: string;
  targetCurrency: string;
  exchangeRate: number;
  fees: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  destinationCountry: string;
  createdAt: string;
}

interface Portfolio {
  customerId: string;
  totalValue: number;
  holdings: Holding[];
  performance: PerformanceMetrics;
}

interface Holding {
  productType: 'mutual_fund' | 'fixed_deposit' | 'recurring_deposit' | 'bonds';
  name: string;
  amount: number;
  purchaseDate: string;
  currentValue: number;
  returns: number;
}

interface PerformanceMetrics {
  oneMonth: number;
  threeMonth: number;
  sixMonth: number;
  oneYear: number;
  totalReturns: number;
}

interface FinancialForecast {
  customerId: string;
  period: '1m' | '3m' | '6m' | '1y';
  income: number;
  expenses: number;
  savings: number;
  recommendedProducts: RecommendedProduct[];
}

interface RecommendedProduct {
  type: string;
  name: string;
  reason: string;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface FraudCheck {
  transactionId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  recommendation: 'approve' | 'review' | 'reject';
}

// ============================================
// IN-MEMORY STORES
// ============================================

const creditApplications = new Map<string, CreditApplication>();
const insurancePolicies = new Map<string, InsurancePolicy>();
const loans = new Map<string, Loan>();
const bnplOrders = new Map<string, BNPLOrder>();
const islamicFinanceProducts = new Map<string, IslamicFinance>();
const remittances = new Map<string, Remittance>();
const portfolios = new Map<string, Portfolio>();

// ============================================
// UTILITY FUNCTIONS
// ============================================

function calculateEMI(principal: number, annualRate: number, months: number): number {
  const monthlyRate = annualRate / 12 / 100;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

function generatePaymentSchedule(principal: number, annualRate: number, months: number): PaymentSchedule[] {
  const emi = calculateEMI(principal, annualRate, months);
  const schedule: PaymentSchedule[] = [];
  let balance = principal;
  const today = new Date();

  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + i);

    const interest = balance * (annualRate / 12 / 100);
    const principalPayment = emi - interest;
    balance -= principalPayment;

    schedule.push({
      dueDate: dueDate.toISOString(),
      amount: emi,
      principal: principalPayment,
      interest,
      balance: Math.max(0, balance),
      status: 'pending'
    });
  }

  return schedule;
}

function calculateZakat(income: number, assets: number): number {
  const totalWealth = income + assets;
  return totalWealth * 0.025; // 2.5% Zakat
}

function getExchangeRate(from: string, to: string): number {
  const rates: Record<string, number> = {
    'USD_INR': 83.5,
    'USD_AED': 3.67,
    'USD_GBP': 0.79,
    'USD_EUR': 0.92,
    'INR_AED': 0.044,
    'INR_GBP': 0.0095,
    'AED_INR': 22.75,
    'GBP_INR': 105.5
  };
  return rates[`${from}_${to}`] || 1;
}

// ============================================
// MIDDLEWARE
// ============================================

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  const validApiKey = process.env.SERVICE_API_KEY;

  if (!apiKey) {
    return res.status(401).json({ success: false, error: 'API key required' });
  }

  // Validate API key properly
  if (!validApiKey || apiKey !== validApiKey) {
    return res.status(401).json({ success: false, error: 'Invalid API key' });
  }

  next();
}

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err.message, 'Path:', req.path);
  res.status(500).json({ success: false, error: err.message });
}

// ============================================
// HEALTH& STATUS
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'RIDZA Finance OS',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    stats: {
      creditApplications: creditApplications.size,
      insurancePolicies: insurancePolicies.size,
      activeLoans: loans.size,
      bnplOrders: bnplOrders.size,
      remittances: remittances.size
    }
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    service: 'RIDZA Finance OS',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    integrations: {
      rabtul: 'connected',
      ree: 'connected',
      hojai: 'connected'
    }
  });
});

// ============================================
// CREDIT SERVICES
// ============================================

app.post('/api/credit/apply', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { customerId, amount, purpose, term, monthlyIncome, employmentStatus } = req.body;

    if (!customerId || !amount || !purpose || !term) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Calculate interest rate based on amount and term
    let baseRate = 10;
    if (amount > 100000) baseRate += 2;
    if (amount > 500000) baseRate += 1;
    if (term > 36) baseRate += 1;

    const application: CreditApplication = {
      id: uuidv4(),
      customerId,
      amount,
      purpose,
      term,
      status: 'pending',
      interestRate: baseRate,
      monthlyIncome: monthlyIncome || 0,
      employmentStatus: employmentStatus || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    creditApplications.set(application.id, application);

    res.json({
      success: true,
      application,
      message: 'Credit application submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/credit/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
 const applications = Array.from(creditApplications.values())
      .filter(app => app.customerId === customerId);

    const creditProfile = {
      customerId,
      totalApplications: applications.length,
      approved: applications.filter(a => a.status === 'approved' || a.status === 'disbursed').length,
      pending: applications.filter(a => a.status === 'pending').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      totalAmount: applications.reduce((sum, a) => sum + a.amount, 0),
      applications
    };

    res.json({ success: true, creditProfile });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/credit/:applicationId/approve', async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const application = creditApplications.get(applicationId);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    application.status = 'approved';
    application.updatedAt = new Date().toISOString();
    creditApplications.set(applicationId, application);

    res.json({ success: true, application, message: 'Credit application approved' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/credit/:applicationId/disburse', async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const application = creditApplications.get(applicationId);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Application must be approved first' });
    }

    application.status = 'disbursed';
    application.updatedAt = new Date().toISOString();
    creditApplications.set(applicationId, application);

    // Create loan record
    const loan: Loan = {
      id: uuidv4(),
      customerId: application.customerId,
      principal: application.amount,
      interestRate: application.interestRate,
      term: application.term,
      emi: calculateEMI(application.amount, application.interestRate, application.term),
      type: 'personal',
      status: 'active',
      disbursedAt: new Date().toISOString(),
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      remainingAmount: application.amount,
      paymentSchedule: generatePaymentSchedule(application.amount, application.interestRate, application.term)
    };

    loans.set(loan.id, loan);

    res.json({
      success: true,
      application,
      loan,
      message: 'Credit disbursed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// INSURANCE SERVICES
// ============================================

app.post('/api/insurance/quote', async (req: Request, res: Response) => {
  try {
    const { type, coverage, customerId, age, term } = req.body;

    if (!type || !coverage) {
      return res.status(400).json({ success: false, error: 'Type and coverage required' });
    }

    // Calculate premium based on type, coverage, age
    let basePremium = coverage * 0.02;
    if (age && age > 45) basePremium *= 1.5;
    if (age && age > 60) basePremium *= 2;
    if (term && term > 5) basePremium *= 0.9;

    const quote = {
      id: uuidv4(),
      customerId: customerId || 'pending',
      type,
      coverage,
      premium: basePremium,
      term: term || 1,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      features: getInsuranceFeatures(type)
    };

    res.json({ success: true, quote });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

function getInsuranceFeatures(type: string): string[] {
  const features: Record<string, string[]> = {
    life: ['Death benefit', 'Terminal illness cover', 'Accidental death', 'Waiver of premium'],
    health: ['Cashless hospitalization', 'Day care treatment', 'Mental health cover', 'Alternative treatment'],
    car: ['Third party liability', 'Own damage', 'Personal accident', 'NCB protection'],
    home: ['Fire cover', 'Theft cover', 'Natural disaster', 'Liability cover'],
    travel: ['Medical emergency', 'Trip cancellation', 'Baggage loss', 'Flight delay']
  };
  return features[type] || ['Basic coverage'];
}

app.post('/api/insurance/purchase', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { policyId, customerId, paymentDetails } = req.body;

    if (!policyId || !customerId) {
      return res.status(400).json({ success: false, error: 'Policy ID and customer ID required' });
    }

    const policy: InsurancePolicy = {
      id: policyId,
      customerId,
      type: 'life',
      coverage: 1000000,
      premium: 20000,
      term: 1,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      claims: []
    };

    insurancePolicies.set(policy.id, policy);

    res.json({ success: true, policy, message: 'Insurance policy purchased successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/insurance/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const policies = Array.from(insurancePolicies.values())
      .filter(p => p.customerId === customerId);

    res.json({ success: true, policies });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/insurance/:policyId/claim', async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;
    const { amount, reason, documents } = req.body;

    const policy = insurancePolicies.get(policyId);
    if (!policy) {
      return res.status(404).json({ success: false, error: 'Policy not found' });
    }

    const claim: Claim = {
      id: uuidv4(),
      policyId,
      amount,
      reason,
      status: 'pending',
      documents: documents || [],
      createdAt: new Date().toISOString()
    };

    policy.claims.push(claim);
    insurancePolicies.set(policyId, policy);

    res.json({ success: true, claim, message: 'Claim submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// LENDING SERVICES
// ============================================

app.post('/api/lending/calculate', async (req: Request, res: Response) => {
  try {
    const { principal, rate, term, type } = req.body;

    if (!principal || !rate || !term) {
      return res.status(400).json({ success: false, error: 'Principal, rate, and term required' });
    }

    const emi = calculateEMI(principal, rate, term);
    const totalPayment = emi * term;
    const totalInterest = totalPayment - principal;

    const calculation = {
      principal,
      interestRate: rate,
      term,
      type: type || 'personal',
      emi,
      totalPayment,
      totalInterest,
      processingFee: principal * 0.01,
      insurance: principal * 0.005
    };

    res.json({ success: true, calculation });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/lending/approve', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.body;

    const loan = loans.get(applicationId);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan application not found' });
    }

    loan.status = 'approved';
    loans.set(applicationId, loan);

    res.json({ success: true, loan, message: 'Loan approved' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/lending/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const customerLoans = Array.from(loans.values())
      .filter(l => l.customerId === customerId);

    res.json({ success: true, loans: customerLoans });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/lending/:loanId/payment', async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;
    const { amount } = req.body;

    const loan = loans.get(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }

    // Update payment schedule
    const nextSchedule = loan.paymentSchedule.find(s => s.status === 'pending');
    if (nextSchedule) {
      nextSchedule.status = 'paid';
      loan.remainingAmount -= amount;
    }

    // Check if loan is completed
    if (loan.remainingAmount <= 0) {
      loan.status = 'completed';
    }

    loans.set(loanId, loan);

    res.json({ success: true, loan, message: 'Payment recorded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// BNPL SERVICES
// ============================================

app.post('/api/bnpl/checkout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { customerId, merchantId, amount, installments } = req.body;

    if (!customerId || !merchantId || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const numInstallments = installments || 3;
    const installmentAmount = amount / numInstallments;
    const dueDates: BNPLDueDate[] = [];

    for (let i = 1; i <= numInstallments; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (i * 30));
      dueDates.push({
        installmentNumber: i,
        amount: installmentAmount,
        dueDate: dueDate.toISOString(),
        status: 'pending'
      });
    }

    const bnplOrder: BNPLOrder = {
      id: uuidv4(),
      customerId,
      merchantId,
      amount,
      installments: numInstallments,
      status: 'pending',
      dueDates
    };

    bnplOrders.set(bnplOrder.id, bnplOrder);

    res.json({ success: true, bnplOrder, message: 'BNPL order created' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/bnpl/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const orders = Array.from(bnplOrders.values())
      .filter(o => o.customerId === customerId);

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// ISLAMIC FINANCE SERVICES
// ============================================

app.post('/api/islamic/zakat', async (req: Request, res: Response) => {
  try {
    const { income, assets, goldValue, silverValue, debts } = req.body;

    const totalWealth = (income || 0) + (assets || 0) + (goldValue || 0) + (silverValue || 0) - (debts || 0);
    const nisab =85 * 2.5; // Gold price threshold (in grams of gold)

    let zakat = 0;
    if (totalWealth >= nisab * 83.5) { // Convert to INR
      zakat = calculateZakat(income || 0, assets || 0);
    }

    res.json({
      success: true,
      calculation: {
        totalWealth,
        nisabThreshold: nisab * 83.5,
        isEligible: totalWealth >= nisab * 83.5,
        zakatAmount: zakat,
        description: 'Zakat is2.5% of total wealth above Nisab threshold'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/islamic/takaful', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { customerId, coverage, term } = req.body;

    const product: IslamicFinance = {
      id: uuidv4(),
      customerId,
      type: 'takaful',
      amount: coverage,
      status: 'active',
      profitRate: 0, // Takaful is cooperative, not profit-based
      tenure: term || 1
    };

    islamicFinanceProducts.set(product.id, product);

    res.json({ success: true, product, message: 'Takaful policy created' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/islamic/ijara', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { customerId, assetValue, tenure } = req.body;

    const rental = assetValue * 0.08 / 12; //8% annual rental

    const product: IslamicFinance = {
      id: uuidv4(),
      customerId,
      type: 'ijara',
      amount: assetValue,
      status: 'active',
      profitRate: 8,
      tenure
    };

    islamicFinanceProducts.set(product.id, product);

    res.json({
      success: true,
      product,
      rental: {
        monthly: rental,
        annual: rental * 12,
        totalOverTenure: rental * tenure
      },
      message: 'Ijara (lease) agreement created'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// REMITTANCE SERVICES
// ============================================

app.post('/api/remittance/send', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, amount, currency, targetCurrency, destinationCountry } = req.body;

    if (!senderId || !receiverId || !amount || !destinationCountry) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const exchangeRate = getExchangeRate(currency || 'USD', targetCurrency || 'INR');
    const fees = amount * 0.01; // 1% fee
    const recipientAmount = (amount - fees) * exchangeRate;

    const remittance: Remittance = {
      id: uuidv4(),
      senderId,
      receiverId,
      amount,
      currency: currency || 'USD',
      targetCurrency: targetCurrency || 'INR',
      exchangeRate,
      fees,
      status: 'processing',
      destinationCountry,
      createdAt: new Date().toISOString()
    };

    remittances.set(remittance.id, remittance);

    res.json({
      success: true,
      remittance,
      breakdown: {
        sent: amount,
        fees,
        exchangeRate,
        recipientReceives: recipientAmount
      },
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/remittance/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const remittance = remittances.get(id);

    if (!remittance) {
      return res.status(404).json({ success: false, error: 'Remittance not found' });
    }

    res.json({ success: true, remittance });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/remittance/rates', async (req: Request, res: Response) => {
  try {
    const rates = [
      { from: 'USD', to: 'INR', rate: 83.5, timestamp: new Date().toISOString() },
      { from: 'USD', to: 'AED', rate: 3.67, timestamp: new Date().toISOString() },
      { from: 'USD', to: 'GBP', rate: 0.79, timestamp: new Date().toISOString() },
      { from: 'USD', to: 'EUR', rate: 0.92, timestamp: new Date().toISOString() },
      { from: 'INR', to: 'AED', rate: 0.044, timestamp: new Date().toISOString() },
      { from: 'AED', to: 'INR', rate: 22.75, timestamp: new Date().toISOString() }
    ];

    res.json({ success: true, rates });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// PORTFOLIO SERVICES
// ============================================

app.get('/api/portfolio/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    let portfolio = portfolios.get(customerId);

    if (!portfolio) {
      // Create default portfolio
      portfolio = {
        customerId,
        totalValue: 0,
        holdings: [],
        performance: {
          oneMonth: 0,
          threeMonth: 0,
          sixMonth: 0,
          oneYear: 0,
          totalReturns: 0
        }
      };
    }

    res.json({ success: true, portfolio });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/portfolio/:customerId/invest', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { productType, name, amount } = req.body;

    let portfolio = portfolios.get(customerId);
    if (!portfolio) {
      portfolio = {
        customerId,
        totalValue: 0,
        holdings: [],
        performance: { oneMonth: 0, threeMonth: 0, sixMonth: 0, oneYear: 0, totalReturns: 0 }
      };
    }

    const holding: Holding = {
      productType,
      name,
      amount,
      purchaseDate: new Date().toISOString(),
      currentValue: amount,
      returns: 0
    };

    portfolio.holdings.push(holding);
    portfolio.totalValue += amount;
    portfolios.set(customerId, portfolio);

    res.json({ success: true, portfolio, message: 'Investment added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// AI FINANCIAL SERVICES
// ============================================

app.post('/api/ai/forecast', async (req: Request, res: Response) => {
  try {
    const { customerId, period } = req.body;

    // Simulated AI forecast
    const forecast: FinancialForecast = {
      customerId,
      period: period || '3m',
      income: 100000 + Math.random() * 50000,
      expenses: 60000 + Math.random() * 20000,
      savings: 40000 + Math.random() * 30000,
      recommendedProducts: [
        {
          type: 'mutual_fund',
          name: 'REZ Growth Fund',
          reason: 'Based on your income level and risk appetite',
          expectedReturn: 12.5,
          riskLevel: 'medium'
        },
        {
          type: 'fixed_deposit',
          name: 'REZ Secure FD',
          reason: 'Emergency fund recommendation - 6 months expenses',
          expectedReturn: 7.5,
          riskLevel: 'low'
        }
      ]
    };

    res.json({ success: true, forecast });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/ai/recommend', async (req: Request, res: Response) => {
  try {
    const { customerId, productType } = req.body;

    const recommendations: Record<string, RecommendedProduct[]> = {
      credit: [
        { type: 'personal_loan', name: 'REZ Personal Loan', reason: 'Quick approval, competitive rate', expectedReturn: 11, riskLevel: 'low' },
        { type: 'credit_card', name: 'REZ Platinum Card', reason: 'Cashback on all purchases', expectedReturn: 0, riskLevel: 'low' }
      ],
      insurance: [
        { type: 'term_life', name: 'REZ Shield Life', reason: 'High coverage at low premium', expectedReturn: 0, riskLevel: 'low' },
        { type: 'health', name: 'REZ Care Health', reason: 'Comprehensive health cover', expectedReturn: 0, riskLevel: 'low' }
      ],
      investment: [
        { type: 'mutual_fund', name: 'REZ Blue Chip Fund', reason: 'Stable returns, low volatility', expectedReturn: 14, riskLevel: 'medium' },
        { type: 'sip', name: 'REZ Smart SIP', reason: 'Automated investing, rupee cost averaging', expectedReturn: 13, riskLevel: 'medium' }
      ]
    };

    res.json({
      success: true,
      recommendations: recommendations[productType] || recommendations.credit
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// FRAUD DETECTION
// ============================================

app.post('/api/fraud/check', async (req: Request, res: Response) => {
  try {
    const { transactionId, amount, customerId } = req.body;

    // Simulated fraud check
    const riskScore = Math.random() * 100;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (riskScore > 80) riskLevel = 'high';
    else if (riskScore > 50) riskLevel = 'medium';

    const flags: string[] = [];
    if (amount > 100000) flags.push('High transaction amount');
    if (Math.random() > 0.9) flags.push('Unusual transaction time');
    if (Math.random() > 0.95) flags.push('Multiple failed validations');

    const fraudCheck: FraudCheck = {
      transactionId: transactionId || uuidv4(),
      riskScore,
      riskLevel,
      flags,
      recommendation: riskLevel === 'critical' ? 'reject' : riskLevel === 'high' ? 'review' : 'approve'
    };

    res.json({ success: true, fraudCheck });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// ANALYTICS & DASHBOARD
// ============================================

app.get('/api/analytics/dashboard', async (req: Request, res: Response) => {
  try {
    const dashboard = {
      totalCustomers: new Set([...creditApplications.values(), ...loans.values()].map(l => l.customerId)).size,
      totalCreditDisbursed: Array.from(creditApplications.values())
        .filter(a => a.status === 'disbursed')
        .reduce((sum, a) => sum + a.amount, 0),
      activeLoans: Array.from(loans.values()).filter(l => l.status === 'active').length,
      totalInsurancePremium: Array.from(insurancePolicies.values())
        .filter(p => p.status === 'active')
        .reduce((sum, p) => sum + p.premium, 0),
      pendingClaims: Array.from(insurancePolicies.values())
        .flatMap(p => p.claims)
        .filter(c => c.status === 'pending').length,
      remittanceVolume: Array.from(remittances.values())
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + r.amount, 0),
      bnplDefaults: Array.from(bnplOrders.values()).filter(o => o.status === 'defaulted').length
    };

    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// STAYOWN HOTEL FINANCE INTEGRATION
// ============================================

import axios from 'axios';

const STAYOWN_URL = process.env.STAYOWN_URL || 'http://localhost:3899';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

const getInternalHeaders = () => ({
  'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
  'Content-Type': 'application/json',
});

/**
 * Get hotel financial overview
 */
app.get('/api/hotels/:hotelId/finance/overview', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const response = await axios.get(
      `${STAYOWN_URL}/api/hotels/${hotelId}/finance-overview`,
      { headers: getInternalHeaders() }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get hotel finance overview' });
  }
});

/**
 * Get hotel revenue analytics
 */
app.get('/api/hotels/:hotelId/finance/revenue', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { period } = req.query;

    const response = await axios.get(
      `${STAYOWN_URL}/api/hotels/${hotelId}/revenue-analytics`,
      { params: { period: period || '30d' }, headers: getInternalHeaders() }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get revenue analytics' });
  }
});

/**
 * Get hotel expense breakdown
 */
app.get('/api/hotels/:hotelId/finance/expenses', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { period } = req.query;

    const response = await axios.get(
      `${STAYOWN_URL}/api/hotels/${hotelId}/expense-breakdown`,
      { params: { period: period || '30d' }, headers: getInternalHeaders() }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get expense breakdown' });
  }
});

/**
 * Get hotel occupancy analytics
 */
app.get('/api/hotels/:hotelId/finance/occupancy', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { period } = req.query;

    const response = await axios.get(
      `${STAYOWN_URL}/api/hotels/${hotelId}/occupancy-analytics`,
      { params: { period: period || '30d' }, headers: getInternalHeaders() }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get occupancy analytics' });
  }
});

/**
 * Get hotel credit/financing options
 */
app.get('/api/hotels/:hotelId/finance/financing', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { amount, purpose } = req.query;

    // Check credit eligibility for hotel
    const creditCheck = await checkHotelCreditEligibility(hotelId, Number(amount) || 0, String(purpose) || 'operations');

    res.json({ success: true, data: creditCheck });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get financing options' });
  }
});

/**
 * Apply for hotel credit/financing
 */
app.post('/api/hotels/:hotelId/finance/apply-credit', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { amount, purpose, term } = req.body;

    const application: CreditApplication = {
      id: uuidv4(),
      customerId: hotelId,
      amount: amount || 0,
      purpose: purpose || 'hotel_operations',
      term: term || 12,
      status: 'pending',
      interestRate: 11 + Math.random() * 4,
      monthlyIncome: 0,
      employmentStatus: 'hotel_owner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    creditApplications.set(application.id, application);

    res.status(201).json({ success: true, data: application, message: 'Credit application submitted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to apply for credit' });
  }
});

/**
 * Get hotel insurance needs
 */
app.get('/api/hotels/:hotelId/finance/insurance-needs', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;

    // Get hotel details for insurance calculation
    const insuranceNeeds = {
      hotelId,
      propertyValue: 50000000 + Math.random() * 100000000,
      recommendedPolicies: [
        {
          type: 'property' as const,
          name: 'REZ Property Shield',
          coverage: 50000000,
          premium: 50000,
          reason: 'Covers building, furniture, and fixtures'
        },
        {
          type: 'business_interruption' as const,
          name: 'REZ Business Continuity',
          coverage: 10000000,
          premium: 25000,
          reason: 'Covers revenue loss during closures'
        },
        {
          type: 'liability' as const,
          name: 'REZ Public Liability',
          coverage: 5000000,
          premium: 15000,
          reason: 'Covers guest injuries and property damage'
        }
      ]
    };

    res.json({ success: true, data: insuranceNeeds });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get insurance needs' });
  }
});

/**
 * Check StayOwn integration status
 */
app.get('/api/integration/stayown/status', async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(`${STAYOWN_URL}/health`, { timeout: 5000 });
    res.json({
      success: true,
      data: {
        stayOwnConnected: response.status === 200,
        capabilities: [
          'hotel_finance_overview',
          'revenue_analytics',
          'expense_tracking',
          'occupancy_analytics',
          'credit_financing',
          'insurance_needs',
        ],
      },
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        stayOwnConnected: false,
        capabilities: [],
      },
    });
  }
});

// Helper function for credit eligibility check
async function checkHotelCreditEligibility(hotelId: string, amount: number, purpose: string) {
  // Simulated credit check based on hotel performance
  return {
    eligible: true,
    hotelId,
    requestedAmount: amount,
    purpose,
    approvedAmount: amount * 0.8,
    interestRate: 10.5 + Math.random() * 3,
    termOptions: [6, 12, 24, 36],
    recommendedTerm: 12,
    reason: 'Based on hotel occupancy and revenue history',
    documents: ['hotel_registration', 'revenue_statements', 'property_deeds'],
  };
}

// ============================================
// ERROR HANDLING
// ============================================

app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(╔════════════════════════════════════════════════════════════╗`);
  console.log(║          RIDZA Finance OS - Port ${PORT} ║`);
  console.log(╠════════════════════════════════════════════════════════════╣`);
  console.log(║  Credit Services                                           ║`);
  console.log(║    POST /api/credit/apply           - Apply for credit     ║`);
  console.log(║    GET  /api/credit/:customerId     - Get credit profile   ║`);
  console.log(║    POST /api/credit/:id/approve     - Approve application  ║`);
  console.log(║    POST /api/credit/:id/disburse    - Disburse credit ║`);
  console.log(╠════════════════════════════════════════════════════════════╣`);
  console.log(║  Insurance Services                                        ║`);
  console.log(║    POST /api/insurance/quote        - Get insurance quote  ║`);
  console.log(║    POST /api/insurance/purchase     - Purchase policy      ║`);
  console.log(║    GET  /api/insurance/:customerId  - Get policies ║`);
  console.log(║    POST /api/insurance/:id/claim - File a claim         ║`);
  console.log(╠════════════════════════════════════════════════════════════╣`);
  console.log(║  Lending Services                                          ║`);
  console.log(║    POST /api/lending/calculate      - Calculate EMI         ║`);
  console.log(║    POST /api/lending/approve - Approve loan          ║`);
  console.log(║    GET  /api/lending/:customerId    - Get customer loans   ║`);
  console.log(║    POST /api/lending/:id/payment    - Record payment ║`);
  console.log(╠════════════════════════════════════════════════════════════╣`);
  console.log(║  Islamic Finance                                           ║`);
  console.log(║    POST /api/islamic/zakat          - Calculate Zakat       ║`);
  console.log(║    POST /api/islamic/takaful        - Create Takaful        ║`);
  console.log(║    POST /api/islamic/ijara          - Create Ijara ║`);
  console.log(╠════════════════════════════════════════════════════════════╣`);
  console.log(║  Remittance                                                ║`);
  console.log(║    POST /api/remittance/send        - Send money            ║`);
  console.log(║    GET  /api/remittance/:id         - Track transfer       ║`);
  console.log(║    GET  /api/remittance/rates        - Exchange rates       ║`);
  console.log(╠════════════════════════════════════════════════════════════╣`);
  console.log(║  AI & Analytics                                            ║`);
  console.log(║    POST /api/ai/forecast            - Financial forecast ║`);
  console.log(║    POST /api/ai/recommend           - Product recommend ║`);
  console.log(║    POST /api/fraud/check - Fraud detection ║`);
  console.log(║    GET  /api/analytics/dashboard     - Dashboard stats     ║`);
  console.log(╚════════════════════════════════════════════════════════════╝`);
});

export default app;
