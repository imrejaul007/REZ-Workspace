import { v4 as uuidv4 } from 'uuid';
import { Budget, IBudget, BudgetType } from '../models/Budget';
import logger from '../utils/logger';

export interface CreateBudgetInput {
  fundId: string;
  type: BudgetType;
  period: {
    start: Date;
    end: Date;
  };
  allocatedAmount: number;
}

class BudgetService {
  /**
   * Create a new budget
   */
  async createBudget(input: CreateBudgetInput): Promise<IBudget> {
    const budgetId = `budget-${uuidv4().slice(0, 12)}`;

    const budget = new Budget({
      budgetId,
      fundId: input.fundId,
      type: input.type,
      period: input.period,
      allocatedAmount: input.allocatedAmount,
      spentAmount: 0,
      reservedAmount: 0,
      availableAmount: input.allocatedAmount,
      allocations: [],
      alerts: {
        threshold50: false,
        threshold75: false,
        threshold90: false,
        threshold100: false,
      },
    });

    await budget.save();
    logger.info('Budget created', { budgetId, fundId: input.fundId, amount: input.allocatedAmount });

    return budget;
  }

  /**
   * Get budget by ID
   */
  async getBudget(budgetId: string): Promise<IBudget | null> {
    return Budget.findOne({ budgetId });
  }

  /**
   * Get budget by fund
   */
  async getBudgetByFund(fundId: string): Promise<IBudget | null> {
    return Budget.findOne({ fundId }).sort({ createdAt: -1 });
  }

  /**
   * Reserve budget for claim
   */
  async reserveBudget(
    budgetId: string,
    partnerId: string,
    amount: number
  ): Promise<IBudget | null> {
    const budget = await Budget.findOne({ budgetId });
    if (!budget || budget.availableAmount < amount) {
      return null;
    }

    // Check if partner already has allocation
    const existingAllocation = budget.allocations.find(a => a.partnerId === partnerId);

    if (existingAllocation) {
      existingAllocation.reserved += amount;
    } else {
      budget.allocations.push({
        partnerId,
        amount: 0,
        reserved: amount,
        spent: 0,
      });
    }

    budget.reservedAmount += amount;
    budget.availableAmount -= amount;

    // Update alerts
    this.updateAlerts(budget);
    await budget.save();

    logger.info('Budget reserved', { budgetId, partnerId, amount });

    return budget;
  }

  /**
   * Release reserved budget
   */
  async releaseReservedBudget(
    budgetId: string,
    partnerId: string,
    amount: number
  ): Promise<IBudget | null> {
    const budget = await Budget.findOne({ budgetId });
    if (!budget) return null;

    const allocation = budget.allocations.find(a => a.partnerId === partnerId);
    if (!allocation || allocation.reserved < amount) {
      return null;
    }

    allocation.reserved -= amount;
    budget.reservedAmount -= amount;
    budget.availableAmount += amount;

    this.updateAlerts(budget);
    await budget.save();

    logger.info('Budget reservation released', { budgetId, partnerId, amount });

    return budget;
  }

  /**
   * Record spending
   */
  async recordSpending(
    budgetId: string,
    partnerId: string,
    amount: number
  ): Promise<IBudget | null> {
    const budget = await Budget.findOne({ budgetId });
    if (!budget) return null;

    const allocation = budget.allocations.find(a => a.partnerId === partnerId);
    if (!allocation) {
      return null;
    }

    // Release reserved amount first
    if (allocation.reserved >= amount) {
      allocation.reserved -= amount;
      budget.reservedAmount -= amount;
    } else {
      const fromReserved = allocation.reserved;
      allocation.reserved = 0;
      budget.reservedAmount -= fromReserved;
    }

    // Record as spent
    allocation.spent += amount;
    budget.spentAmount += amount;

    this.updateAlerts(budget);
    await budget.save();

    logger.info('Spending recorded', { budgetId, partnerId, amount, totalSpent: budget.spentAmount });

    return budget;
  }

  /**
   * Update alert thresholds
   */
  private updateAlerts(budget: IBudget): void {
    const utilization = budget.spentAmount / budget.allocatedAmount;

    budget.alerts.threshold50 = utilization >= 0.5;
    budget.alerts.threshold75 = utilization >= 0.75;
    budget.alerts.threshold90 = utilization >= 0.9;
    budget.alerts.threshold100 = utilization >= 1;
  }

  /**
   * Get budget utilization
   */
  async getBudgetUtilization(budgetId: string): Promise<{
    allocated: number;
    spent: number;
    reserved: number;
    available: number;
    utilizationPercent: number;
    alerts: IBudget['alerts'];
  } | null> {
    const budget = await Budget.findOne({ budgetId });
    if (!budget) return null;

    return {
      allocated: budget.allocatedAmount,
      spent: budget.spentAmount,
      reserved: budget.reservedAmount,
      available: budget.availableAmount,
      utilizationPercent: budget.allocatedAmount > 0
        ? (budget.spentAmount / budget.allocatedAmount) * 100
        : 0,
      alerts: budget.alerts,
    };
  }

  /**
   * Get partner allocation
   */
  async getPartnerAllocation(
    budgetId: string,
    partnerId: string
  ): Promise<{ amount: number; reserved: number; spent: number; available: number } | null> {
    const budget = await Budget.findOne({ budgetId });
    if (!budget) return null;

    const allocation = budget.allocations.find(a => a.partnerId === partnerId);
    if (!allocation) {
      return { amount: 0, reserved: 0, spent: 0, available: 0 };
    }

    return {
      amount: allocation.amount,
      reserved: allocation.reserved,
      spent: allocation.spent,
      available: allocation.amount - allocation.reserved - allocation.spent,
    };
  }

  /**
   * Close budget period
   */
  async closeBudget(budgetId: string): Promise<IBudget | null> {
    const budget = await Budget.findOneAndUpdate(
      { budgetId, 'period.end': { $lte: new Date() } },
      { $set: { 'period.end': new Date() } },
      { new: true }
    );

    if (budget) {
      logger.info('Budget period closed', { budgetId });
    }

    return budget;
  }
}

export const budgetService = new BudgetService();
export default budgetService;