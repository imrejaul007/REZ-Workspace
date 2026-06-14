import { v4 as uuidv4 } from 'uuid';
import { ComplianceCheck, IComplianceCheck, IComplianceIssue, IGSTCompliance, ITDSCompliance, ComplianceType } from '../models/ComplianceCheck';
import config from '../config';

// Response types
export interface ComplianceStatusResponse {
  companyId: string;
  overallStatus: 'compliant' | 'non_compliant' | 'pending_review';
  score: number;
  checks: {
    type: ComplianceType;
    status: string;
    score: number;
    lastChecked: Date | null;
    nextDueDate: Date | null;
  }[];
  criticalIssues: number;
  warnings: number;
}

export interface ComplianceCheckRequest {
  companyId: string;
  type: ComplianceType;
  period: {
    start: Date;
    end: Date;
  };
  data?: {
    // GST data
    turnover?: number;
    gstin?: string;
    inputTaxCredit?: number;
    outputTax?: number;
    // TDS data
    transactions?: Array<{
      section: string;
      amount: number;
      recipientPan?: string;
    }>;
    tan?: string;
    // PF/ESI data
    employeeCount?: number;
    pfContributions?: number;
    esiContributions?: number;
  };
}

export interface ComplianceReport {
  reportId: string;
  companyId: string;
  type: ComplianceType;
  period: {
    start: Date;
    end: Date;
  };
  generatedAt: Date;
  summary: {
    score: number;
    status: string;
    passedChecks: number;
    failedChecks: number;
    issues: IComplianceIssue[];
  };
  details: IGSTCompliance | ITDSCompliance | Record<string, unknown>;
  recommendations: string[];
}

class ComplianceService {
  /**
   * Get overall compliance status for a company
   */
  async getComplianceStatus(companyId: string): Promise<ComplianceStatusResponse> {
    const checks = await ComplianceCheck.find({ companyId })
      .sort({ type: 1, checkedAt: -1 })
      .lean();

    // Get latest check for each type
    const latestChecksByType = new Map<string, IComplianceCheck>();
    checks.forEach((check) => {
      if (!latestChecksByType.has(check.type)) {
        latestChecksByType.set(check.type, check as IComplianceCheck);
      }
    });

    const checksList = Array.from(latestChecksByType.entries()).map(([type, check]) => ({
      type,
      status: check.status,
      score: check.score,
      lastChecked: check.checkedAt || null,
      nextDueDate: check.nextDueDate || null,
    }));

    const totalScore = checksList.length > 0
      ? checksList.reduce((sum, c) => sum + c.score, 0) / checksList.length
      : 0;

    const criticalIssues = checksList.filter(
      (c) => c.status === 'failed' || c.score < 50
    ).length;

    let overallStatus: 'compliant' | 'non_compliant' | 'pending_review';
    if (checksList.length === 0) {
      overallStatus = 'pending_review';
    } else if (criticalIssues > 0 || totalScore < 70) {
      overallStatus = 'non_compliant';
    } else {
      overallStatus = 'compliant';
    }

    return {
      companyId,
      overallStatus,
      score: Math.round(totalScore),
      checks: checksList,
      criticalIssues,
      warnings: checksList.filter((c) => c.score < 80 && c.score >= 50).length,
    };
  }

  /**
   * Run a compliance check
   */
  async runComplianceCheck(request: ComplianceCheckRequest): Promise<IComplianceCheck> {
    const { companyId, type, period, data } = request;

    // Check for existing check
    const existingCheck = await ComplianceCheck.findOne({
      companyId,
      type,
      'period.start': period.start,
      'period.end': period.end,
    });

    // Create new check
    const check = new ComplianceCheck({
      companyId,
      type,
      status: 'in_progress',
      period,
      checkedAt: new Date(),
      checkedBy: 'system',
      version: existingCheck ? existingCheck.version + 1 : 1,
    });

    // Run specific compliance check based on type
    switch (type) {
      case 'gst':
        await this.runGSTCheck(check, data);
        break;
      case 'tds':
        await this.runTDSCheck(check, data);
        break;
      case 'pf':
      case 'esi':
        await this.runPFESICheck(check, data);
        break;
      default:
        await this.runGenericCheck(check, data);
    }

    // Calculate score and determine status
    check.score = check.calculateScore();
    check.status = check.score >= 80 ? 'completed' : check.score >= 50 ? 'flagged' : 'failed';

    // Set next due date based on type
    check.nextDueDate = this.calculateNextDueDate(type);

    await check.save();
    return check;
  }

