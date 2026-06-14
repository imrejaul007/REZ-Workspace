/**
 * HOJAI Finance Compliance AI
 * GST, TDS, Payroll compliance service
 * Port: 4902
 */
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import config from './config';
import { ComplianceRecord, FilingReminder, ComplianceStatus, FilingStatus } from './models/Compliance';
import {
  calculateGst,
  calculateBulkGst,
  calculateTds,
  calculateTenantTds,
  calculatePayrollCompliance,
  getFilingReminders,
  generateFilingReminders,
  getComplianceSummary,
  validateGstin,
  validateHsnCode,
} from './services/complianceService';
import { authenticate, verifyInternalToken, tenantIsolation, AuthRequest } from './middleware/auth';
import {
  GstCalculationInputSchema,
  GstBulkCalculateSchema,
  TdsCalculationInputSchema,
  TenantTdsRequestSchema,
  PayrollComplianceRequestSchema,
  SalaryTdsInputSchema,
  FilingReminderQuerySchema,
  validateBody,
} from './validators/compliance';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too Many Requests', message: 'Rate limit exceeded' },
});
app.use('/api/', limiter);

// Health check endpoints (no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'finance-compliance',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  try {
    const dbState = mongoose.connection.readyState;
    if (dbState === 1) {
      res.json({ status: 'ready', database: 'connected' });
    } else {
      res.status(503).json({ status: 'not ready', database: 'disconnected' });
    }
  } catch {
    res.status(503).json({ status: 'not ready', error: 'health check failed' });
  }
});

// ============ GST Endpoints ============

/**
 * POST /api/gst/calculate
 * Calculate GST for invoices with proper slabs
 */
app.post('/api/gst/calculate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateBody(GstCalculationInputSchema, req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: validation.errors,
      });
      return;
    }

    const { tenantId, invoices } = validation.data;

    // Verify tenant access
    if (req.user?.tenantId !== tenantId && !req.user?.isService) {
      res.status(403).json({ error: 'Access denied to this tenant' });
      return;
    }

    // Calculate GST for all invoices
    const result = calculateBulkGst({ invoices });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('GST calculation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'GST calculation failed',
    });
  }
});

/**
 * POST /api/gst/bulk-calculate
 * Bulk GST calculation (up to 1000 invoices)
 */
app.post('/api/gst/bulk-calculate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateBody(GstBulkCalculateSchema, req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: validation.errors,
      });
      return;
    }

    const { tenantId, invoices } = validation.data;

    if (req.user?.tenantId !== tenantId && !req.user?.isService) {
      res.status(403).json({ error: 'Access denied to this tenant' });
      return;
    }

    const result = calculateBulkGst({ invoices });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Bulk GST calculation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Bulk GST calculation failed',
    });
  }
});

/**
 * POST /api/gst/validate
 * Validate GSTIN and HSN codes
 */
app.post('/api/gst/validate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { gstin, hsnCode } = req.body;

    const results: {
      gstin?: { valid: boolean; message: string };
      hsnCode?: { valid: boolean; message: string };
    } = {};

    if (gstin) {
      results.gstin = {
        valid: validateGstin(gstin),
        message: validateGstin(gstin) ? 'Valid GSTIN' : 'Invalid GSTIN format',
      };
    }

    if (hsnCode) {
      results.hsnCode = {
        valid: validateHsnCode(hsnCode),
        message: validateHsnCode(hsnCode) ? 'Valid HSN code' : 'Invalid HSN code format',
      };
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Validation failed',
    });
  }
});

/**
 * POST /api/gst/record
 * Create GST compliance record
 */
