/**
 * CorpPerks Integration Service
 *
 * Corporate billing and employee management:
 * - Employee verification
 * - Policy enforcement
 * - GST invoicing
 * - Expense tracking
 * - Budget management
 */

import axios, { AxiosInstance } from 'axios';
import { Logger } from '@nestjs/common';
import mongoose from 'mongoose';
import {
  CorporateAccount,
  ICorporateAccount,
  CorporateEmployee,
  ICorporateEmployee,
  CorporateRide,
  ICorporateRide,
  CorporatePlan,
  CorporateStatus,
  EmployeeCorporateStatus,
  CorporateRideStatus,
  ApprovalStatus,
} from '../models/corporate.model';
import { AppError } from '../common/exceptions';

export interface CreateCorporateAccountParams {
  companyName: string;
  domain: string;
  email: string;
  phone: string;
  plan?: string;
  gstIn?: string;
}

export interface EnrollEmployeeParams {
  corporateAccountId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation?: string;
  level?: string;
}

export interface BookCorporateRideParams {
  rideId: string;
  corporateAccountId: string;
  employeeId: string;
  amount: number;
  purpose: 'commute' | 'business' | 'client' | 'pickup' | 'delivery';
  projectCode?: string;
}

export interface RideHistoryFilters {
  employeeId?: string;
  department?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  page?: number;
  limit?: number;
}

// CorpPerks API response types (external service)
export interface CorpPerksEmployee {
  employeeId: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  tier: 'standard' | 'manager' | 'executive' | 'director';
  status: 'active' | 'inactive';
  limits: {
    dailyLimit: number;
    monthlyLimit: number;
    allowedVehicles: ('auto' | 'cab' | 'suv')[];
  };
}

export interface CorporatePolicy {
  companyId: string;
  name: string;
  rules: {
    allowedVehicles: ('auto' | 'cab' | 'suv')[];
    maxFarePerTrip: number;
    dailyLimit: number;
    monthlyLimit: number;
    allowedHours: { start: number; end: number }[];
    allowedDays: number[];
    requiresApproval: boolean;
    approvalThreshold: number;
  };
  gstEnabled: boolean;
  gstPercentage: number;
  billingCycle: 'monthly' | 'weekly';
  invoicePrefix: string;
}

export interface CorporateRideRequest {
  employeeId: string;
  companyId: string;
  pickup: { lat: number; lng: number; address: string };
  drop: { lat: number; lng: number; address: string };
  vehicleType: 'auto' | 'cab' | 'suv';
  purpose: string;
  projectCode?: string;
}

export interface CorporateInvoice {
  invoiceId: string;
  companyId: string;
  companyName: string;
  gstin: string;
  billingPeriod: { start: Date; end: Date };
  rides: {
    date: Date;
    employeeId: string;
    employeeName: string;
    pickup: string;
    drop: string;
    vehicleType: string;
    fare: number;
  }[];
  subtotal: number;
  gst: number;
  total: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: Date;
}

