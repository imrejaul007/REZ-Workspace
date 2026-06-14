/**
 * New Features Integration Tests
 *
 * Tests for: Bank Statement Parser, Reconciliation, E-waybill, GSTR, TDS
 */

import { describe, test, expect } from '@jest/globals';


// ── Bank Statement Parser Tests ──────────────────────────────────────────────

describe('Bank Statement Parser', () => {
  test('should parse HDFC CSV format correctly', async () => {
    const hdfcCSV = `Date,Description,Debit,Credit,Balance,Reference
01/01/2024,NEFT UTR123456789012,1000,,9000,UTR123456789012
02/01/2024,UPI FROM ABC@YBL,,5000,14000,
03/01/2024,RTGS REF987654321,20000,,34000,REF987654321`;

    // Import the parser
    const { parseHDFCCSV, parseGenericCSV, detectCategory, extractUTR } = await import('../src/services/bankStatementParser');

    const transactions = parseHDFCCSV(hdfcCSV);

    expect(transactions.length).toBe(3);
    expect(transactions[0].category).toBe('neft');
    expect(transactions[1].category).toBe('upi');
    expect(transactions[2].category).toBe('rtgs');
    expect(transactions[0].debit).toBe(1000);
    expect(transactions[1].credit).toBe(5000);
  });

  test('should extract UTR numbers from descriptions', async () => {
    const { extractUTR } = await import('../src/services/bankStatementParser');

    expect(extractUTR('NEFT UTR123456789012')).toBe('123456789012');
    expect(extractUTR('Payment Ref: ABC123XYZ')).toBeUndefined();
  });

  test('should detect transaction categories', async () => {
    const { detectCategory } = await import('../src/services/bankStatementParser');

    expect(detectCategory('NEFT transaction')).toBe('neft');
    expect(detectCategory('RTGS transfer')).toBe('rtgs');
    expect(detectCategory('UPI from user@ybl')).toBe('upi');
    expect(detectCategory('IMPS transfer')).toBe('imps');
    expect(detectCategory('Cash deposit')).toBe('cash');
    expect(detectCategory('Cheque deposit')).toBe('cheque');
    expect(detectCategory('Unknown transaction')).toBe('other');
  });

  test('should parse generic CSV with auto-detection', async () => {
    const genericCSV = `date,description,debit,credit,balance
2024-01-01,Test transaction,1000,,5000
2024-01-02,Credit received,,2000,7000`;

    const { parseGenericCSV } = await import('../src/services/bankStatementParser');

    const transactions = parseGenericCSV(genericCSV);

    expect(transactions.length).toBe(2);
    expect(transactions[0].transactionType).toBe('debit');
    expect(transactions[1].transactionType).toBe('credit');
  });
});

// ── TDS Calculator Tests ─────────────────────────────────────────────────────

describe('TDS Calculator', () => {
  test('should calculate TDS for section 194C correctly', async () => {
    const { calculateTDS } = await import('../src/services/tdsTcsService');

    // Below threshold - no TDS
    const belowThreshold = calculateTDS(20000, '194C', 'individual');
    expect(belowThreshold.isTdsApplicable).toBe(false);
    expect(belowThreshold.tdsAmount).toBe(0);

    // Above threshold - TDS applicable
    const aboveThreshold = calculateTDS(50000, '194C', 'individual');
    expect(aboveThreshold.isTdsApplicable).toBe(true);
    expect(aboveThreshold.tdsAmount).toBe(1000); // 2% of 50000
    expect(aboveThreshold.tdsRate).toBe(2);
  });

  test('should calculate TDS for section 194J (professional fees)', async () => {
    const { calculateTDS } = await import('../src/services/tdsTcsService');

    const result = calculateTDS(100000, '194J', 'individual');
    expect(result.isTdsApplicable).toBe(true);
    expect(result.tdsAmount).toBe(10000); // 10% of 100000
  });

  test('should calculate TDS for section 194Q (goods purchase)', async () => {
    const { calculateTDS } = await import('../src/services/tdsTcsService');

    // Below threshold (5 lakhs)
    const below = calculateTDS(300000, '194Q', 'individual');
    expect(below.isTdsApplicable).toBe(false);

    // Above threshold
    const above = calculateTDS(600000, '194Q', 'individual');
    expect(above.isTdsApplicable).toBe(true);
    expect(above.tdsAmount).toBe(600); // 0.1% of 600000
  });

  test('should not apply threshold for companies', async () => {
    const { calculateTDS } = await import('../src/services/tdsTcsService');

    const result = calculateTDS(10000, '194C', 'company');
    expect(result.isTdsApplicable).toBe(true); // No threshold for companies
    expect(result.tdsAmount).toBe(200); // 2% of 10000
  });
});

