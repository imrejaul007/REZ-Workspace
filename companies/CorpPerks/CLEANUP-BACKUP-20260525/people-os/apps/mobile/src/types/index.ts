export interface LeaveBalance {
  annual: number;
  sick: number;
  casual: number;
  unpaid: number;
}

export interface LeaveRequest {
  _id: string;
  requestNumber: string;
  leaveType: 'annual' | 'sick' | 'casual' | 'unpaid' | 'maternity' | 'paternity' | 'bereavement';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled';
  isHalfDay: boolean;
  createdAt: string;
}

export interface ExpenseClaim {
  _id: string;
  claimNumber: string;
  claimType: 'travel' | 'meals' | 'accommodation' | 'communication' | 'equipment' | 'training' | 'other';
  amount: number;
  currency: string;
  expenseDate: string;
  description: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
  createdAt: string;
}

export interface Employee {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation: string;
  departmentId: string;
  profileImage?: string;
}

export interface Dashboard {
  leaveBalances: LeaveBalance;
  pendingLeaveRequests: number;
  pendingExpenseClaims: number;
  approvedLeavesThisMonth: number;
  totalExpensesThisMonth: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
