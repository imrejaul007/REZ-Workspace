import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { ApiResponse, LeaveRequest, ExpenseClaim, Dashboard, LeaveBalance, Employee } from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Employee API
export const getEmployee = async (employeeId: string): Promise<Employee | null> => {
  try {
    const response = await api.get<ApiResponse<Employee>>(`/employees/${employeeId}`);
    return response.data.data || null;
  } catch (error) {
    logger.error('Error fetching employee:', error);
    return null;
  }
};

export const getEmployeeDashboard = async (employeeId: string): Promise<Dashboard | null> => {
  try {
    const response = await api.get<ApiResponse<Dashboard>>(`/employees/${employeeId}/dashboard`);
    return response.data.data || null;
  } catch (error) {
    logger.error('Error fetching dashboard:', error);
    return null;
  }
};

export const getLeaveBalances = async (employeeId: string): Promise<LeaveBalance | null> => {
  try {
    const response = await api.get<ApiResponse<LeaveBalance>>(`/employees/${employeeId}/leave-balances`);
    return response.data.data || null;
  } catch (error) {
    logger.error('Error fetching leave balances:', error);
    return null;
  }
};

// Leave API
export const getLeaveRequests = async (employeeId: string, status?: string): Promise<LeaveRequest[]> => {
  try {
    const params = status ? { status } : {};
    const response = await api.get<ApiResponse<LeaveRequest[]>>(`/leave/employee/${employeeId}`, { params });
    return response.data.data || [];
  } catch (error) {
    logger.error('Error fetching leave requests:', error);
    return [];
  }
};

export const createLeaveRequest = async (data: {
  employeeId: string;
  organizationId: string;
  leaveType: LeaveRequest['leaveType'];
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay?: boolean;
}): Promise<LeaveRequest | null> => {
  try {
    const response = await api.post<ApiResponse<LeaveRequest>>('/leave', data);
    return response.data.data || null;
  } catch (error) {
    logger.error('Error creating leave request:', error);
    throw error;
  }
};

export const submitLeaveRequest = async (requestId: string): Promise<LeaveRequest | null> => {
  try {
    const response = await api.post<ApiResponse<LeaveRequest>>(`/leave/${requestId}/submit`);
    return response.data.data || null;
  } catch (error) {
    logger.error('Error submitting leave request:', error);
    throw error;
  }
};

export const cancelLeaveRequest = async (requestId: string): Promise<LeaveRequest | null> => {
  try {
    const response = await api.post<ApiResponse<LeaveRequest>>(`/leave/${requestId}/cancel`);
    return response.data.data || null;
  } catch (error) {
    logger.error('Error cancelling leave request:', error);
    throw error;
  }
};

// Expense API
export const getExpenseClaims = async (employeeId: string, status?: string): Promise<ExpenseClaim[]> => {
  try {
    const params = status ? { status } : {};
    const response = await api.get<ApiResponse<ExpenseClaim[]>>(`/expenses/employee/${employeeId}`, { params });
    return response.data.data || [];
  } catch (error) {
    logger.error('Error fetching expense claims:', error);
    return [];
  }
};

export const createExpenseClaim = async (data: {
  employeeId: string;
  organizationId: string;
  claimType: ExpenseClaim['claimType'];
  amount: number;
  expenseDate: string;
  description: string;
  projectCode?: string;
}): Promise<ExpenseClaim | null> => {
  try {
    const response = await api.post<ApiResponse<ExpenseClaim>>('/expenses', data);
    return response.data.data || null;
  } catch (error) {
    logger.error('Error creating expense claim:', error);
    throw error;
  }
};

export const submitExpenseClaim = async (claimId: string): Promise<ExpenseClaim | null> => {
  try {
    const response = await api.post<ApiResponse<ExpenseClaim>>(`/expenses/${claimId}/submit`);
    return response.data.data || null;
  } catch (error) {
    logger.error('Error submitting expense claim:', error);
    throw error;
  }
};

export default api;