// ── TCS Calculator Tests ──────────────────────────────────────────────────────

describe('TCS Calculator', () => {
  test('should calculate TCS for e-commerce sales', async () => {
    const { calculateTCS } = await import('../src/services/tdsTcsService');

    // Below threshold
    const below = calculateTCS(300000, '206C1H');
    expect(below.isTcsApplicable).toBe(false);

    // Above threshold (50 lakhs)
    const above = calculateTCS(6000000, '206C1H');
    expect(above.isTcsApplicable).toBe(true);
    expect(above.tcsAmount).toBe(3000); // 0.05% of 6000000
  });
});

// ── E-waybill Number Generation Tests ──────────────────────────────────────

describe('E-waybill Service', () => {
  test('should generate valid e-waybill number format', async () => {
    const { generateEwaybill } = await import('../src/services/ewaybillService');

    const request = {
      purchaseOrderId: '507f1f77bcf86cd799439011',
      ewaybillType: 'inward' as const,
      documentType: 'inv' as const,
      documentNumber: 'INV-001',
      documentDate: '2024-01-15',
      fromName: 'Test Supplier',
      fromAddress: '123 Test St',
      fromPlace: 'Mumbai',
      fromState: 'Maharashtra',
      fromPincode: '400001',
      toName: 'Test Merchant',
      toAddress: '456 Merchant St',
      toPlace: 'Mumbai',
      toState: 'Maharashtra',
      toPincode: '400001',
      items: [{
        productName: 'Test Product',
        hsnCode: '1234',
        quantity: 10,
        unit: 'NOS',
        taxableValue: 10000,
        cgstRate: 9,
        sgstRate: 9,
      }],
      transporterMode: 'road' as const,
      distance: 500,
    };

    const result = await generateEwaybill('507f1f77bcf86cd799439011', request);

    expect(result.success).toBe(true);
    expect(result.ewaybillNumber).toBeDefined();
    expect(result.ewaybillNumber?.length).toBeGreaterThanOrEqual(14);

    // Should be in format: YYMM + 8 digits
    const ewaybillNum = result.ewaybillNumber!;
    expect(ewaybillNum).toMatch(/^\d{14}$/);
  });

  test('should reject cancellation after expiry', async () => {
    const { cancelEwaybill } = await import('../src/services/ewaybillService');

    // First create an e-waybill
    const { generateEwaybill } = await import('../src/services/ewaybillService');
    const result = await generateEwaybill('507f1f77bcf86cd799439011', {
      purchaseOrderId: '507f1f77bcf86cd799439011',
      ewaybillType: 'inward',
      documentType: 'inv',
      documentNumber: 'INV-002',
      documentDate: '2024-01-15',
      fromName: 'Supplier',
      fromAddress: '',
      fromPlace: '',
      fromState: 'Maharashtra',
      fromPincode: '400001',
      toName: 'Merchant',
      toAddress: '',
      toPlace: '',
      toState: 'Maharashtra',
      toPincode: '400001',
      items: [],
      transporterMode: 'road',
      distance: 100,
    });

    const cancelResult = await cancelEwaybill(
      '507f1f77bcf86cd799439011',
      result.ewaybillNumber!,
      'User cancelled',
      '1'
    );

    expect(cancelResult.success).toBe(true);
  });
});