app.post('/api/gst/record', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, financialYear, period, invoices } = req.body;

    if (req.user?.tenantId !== tenantId && !req.user?.isService) {
      res.status(403).json({ error: 'Access denied to this tenant' });
      return;
    }

    // Calculate totals
    const gstResult = calculateBulkGst({ invoices });

    // Calculate filing deadline (20th of next month)
    const periodEnd = new Date(period.end);
    const deadline = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 20);

    const record = new ComplianceRecord({
      tenantId,
      type: 'gst',
      financialYear,
      period: {
        start: new Date(period.start),
        end: new Date(period.end),
      },
      status: ComplianceStatus.PENDING,
      filingStatus: FilingStatus.NOT_FILED,
      gstData: {
        invoices: gstResult.invoices.map((inv) => ({
          invoiceNumber: `INV-${Date.now()}`,
          invoiceDate: new Date(),
          supplierGstin: '00AAAAA0000A1Z5',
          recipientGstin: '00BBBBB0000B1Z5',
          hsnCode: inv.hsnCode,
          taxableValue: inv.taxableValue,
          cgst: inv.cgst,
          sgst: inv.sgst,
          igst: inv.igst,
          totalGst: inv.totalGst,
          totalAmount: inv.totalAmount,
          placeOfSupply: 'Maharashtra',
          reverseCharge: inv.reverseCharge,
        })),
        totalTaxableValue: gstResult.summary.totalTaxableValue,
        totalCgst: gstResult.summary.totalCgst,
        totalSgst: gstResult.summary.totalSgst,
        totalIgst: gstResult.summary.totalIgst,
        totalGstPayable: gstResult.summary.totalGst,
        inputTaxCredit: 0,
        netGstPayable: gstResult.summary.totalGst,
        returnFiled: false,
      },
      filingDeadline: deadline,
    });

    await record.save();

    res.status(201).json({
      success: true,
      data: {
        recordId: record._id,
        ...gstResult.summary,
        filingDeadline: deadline,
      },
    });
  } catch (error) {
    console.error('GST record creation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Record creation failed',
    });
  }
});

// ============ TDS Endpoints ============

/**
 * GET /api/tds/:tenantId
 * Get TDS compliance for a tenant
 */
app.get('/api/tds/:tenantId', authenticate, tenantIsolation, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { financialYear, quarter } = req.query as { financialYear?: string; quarter?: string };

    // Get TDS records
    const records = await ComplianceRecord.find({
      tenantId,
      type: 'tds',
      ...(financialYear && { financialYear }),
    });

    // Calculate summary
    const totalPayments = records.reduce(
      (sum, r) => sum + (r.tdsData?.totalPayments ?? 0),
      0
    );
    const totalTdsDeducted = records.reduce(
      (sum, r) => sum + (r.tdsData?.totalTdsDeducted ?? 0),
      0
    );

    res.json({
      success: true,
      data: {
        tenantId,
        financialYear: financialYear ?? '2024-2025',
        records: records.map((r) => ({
          recordId: r._id,
          period: r.period,
          status: r.status,
          totalPayments: r.tdsData?.totalPayments ?? 0,
          totalTdsDeducted: r.tdsData?.totalTdsDeducted ?? 0,
          quarterlyReturnFiled: r.tdsData?.quarterlyReturnFiled ?? false,
          filingDeadline: r.filingDeadline,
        })),
        summary: {
          totalPayments,
          totalTdsDeducted,
          complianceStatus: records.length > 0 ? records[0].status : ComplianceStatus.PENDING,
        },
      },
    });
  } catch (error) {
    console.error('TDS retrieval error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve TDS data',
    });
  }
});

/**
 * POST /api/tds/calculate
 * Calculate TDS on a payment
 */
app.post('/api/tds/calculate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateBody(TdsCalculationInputSchema, req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: validation.errors,
      });
      return;
    }

    const result = calculateTds(validation.data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('TDS calculation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'TDS calculation failed',
    });
  }
});

/**
 * POST /api/tds/record
 * Create TDS compliance record
 */
