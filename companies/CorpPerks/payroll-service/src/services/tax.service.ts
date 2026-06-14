import { TaxDeclaration } from '../models/index.js';
import config from '../config/index.js';
import type { ITaxDeclaration, ApiResponse, SubmitTaxDeclarationInput } from '../types/index.js';
import { TAX_SECTIONS } from '../types/index.js';

export class TaxService {
  /**
   * Get tax declarations for an employee
   */
  async getDeclarations(
    tenantId: string,
    employeeId: string,
    fiscalYear?: string
  ): Promise<ApiResponse<ITaxDeclaration | ITaxDeclaration[]>> {
    const query: Record<string, unknown> = { tenantId, employeeId };
    if (fiscalYear) query.fiscalYear = fiscalYear;

    const declarations = await TaxDeclaration.find(query).sort({ fiscalYear: -1 });

    if (fiscalYear) {
      return {
        success: true,
        data: declarations[0] || null,
        message: declarations.length === 0 ? 'No declarations found for this fiscal year' : undefined,
      };
    }

    return { success: true, data: declarations };
  }

  /**
   * Submit tax declarations for an employee
   */
  async submitDeclaration(
    tenantId: string,
    input: SubmitTaxDeclarationInput
  ): Promise<ApiResponse<ITaxDeclaration>> {
    const { employeeId, fiscalYear, declarations, basicSalary = 0, totalAllowances = 0 } = input;

    // Check for existing declaration
    const existing = await TaxDeclaration.findOne({ tenantId, employeeId, fiscalYear });
    if (existing) {
      // Update existing declaration
      existing.declarations = declarations.map((d) => ({
        ...d,
        status: 'pending' as const,
      }));
      existing.totalDeclared = declarations.reduce((sum, d) => sum + d.amount, 0);
      existing.totalVerified = 0;
      existing.status = 'pending';
      existing.submittedAt = new Date();

      await existing.save();

      return {
        success: true,
        data: existing,
        message: 'Tax declaration updated successfully',
      };
    }

    // Create new declaration
    const totalDeclared = declarations.reduce((sum, d) => sum + d.amount, 0);

    const newDeclaration = new TaxDeclaration({
      tenantId,
      employeeId,
      fiscalYear,
      declarations: declarations.map((d) => ({
        ...d,
        status: 'pending' as const,
      })),
      totalDeclared,
      totalVerified: 0,
      status: 'pending',
      submittedAt: new Date(),
      basicSalary,
      totalAllowances,
    });

    await newDeclaration.save();

    return {
      success: true,
      data: newDeclaration,
      message: 'Tax declaration submitted successfully',
    };
  }

  /**
   * Verify a tax declaration (HR/Admin action)
   */
  async verifyDeclaration(
    tenantId: string,
    declarationId: string,
    verifiedBy: string,
    sectionStatuses: { section: string; status: 'approved' | 'rejected'; rejectionReason?: string }[]
  ): Promise<ApiResponse<ITaxDeclaration>> {
    const declaration = await TaxDeclaration.findOne({ _id: declarationId, tenantId });

    if (!declaration) {
      return { success: false, error: 'Tax declaration not found' };
    }

    let totalVerified = 0;
    let allApproved = true;

    for (const update of sectionStatuses) {
      const declarationItem = declaration.declarations.find((d) => d.section === update.section);
      if (declarationItem) {
        declarationItem.status = update.status;
        if (update.status === 'approved') {
          totalVerified += declarationItem.amount;
          declarationItem.verifiedAt = new Date();
          declarationItem.verifiedBy = verifiedBy;
        } else {
          allApproved = false;
          declarationItem.verifiedAt = new Date();
          declarationItem.verifiedBy = verifiedBy;
        }
      }
    }

    declaration.totalVerified = totalVerified;
    declaration.status = allApproved ? 'approved' : 'pending';
    declaration.verifiedBy = verifiedBy;
    declaration.verifiedAt = new Date();

    await declaration.save();

    return {
      success: true,
      data: declaration,
      message: `Declaration verified. Total verified: ₹${totalVerified.toLocaleString()}`,
    };
  }

