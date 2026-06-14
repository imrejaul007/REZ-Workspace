import { apiClient } from './client';

export type CampaignType = 'cashback_percentage' | 'flat_bonus' | 'multiplier';

export interface SimulationInput {
  storeId: string;
  campaignType: CampaignType;
  rewardValue: number;
  budgetCap: number;
  durationDays: number;
  estimatedDailyFootfall?: number;
  estimatedAvgBill?: number;
}

export interface SimulationResult {
  expectedLiability: number;
  dailyLiability: number;
  budgetLastsDays: number;

  currentRepeatRate: number;
  projectedRepeatRate: number;
  additionalRepeatVisits: number;

  breakageRate: number;
  coinBreakageEstimate: number;
  effectiveCost: number;

  projectedRevenueUplift: number;
  projectedROI: number;
  breakEvenDays: number;

  baseline: {
    dailyOrders: number;
    avgOrderValue: number;
    dailyRevenue: number;
    repeatRate: number;
    totalCustomers: number;
  };
}

class CampaignSimulatorService {
  async simulate(input: SimulationInput): Promise<SimulationResult> {
    try {
      const response = await apiClient.post<SimulationResult>(
        'merchant/campaign-simulator/simulate',
        input
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Simulation failed');
    } catch (error) {
      throw new Error(error.message || 'Campaign simulation failed');
    }
  }
}

export const campaignSimulatorService = new CampaignSimulatorService();
export default campaignSimulatorService;