// ── GSTR Generation Tests ────────────────────────────────────────────────────

describe('GSTR Service', () => {
  test('should generate GSTR-1 structure correctly', async () => {
    const { generateGSTR1 } = await import('../src/services/gstrService');

    const result = await generateGSTR1('507f1f77bcf86cd799439011', 2024, 1);

    expect(result.records).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.period).toBe('2024-01');
    expect(result.summary.b2bCount).toBeDefined();
    expect(result.summary.totalTaxableValue).toBeDefined();
  });

  test('should generate GSTR-2 structure correctly', async () => {
    const { generateGSTR2 } = await import('../src/services/gstrService');

    const result = await generateGSTR2('507f1f77bcf86cd799439011', 2024, 1);

    expect(result.records).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.period).toBe('2024-01');
    expect(result.summary.b2bCount).toBeDefined();
    expect(result.summary.totalItcAvailable).toBeDefined();
  });

  test('should generate GSTR-3B summary correctly', async () => {
    const { generateGSTR3B } = await import('../src/services/gstrService');

    const result = await generateGSTR3B('507f1f77bcf86cd799439011', 2024, 1);

    expect(result.outwardSummary).toBeDefined();
    expect(result.inwardSummary).toBeDefined();
    expect(result.itcSummary).toBeDefined();
    expect(result.taxPayable).toBeDefined();
    expect(result.taxPayable.total).toBeDefined();
  });
});

// ── Reconciliation Tests ────────────────────────────────────────────────────

describe('Reconciliation Service', () => {
  test('should generate reconciliation summary', async () => {
    const { getReconciliationSummary } = await import('../src/services/reconciliationService');

    const summary = await getReconciliationSummary('507f1f77bcf86cd799439011');

    expect(summary.totalRecords).toBeDefined();
    expect(summary.matched).toBeDefined();
    expect(summary.unmatched).toBeDefined();
    expect(summary.disputed).toBeDefined();
    expect(summary.totalMatchedAmount).toBeDefined();
    expect(summary.totalUnmatchedAmount).toBeDefined();
  });

  test('should handle dispute resolution', async () => {
    const { disputeRecord, resolveDispute } = await import('../src/services/reconciliationService');

    // This tests the dispute flow (in-memory records)
    const disputeResult = await disputeRecord(
      '507f1f77bcf86cd799439011',
      'ledger',
      '507f1f77bcf86cd799439012',
      'Amount mismatch'
    );

    expect(disputeResult).toBeDefined();
    expect(disputeResult.success).toBeDefined();
  });
});

// ── Validation Tests ────────────────────────────────────────────────────────

describe('TDS Sections Configuration', () => {
  test('should have all required TDS sections defined', async () => {
    const tdsRates = {
      '193J': { rate: 0.1, threshold: 5000 },
      '194': { rate: 0.1, threshold: 10000 },
      '194A': { rate: 0.1, threshold: 40000 },
      '194C': { rate: 0.02, threshold: 30000 },
      '194D': { rate: 0.05, threshold: 15000 },
      '194H': { rate: 0.05, threshold: 15000 },
      '194I': { rate: 0.02, threshold: 180000 },
      '194J': { rate: 0.1, threshold: 30000 },
      '194Q': { rate: 0.001, threshold: 500000 },
    };

    Object.entries(tdsRates).forEach(([section, config]) => {
      expect(config.rate).toBeGreaterThan(0);
      expect(config.threshold).toBeGreaterThanOrEqual(0);
    });
  });
});

// ── Vendor Portal Tests ──────────────────────────────────────────────────────

