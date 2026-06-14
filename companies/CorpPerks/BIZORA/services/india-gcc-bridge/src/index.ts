/**
 * BIZORA India ↔ GCC Bridge
 * Expansion infrastructure for businesses going cross-border
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// ============================================================================
// Types
// ============================================================================

interface ExpansionFlow {
  id: string;
  from: 'india' | 'gcc';
  to: 'india' | 'gcc';
  type: 'company' | 'compliance' | 'banking' | 'operations' | 'marketing';
  status: 'planning' | 'in_progress' | 'completed';
  steps: Step[];
  currentStep: number;
  estimatedDays: number;
  cost: number;
}

interface Step {
  id: string;
  name: string;
  service: string;
  status: 'pending' | 'in_progress' | 'completed';
  estimatedDays: number;
  cost: number;
  dependencies: string[];
}

interface UAECompanySetup {
  tradeLicense: boolean;
  visa: boolean;
  bankAccount: boolean;
  vat: boolean;
  localPartner: boolean;
  office: boolean;
  staff: boolean;
  bank: BankDetails;
}

interface BankDetails {
  accountNumber?: string;
  iban?: string;
  bank: string;
  branch: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ComplianceBridge {
  indiaSide: {
    gst: { status: boolean; number?: string };
    pan: { status: boolean; number?: string };
    tds: { status: boolean };
  };
  gccSide: {
    vat: { status: boolean; number?: string; percentage: number };
    tradeLicense: { status: boolean; number?: string };
    excise?: { status: boolean };
  };
  syncEnabled: boolean;
}

interface MarketBridge {
  sourcing: {
    indianSuppliers: string[];
    gccDistributors: string[];
    customs: string[];
  };
  sales: {
    indiaChannels: string[];
    gccChannels: string[];
    bilingualInvoicing: boolean;
    currency: 'INR' | 'AED' | 'USD';
  };
  logistics: {
    indiaFulfillment: string;
    gccFulfillment: string;
  };
}

// India ↔ GCC Flows
const EXPANSION_FLOWS = {
  'india-to-gcc': {
    name: 'India → UAE/GCC Expansion',
    duration: '4-8 weeks',
    steps: [
      { service: 'company', duration: '2-3 weeks', cost: 25000 },
      { service: 'visa', duration: '1-2 weeks', cost: 15000 },
      { service: 'banking', duration: '2-4 weeks', cost: 20000 },
      { service: 'vat_registration', duration: '1 week', cost: 8000 },
      { service: 'compliance_bridge', duration: 'ongoing', cost: 5000 },
    ],
  },
  'gcc-to-india': {
    name: 'GCC → India Expansion',
    duration: '3-6 weeks',
    steps: [
      { service: 'gst_registration', duration: '2 weeks', cost: 15000 },
      { service: 'pan_tan', duration: '1 week', cost: 5000 },
      { service: 'compliance_setup', duration: '1 week', cost: 8000 },
      { service: 'vendor_network', duration: 'ongoing', cost: 0 },
    ],
  },
};

// UAE Setup Checklist
const UAE_CHECKLIST = {
  company: [
    { item: 'Trade License', service: 'DED/DFZ/Custom zone', estimated: '3-5 days' },
    { item: 'Local Partner', service: 'Sponsor/Nationality', estimated: '3-5 days' },
    { item: 'Office Space', service: 'Flexi-desk to Warehouse', estimated: '1-2 days' },
    { item: 'Bank Account', service: 'Emirates NBD, ADCB, ENBD', estimated: '2-4 weeks' },
    { item: 'VAT Registration', service: 'VAT setup + returns', estimated: '1 week' },
    { item: 'Corporate Card', service: 'Business cards', estimated: '1 week' },
  ],
  banking: [
    { item: 'Nostro Account', service: 'INR-AED settlement', estimated: '2 weeks' },
    { item: 'Trade Finance', service: 'LC/Back-to-back LC', estimated: '2 weeks' }
  ],
  compliance: [
    { item: 'VAT Returns', service: 'Monthly/Quarterly', estimated: 'Automated' },
    { item: 'Transfer Pricing', service: 'India-GCC transactions', estimated: 'Ongoing' },
    { item: 'BEPS Compliance', service: 'Tax optimization', estimated: 'Quarterly review' }
  ]
};

// Indian Setup Checklist (for GCC companies)
const INDIA_CHECKLIST = {
  setup: [
    { item: 'GST Registration', service: 'Operating state', estimated: '3-7 days' },
    { item: 'IEC Code', service: 'Import/Export license', estimated: '3-5 days' },
    { item: ' Liaison Office', service: 'ROP + RBI filing', estimated: '4-6 weeks' },
    { item: 'Branch Office', service: 'RBI approval + operations', estimated: '6-8 weeks' },
    { item: 'PAN/TAN', service: 'Tax numbers', estimated: '3-5 days' }
  ],
  banking: [
    { item: 'NRO Account', service: 'Indian rupee account', estimated: '2 weeks' },
    { item: 'NRE Account', service: 'Repatriation account', estimated: '2 weeks' }
  ]
};

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'india-gcc-bridge',
    flows: Object.keys(EXPANSION_FLOWS).length,
    timestamp: new Date().toISOString()
  });
});

// Get expansion flows
app.get('/api/flows', (_req: Request, res: Response) => {
  res.json({ flows: EXPANSION_FLOWS });
});

// Get UAE setup checklist
app.get('/api/checklist/uae', (_req: Response, res: Response) => {
  res.json({ checklist: UAE_CHECKLIST });
});

// Get India setup checklist
app.get('/api/checklist/india', (_req: Response, res: Response) => {
  res.json({ checklist: INDIA_CHECKLIST });
});

// Start expansion flow
app.post('/api/expansion/start', (req: Request, res: Response) => {
  const { direction, businessType, industry } = req.body;

  const id = `exp_${Date.now()}`;
  const flow = EXPANSION_FLOWS[direction] || EXPANSION_FLOWS['india-to-gcc'];

  const expansion: ExpansionFlow = {
    id,
    from: direction === 'india-to-gcc' ? 'india' : 'gcc',
    to: direction === 'india-to-gcc' ? 'gcc' : 'india',
    type: businessType || 'company',
    status: 'planning',
    steps: flow.steps.map((s, i) => ({
      id: `step_${i + 1}`,
      name: s.service,
      service: s.service,
      status: 'pending',
      estimatedDays: parseInt(s.duration),
      cost: s.cost,
      dependencies: []
    })),
    currentStep: 0,
    estimatedDays: 30,
    cost: flow.steps.reduce((sum, s) => sum + s.cost, 0)
  };

  res.status(201).json({
    expansionId: id,
    flow: direction,
    status: 'started',
    estimatedWeeks: Math.ceil(expansion.estimatedDays / 7),
    estimatedCost: expansion.cost,
    message: 'Expansion planning started'
  });
});

// Get UAE company setup status
app.get('/api/uae/setup/:expansionId', (req: Request, res: Response) => {
  res.json({
    expansionId: req.params.expansionId,
    status: 'in_progress',
    setup: {
      tradeLicense: { status: 'pending', document: 'trade_license.pdf' },
      visa: { status: 'pending', sponsors: 1 },
      bankAccount: { status: 'pending', bank: 'Emirates NBD' },
      vat: { status: 'pending', percentage: 5 },
      localPartner: { status: 'pending', type: 'sponsor' },
      office: { status: 'pending', type: 'flexi_desk' }
    },
    estimatedDays: 30,
    costs: {
      tradeLicense: 15000,
      visa: 8000,
      bankAccount: 12000,
      vat: 5000,
      total: 40000
    }
  });
});

// Get banking bridge status
app.get('/api/banking/:expansionId', (req: Request, res: Response) => {
  res.json({
    expansionId: req.params.expansionId,
    indiaSide: {
      accountNumber: 'XXXXXXXXXX',
      bank: 'State Bank of India',
      status: 'pending'
    },
    gccSide: {
      accountNumber: 'AE XX XXXX XXXX XXXX',
      bank: 'Emirates NBD',
      status: 'pending'
    },
    nostro: { status: 'pending' }
  });
});

// Get compliance bridge
app.get('/api/compliance/:expansionId', (req: Request, res: Response) => {
  res.json({
    expansionId: req.params.expansionId,
    india: {
      gst: { status: 'active', number: '27XXXXXP1Z5' },
      tds: { status: 'active' },
      pan: { status: 'active' }
    },
    gcc: {
      vat: { status: 'active', number: '123456789000123' },
      excise: { status: 'pending' },
      transferPricing: { status: 'active' }
    },
    sync: {
      invoiceMatching: true,
      currency: 'AED/INR/USD',
      bilingual: true
    }
  });
});

// Get market bridge
app.get('/api/market/:expansionId', (req: Request, res: Response) => {
  res.json({
    expansionId: req.params.expansionId,
    sourcing: {
      indianSuppliers: ['Packaging Co', 'Ingredients LLC', 'Equipment Pro'],
      gccDistributors: ['Dubai Wholesale', 'Abu Dhabi Retail'],
      customs: { duty: '5%', exemptions: true }
    },
    sales: {
      channels: ['Amazon.ae', 'Noon', 'Carriage', 'Shopify India'],
      bilingual: true,
      currency: 'AED/INR'
    }
  });
});

// UAE Service Providers
app.get('/api/uae/providers', (_req: Request, res: Response) => {
  res.json({
    providers: [
      { type: 'ca', name: 'UAE CA Network', rating: 4.8 },
      { type: 'legal', name: 'GCC Legal Partners', rating: 4.7 },
      { type: 'banking', name: 'Emirates NBD', rating: 4.5 },
      { type: 'marketing', name: 'GCC Marketing Agency', rating: 4.6 }
    ]
  });
});

// India Service Providers (for GCC companies)
app.get('/api/india/providers', (_req: Request, res: Response) => {
  res.json({
    providers: [
      { type: 'ca', name: 'India CA Network', rating: 4.7 },
      { type: 'logistics', name: 'India Cargo', rating: 4.5 },
      { type: 'compliance', name: 'India Compliance Hub', rating: 4.8 }
    ]
  });
});

const PORT = process.env.PORT || 4064;
app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════╗
║  🌏 India ↔ GCC Bridge Service         ║
║  Expansion infrastructure             ║
║  Port: ${PORT}                           ║
║                                      ║
║  Features:                              ║
║  • UAE setup automation               ║
║  • Banking bridge                      ║
║  • Compliance sync                    ║
║  • Market connections                 ║
╚══════════════════════════════════════════╝
  `);
});
