/**
 * Merchant OS Connector
 * Connects TEAMMIND to Merchant OS (REZ or Standalone)
 * HR and Team Management Platform
 */

export interface MerchantOSConfig {
  baseUrl: string;
  apiKey: string;
  type: 'rez' | 'standalone';
}

export interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  managerId?: string;
  joiningDate: string;
  employeeType: 'full-time' | 'part-time' | 'contract' | 'intern';
  status: 'active' | 'inactive' | 'on-leave';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'sick' | 'casual' | 'earned' | 'unpaid' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'half-day' | 'work-from-home';
  overtime?: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paymentDate?: string;
}

export class MerchantOSConnector {
  private config: MerchantOSConfig;

  constructor(config: MerchantOSConfig) {
    this.config = config;
  }

  /**
   * Get employee by phone
   */
  async getEmployeeByPhone(phone: string): Promise<EmployeeProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/employees/phone/${phone}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to get employee by phone');
      return null;
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(employeeId: string): Promise<EmployeeProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/employees/${employeeId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to get employee by ID');
      return null;
    }
  }

  /**
   * Get all employees
   */
  async getEmployees(department?: string): Promise<EmployeeProfile[]> {
    try {
      const url = department
        ? `${this.config.baseUrl}/api/employees?department=${department}`
        : `${this.config.baseUrl}/api/employees`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.employees || [];
    } catch {
      return [];
    }
  }

  /**
   * Create or update employee
   */
  async upsertEmployee(employee: Omit<EmployeeProfile, 'id'>): Promise<EmployeeProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/employees`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(employee)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to upsert employee');
      return null;
    }
  }

  /**
   * Update employee profile
   */
  async updateEmployee(
    employeeId: string,
    updates: Partial<EmployeeProfile>
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/employees/${employeeId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get departments
   */
  async getDepartments(): Promise<{
    id: string;
    name: string;
    headId?: string;
    employeeCount: number;
  }[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/departments`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.departments || [];
    } catch {
      return [];
    }
  }

  /**
   * Apply for leave
   */
  async applyLeave(request: Omit<LeaveRequest, 'id' | 'status'>): Promise<LeaveRequest | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/leave`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to apply for leave');
      return null;
    }
  }

  /**
   * Get leave balance
   */
  async getLeaveBalance(employeeId: string): Promise<{
    sick: number;
    casual: number;
    earned: number;
    unpaid: number;
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/leave/balance/${employeeId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return { sick: 0, casual: 0, earned: 0, unpaid: 0 };
      return await response.json();
    } catch {
      return { sick: 0, casual: 0, earned: 0, unpaid: 0 };
    }
  }

  /**
   * Get leave history
   */
  async getLeaveHistory(employeeId: string): Promise<LeaveRequest[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/leave?employeeId=${employeeId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.leaves || [];
    } catch {
      return [];
    }
  }

  /**
   * Approve/reject leave
   */
  async updateLeaveStatus(
    leaveId: string,
    status: 'approved' | 'rejected',
    approverNotes?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/leave/${leaveId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status, notes: approverNotes })
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Record attendance
   */
  async recordAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/attendance`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(record)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to record attendance');
      return null;
    }
  }

  /**
   * Get attendance records
   */
  async getAttendance(
    employeeId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceRecord[]> {
    try {
      const params = new URLSearchParams();
      if (employeeId) params.append('employeeId', employeeId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(
        `${this.config.baseUrl}/api/attendance?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.records || [];
    } catch {
      return [];
    }
  }

  /**
   * Get payroll records
   */
  async getPayroll(employeeId: string, year?: number): Promise<PayrollRecord[]> {
    try {
      const params = new URLSearchParams({ employeeId });
      if (year) params.append('year', year.toString());

      const response = await fetch(
        `${this.config.baseUrl}/api/payroll?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.records || [];
    } catch {
      return [];
    }
  }

  /**
   * Process payroll
   */
  async processPayroll(month: string, year: number): Promise<{ processed: number; errors: string[] }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/payroll/process`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ month, year })
        }
      );

      if (!response.ok) return { processed: 0, errors: ['Processing failed'] };
      return await response.json();
    } catch {
      return { processed: 0, errors: ['Processing failed'] };
    }
  }

  /**
   * Check connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }
}

export default MerchantOSConnector;