  /**
   * Run GST compliance check
   */
  private async runGSTCheck(check: InstanceType<typeof ComplianceCheck>, data?: ComplianceCheckRequest['data']): Promise<void> {
    const gstData = data || {};
    const issues: IComplianceIssue[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const turnover = gstData.turnover || 0;
    const threshold = config.compliance.gst.threshold;

    // GST Registration check
    if (turnover >= threshold && !gstData.gstin) {
      issues.push({
        code: 'GST001',
        description: 'Company turnover exceeds GST threshold but GSTIN not registered',
        severity: 'critical',
        field: 'gstin',
        suggestion: 'Apply for GST registration immediately',
      });
    }

    // Threshold check
    if (turnover >= threshold) {
      warnings.push('Turnover exceeds mandatory GST registration threshold of ₹40 Lakhs');
      recommendations.push('Ensure timely GST registration and filing');
    }

    // Calculate GST liability
    const inputTaxCredit = gstData.inputTaxCredit || 0;
    const outputTax = gstData.outputTax || 0;
    const netLiability = Math.max(0, outputTax - inputTaxCredit);

    // GST rate determination (simplified)
    let applicableRate = 18; // Default rate
    if (turnover < 2500000) {
      applicableRate = 0; // Nil rated for small businesses
    } else if (turnover < 5000000) {
      applicableRate = 5;
    }

    // Filing status checks
    check.gstCompliance = {
      registrationStatus: !!gstData.gstin,
      gstin: gstData.gstin,
      turnover,
      thresholdExceeded: turnover >= threshold,
      applicableRate,
      inputTaxCredit,
      outputTax,
      netLiability,
      filingStatus: 'pending', // Would check actual filing status
    };

    // Nil rated category check
    if (config.compliance.gst.nilRatedCategories.some((cat) => turnover > 0)) {
      warnings.push('Business may qualify for nil-rated GST category');
      recommendations.push('Verify eligibility for GST exemption');
    }

    // Check for net liability issues
    if (netLiability > 100000) {
      issues.push({
        code: 'GST002',
        description: `High GST liability of ₹${netLiability.toLocaleString()}`,
        severity: 'high',
        suggestion: 'Ensure sufficient funds for GST payment before due date',
      });
    }

    check.issues = issues;
    check.warnings = warnings;
    check.recommendations = recommendations;
  }

  /**
   * Run TDS compliance check
   */
  private async runTDSCheck(check: InstanceType<typeof ComplianceCheck>, data?: ComplianceCheckRequest['data']): Promise<void> {
    const tdsData = data || {};
    const issues: IComplianceIssue[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const transactions = tdsData.transactions || [];
    const threshold = config.compliance.tds.threshold;
    const sections = config.compliance.tds.sections;

    // Aggregate transactions by section
    const sectionSummary = new Map<string, { count: number; amount: number; tdsDeducted: number }>();

    for (const txn of transactions) {
      const existing = sectionSummary.get(txn.section) || { count: 0, amount: 0, tdsDeducted: 0 };
      existing.count += 1;
      existing.amount += txn.amount;
      existing.tdsDeducted += txn.amount * (sections[txn.section as keyof typeof sections]?.rate || 0.1);

      // Check threshold
      if (txn.amount >= threshold) {
        issues.push({
          code: 'TDS001',
          description: `Transaction of ₹${txn.amount.toLocaleString()} exceeds threshold for Section ${txn.section}`,
          severity: 'medium',
          field: 'transactions',
          suggestion: `Ensure TDS deducted at ${(sections[txn.section as keyof typeof sections]?.rate || 0.1) * 100}%`,
        });
      }

      // PAN verification check
      if (!txn.recipientPan || txn.recipientPan.length !== 10) {
        issues.push({
          code: 'TDS002',
          description: 'Recipient PAN not provided or invalid',
          severity: 'high',
          field: 'recipientPan',
          suggestion: 'Collect and verify recipient PAN for TDS compliance',
        });
      }

      sectionSummary.set(txn.section, existing);
    }

    // Build section summary
    const sectionDetails = Array.from(sectionSummary.entries()).map(([section, summary]) => ({
      section,
      rate: sections[section as keyof typeof sections]?.rate || 0.1,
      transactions: summary.count,
      amount: summary.amount,
      tdsDeducted: summary.tdsDeducted,
    }));

    // Calculate total TDS liability
    const totalTDS = sectionDetails.reduce((sum, s) => sum + s.tdsDeducted, 0);

    if (totalTDS > 100000) {
      warnings.push(`Total TDS liability of ₹${totalTDS.toLocaleString()} requires quarterly return filing`);
      recommendations.push('File TDS return before quarterly due date to avoid penalties');
    }

    // TAN validation
    if (!tdsData.tan) {
      issues.push({
        code: 'TDS003',
        description: 'TAN not provided - required for TDS operations',
        severity: 'critical',
        field: 'tan',
        suggestion: 'Obtain TAN from NSDL or UTIITSL',
      });
    }

    check.tdsCompliance = {
      panVerified: transactions.every((t) => t.recipientPan && t.recipientPan.length === 10),
      tan: tdsData.tan,
      sections: sectionDetails,
      thresholdExceeded: transactions.some((t) => t.amount >= threshold),
      annualFilingDue: new Date(new Date().getFullYear(), 3, 31),
      quarterlyFilingDue: [
        new Date(new Date().getFullYear(), 4, 30), // Q1
        new Date(new Date().getFullYear(), 7, 31), // Q2
        new Date(new Date().getFullYear(), 10, 30), // Q3
        new Date(new Date().getFullYear() + 1, 4, 31), // Q4
      ],
    };

    check.issues = issues;
    check.warnings = warnings;
    check.recommendations = recommendations;
  }

  /**
   * Run PF/ESI compliance check
   */
  private async runPFESICheck(check: InstanceType<typeof ComplianceCheck>, data?: ComplianceCheckRequest['data']): Promise<void> {
    const pfesiData = data || {};
    const issues: IComplianceIssue[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const employeeCount = pfesiData.employeeCount || 0;

    // PF/ESI applicability thresholds
    const PF_THRESHOLD = 20; // Employees
    const ESI_THRESHOLD = 10; // Employees

    // PF compliance
    if (employeeCount >= PF_THRESHOLD) {
      warnings.push(`Company has ${employeeCount} employees - PF registration mandatory`);
      recommendations.push('Register for EPF and ensure timely contributions');

      if (!pfesiData.pfContributions) {
        issues.push({
          code: 'PF001',
          description: 'PF contributions not recorded',
          severity: 'high',
          suggestion: 'Ensure PF contributions are calculated and remitted',
        });
      }
    }

    // ESI compliance
    if (employeeCount >= ESI_THRESHOLD) {
      warnings.push(`Company has ${employeeCount} employees - ESI registration mandatory`);
      recommendations.push('Register for ESI and ensure timely contributions');

      if (!pfesiData.esiContributions) {
        issues.push({
          code: 'ESI001',
          description: 'ESI contributions not recorded',
          severity: 'high',
          suggestion: 'Ensure ESI contributions are calculated and remitted',
        });
      }
    }

    const pfContribution = pfesiData.pfContributions || 0;
    const esiContribution = pfesiData.esiContributions || 0;

    // Calculate compliance rate
    let complianceRate = 100;
    if (employeeCount >= PF_THRESHOLD && pfContribution === 0) complianceRate -= 50;
    if (employeeCount >= ESI_THRESHOLD && esiContribution === 0) complianceRate -= 50;

    check.pfesiCompliance = {
      employeeCount,
      pfContribution,
      esiContribution,
      complianceRate,
      nextDueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15),
    };

    check.issues = issues;
    check.warnings = warnings;
    check.recommendations = recommendations;
  }

  /**
   * Run generic compliance check
   */
  private async runGenericCheck(check: InstanceType<typeof ComplianceCheck>, data?: ComplianceCheckRequest['data']): Promise<void> {
    check.issues = [];
    check.warnings = ['Generic compliance check - verify specific requirements manually'];
    check.recommendations = ['Implement proper documentation and audit trails'];
  }

  /**
   * Calculate next due date based on compliance type
   */
  private calculateNextDueDate(type: ComplianceType): Date {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    switch (type) {
      case 'gst':
        // GSTR-1 due: 11th of next month (for monthly filers)
        return new Date(year, month + 1, 11);
      case 'tds':
        // TDS quarterly return due: 30th of next month after quarter
        const quarter = Math.floor(month / 3);
        return new Date(year, quarter * 3 + 4, 30);
      case 'pf':
      case 'esi':
        // PF/ESI due: 15th of next month
        return new Date(year, month + 1, 15);
      case 'annual':
        return new Date(year, 3, 31); // March 31st
      default:
        return new Date(year, month + 3, 1); // 3 months later
    }
  }

  /**
   * Get compliance reports
   */
  async getReports(
    companyId?: string,
    type?: ComplianceType,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ reports: ComplianceReport[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (companyId) query.companyId = companyId;
    if (type) query.type = type;

    const [checks, total] = await Promise.all([
      ComplianceCheck.find(query)
        .sort({ checkedAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      ComplianceCheck.countDocuments(query),
    ]);

    const reports: ComplianceReport[] = checks.map((check) => ({
      reportId: (check._id as unknown as string) || uuidv4(),
      companyId: check.companyId,
      type: check.type,
      period: check.period,
      generatedAt: check.checkedAt || new Date(),
      summary: {
        score: check.score,
        status: check.status,
        passedChecks: check.issues.filter((i) => i.severity === 'low').length,
        failedChecks: check.issues.filter((i) => ['high', 'critical'].includes(i.severity)).length,
        issues: check.issues,
      },
      details: (check.gstCompliance || check.tdsCompliance || check.pfesiCompliance) || {},
      recommendations: check.recommendations,
    }));

    return { reports, total };
  }

  /**
   * Run GST compliance check (standalone)
   */
  async checkGST(request: {
    companyId: string;
    turnover: number;
    gstin?: string;
    inputTaxCredit?: number;
    outputTax?: number;
  }): Promise<{
    compliant: boolean;
    score: number;
    issues: IComplianceIssue[];
    recommendations: string[];
  }> {
    const { companyId, turnover, gstin, inputTaxCredit = 0, outputTax = 0 } = request;
    const issues: IComplianceIssue[] = [];
    const recommendations: string[] = [];

    const threshold = config.compliance.gst.threshold;

    // Registration check
    if (turnover >= threshold && !gstin) {
      issues.push({
        code: 'GST_REG_001',
        description: 'GST registration required but not obtained',
        severity: 'critical',
        suggestion: 'Apply for GST registration within 30 days',
      });
    }

    // Turnover verification
    if (turnover > 100000000) {
      issues.push({
        code: 'GST_TURN_001',
        description: 'Turnover exceeds ₹10 Crores - additional compliance required',
        severity: 'high',
        suggestion: 'Ensure GST audit and annual return filing',
      });
    }

    // Net liability
    const netLiability = outputTax - inputTaxCredit;
    if (netLiability < 0) {
      issues.push({
        code: 'GST_ITC_001',
        description: 'Input tax credit exceeds output tax',
        severity: 'medium',
        suggestion: 'Review ITC claim eligibility',
      });
      recommendations.push('Verify ITC documents are valid and within 1 year');
    }

    const score = issues.length === 0 ? 100 : Math.max(0, 100 - issues.reduce((sum, i) => {
      const weights = { critical: 30, high: 20, medium: 10, low: 5 };
      return sum + (weights[i.severity] || 10);
    }, 0));

    return {
      compliant: issues.filter((i) => i.severity === 'critical').length === 0,
      score,
      issues,
      recommendations,
    };
  }

  /**
   * Run TDS compliance check (standalone)
   */
  async checkTDS(request: {
    companyId: string;
    transactions: Array<{
      section: string;
      amount: number;
      recipientPan?: string;
    }>;
    tan?: string;
  }): Promise<{
    compliant: boolean;
    score: number;
    issues: IComplianceIssue[];
    recommendations: string[];
    totalTDSLiability: number;
  }> {
    const { companyId, transactions, tan } = request;
    const issues: IComplianceIssue[] = [];
    const recommendations: string[] = [];

    const sections = config.compliance.tds.sections;
    let totalTDSLiability = 0;

    // TAN validation
    if (!tan) {
      issues.push({
        code: 'TDS_TAN_001',
        description: 'TAN not provided',
        severity: 'critical',
        suggestion: 'Obtain TAN for TDS operations',
      });
    }

    // Transaction analysis
    for (const txn of transactions) {
      const sectionConfig = sections[txn.section as keyof typeof sections];
      if (!sectionConfig) {
        issues.push({
          code: 'TDS_SEC_001',
          description: `Unknown TDS section: ${txn.section}`,
          severity: 'medium',
          suggestion: 'Verify correct TDS section code',
        });
        continue;
      }

      const tdsAmount = txn.amount * sectionConfig.rate;
      totalTDSLiability += tdsAmount;

      // PAN verification
      if (!txn.recipientPan || txn.recipientPan.length !== 10) {
        issues.push({
          code: 'TDS_PAN_001',
          description: `Invalid PAN for Section ${txn.section} transaction`,
          severity: 'high',
          suggestion: 'Collect and verify recipient PAN',
        });
      }

      // Higher rate without PAN
      if (!txn.recipientPan && txn.amount >= 50000) {
        issues.push({
          code: 'TDS_PAN_002',
          description: `Higher TDS rate applicable without PAN - ₹${txn.amount.toLocaleString()}`,
          severity: 'medium',
          suggestion: 'Collect PAN to reduce TDS rate from 20% to 10%',
        });
        totalTDSLiability += txn.amount * 0.10; // Additional 10% if no PAN
      }
    }

    const score = issues.length === 0 ? 100 : Math.max(0, 100 - issues.reduce((sum, i) => {
      const weights = { critical: 30, high: 20, medium: 10, low: 5 };
      return sum + (weights[i.severity] || 10);
    }, 0));

    return {
      compliant: issues.filter((i) => i.severity === 'critical').length === 0,
      score,
      issues,
      recommendations,
      totalTDSLiability,
    };
  }
}

export const complianceService = new ComplianceService();
export default complianceService;