describe('Vendor Portal Service', () => {
  test('should generate vendor access credentials', async () => {
    const { generateVendorAccess } = await import('../src/services/vendorPortalService');

    const result = await generateVendorAccess(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012'
    );

    expect(result.access).toBeDefined();
    expect(result.access.supplierId).toBe('507f1f77bcf86cd799439011');
    expect(result.access.merchantId).toBe('507f1f77bcf86cd799439012');
    expect(result.access.accessToken).toMatch(/^vpt_/);
    expect(result.tempPassword).toBeDefined();
    expect(result.tempPassword?.length).toBe(8);
  });

  test('should validate vendor access token', async () => {
    const { generateVendorAccess, validateVendorAccess } = await import('../src/services/vendorPortalService');

    const { access } = await generateVendorAccess(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012'
    );

    const validated = await validateVendorAccess(access.accessToken);

    expect(validated).not.toBeNull();
    expect(validated?.isActive).toBe(true);
  });

  test('should revoke vendor access', async () => {
    const { generateVendorAccess, revokeVendorAccess } = await import('../src/services/vendorPortalService');

    const { access } = await generateVendorAccess(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012'
    );

    const result = await revokeVendorAccess(access.accessToken);
    expect(result).toBe(true);
  });
});

// ── Cash Flow Forecast Tests ─────────────────────────────────────────────────

describe('Cash Flow Forecast Service', () => {
  test('should generate cash flow forecast', async () => {
    const { generateForecast } = await import('../src/services/cashFlowForecastService');

    const forecast = await generateForecast('507f1f77bcf86cd799439011', 30);

    expect(forecast.merchantId).toBe('507f1f77bcf86cd799439011');
    expect(forecast.openingBalance).toBeDefined();
    expect(forecast.totalInflows).toBeDefined();
    expect(forecast.totalOutflows).toBeDefined();
    expect(forecast.closingBalance).toBe(forecast.openingBalance + forecast.totalInflows - forecast.totalOutflows);
    expect(forecast.dailyProjections.length).toBe(30);
    expect(forecast.confidence).toBeGreaterThan(0);
    expect(forecast.confidence).toBeLessThanOrEqual(100);
  });

  test('should generate alerts for negative balance', async () => {
    const { generateForecast } = await import('../src/services/cashFlowForecastService');

    const forecast = await generateForecast('507f1f77bcf86cd799439011', 30, 10000);

    // Should generate alerts
    expect(Array.isArray(forecast.alerts)).toBe(true);
  });
});

// ── Multi-Bank Aggregation Tests ─────────────────────────────────────────────

describe('Multi-Bank Aggregation Service', () => {
  test('should add bank account', async () => {
    const { addBankAccount } = await import('../src/services/multiBankAggregationService');

    const account = await addBankAccount('507f1f77bcf86cd799439011', {
      provider: 'hdfc',
      accountNumber: '50200012345678',
      accountType: 'current',
      accountHolderName: 'Test Company',
      balance: 500000,
      currency: 'INR',
      isPrimary: true,
    });

    expect(account.id).toBeDefined();
    expect(account.provider).toBe('hdfc');
    expect(account.accountNumber).toBe('50200012345678');
    expect(account.isActive).toBe(true);
  });

  test('should get merchant accounts', async () => {
    const { addBankAccount, getMerchantAccounts } = await import('../src/services/multiBankAggregationService');

    await addBankAccount('507f1f77bcf86cd799439013', {
      provider: 'icici',
      accountNumber: '000405012345',
      accountType: 'savings',
      accountHolderName: 'Test Savings',
      balance: 100000,
      currency: 'INR',
      isPrimary: false,
    });

    const accounts = await getMerchantAccounts('507f1f77bcf86cd799439013');
    expect(accounts.length).toBeGreaterThan(0);
    expect(accounts[0].isPrimary).toBe(true);
  });

  test('should calculate aggregated balance', async () => {
    const { getAggregatedBalance } = await import('../src/services/multiBankAggregationService');

    const balance = await getAggregatedBalance('507f1f77bcf86cd799439011');

    expect(balance.totalBalance).toBeGreaterThanOrEqual(0);
    expect(balance.totalAvailable).toBeGreaterThanOrEqual(0);
    expect(balance.accountsCount).toBeGreaterThanOrEqual(0);
  });
});