app.post('/api/tds/record', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateBody(TenantTdsRequestSchema, req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: validation.errors,
      });
      return;
    }

    const { tenantId, financialYear, quarter, deductions } = validation.data;

    if (req.user?.tenantId !== tenantId && !req.user?.isService) {
      res.status(403).json({ error: 'Access denied to this tenant' });
      return;
    }

    // Calculate TDS for all deductions
    const tdsResult = await calculateTenantTds({
      tenantId,
      financialYear,
      quarter,
      deductions: deductions.map((d) => ({
        section: d.section,
        paymentAmount: d.paymentAmount,
        panAvailable: !!d.panOfDeductee,
        isIndividualOrHuf: false,
      })),
    });

    // Calculate period dates
    const quarterMonths: Record<string, { start: number; end: number }> = {
      Q1: { start: 3, end: 5 }, // Apr-Jun
      Q2: { start: 6, end: 8 }, // Jul-Sep
      Q3: { start: 9, end: 11 }, // Oct-Dec
      Q4: { start: 0, end: 2 }, // Jan-Mar
    };
    const year = financialYear.split('-')[0];
    const { start: startMonth, end: endMonth } = quarterMonths[quarter];
    const periodStart = new Date(parseInt(year, 10), startMonth, 1);
    const periodEnd = endMonth === 2 ? new Date(parseInt(year, 10) + 1, 2, 0) : new Date(parseInt(year, 10), endMonth + 1, 0);

    const record = new ComplianceRecord({
      tenantId,
      type: 'tds',
      financialYear,
      period: { start: periodStart, end: periodEnd },
      status: tdsResult.complianceStatus,
      filingStatus: FilingStatus.NOT_FILED,
      tdsData: {
        deductions: tdsResult.deductions.map((d) => ({
          section: d.section,
          panOfDeductee: '',
          nameOfDeductee: '',
          paymentAmount: d.paymentAmount,
          tdsAmount: d.tdsAmount,
          tdsRate: d.tdsRate,
          dateOfPayment: new Date(),
          natureOfPayment: '',
        })),
        totalPayments: tdsResult.totalPayments,
        totalTdsDeducted: tdsResult.totalTdsDeducted,
        tdsCertificateIssued: false,
        quarterlyReturnFiled: false,
      },
      filingDeadline: tdsResult.dueDate,
    });

    await record.save();

    res.status(201).json({
      success: true,
      data: {
        recordId: record._id,
        ...tdsResult,
      },
    });
  } catch (error) {
    console.error('TDS record creation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Record creation failed',
    });
  }
});

// ============ Payroll Endpoints ============

/**
 * POST /api/payroll/compliance
 * Calculate payroll compliance for employees
 */
app.post('/api/payroll/compliance', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateBody(PayrollComplianceRequestSchema, req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: validation.errors,
      });
      return;
    }

    const { tenantId, financialYear, employees } = validation.data;

    if (req.user?.tenantId !== tenantId && !req.user?.isService) {
      res.status(403).json({ error: 'Access denied to this tenant' });
      return;
    }

    // Calculate compliance for each employee
    const employeeResults = employees.map((emp) =>
      calculatePayrollCompliance({
        employeeId: emp.employeeId,
        employeePan: emp.employeePan,
        basicSalary: emp.basicSalary,
        hra: emp.hra,
        allowances: emp.allowances,
        epf: emp.epf,
        esic: emp.esic,
        professionalTax: emp.professionalTax,
      })
    );

    // Calculate totals
    const totals = {
      totalGrossSalary: employeeResults.reduce((sum, e) => sum + e.grossSalary, 0),
      totalProfessionalTax: employeeResults.reduce((sum, e) => sum + e.professionalTax, 0),
      totalEpf: employeeResults.reduce((sum, e) => sum + e.epfContribution, 0),
      totalEsic: employeeResults.reduce((sum, e) => sum + e.esicContribution, 0),
      totalTds: employeeResults.reduce((sum, e) => sum + e.tdsOnSalary, 0),
      totalNetPay: employeeResults.reduce((sum, e) => sum + e.netPay, 0),
    };

    // Create compliance record
    const periodStart = new Date(financialYear.split('-')[0], 3, 1);
    const periodEnd = new Date(financialYear.split('-')[1], 2, 31);

    const record = new ComplianceRecord({
      tenantId,
      type: 'payroll',
      financialYear,
      period: { start: periodStart, end: periodEnd },
      status: ComplianceStatus.COMPLIANT,
      filingStatus: FilingStatus.NOT_FILED,
      payrollData: {
        employees: employeeResults.map((e) => ({
          employeeId: e.employeeId,
          employeePan: e.employeePan,
          grossSalary: e.grossSalary,
          professionalTax: e.professionalTax,
          tdsOnSalary: e.tdsOnSalary,
          epfContribution: e.epfContribution,
          esicContribution: e.esicContribution,
          ptdsAmount: e.tdsOnSalary,
          netPay: e.netPay,
        })),
        totalGrossSalary: totals.totalGrossSalary,
        totalProfessionalTax: totals.totalProfessionalTax,
        totalTdsOnSalary: totals.totalTds,
        totalEpf: totals.totalEpf,
        totalEsic: totals.totalEsic,
        monthlyComplianceMet: true,
      },
      filingDeadline: new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 15),
    });

    await record.save();

    res.json({
      success: true,
      data: {
        recordId: record._id,
        employees: employeeResults,
        totals,
      },
    });
  } catch (error) {
    console.error('Payroll compliance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Payroll compliance calculation failed',
    });
  }
});

