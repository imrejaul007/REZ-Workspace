/**
 * CARECODE - Billing AI Employee
 * AI-powered medical billing, claims processing, and revenue cycle management
 * "AI That Maximizes Revenue & Reduces Billing Errors"
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4856;

app.use(express.json());

// ============================================
// TYPES
// ============================================

interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'pending' | 'sent' | 'partial' | 'paid' | 'cancelled' | 'overdue';
  payments: Payment[];
  insuranceClaim?: InsuranceClaim;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  code?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  serviceDate?: string;
  providerId?: string;
}

interface Payment {
  id: string;
  amount: number;
  method: 'cash' | 'card' | 'bank-transfer' | 'insurance' | 'check' | 'online';
  date: string;
  reference?: string;
  notes?: string;
}

interface InsuranceClaim {
  id: string;
  claimNumber: string;
  insuranceId: string;
  insuranceName: string;
  policyNumber: string;
  status: 'submitted' | 'pending' | 'approved' | 'denied' | 'appealed' | 'paid';
  submittedDate?: string;
  approvedAmount?: number;
  paidAmount?: number;
  denialReason?: string;
  documents: string[];
}

interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  insuranceId?: string;
  insuranceName?: string;
  policyNumber?: string;
  copay?: number;
  deductible?: number;
}

interface BillingCode {
  code: string;
  description: string;
  category: string;
  defaultPrice: number;
  rules?: string;
}

// ============================================
// IN-MEMORY DATABASE
// ============================================

const invoices = new Map<string, Invoice>();
const patients = new Map<string, Patient>();

// Sample billing codes
const billingCodes: BillingCode[] = [
  { code: '99213', description: 'Office visit, established patient, moderate complexity', category: 'E/M', defaultPrice: 150 },
  { code: '99214', description: 'Office visit, established patient, moderate to high complexity', category: 'E/M', defaultPrice: 200 },
  { code: '99215', description: 'Office visit, established patient, high complexity', category: 'E/M', defaultPrice: 275 },
  { code: '99395', description: 'Annual wellness visit, established patient', category: 'Preventive', defaultPrice: 250 },
  { code: '85025', description: 'Complete blood count (CBC) with differential', category: 'Lab', defaultPrice: 45 },
  { code: '80053', description: 'Comprehensive metabolic panel', category: 'Lab', defaultPrice: 85 },
  { code: '36415', description: 'Venipuncture', category: 'Procedure', defaultPrice: 25 },
  { code: '90471', description: 'Immunization administration', category: 'Immunization', defaultPrice: 35 },
  { code: '90472', description: 'Each additional vaccine', category: 'Immunization', defaultPrice: 25 },
  { code: '71046', description: 'Chest X-ray, 2 views', category: 'Imaging', defaultPrice: 120 },
  { code: '93000', description: 'Electrocardiogram (ECG/EKG)', category: 'Cardiology', defaultPrice: 75 },
  { code: '99201', description: 'Office visit, new patient, straightforward', category: 'E/M', defaultPrice: 85 },
  { code: '99202', description: 'Office visit, new patient, low complexity', category: 'E/M', defaultPrice: 125 },
  { code: '99203', description: 'Office visit, new patient, moderate complexity', category: 'E/M', defaultPrice: 175 }
];

// Sample patients
const samplePatients: Patient[] = [
  { id: 'pat-001', name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@email.com', insuranceId: 'INS001', insuranceName: 'HealthPlus Insurance', policyNumber: 'HP123456', copay: 30, deductible: 1000 },
  { id: 'pat-002', name: 'Priya Patel', phone: '9876543211', insuranceId: 'INS002', insuranceName: 'MediCare Plus', policyNumber: 'MP789012', copay: 25, deductible: 500 },
  { id: 'pat-003', name: 'Anita Verma', phone: '9876543212', insuranceId: 'INS003', insuranceName: 'Family Health', policyNumber: 'FH345678', copay: 40, deductible: 2000 }
];

samplePatients.forEach(p => patients.set(p.id, p));

// Sample invoices
const sampleInvoices: Invoice[] = [
  {
    id: 'inv-001',
    patientId: 'pat-001',
    patientName: 'Rahul Sharma',
    invoiceNumber: 'INV-2026-0001',
    date: '2026-05-15',
    dueDate: '2026-05-30',
    items: [
      { id: 'item-1', description: 'Office Visit - 99213', code: '99213', quantity: 1, unitPrice: 150, total: 150, serviceDate: '2026-05-15', providerId: 'doc-001' },
      { id: 'item-2', description: 'Lab - CBC (85025)', code: '85025', quantity: 1, unitPrice: 45, total: 45, serviceDate: '2026-05-15', providerId: 'lab-001' }
    ],
    subtotal: 195,
    tax: 0,
    discount: 0,
    total: 195,
    status: 'paid',
    payments: [{ id: 'pay-001', amount: 30, method: 'card', date: '2026-05-15', reference: 'PAY12345' }],
    notes: 'Insurance claim filed for remaining amount',
    createdAt: '2026-05-15T10:00:00Z',
    updatedAt: '2026-05-15T10:00:00Z'
  }
];

sampleInvoices.forEach(inv => invoices.set(inv.id, inv));

// ============================================
// AI BILLING ENGINE
// ============================================

interface BillingCheck {
  passed: boolean;
  warnings: string[];
  suggestions: string[];
  insuranceCoverage?: {
    covered: boolean;
    estimatedPayable: number;
    patientResponsibility: number;
    reason?: string;
  };
}

function verifyBillingCode(code: string): { valid: boolean; codeInfo?: BillingCode } {
  const codeInfo = billingCodes.find(c => c.code === code);
  return {
    valid: !!codeInfo,
    codeInfo
  };
}

function calculatePatientResponsibility(
  total: number,
  insuranceId?: string,
  deductible?: number,
  copay?: number
): BillingCheck {
  const check: BillingCheck = {
    passed: true,
    warnings: [],
    suggestions: []
  };

  if (!insuranceId) {
    check.warnings.push('No insurance on file - patient responsible for full amount');
    check.insuranceCoverage = {
      covered: false,
      estimatedPayable: 0,
      patientResponsibility: total,
      reason: 'No insurance coverage'
    };
    return check;
  }

  // Simplified insurance calculation
  const deductibleMet = 500; // Assume partial deductible met
  const remainingDeductible = (deductible || 0) - deductibleMet;
  const afterDeductible = remainingDeductible > 0 ? total : total;
  const copayAmount = copay || 30;
  const insurancePayable = Math.max(0, afterDeductible - copayAmount);

  check.insuranceCoverage = {
    covered: true,
    estimatedPayable: insurancePayable,
    patientResponsibility: total - insurancePayable,
    reason: remainingDeductible > 0
      ? `Deductible of ₹${remainingDeductible} not yet met`
      : 'Insurance will cover after copay'
  };

  if (remainingDeductible > 0) {
    check.warnings.push(`Deductible of ₹${remainingDeductible} not yet met`);
  }

  return check;
}

// ============================================
// API ROUTES
// ============================================

/**
 * Create invoice
 */