export interface ApprovalRequest {
  requestId: string;
  employeeId: string;
  employeeName: string;
  managerId: string;
  rideDetails: CorporateRideRequest;
  estimatedFare: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export class CorporateService {
  private readonly logger = new Logger('CorporateService');

  // CorpPerks URLs
  private readonly CORPPERKS_URL = process.env.CORPPERKS_URL || 'http://localhost:4000';
  private readonly INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      timeout: 10000,
      headers: {
        'X-Internal-Token': this.INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
    });
  }

  // ===========================================
  // CORPORATE ACCOUNT CRUD
  // ===========================================

  /**
   * Create a new corporate account
   */
  async createCorporateAccount(params: CreateCorporateAccountParams): Promise<ICorporateAccount> {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const account = new CorporateAccount({
      companyId: `C${Date.now()}`,
      companyName: params.companyName,
      domain: params.domain.toLowerCase(),
      plan: (params.plan as CorporatePlan) || CorporatePlan.STARTER,
      status: CorporateStatus.TRIAL,
      budget: {
        totalBudget: 0,
        spentAmount: 0,
        remainingAmount: 0,
        billingCycle: 'monthly',
        lastResetDate: now,
        nextResetDate: nextMonth,
        lowBalanceAlert: true,
        lowBalanceThreshold: 20,
      },
      employeeCount: 0,
      enrolledEmployees: 0,
      integrationEnabled: false,
      expiresAt: nextMonth,
    });

    await account.save();
    return account;
  }

  /**
   * Get corporate account by domain
   */
  async getAccountByDomain(domain: string): Promise<ICorporateAccount | null> {
    return CorporateAccount.findOne({ domain: domain.toLowerCase() });
  }

  /**
   * Get corporate account by ID
   */
  async getAccountById(accountId: string): Promise<ICorporateAccount | null> {
    return CorporateAccount.findById(accountId);
  }

  /**
   * Update corporate account
   */
  async updateAccount(accountId: string, updates: Partial<ICorporateAccount>): Promise<ICorporateAccount | null> {
    return CorporateAccount.findByIdAndUpdate(
      accountId,
      { $set: updates },
      { new: true }
    );
  }

  /**
   * Add budget to account
   */
  async addBudget(accountId: string, amount: number): Promise<ICorporateAccount | null> {
    const account = await CorporateAccount.findById(accountId);
    if (!account) return null;

    account.budget.totalBudget += amount;
    account.budget.remainingAmount += amount;
    await account.save();
    return account;
  }

  // ===========================================
  // EMPLOYEE CRUD
  // ===========================================

  /**
   * Enroll an employee
   */
  async enrollEmployee(params: EnrollEmployeeParams): Promise<ICorporateEmployee> {
    const employee = new CorporateEmployee({
      employeeId: `EMP${Date.now()}`,
      corporateAccountId: new mongoose.Types.ObjectId(params.corporateAccountId),
      name: params.name,
      email: params.email.toLowerCase(),
      phone: params.phone,
      department: params.department,
      designation: params.designation || '',
      level: params.level || 'L1',
      status: EmployeeCorporateStatus.ENROLLED,
      rideBudgetSpent: 0,
      totalRides: 0,
      totalSpend: 0,
      enrolledAt: new Date(),
    });

    await employee.save();

    // Update account employee count
    await CorporateAccount.findByIdAndUpdate(params.corporateAccountId, {
      $inc: { employeeCount: 1, enrolledEmployees: 1 },
    });

    return employee;
  }

  /**
   * Bulk enroll employees
   */
  async bulkEnrollEmployees(
    corporateAccountId: string,
    employees: Omit<EnrollEmployeeParams, 'corporateAccountId'>[]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (const emp of employees) {
      try {
        await this.enrollEmployee({
          ...emp,
          corporateAccountId,
        });
        success++;
      } catch (error: unknown) {
        failed++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${emp.email}: ${message}`);
      }
    }

    return { success, failed, errors };
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(employeeId: string): Promise<ICorporateEmployee | null> {
    return CorporateEmployee.findById(employeeId);
  }

  /**
   * Get employee by email
   */
  async getEmployeeByEmail(email: string): Promise<ICorporateEmployee | null> {
    return CorporateEmployee.findOne({ email: email.toLowerCase() });
  }

  /**
   * Get all employees for an account
   */
  async getAccountEmployees(accountId: string): Promise<ICorporateEmployee[]> {
    return CorporateEmployee.find({ corporateAccountId: accountId });
  }

  /**
   * Update employee
   */
  async updateEmployee(
    employeeId: string,
    updates: Partial<ICorporateEmployee>
  ): Promise<ICorporateEmployee | null> {
    return CorporateEmployee.findByIdAndUpdate(
      employeeId,
      { $set: updates },
      { new: true }
    );
  }

  /**
   * Suspend employee
   */
  async suspendEmployee(employeeId: string): Promise<ICorporateEmployee | null> {
    return CorporateEmployee.findByIdAndUpdate(
      employeeId,
      { $set: { status: EmployeeCorporateStatus.SUSPENDED } },
      { new: true }
    );
  }

  // ===========================================
  // CORPORATE RIDES
  // ===========================================

  /**
   * Book a corporate ride
   */
  async bookCorporateRide(params: BookCorporateRideParams): Promise<ICorporateRide> {
    const cgst = params.amount * 0.09;
    const sgst = params.amount * 0.09;

    const corporateRide = new CorporateRide({
      rideId: new mongoose.Types.ObjectId(params.rideId),
      corporateAccountId: new mongoose.Types.ObjectId(params.corporateAccountId),
      employeeId: new mongoose.Types.ObjectId(params.employeeId),
      amount: params.amount,
      cgst,
      sgst,
      totalAmount: params.amount + cgst + sgst,
      department: 'general',
      purpose: params.purpose,
      projectCode: params.projectCode,
      status: CorporateRideStatus.COMPLETED,
      approvalStatus: ApprovalStatus.NOT_REQUIRED,
    });

    await corporateRide.save();

    // Update account budget
    await CorporateAccount.findByIdAndUpdate(params.corporateAccountId, {
      $inc: {
        'budget.spentAmount': params.amount,
        'budget.remainingAmount': -params.amount,
      },
    });

    // Update employee stats
    await CorporateEmployee.findByIdAndUpdate(params.employeeId, {
      $inc: {
        totalRides: 1,
        rideBudgetSpent: params.amount,
        totalSpend: params.amount,
      },
      $set: { lastRideAt: new Date() },
    });

    return corporateRide;
  }

  /**
   * Approve a corporate ride
   */
  async approveRide(
    rideId: string,
    approverEmail: string,
    approvedAmount?: number
  ): Promise<ICorporateRide | null> {
    const update: Record<string, unknown> = {
      approvalStatus: ApprovalStatus.APPROVED,
      approvedBy: approverEmail,
      approvedAt: new Date(),
    };

    if (approvedAmount !== undefined) {
      update.approvedAmount = approvedAmount;
    }

    return CorporateRide.findByIdAndUpdate(rideId, { $set: update }, { new: true });
  }

  /**
   * Get corporate ride history
   */
  async getCorporateRideHistory(
    accountId: string,
    filters: RideHistoryFilters
  ): Promise<{
    rides: ICorporateRide[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: Record<string, unknown> = {
      corporateAccountId: new mongoose.Types.ObjectId(accountId),
    };

    if (filters.employeeId) {
      query.employeeId = new mongoose.Types.ObjectId(filters.employeeId);
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        (query.createdAt as Record<string, Date>).$gte = filters.startDate;
      }
      if (filters.endDate) {
        (query.createdAt as Record<string, Date>).$lte = filters.endDate;
      }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [rides, total] = await Promise.all([
      CorporateRide.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      CorporateRide.countDocuments(query),
    ]);

    return {
      rides,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===========================================
  // INVOICING
  // ===========================================

  /**
   * Generate invoice for account
   */
  async generateInvoice(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    invoiceNumber: string;
    companyName: string;
    rides: ICorporateRide[];
    subtotal: number;
    cgst: number;
    sgst: number;
    total: number;
  } | null> {
    const account = await CorporateAccount.findById(accountId);
    if (!account) return null;

    const rides = await CorporateRide.find({
      corporateAccountId: accountId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: CorporateRideStatus.COMPLETED,
    });

    const subtotal = rides.reduce((sum, r) => sum + r.amount, 0);
    const cgst = rides.reduce((sum, r) => sum + r.cgst, 0);
    const sgst = rides.reduce((sum, r) => sum + r.sgst, 0);

    return {
      invoiceNumber: `INV-${Date.now()}`,
      companyName: account.companyName,
      rides,
      subtotal,
      cgst,
      sgst,
      total: subtotal + cgst + sgst,
    };
  }

  // ===========================================
  // ANALYTICS
  // ===========================================

  /**
   * Get account analytics
   */
  async getAccountAnalytics(accountId: string): Promise<{
    totalRides: number;
    totalSpend: number;
    activeEmployees: number;
    ridesThisMonth: number;
    spendThisMonth: number;
    avgRideCost: number;
  } | null> {
    const account = await CorporateAccount.findById(accountId);
    if (!account) return null;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allRides, monthRides, employeeStats] = await Promise.all([
      CorporateRide.find({
        corporateAccountId: accountId,
        status: CorporateRideStatus.COMPLETED,
      }),
      CorporateRide.find({
        corporateAccountId: accountId,
        createdAt: { $gte: startOfMonth },
        status: CorporateRideStatus.COMPLETED,
      }),
      CorporateEmployee.find({
        corporateAccountId: accountId,
        status: EmployeeCorporateStatus.ENROLLED,
      }),
    ]);

    const totalSpend = allRides.reduce((sum, r) => sum + r.totalAmount, 0);
    const spendThisMonth = monthRides.reduce((sum, r) => sum + r.totalAmount, 0);

    return {
      totalRides: allRides.length,
      totalSpend,
      activeEmployees: employeeStats.length,
      ridesThisMonth: monthRides.length,
      spendThisMonth,
      avgRideCost: allRides.length > 0 ? totalSpend / allRides.length : 0,
    };
  }

  // ===========================================
  // EMPLOYEE MANAGEMENT (CorpPerks Integration)
  // ===================================================

  /**
   * Verify employee is authorized for corporate rides
   */
  async verifyEmployee(employeeId: string, phone: string): Promise<CorpPerksEmployee | null> {
    try {
      const response = await this.http.get(`${this.CORPPERKS_URL}/api/corporate/employee/verify`, {
        params: { employeeId, phone },
      });
      return response.data.employee;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Employee verification failed: ${message}`);
      return null;
    }
  }

  /**
   * Get employee details
   */
  async getEmployee(employeeId: string): Promise<CorpPerksEmployee | null> {
    try {
      const response = await this.http.get(`${this.CORPPERKS_URL}/api/corporate/employees/${employeeId}`);
      return response.data.employee;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Employee lookup failed: ${message}`);
      return null;
    }
  }

  /**
   * Get all employees for a company
   */
  async getCompanyEmployees(companyId: string): Promise<CorpPerksEmployee[]> {
    try {
      const response = await this.http.get(`${this.CORPPERKS_URL}/api/corporate/company/${companyId}/employees`);
      return response.data.employees;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Company employees lookup failed: ${message}`);
      return [];
    }
  }

  /**
   * Sync employees from CorpPerks
   */
  async syncEmployees(companyId: string): Promise<{ synced: number; errors: string[] }> {
    try {
      const response = await this.http.post(`${this.CORPPERKS_URL}/api/corporate/sync/employees`, {
        companyId,
      });
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Employee sync failed: ${message}`);
      return { synced: 0, errors: [message] };
    }
  }

  // ===========================================
  // POLICY ENFORCEMENT
  // ===========================================

  /**
   * Get company policy
   */
  async getCompanyPolicy(companyId: string): Promise<CorporatePolicy | null> {
    try {
      const response = await this.http.get(`${this.CORPPERKS_URL}/api/corporate/company/${companyId}/policy`);
      return response.data.policy;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Policy lookup failed: ${message}`);
      return this.getDefaultPolicy(companyId);
    }
  }

  /**
   * Check if ride is within policy
   */
  async checkPolicyCompliance(
    employee: CorpPerksEmployee,
    ride: CorporateRideRequest
  ): Promise<{
    allowed: boolean;
    violations: string[];
    requiresApproval: boolean;
  }> {
    const violations: string[] = [];
    let requiresApproval = false;

    // Check vehicle type
    if (!employee.limits.allowedVehicles.includes(ride.vehicleType)) {
      violations.push(`Vehicle type ${ride.vehicleType} not allowed`);
    }

    // Check time restrictions
    const hour = new Date().getHours();
    const day = new Date().getDay();

    // Check if within allowed hours (assuming 6 AM - 10 PM default)
    if (hour < 6 || hour > 22) {
      violations.push('Ride outside allowed hours');
    }

    // Check if weekday (assuming weekdays only)
    if (day === 0 || day === 6) {
      violations.push('Weekend rides not allowed');
    }

    return {
      allowed: violations.length === 0,
      violations,
      requiresApproval: violations.length > 0 || requiresApproval,
    };
  }

  /**
   * Check employee's remaining budget
   */
  async getRemainingBudget(employeeId: string): Promise<{
    dailyRemaining: number;
    monthlyRemaining: number;
    dailyUsed: number;
    monthlyUsed: number;
  }> {
    try {
      const response = await this.http.get(`${this.CORPPERKS_URL}/api/corporate/employee/${employeeId}/budget`);
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Budget lookup failed: ${message}`);
      return { dailyRemaining: 5000, monthlyRemaining: 50000, dailyUsed: 0, monthlyUsed: 0 };
    }
  }

  // ===========================================
  // APPROVAL WORKFLOW
  // ===========================================

  /**
   * Submit ride for approval
   */
  async requestApproval(request: ApprovalRequest): Promise<ApprovalRequest> {
    try {
      const response = await this.http.post(`${this.CORPPERKS_URL}/api/corporate/approvals`, request);
      return response.data.request;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Approval request failed: ${message}`);
      throw new AppError(message, 'CORPORATE_SERVICE_ERROR');
    }
  }

  /**
   * Get pending approvals for manager
   */
  async getPendingApprovals(managerId: string): Promise<ApprovalRequest[]> {
    try {
      const response = await this.http.get(`${this.CORPPERKS_URL}/api/corporate/approvals/pending`, {
        params: { managerId },
      });
      return response.data.requests;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Pending approvals lookup failed: ${message}`);
      return [];
    }
  }

  /**
   * Approve or reject request
   */
  async processApproval(
    requestId: string,
    managerId: string,
    action: 'approve' | 'reject',
    comment?: string
  ): Promise<void> {
    try {
      await this.http.patch(`${this.CORPPERKS_URL}/api/corporate/approvals/${requestId}`, {
        managerId,
        action,
        comment,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Approval processing failed: ${message}`);
      throw new AppError(message, 'CORPORATE_SERVICE_ERROR');
    }
  }

  // ===========================================
  // EXPENSE TRACKING
  // ===========================================

  /**
   * Log ride expense
   */
  async logExpense(rideData: {
    rideId: string;
    employeeId: string;
    companyId: string;
    fare: number;
    date: Date;
    purpose: string;
    projectCode?: string;
  }): Promise<void> {
    try {
      await this.http.post(`${this.CORPPERKS_URL}/api/corporate/expenses`, rideData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Expense logging failed: ${message}`);
    }
  }

  /**
   * Get employee's expense report
   */
  async getExpenseReport(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    expenses: unknown[];
    total: number;
    byCategory: Record<string, number>;
    byProject: Record<string, number>;
  }> {
    try {
      const response = await this.http.get(`${this.CORPPERKS_URL}/api/corporate/expenses/report`, {
        params: { employeeId, startDate, endDate },
      });
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Expense report failed: ${message}`);
      return { expenses: [], total: 0, byCategory: {}, byProject: {} };
    }
  }

  // ===========================================
  // INVOICING
  // ===========================================

  /**
   * Generate invoice for company (CorpPerks external API)
   */
  async getCorpPerksInvoice(companyId: string, period: { start: Date; end: Date }): Promise<CorporateInvoice | null> {
    try {
      const response = await this.http.post(`${this.CORPPERKS_URL}/api/corporate/invoices/generate`, {
        companyId,
        period,
      });
      return response.data.invoice;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Invoice generation failed: ${message}`);
      return null;
    }
  }

  /**
   * Get company invoices
   */
  async getCompanyInvoices(companyId: string): Promise<CorporateInvoice[]> {
    try {
      const response = await this.http.get(`${this.CORPPERKS_URL}/api/corporate/company/${companyId}/invoices`);
      return response.data.invoices;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Invoices lookup failed: ${message}`);
      return [];
    }
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(invoiceId: string, transactionId: string): Promise<void> {
    try {
      await this.http.patch(`${this.CORPPERKS_URL}/api/corporate/invoices/${invoiceId}/pay`, {
        transactionId,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Invoice payment failed: ${message}`);
      throw new AppError(message, 'CORPORATE_SERVICE_ERROR');
    }
  }

  // ===========================================
  // HELPERS
  // ===========================================

  private getDefaultPolicy(companyId: string): CorporatePolicy {
    return {
      companyId,
      name: 'Default Policy',
      rules: {
        allowedVehicles: ['auto', 'cab', 'suv'],
        maxFarePerTrip: 1000,
        dailyLimit: 5000,
        monthlyLimit: 50000,
        allowedHours: [{ start: 6, end: 22 }],
        allowedDays: [1, 2, 3, 4, 5],
        requiresApproval: false,
        approvalThreshold: 2000,
      },
      gstEnabled: true,
      gstPercentage: 18,
      billingCycle: 'monthly',
      invoicePrefix: 'REZRIDE',
    };
  }
}

export const corporateService = new CorporateService();