/**
 * POST /api/payroll/salary-tds
 * Calculate TDS on salary
 */
app.post('/api/payroll/salary-tds', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateBody(SalaryTdsInputSchema, req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: validation.errors,
      });
      return;
    }

    const { calculateSalaryTds } = await import('./services/complianceService');
    const result = calculateSalaryTds(validation.data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Salary TDS calculation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Salary TDS calculation failed',
    });
  }
});

// ============ Filing Reminder Endpoints ============

/**
 * GET /api/filing/reminders
 * Get upcoming filing deadlines
 */
app.get('/api/filing/reminders', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateBody(FilingReminderQuerySchema, req.query);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: validation.errors,
      });
      return;
    }

    const { tenantId, daysAhead } = validation.data;

    if (req.user?.tenantId !== tenantId && !req.user?.isService) {
      res.status(403).json({ error: 'Access denied to this tenant' });
      return;
    }

    const reminders = await getFilingReminders({ tenantId, daysAhead });

    res.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error('Filing reminders error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to retrieve reminders',
    });
  }
});

/**
 * POST /api/filing/reminders/generate
 * Generate filing reminders for a tenant
 */
app.post('/api/filing/reminders/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, financialYear } = req.body;

    if (req.user?.tenantId !== tenantId && !req.user?.isService) {
      res.status(403).json({ error: 'Access denied to this tenant' });
      return;
    }

    await generateFilingReminders(tenantId, financialYear ?? '2024-2025');

    res.json({
      success: true,
      message: 'Filing reminders generated successfully',
    });
  } catch (error) {
    console.error('Generate reminders error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to generate reminders',
    });
  }
});

// ============ Compliance Summary Endpoints ============

/**
 * GET /api/compliance/:tenantId/summary
 * Get compliance summary for a tenant
 */
app.get('/api/compliance/:tenantId/summary', authenticate, tenantIsolation, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { financialYear } = req.query as { financialYear?: string };

    const summary = await getComplianceSummary(
      tenantId,
      financialYear ?? '2024-2025'
    );

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Compliance summary error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to retrieve compliance summary',
    });
  }
});

/**
 * GET /api/compliance/:tenantId/records
 * Get all compliance records for a tenant
 */
app.get('/api/compliance/:tenantId/records', authenticate, tenantIsolation, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { type, status, financialYear } = req.query as {
      type?: 'gst' | 'tds' | 'payroll';
      status?: string;
      financialYear?: string;
    };

    const records = await ComplianceRecord.find({
      tenantId,
      ...(type && { type }),
      ...(status && { status }),
      ...(financialYear && { financialYear }),
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('Compliance records error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to retrieve records',
    });
  }
});

// ============ Error Handler ============

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

// ============ Database Connection & Server Start ============

async function startServer() {
  try {
    // Connect to MongoDB using config
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    // Start server on configured port
    app.listen(config.port, () => {
      console.log(`Finance Compliance: ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
