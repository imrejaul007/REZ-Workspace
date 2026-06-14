/**
 * PeopleOS Self-Service Service
 */

import { Employee, IEmployee } from '../models/employee';
import { LeaveRequest, ILeaveRequest } from '../models/leaveRequest';
import { ExpenseClaim, IExpenseClaim } from '../models/expenseClaim';

const ANNUAL_LEAVE_DEFAULT = parseInt(process.env.ANNUAL_LEAVE_ALLOWANCE || '18');
const SICK_LEAVE_DEFAULT = parseInt(process.env.SICK_LEAVE_ALLOWANCE || '12');
const CASUAL_LEAVE_DEFAULT = parseInt(process.env.CASUAL_LEAVE_ALLOWANCE || '6');

function generateRequestNumber(prefix: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Date.now().toString(36).toUpperCase();
  return `${prefix}-${year}${month}-${random}`;
}

function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// Employee operations
export async function getEmployee(employeeId: string): Promise<IEmployee | null> {
  return Employee.findOne({ employeeId });
}

export async function getEmployeeByEmail(email: string): Promise<IEmployee | null> {
  return Employee.findOne({ email });
}

export async function updateEmployeeProfile(employeeId: string, updates: {
  phone?: string;
  dateOfBirth?: Date;
}): Promise<IEmployee | null> {
  return Employee.findOneAndUpdate(
    { employeeId },
    updates,
    { new: true }
  );
}

export async function getEmployeeLeaveBalances(employeeId: string): Promise<IEmployee['leaveBalances'] | null> {
  const employee = await Employee.findOne({ employeeId });
  return employee?.leaveBalances || null;
}

// Leave operations
export async function createLeaveRequest(params: {
  employeeId: string;
  organizationId: string;
  leaveType: ILeaveRequest['leaveType'];
  startDate: Date;
  endDate: Date;
  reason: string;
  isHalfDay?: boolean;
  halfDaySession?: 'morning' | 'afternoon';
}): Promise<ILeaveRequest> {
  const employee = await Employee.findOne({ employeeId: params.employeeId });
  if (!employee) throw new Error('Employee not found');

  let totalDays = calculateWorkingDays(params.startDate, params.endDate);
  if (params.isHalfDay) totalDays = 0.5;

  // Check leave balance
  if (params.leaveType !== 'unpaid') {
    const balance = employee.leaveBalances[params.leaveType];
    if (balance < totalDays) {
      throw new Error(`Insufficient ${params.leaveType} leave balance. Available: ${balance}, Requested: ${totalDays}`);
    }
  }

  const request = new LeaveRequest({
    requestNumber: generateRequestNumber('LV'),
    ...params,
    totalDays,
    status: 'draft',
  });

  await request.save();
  return request;
}

export async function submitLeaveRequest(requestId: string): Promise<ILeaveRequest | null> {
  const request = await LeaveRequest.findById(requestId);
  if (!request) return null;
  if (request.status !== 'draft') throw new Error('Request already submitted');

  const employee = await Employee.findOne({ employeeId: request.employeeId });
  if (!employee) throw new Error('Employee not found');

  // Check balance again
  if (request.leaveType !== 'unpaid') {
    const balance = employee.leaveBalances[request.leaveType];
    if (balance < request.totalDays) {
      throw new Error(`Insufficient leave balance. Available: ${balance}, Requested: ${request.totalDays}`);
    }
  }

  request.status = 'submitted';
  request.submittedAt = new Date();
  await request.save();
  return request;
}

export async function approveLeaveRequest(requestId: string, approvedBy: string): Promise<ILeaveRequest | null> {
  const request = await LeaveRequest.findById(requestId);
  if (!request) return null;
  if (request.status !== 'submitted') throw new Error('Request not in submitted status');

  const employee = await Employee.findOne({ employeeId: request.employeeId });
  if (!employee) throw new Error('Employee not found');

  // Deduct leave balance
  if (request.leaveType !== 'unpaid') {
    const balanceKey = request.leaveType as keyof IEmployee['leaveBalances'];
    employee.leaveBalances[balanceKey] -= request.totalDays;
    await employee.save();
  }

  request.status = 'approved';
  request.approvedBy = approvedBy;
  request.approvedAt = new Date();
  await request.save();
  return request;
}

export async function rejectLeaveRequest(params: {
  requestId: string;
  rejectedBy: string;
  reason: string;
}): Promise<ILeaveRequest | null> {
  const request = await LeaveRequest.findById(params.requestId);
  if (!request) return null;

  request.status = 'rejected';
  request.rejectedBy = params.rejectedBy;
  request.rejectedAt = new Date();
  request.rejectionReason = params.reason;
  await request.save();
  return request;
}

export async function cancelLeaveRequest(requestId: string): Promise<ILeaveRequest | null> {
  const request = await LeaveRequest.findById(requestId);
  if (!request) return null;
  if (!['draft', 'submitted'].includes(request.status)) {
    throw new Error('Cannot cancel request in current status');
  }

  request.status = 'cancelled';
  await request.save();
  return request;
}

