/**
 * CorpPerks Client for DO App
 *
 * Connect DO App to CorpPerks HRMS
 * Features: Payroll, Attendance, Leave, Expenses, Learning
 */

import axios, { AxiosInstance } from 'axios';

const CORPPERKS_URL = process.env.CORPPERKS_URL || 'http://localhost:4006';

export class CorpPerksClient {
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    this.client = axios.create({
      baseURL: CORPPERKS_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });
  }

  // =========================================================================
  // EMPLOYEE
  // =========================================================================

  async getEmployee(employeeId: string) {
    try {
      const { data } = await this.client.get(`/api/employees/${employeeId}`);
      return data;
    } catch (error) {
      console.error('CorpPerks getEmployee error:', error);
      return null;
    }
  }

  async getEmployees(params?: { department?: string; status?: string }) {
    try {
      const { data } = await this.client.get('/api/employees', { params });
      return data;
    } catch (error) {
      console.error('CorpPerks getEmployees error:', error);
      return { employees: [] };
    }
  }

  // =========================================================================
  // ATTENDANCE
  // =========================================================================

  async checkIn(employeeId: string, location?: { lat: number; lng: number }) {
    try {
      const { data } = await this.client.post('/api/attendance/checkin', {
        employeeId,
        location,
        timestamp: new Date().toISOString(),
      });
      return data;
    } catch (error) {
      console.error('CorpPerks checkIn error:', error);
      return null;
    }
  }

  async checkOut(employeeId: string) {
    try {
      const { data } = await this.client.post('/api/attendance/checkout', {
        employeeId,
        timestamp: new Date().toISOString(),
      });
      return data;
    } catch (error) {
      console.error('CorpPerks checkOut error:', error);
      return null;
    }
  }

  async getAttendance(employeeId: string, date: string) {
    try {
      const { data } = await this.client.get(`/api/attendance/${employeeId}`, {
        params: { date },
      });
      return data;
    } catch (error) {
      console.error('CorpPerks getAttendance error:', error);
      return null;
    }
  }

  async getAttendanceSummary(employeeId: string, month: string) {
    try {
      const { data } = await this.client.get(`/api/attendance/${employeeId}/summary`, {
        params: { month },
      });
      return data;
    } catch (error) {
      console.error('CorpPerks attendance summary error:', error);
      return null;
    }
  }

  // =========================================================================
  // LEAVE
  // =========================================================================

  async requestLeave(employeeId: string, leave: {
    type: 'sick' | 'casual' | 'earned' | 'unpaid' | ' paternity' | 'maternity';
    startDate: string;
    endDate: string;
    reason: string;
  }) {
    try {
      const { data } = await this.client.post('/api/leave/request', {
        employeeId,
        ...leave,
      });
      return data;
    } catch (error) {
      console.error('CorpPerks requestLeave error:', error);
      return null;
    }
  }

  async getLeaveBalance(employeeId: string) {
    try {
      const { data } = await this.client.get(`/api/leave/balance/${employeeId}`);
      return data;
    } catch (error) {
      console.error('CorpPerks getLeaveBalance error:', error);
      return null;
    }
  }

  async getLeaveHistory(employeeId: string) {
    try {
      const { data } = await this.client.get(`/api/leave/history/${employeeId}`);
      return data;
    } catch (error) {
      console.error('CorpPerks getLeaveHistory error:', error);
      return null;
    }
  }

  async approveLeave(leaveId: string, managerId: string, approved: boolean) {
    try {
      const { data } = await this.client.post(`/api/leave/${leaveId}/approve`, {
        managerId,
        approved,
      });
      return data;
    } catch (error) {
      console.error('CorpPerks approveLeave error:', error);
      return null;
    }
  }

  // =========================================================================
  // PAYROLL
  // =========================================================================

  async getPayslip(employeeId: string, month: string) {
    try {
      const { data } = await this.client.get(`/api/payroll/payslip/${employeeId}`, {
        params: { month },
      });
      return data;
    } catch (error) {
      console.error('CorpPerks getPayslip error:', error);
      return null;
    }
  }

  async getSalary(employeeId: string) {
    try {
      const { data } = await this.client.get(`/api/payroll/salary/${employeeId}`);
      return data;
    } catch (error) {
      console.error('CorpPerks getSalary error:', error);
      return null;
    }
  }

  async getTaxStatement(employeeId: string, year: string) {
    try {
      const { data } = await this.client.get(`/api/payroll/tax/${employeeId}`, {
        params: { year },
      });
      return data;
    } catch (error) {
      console.error('CorpPerks getTaxStatement error:', error);
      return null;
    }
  }

  // =========================================================================
  // EXPENSES
  // =========================================================================

  async submitExpense(employeeId: string, expense: {
    category: 'travel' | 'food' | 'accommodation' | 'equipment' | 'other';
    amount: number;
    description: string;
    receipt?: string;
    date: string;
  }) {
    try {
      const { data } = await this.client.post('/api/expenses/submit', {
        employeeId,
        ...expense,
      });
      return data;
    } catch (error) {
      console.error('CorpPerks submitExpense error:', error);
      return null;
    }
  }

  async getExpenses(employeeId: string, status?: string) {
    try {
      const { data } = await this.client.get(`/api/expenses/${employeeId}`, {
        params: { status },
      });
      return data;
    } catch (error) {
      console.error('CorpPerks getExpenses error:', error);
      return { expenses: [] };
    }
  }

  async approveExpense(expenseId: string, managerId: string, approved: boolean) {
    try {
      const { data } = await this.client.post(`/api/expenses/${expenseId}/approve`, {
        managerId,
        approved,
      });
      return data;
    } catch (error) {
      console.error('CorpPerks approveExpense error:', error);
      return null;
    }
  }

  // =========================================================================
  // LEARNING / LMS
  // =========================================================================

  async getCourses(employeeId: string) {
    try {
      const { data } = await this.client.get(`/api/lms/courses/${employeeId}`);
      return data;
    } catch (error) {
      console.error('CorpPerks getCourses error:', error);
      return { courses: [] };
    }
  }

  async enrollCourse(employeeId: string, courseId: string) {
    try {
      const { data } = await this.client.post('/api/lms/enroll', {
        employeeId,
        courseId,
      });
      return data;
    } catch (error) {
      console.error('CorpPerks enrollCourse error:', error);
      return null;
    }
  }

  async getProgress(employeeId: string, courseId: string) {
    try {
      const { data } = await this.client.get(`/api/lms/progress/${employeeId}`, {
        params: { courseId },
      });
      return data;
    } catch (error) {
      console.error('CorpPerks getProgress error:', error);
      return null;
    }
  }

  // =========================================================================
  // PERFORMANCE
  // =========================================================================

  async getOKRs(employeeId: string) {
    try {
      const { data } = await this.client.get(`/api/performance/okrs/${employeeId}`);
      return data;
    } catch (error) {
      console.error('CorpPerks getOKRs error:', error);
      return { okrs: [] };
    }
  }

  async updateOKRProgress(employeeId: string, okrId: string, progress: number) {
    try {
      const { data } = await this.client.put(`/api/performance/okrs/${okrId}/progress`, {
        employeeId,
        progress,
      });
      return data;
    } catch (error) {
      console.error('CorpPerks updateOKRProgress error:', error);
      return null;
    }
  }

  // =========================================================================
  // TEAM
  // =========================================================================

  async getTeam(managerId: string) {
    try {
      const { data } = await this.client.get(`/api/team/${managerId}`);
      return data;
    } catch (error) {
      console.error('CorpPerks getTeam error:', error);
      return { team: [] };
    }
  }

  async getTeamHealth(managerId: string) {
    try {
      const { data } = await this.client.get(`/api/team/${managerId}/health`);
      return data;
    } catch (error) {
      console.error('CorpPerks getTeamHealth error:', error);
      return null;
    }
  }

  // =========================================================================
  // ANNOUNCEMENTS
  // =========================================================================

  async getAnnouncements() {
    try {
      const { data } = await this.client.get('/api/announcements');
      return data;
    } catch (error) {
      console.error('CorpPerks getAnnouncements error:', error);
      return { announcements: [] };
    }
  }

  // =========================================================================
  // DO APP SPECIFIC METHODS
  // =========================================================================

  async getDOAppDashboard(employeeId: string) {
    // Get all relevant data for DO App HR dashboard
    const [employee, attendance, leaveBalance, payslip] = await Promise.all([
      this.getEmployee(employeeId),
      this.getAttendanceSummary(employeeId, new Date().toISOString().slice(0, 7)),
      this.getLeaveBalance(employeeId),
      this.getPayslip(employeeId, new Date().toISOString().slice(0, 7)),
    ]);

    return {
      employee,
      attendance,
      leaveBalance,
      payslip,
      quickActions: {
        checkIn: true,
        requestLeave: true,
        submitExpense: true,
        viewPayslip: true,
      },
    };
  }
}

// Export singleton
export const corpperksClient = new CorpPerksClient();

export default CorpPerksClient;