app.post('/api/invoices', (req: Request, res: Response) => {
  try {
    const { patientId, items, dueDays = 15, notes } = req.body;

    if (!patientId || !items || items.length === 0) {
      return res.status(400).json({ error: 'patientId and items are required' });
    }

    const patient = patients.get(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const invoiceItems: InvoiceItem[] = items.map((item: any) => ({
      id: `item-${uuidv4().slice(0, 8)}`,
      description: item.description,
      code: item.code,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice,
      total: (item.quantity || 1) * item.unitPrice,
      serviceDate: item.serviceDate,
      providerId: item.providerId
    }));

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.size + 1).padStart(4, '0')}`;

    const invoice: Invoice = {
      id: `inv-${uuidv4().slice(0, 8)}`,
      patientId,
      patientName: patient.name,
      invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      items: invoiceItems,
      subtotal,
      tax: 0,
      discount: 0,
      total: subtotal,
      status: 'draft',
      payments: [],
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    invoices.set(invoice.id, invoice);

    res.status(201).json({
      success: true,
      invoice,
      message: `Invoice ${invoiceNumber} created for ${patient.name}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

/**
 * Get invoice by ID
 */
app.get('/api/invoices/:id', (req: Request, res: Response) => {
  try {
    const invoice = invoices.get(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Calculate billing check
    const billingCheck = calculatePatientResponsibility(
      invoice.total,
      patients.get(invoice.patientId)?.insuranceId,
      patients.get(invoice.patientId)?.deductible,
      patients.get(invoice.patientId)?.copay
    );

    res.json({
      success: true,
      invoice,
      billingCheck
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

/**
 * Get invoices by patient
 */
app.get('/api/invoices/patient/:patientId', (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let result = Array.from(invoices.values())
      .filter(i => i.patientId === req.params.patientId);

    if (status) {
      result = result.filter(i => i.status === status);
    }

    result.sort((a, b) => b.date.localeCompare(a.date));

    const totalOutstanding = result
      .filter(i => !['paid', 'cancelled'].includes(i.status))
      .reduce((sum, i) => sum + i.total - i.payments.reduce((p, pay) => p + pay.amount, 0), 0);

    res.json({
      success: true,
      invoices: result,
      count: result.length,
      totalOutstanding
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

/**
 * Update invoice status
 */
app.patch('/api/invoices/:id', (req: Request, res: Response) => {
  try {
    const invoice = invoices.get(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const { status, notes, discount, items } = req.body;

    if (status) {
      invoice.status = status;
      if (status === 'sent') {
        invoice.dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
    }

    if (notes) invoice.notes = notes;
    if (discount) {
      invoice.discount = discount;
      invoice.total = invoice.subtotal - discount + invoice.tax;
    }
    if (items) {
      invoice.items = items.map((item: any) => ({
        ...item,
        id: item.id || `item-${uuidv4().slice(0, 8)}`,
        total: (item.quantity || 1) * item.unitPrice
      }));
      invoice.subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
      invoice.total = invoice.subtotal - invoice.discount + invoice.tax;
    }

    invoice.updatedAt = new Date().toISOString();
    invoices.set(invoice.id, invoice);

    res.json({
      success: true,
      invoice,
      message: `Invoice ${status ? `status updated to ${status}` : 'updated'}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

/**
 * Record payment
 */
app.post('/api/invoices/:id/payments', (req: Request, res: Response) => {
  try {
    const { amount, method, reference, notes } = req.body;

    if (!amount || !method) {
      return res.status(400).json({ error: 'amount and method are required' });
    }

    const invoice = invoices.get(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const payment: Payment = {
      id: `pay-${uuidv4().slice(0, 8)}`,
      amount,
      method,
      date: new Date().toISOString().split('T')[0],
      reference,
      notes
    };

    invoice.payments.push(payment);

    // Update status
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= invoice.total) {
      invoice.status = 'paid';
    } else if (totalPaid > 0) {
      invoice.status = 'partial';
    }

    invoice.updatedAt = new Date().toISOString();
    invoices.set(invoice.id, invoice);

    res.json({
      success: true,
      invoice,
      payment,
      message: `Payment of ₹${amount} recorded`,
      remainingBalance: invoice.total - totalPaid
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

/**
 * Get billing codes
 */
app.get('/api/codes', (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    let result = billingCodes;

    if (category) {
      result = result.filter(c => c.category === category);
    }
    if (search) {
      const searchLower = String(search).toLowerCase();
      result = result.filter(c =>
        c.code.includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      codes: result,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get codes' });
  }
});

/**
 * Verify billing code
 */
app.post('/api/codes/verify', (req: Request, res: Response) => {
  try {
    const { code, patientId } = req.body;

    const verification = verifyBillingCode(code);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Invalid billing code'
      });
    }

    let coverage: BillingCheck['insuranceCoverage'];
    if (patientId) {
      const patient = patients.get(patientId);
      if (patient) {
        coverage = calculatePatientResponsibility(
          verification.codeInfo!.defaultPrice,
          patient.insuranceId,
          patient.deductible,
          patient.copay
        ).insuranceCoverage;
      }
    }

    res.json({
      success: true,
      valid: true,
      codeInfo: verification.codeInfo,
      coverage
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

/**
 * Create insurance claim
 */
app.post('/api/claims', (req: Request, res: Response) => {
  try {
    const { invoiceId, insuranceId, insuranceName, policyNumber } = req.body;

    if (!invoiceId || !insuranceId) {
      return res.status(400).json({ error: 'invoiceId and insuranceId are required' });
    }

    const invoice = invoices.get(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const claim: InsuranceClaim = {
      id: `clm-${uuidv4().slice(0, 8)}`,
      claimNumber: `CLM-${Date.now().toString(36).toUpperCase()}`,
      insuranceId,
      insuranceName: insuranceName || 'Unknown',
      policyNumber: policyNumber || '',
      status: 'submitted',
      submittedDate: new Date().toISOString(),
      documents: []
    };

    invoice.insuranceClaim = claim;
    invoice.updatedAt = new Date().toISOString();

    invoices.set(invoice.id, invoice);

    res.status(201).json({
      success: true,
      claim,
      invoice,
      message: `Insurance claim ${claim.claimNumber} submitted`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

/**
 * Get claim status
 */
app.get('/api/claims/:claimId', (req: Request, res: Response) => {
  try {
    // Search for claim in all invoices
    let foundClaim: InsuranceClaim | undefined;
    let invoice: Invoice | undefined;

    invoices.forEach((inv) => {
      if (inv.insuranceClaim?.id === req.params.claimId) {
        foundClaim = inv.insuranceClaim;
        invoice = inv;
      }
    });

    if (!foundClaim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    res.json({
      success: true,
      claim: foundClaim,
      invoice: {
        id: invoice!.id,
        invoiceNumber: invoice!.invoiceNumber,
        total: invoice!.total
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get claim' });
  }
});

/**
 * Get AR (Accounts Receivable) summary
 */
app.get('/api/reports/ar', (req: Request, res: Response) => {
  try {
    const allInvoices = Array.from(invoices.values());

    const aging = {
      '0-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '61-90': { count: 0, amount: 0 },
      '90+': { count: 0, amount: 0 }
    };

    let totalOutstanding = 0;
    let overdueCount = 0;

    allInvoices.forEach(inv => {
      if (['paid', 'cancelled'].includes(inv.status)) return;

      const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      const outstanding = inv.total - paid;
      totalOutstanding += outstanding;

      // Calculate aging
      const dueDate = new Date(inv.dueDate);
      const daysPastDue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysPastDue > 90) {
        aging['90+'].count++;
        aging['90+'].amount += outstanding;
        overdueCount++;
      } else if (daysPastDue > 60) {
        aging['61-90'].count++;
        aging['61-90'].amount += outstanding;
      } else if (daysPastDue > 30) {
        aging['31-60'].count++;
        aging['31-60'].amount += outstanding;
      } else {
        aging['0-30'].count++;
        aging['0-30'].amount += outstanding;
      }
    });

    res.json({
      success: true,
      summary: {
        totalOutstanding,
        overdueCount,
        totalInvoices: allInvoices.filter(i => !['paid', 'cancelled'].includes(i.status)).length
      },
      aging,
      byStatus: {
        draft: allInvoices.filter(i => i.status === 'draft').length,
        pending: allInvoices.filter(i => i.status === 'pending').length,
        sent: allInvoices.filter(i => i.status === 'sent').length,
        partial: allInvoices.filter(i => i.status === 'partial').length,
        overdue: allInvoices.filter(i => i.status === 'overdue').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get AR report' });
  }
});

/**
 * Get daily revenue report
 */
app.get('/api/reports/revenue', (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    let result = Array.from(invoices.values());

    if (startDate) {
      result = result.filter(i => i.date >= String(startDate));
    }
    if (endDate) {
      result = result.filter(i => i.date <= String(endDate));
    }

    const totalBilled = result.reduce((sum, i) => sum + i.total, 0);
    const totalCollected = result.reduce((sum, i) =>
      sum + i.payments.reduce((p, pay) => p + pay.amount, 0), 0);
    const totalInsurance = result.reduce((sum, i) =>
      sum + (i.insuranceClaim?.paidAmount || 0), 0);

    const collectionRate = totalBilled > 0
      ? Math.round((totalCollected / totalBilled) * 100) : 0;

    res.json({
      success: true,
      period: { start: startDate || 'all', end: endDate || 'all' },
      summary: {
        totalBilled,
        totalCollected,
        totalInsurance,
        patientPayments: totalCollected - totalInsurance,
        collectionRate: `${collectionRate}%`,
        totalInvoices: result.length
      },
      byServiceType: Array.from(new Set(result.flatMap(i => i.items.map(item => item.code || 'Other'))))
        .map(code => ({
          code,
          count: result.filter(i => i.items.some(item => item.code === code)).length,
          amount: result.reduce((sum, i) =>
            sum + i.items.filter(item => item.code === code).reduce((s, item) => s + item.total, 0), 0)
        }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get revenue report' });
  }
});

/**
 * Get patients
 */
app.get('/api/patients', (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let result = Array.from(patients.values());

    if (search) {
      const searchLower = String(search).toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.phone.includes(searchLower) ||
        p.id.includes(searchLower)
      );
    }

    res.json({
      success: true,
      patients: result,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get patients' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  const totalOutstanding = Array.from(invoices.values())
    .filter(i => !['paid', 'cancelled'].includes(i.status))
    .reduce((sum, i) => sum + i.total - i.payments.reduce((p, pay) => p + pay.amount, 0), 0);

  res.json({
    status: 'healthy',
    service: 'billing-ai',
    version: '1.0.0',
    port: PORT,
    capabilities: [
      'Invoice generation',
      'Payment processing',
      'Insurance claims',
      'Revenue reports',
      'AR management',
      'Billing code verification'
    ],
    stats: {
      totalInvoices: invoices.size,
      totalPatients: patients.size,
      totalOutstanding,
      billingCodesCount: billingCodes.length
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CARECODE Billing AI',
    description: 'AI-powered medical billing and revenue cycle management',
    version: '1.0.0',
    endpoints: {
      invoices: {
        create: 'POST /api/invoices',
        get: 'GET /api/invoices/:id',
        patient: 'GET /api/invoices/patient/:patientId',
        payment: 'POST /api/invoices/:id/payments'
      },
      codes: {
        list: 'GET /api/codes',
        verify: 'POST /api/codes/verify'
      },
      claims: {
        create: 'POST /api/claims',
        get: 'GET /api/claims/:id'
      },
      reports: {
        ar: 'GET /api/reports/ar',
        revenue: 'GET /api/reports/revenue'
      }
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║               CARECODE BILLING AI v1.0.0               ║
║                                                         ║
║  Tagline: "AI That Maximizes Revenue & Reduces Errors"║
║  Port: ${PORT}                                               ║
║                                                         ║
║  Capabilities:                                         ║
║  • Invoice Generation                                  ║
║  • Insurance Claims                                    ║
║  • Payment Processing                                  ║
║  • Revenue Reports                                     ║
║  • AR Management                                       ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export { app, invoices, patients, billingCodes };