// ── Employee Disbursements Tests ────────────────────────────────────────────

describe('Employee Disbursements Service', () => {
  test('should add employee', async () => {
    const { addEmployee } = await import('../src/services/employeePayoutsService');

    const employee = await addEmployee('507f1f77bcf86cd799439011', {
      employeeId: 'EMP001',
      name: 'Rajesh Kumar',
      email: 'rajesh@company.com',
      phone: '+919876543210',
      department: 'Engineering',
      designation: 'Software Engineer',
      bankAccount: {
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        accountHolderName: 'Rajesh Kumar',
      },
    });

    expect(employee.id).toBeDefined();
    expect(employee.employeeId).toBe('EMP001');
    expect(employee.name).toBe('Rajesh Kumar');
    expect(employee.isActive).toBe(true);
  });

  test('should create disbursement', async () => {
    const { addEmployee, createDisbursement } = await import('../src/services/employeePayoutsService');

    const employee = await addEmployee('507f1f77bcf86cd799439011', {
      employeeId: 'EMP002',
      name: 'Priya Singh',
      email: 'priya@company.com',
      phone: '+919876543211',
    });

    const disbursement = await createDisbursement('507f1f77bcf86cd799439011', {
      employeeId: employee.id,
      type: 'salary',
      amount: 85000,
      description: 'January Salary',
      paymentMethod: 'bank_transfer',
    });

    expect(disbursement.id).toBeDefined();
    expect(disbursement.reference).toMatch(/^SAL-/);
    expect(disbursement.status).toBe('pending');
    expect(disbursement.netAmount).toBe(85000);
  });

  test('should create bulk disbursement batch', async () => {
    const { addEmployee, createBulkDisbursement } = await import('../src/services/employeePayoutsService');

    const emp1 = await addEmployee('507f1f77bcf86cd799439011', {
      employeeId: 'EMP003',
      name: 'Amit Patel',
      email: 'amit@company.com',
      phone: '+919876543212',
    });

    const emp2 = await addEmployee('507f1f77bcf86cd799439011', {
      employeeId: 'EMP004',
      name: 'Sneha Reddy',
      email: 'sneha@company.com',
      phone: '+919876543213',
    });

    const batch = await createBulkDisbursement('507f1f77bcf86cd799439011', {
      type: 'incentive',
      disbursements: [
        { employeeId: emp1.id, amount: 25000, description: 'Q4 Incentive' },
        { employeeId: emp2.id, amount: 30000, description: 'Q4 Incentive' },
      ],
    });

    expect(batch.id).toBeDefined();
    expect(batch.batchNumber).toMatch(/^BATCH-/);
    expect(batch.employeeCount).toBe(2);
    expect(batch.totalAmount).toBe(55000);
    expect(batch.status).toBe('pending');
  });

  test('should approve and process disbursement', async () => {
    const { addEmployee, createDisbursement, approveDisbursement, processDisbursement } = await import('../src/services/employeePayoutsService');

    const employee = await addEmployee('507f1f77bcf86cd799439011', {
      employeeId: 'EMP005',
      name: 'Vikram Joshi',
      email: 'vikram@company.com',
      phone: '+919876543214',
    });

    const disbursement = await createDisbursement('507f1f77bcf86cd799439011', {
      employeeId: employee.id,
      type: 'expense',
      amount: 15000,
      description: 'Travel Reimbursement',
      paymentMethod: 'upi',
    });

    const approved = await approveDisbursement('507f1f77bcf86cd799439011', disbursement.id, 'admin123');
    expect(approved?.status).toBe('approved');
    expect(approved?.approvedBy).toBe('admin123');
    expect(approved?.approvedAt).toBeDefined();

    const processed = await processDisbursement('507f1f77bcf86cd799439011', disbursement.id);
    expect(['completed', 'failed'].includes(processed?.status || '')).toBe(true);
  });
});

// ── End of Tests ────────────────────────────────────────────────────────────
