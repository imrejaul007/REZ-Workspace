import mongoose, { Schema, Document, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { TravelPolicy, Approval, Expense } from '../types';
import { logger } from '../utils/logger';

interface IPolicy extends Document { companyId: string; name: string; description: string; rules: any; active: boolean; }
interface IApproval extends Document { userId: string; companyId: string; type: string; amount: number; description: string; status: string; approverId?: string; approvedAt?: Date; rejectionReason?: string; }
interface IExpense extends Document { userId: string; companyId: string; tripId?: string; category: string; amount: number; currency: string; description: string; receiptUrl?: string; status: string; submittedAt?: Date; reimbursedAt?: Date; }

const PolicySchema = new Schema({ companyId: { type: String, required: true, index: true }, name: { type: String, required: true }, description: String, rules: { type: Schema.Types.Mixed, required: true }, active: { type: Boolean, default: true } }, { timestamps: true });
const ApprovalSchema = new Schema({ userId: { type: String, required: true, index: true }, companyId: { type: String, required: true, index: true }, type: { type: String, enum: ['flight', 'hotel', 'transfer', 'expense'], required: true }, amount: { type: Number, required: true }, description: String, status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, approverId: String, approvedAt: Date, rejectionReason: String }, { timestamps: true });
const ExpenseSchema = new Schema({ userId: { type: String, required: true, index: true }, companyId: { type: String, required: true, index: true }, tripId: String, category: { type: String, required: true }, amount: { type: Number, required: true }, currency: { type: String, default: 'INR' }, description: String, receiptUrl: String, status: { type: String, enum: ['pending', 'submitted', 'approved', 'rejected', 'reimbursed'], default: 'pending' }, submittedAt: Date, reimbursedAt: Date }, { timestamps: true });

export const PolicyModel = model<IPolicy>('Policy', PolicySchema);
export const ApprovalModel = model<IApproval>('Approval', ApprovalSchema);
export const ExpenseModel = model<IExpense>('Expense', ExpenseSchema);

export class CorpService {
  async getPolicy(companyId: string): Promise<TravelPolicy | null> {
    const policy = await PolicyModel.findOne({ companyId, active: true });
    if (!policy) {
      const defaultPolicy = new PolicyModel({ companyId, name: 'Default Policy', description: 'Standard travel policy', rules: { maxFlightPrice: 50000, maxHotelPrice: 10000, allowedCabins: ['economy', 'premium_economy', 'business'], advanceBookingDays: 7, requiresApproval: true, approvalThreshold: 25000, allowedExpenseCategories: ['travel', 'accommodation', 'meals', 'misc'] }, active: true });
      await defaultPolicy.save();
      return { id: defaultPolicy._id.toString(), companyId: defaultPolicy.companyId, name: defaultPolicy.name, description: defaultPolicy.description, rules: defaultPolicy.rules, active: defaultPolicy.active, createdAt: defaultPolicy.createdAt };
    }
    return { id: policy._id.toString(), companyId: policy.companyId, name: policy.name, description: policy.description, rules: policy.rules as any, active: policy.active, createdAt: policy.createdAt };
  }

  async createApproval(userId: string, companyId: string, type: string, amount: number, description: string): Promise<Approval> {
    const approval = new ApprovalModel({ userId, companyId, type, amount, description });
    await approval.save();
    return { id: approval._id.toString(), userId: approval.userId, companyId: approval.companyId, type: approval.type, amount: approval.amount, description: approval.description, status: approval.status as any, createdAt: approval.createdAt };
  }

  async getApprovals(companyId: string, status?: string): Promise<Approval[]> {
    const query: Record<string, unknown> = { companyId };
    if (status) query.status = status;
    const approvals = await ApprovalModel.find(query).sort({ createdAt: -1 });
    return approvals.map(a => ({ id: a._id.toString(), userId: a.userId, companyId: a.companyId, type: a.type, amount: a.amount, description: a.description, status: a.status as any, approverId: a.approverId, approvedAt: a.approvedAt, rejectionReason: a.rejectionReason, createdAt: a.createdAt }));
  }

  async updateApprovalStatus(approvalId: string, status: 'approved' | 'rejected', approverId: string, rejectionReason?: string): Promise<Approval | null> {
    const update: Record<string, unknown> = { status, approverId };
    if (status === 'approved') update.approvedAt = new Date();
    if (rejectionReason) update.rejectionReason = rejectionReason;
    const approval = await ApprovalModel.findByIdAndUpdate(approvalId, update, { new: true });
    return approval ? { id: approval._id.toString(), userId: approval.userId, companyId: approval.companyId, type: approval.type, amount: approval.amount, description: approval.description, status: approval.status as any, approverId: approval.approverId, approvedAt: approval.approvedAt, rejectionReason: approval.rejectionReason, createdAt: approval.createdAt } : null;
  }

  async createExpense(userId: string, companyId: string, category: string, amount: number, description: string): Promise<Expense> {
    const expense = new ExpenseModel({ userId, companyId, category, amount, description });
    await expense.save();
    return { id: expense._id.toString(), userId: expense.userId, companyId: expense.companyId, category: expense.category, amount: expense.amount, currency: expense.currency, description: expense.description, status: expense.status as any, createdAt: expense.createdAt };
  }

  async getExpenses(companyId: string, userId?: string): Promise<Expense[]> {
    const query: Record<string, unknown> = { companyId };
    if (userId) query.userId = userId;
    const expenses = await ExpenseModel.find(query).sort({ createdAt: -1 });
    return expenses.map(e => ({ id: e._id.toString(), userId: e.userId, companyId: e.companyId, tripId: e.tripId, category: e.category, amount: e.amount, currency: e.currency, description: e.description, receiptUrl: e.receiptUrl, status: e.status as any, submittedAt: e.submittedAt, reimbursedAt: e.reimbursedAt, createdAt: e.createdAt }));
  }

  async submitExpense(expenseId: string): Promise<Expense | null> {
    const expense = await ExpenseModel.findByIdAndUpdate(expenseId, { status: 'submitted', submittedAt: new Date() }, { new: true });
    return expense ? { id: expense._id.toString(), userId: expense.userId, companyId: expense.companyId, category: expense.category, amount: expense.amount, currency: expense.currency, description: expense.description, status: expense.status as any, submittedAt: expense.submittedAt, createdAt: expense.createdAt } : null;
  }

  async checkPolicyCompliance(companyId: string, type: string, amount: number): Promise<{ compliant: boolean; requiresApproval: boolean; reason?: string }> {
    const policy = await this.getPolicy(companyId);
    if (!policy) return { compliant: false, requiresApproval: false, reason: 'No policy found' };
    if (type === 'flight' && amount > policy.rules.maxFlightPrice) return { compliant: false, requiresApproval: true, reason: `Flight price exceeds maximum of ${policy.rules.maxFlightPrice}` };
    if (type === 'hotel' && amount > policy.rules.maxHotelPrice) return { compliant: false, requiresApproval: true, reason: `Hotel price exceeds maximum of ${policy.rules.maxHotelPrice}` };
    return { compliant: true, requiresApproval: amount >= policy.rules.approvalThreshold };
  }
}

export const corpService = new CorpService();
export default corpService;