export async function getLeaveRequest(requestId: string): Promise<ILeaveRequest | null> {
  return LeaveRequest.findById(requestId);
}

export async function getEmployeeLeaveRequests(employeeId: string, status?: ILeaveRequest['status']): Promise<ILeaveRequest[]> {
  const query: Record<string, unknown> = { employeeId };
  if (status) query.status = status;
  return LeaveRequest.find(query).sort({ createdAt: -1 });
}

export async function getPendingApprovals(managerId: string): Promise<ILeaveRequest[]> {
  const employees = await Employee.find({ managerId });
  const employeeIds = employees.map(e => e.employeeId);
  return LeaveRequest.find({
    employeeId: { $in: employeeIds },
    status: 'submitted',
  }).sort({ submittedAt: 1 });
}

// Expense operations
export async function createExpenseClaim(params: {
  employeeId: string;
  organizationId: string;
  claimType: IExpenseClaim['claimType'];
  amount: number;
  expenseDate: Date;
  description: string;
  projectCode?: string;
}): Promise<IExpenseClaim> {
  const claim = new ExpenseClaim({
    claimNumber: generateRequestNumber('EX'),
    ...params,
    status: 'draft',
  });
  await claim.save();
  return claim;
}

export async function submitExpenseClaim(claimId: string): Promise<IExpenseClaim | null> {
  const claim = await ExpenseClaim.findById(claimId);
  if (!claim) return null;
  if (claim.status !== 'draft') throw new Error('Claim already submitted');

  claim.status = 'submitted';
  claim.submittedAt = new Date();
  await claim.save();
  return claim;
}

export async function approveExpenseClaim(claimId: string, approvedBy: string): Promise<IExpenseClaim | null> {
  const claim = await ExpenseClaim.findById(claimId);
  if (!claim) return null;
  if (claim.status !== 'submitted') throw new Error('Claim not in submitted status');

  claim.status = 'approved';
  claim.approvedBy = approvedBy;
  claim.approvedAt = new Date();
  await claim.save();
  return claim;
}

export async function rejectExpenseClaim(params: {
  claimId: string;
  rejectedBy: string;
  reason: string;
}): Promise<IExpenseClaim | null> {
  const claim = await ExpenseClaim.findById(params.claimId);
  if (!claim) return null;

  claim.status = 'rejected';
  claim.rejectedBy = params.rejectedBy;
  claim.rejectedAt = new Date();
  claim.rejectionReason = params.reason;
  await claim.save();
  return claim;
}

export async function markExpenseReimbursed(claimId: string, paymentReference: string): Promise<IExpenseClaim | null> {
  const claim = await ExpenseClaim.findById(claimId);
  if (!claim) return null;
  if (claim.status !== 'approved') throw new Error('Claim not approved');

  claim.status = 'reimbursed';
  claim.reimbursedAt = new Date();
  claim.paymentReference = paymentReference;
  await claim.save();
  return claim;
}

export async function getExpenseClaim(claimId: string): Promise<IExpenseClaim | null> {
  return ExpenseClaim.findById(claimId);
}

export async function getEmployeeExpenseClaims(employeeId: string, status?: IExpenseClaim['status']): Promise<IExpenseClaim[]> {
  const query: Record<string, unknown> = { employeeId };
  if (status) query.status = status;
  return ExpenseClaim.find(query).sort({ createdAt: -1 });
}

export async function getPendingExpenseApprovals(managerId: string): Promise<IExpenseClaim[]> {
  const employees = await Employee.find({ managerId });
  const employeeIds = employees.map(e => e.employeeId);
  return ExpenseClaim.find({
    employeeId: { $in: employeeIds },
    status: 'submitted',
  }).sort({ submittedAt: 1 });
}

// Dashboard analytics
export async function getEmployeeDashboard(employeeId: string): Promise<{
  leaveBalances: IEmployee['leaveBalances'];
  pendingLeaveRequests: number;
  pendingExpenseClaims: number;
  approvedLeavesThisMonth: number;
  totalExpensesThisMonth: number;
}> {
  const employee = await Employee.findOne({ employeeId });
  if (!employee) throw new Error('Employee not found');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const pendingLeave = await LeaveRequest.countDocuments({
    employeeId,
    status: { $in: ['draft', 'submitted'] },
  });

  const pendingExpense = await ExpenseClaim.countDocuments({
    employeeId,
    status: { $in: ['draft', 'submitted'] },
  });

  const approvedLeavesThisMonth = await LeaveRequest.countDocuments({
    employeeId,
    status: 'approved',
    approvedAt: { $gte: startOfMonth },
  });

  const expenseResult = await ExpenseClaim.aggregate([
    {
      $match: {
        employeeId,
        status: { $in: ['approved', 'reimbursed'] },
        expenseDate: { $gte: startOfMonth },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  return {
    leaveBalances: employee.leaveBalances,
    pendingLeaveRequests: pendingLeave,
    pendingExpenseClaims: pendingExpense,
    approvedLeavesThisMonth,
    totalExpensesThisMonth: expenseResult[0]?.total || 0,
  };
}