  /**
   * Get all pending declarations for a tenant (HR dashboard)
   */
  async getPendingDeclarations(
    tenantId: string,
    fiscalYear: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<{ declarations: ITaxDeclaration[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> {
    const query = { tenantId, fiscalYear, status: { $in: ['pending', 'rejected'] } };
    const skip = (page - 1) * limit;

    const [declarations, total] = await Promise.all([
      TaxDeclaration.find(query).sort({ submittedAt: -1 }).skip(skip).limit(limit),
      TaxDeclaration.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        declarations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Calculate estimated tax for an employee
   */
  async calculateEstimatedTax(
    tenantId: string,
    employeeId: string,
    annualIncome: number
  ): Promise<ApiResponse<{
    grossIncome: number;
    standardDeduction: number;
    totalDeclarations: number;
    taxableIncome: number;
    taxSlab: string;
    estimatedTax: number;
    monthlyTDS: number;
    effectiveRate: number;
  }>> {
    // Get latest approved declaration
    const declaration = await TaxDeclaration.findOne({
      tenantId,
      employeeId,
      status: 'approved',
    }).sort({ submittedAt: -1 });

    const standardDeduction = config.tax.standardDeduction;
    const totalDeclarations = declaration?.totalVerified || 0;
    const taxableIncome = Math.max(0, annualIncome - standardDeduction - totalDeclarations);

    const { taxSlab, estimatedTax } = this.calculateTaxSlab(taxableIncome);
    const monthlyTDS = Math.round(estimatedTax / 12);
    const effectiveRate = annualIncome > 0 ? (estimatedTax / annualIncome) * 100 : 0;

    return {
      success: true,
      data: {
        grossIncome: annualIncome,
        standardDeduction,
        totalDeclarations,
        taxableIncome,
        taxSlab,
        estimatedTax,
        monthlyTDS,
        effectiveRate: Math.round(effectiveRate * 100) / 100,
      },
    };
  }

  /**
   * Get available tax sections
   */
  getTaxSections(): { code: string; name: string; maxAmount: number; description: string }[] {
    return TAX_SECTIONS;
  }

  /**
   * Calculate tax based on income slabs (New Tax Regime FY 2024-25)
   */
  private calculateTaxSlab(taxableIncome: number): { taxSlab: string; estimatedTax: number } {
    if (taxableIncome <= 300000) {
      return { taxSlab: '0% (0-3L)', estimatedTax: 0 };
    }
    if (taxableIncome <= 700000) {
      const tax = (taxableIncome - 300000) * 0.05;
      return { taxSlab: '5% (3L-7L)', estimatedTax: tax };
    }
    if (taxableIncome <= 1000000) {
      const tax = 20000 + (taxableIncome - 700000) * 0.1;
      return { taxSlab: '10% (7L-10L)', estimatedTax: tax };
    }
    if (taxableIncome <= 1200000) {
      const tax = 50000 + (taxableIncome - 1000000) * 0.15;
      return { taxSlab: '15% (10L-12L)', estimatedTax: tax };
    }
    if (taxableIncome <= 1500000) {
      const tax = 80000 + (taxableIncome - 1200000) * 0.2;
      return { taxSlab: '20% (12L-15L)', estimatedTax: tax };
    }
    const tax = 140000 + (taxableIncome - 1500000) * 0.3;
    return { taxSlab: '30% (15L+)', estimatedTax: tax };
  }

  /**
   * Reject a tax declaration
   */
  async rejectDeclaration(
    tenantId: string,
    declarationId: string,
    rejectedBy: string,
    reason: string
  ): Promise<ApiResponse<ITaxDeclaration>> {
    const declaration = await TaxDeclaration.findOne({ _id: declarationId, tenantId });

    if (!declaration) {
      return { success: false, error: 'Tax declaration not found' };
    }

    declaration.status = 'rejected';
    declaration.rejectionReason = reason;
    declaration.verifiedBy = rejectedBy;
    declaration.verifiedAt = new Date();

    await declaration.save();

    return {
      success: true,
      data: declaration,
      message: 'Tax declaration rejected',
    };
  }
}

export const taxService = new TaxService();
