import { apiClient } from './apiClient';

export interface StaffMember {
  _id: string;
  name: string;
  role: string;
  storeName: string;
  storeId: string;
  salaryType: 'fixed' | 'commission' | 'hourly';
  baseSalary: number | null;
  commissionRate?: number;
  hoursWorked?: number;
  attendance?: { date: string; status: 'present' | 'absent' | 'half_day' | 'leave' }[];
}

export interface PayrollRun {
  _id: string;
  month: number;
  year: number;
  totalAmount: number;
  staffCount: number;
  status: 'processed' | 'pending' | 'failed';
  processedAt?: string;
}

export interface OverviewStats {
  totalStaff: number;
  totalMonthlyPayroll: number;
  avgSalary: number;
  pendingApprovals: number;
  merchantsProcessed: number;
  totalMerchants: number;
  topMerchants: { name: string; payroll: number }[];
}

export interface GetStaffFilters {
  page: number;
  limit: number;
  search?: string;
  merchantId?: string;
}

export interface GetHistoryFilters {
  page: number;
  limit: number;
}

export interface ProcessPayrollData {
  month: number;
  year: number;
  totalAmount: number;
  staffCount: number;
  idempotencyKey?: string; // AA-FIN-001: For safe retries
  expectedAmount?: number; // AA-FIN-002: Validation field
}

export const payrollService = {
  /**
   * Fetch payroll overview stats (total staff, monthly payroll, pending approvals, etc.)
   */
  async getOverview(): Promise<OverviewStats> {
    const response = await apiClient.get<OverviewStats>('/admin/payroll/overview');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch payroll overview');
  },

  /**
   * Fetch paginated staff list, optionally filtered by merchantId (storeId) or search term.
   */
  async getStaff(filters: GetStaffFilters): Promise<{ data: StaffMember[]; total: number }> {
    const { page, limit, search, merchantId } = filters;
    let query = `?page=${page}&limit=${limit}`;
    if (merchantId) query += `&storeId=${encodeURIComponent(merchantId)}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;

    const response = await apiClient.get<{ data: StaffMember[]; total: number }>(
      `/admin/payroll/staff${query}`
    );
    if (response.success && response.data) {
      return {
        data: Array.isArray(response.data.data) ? response.data.data : [],
        total: typeof response.data.total === 'number' ? response.data.total : 0,
      };
    }
    throw new Error(response.message || 'Failed to fetch staff list');
  },

  /**
   * Fetch attendance records for a date range (ISO strings).
   * Typically called with a week's start/end date.
   */
  async getAttendance(startDate: string, endDate: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(
      `/admin/payroll/attendance?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    );
    if (response.success) {
      const data = response.data;
      return Array.isArray(data) ? data : [];
    }
    throw new Error(response.message || 'Failed to fetch attendance records');
  },

  /**
   * Fetch payroll run history with pagination.
   */
  async getHistory(filters: GetHistoryFilters): Promise<PayrollRun[]> {
    const { page, limit } = filters;
    const response = await apiClient.get<PayrollRun[]>(
      `/admin/payroll/history?page=${page}&limit=${limit}`
    );
    if (response.success) {
      const data = response.data;
      return Array.isArray(data) ? data : [];
    }
    throw new Error(response.message || 'Failed to fetch payroll history');
  },

  /**
   * Trigger payroll processing for a given month/year.
   * Initiates bank transfers via Razorpay Payouts.
   * AA-FIN-001: Added idempotency key for retry safety
   * AA-FIN-002: Added amount validation
   * AA-FIN-003: Audit trail handled server-side (must be logged)
   * AA-FIN-004: Two-person approval must be enforced server-side
   */
  async processPayroll(data: ProcessPayrollData & { approvedBy?: string; initiatedBy?: string }): Promise<void> {
    try {
      // AA-FIN-002: Validate payroll amount
      if (data.totalAmount <= 0) {
        throw new Error('Invalid payroll amount: must be greater than 0');
      }

      // AA-FIN-001 FIX: Use crypto.randomUUID() instead of Date.now() for collision-safe idempotency.
      const idempotencyKey = data.idempotencyKey || `payroll-${data.month}-${data.year}-${crypto.randomUUID()}`;

      const payload = {
        ...data,
        idempotencyKey,
        // AA-FIN-003: Audit fields (backend will store)
        auditMetadata: {
          initiatedAt: new Date().toISOString(),
          initiatedBy: data.initiatedBy,
          approvedBy: data.approvedBy,
        },
      };

      const response = await apiClient.post<any>('/admin/payroll/process', payload);
      if (!response.success) {
        throw new Error(response.message || 'Failed to process payroll');
      }
    } catch (error: any) {
      if (__DEV__) console.error('[Payroll] Process payroll error:', error.message);
      throw error;
    }
  },
};

export default payrollService;
