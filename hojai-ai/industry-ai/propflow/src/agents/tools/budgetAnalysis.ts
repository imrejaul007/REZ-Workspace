/**
 * PROPFLOW - Budget Analysis Tool
 * Tool for analyzing lead budget and financial readiness
 */

import { BaseTool } from '@hojai/agent-runtime';
import { AgentContext, ToolResult } from '@hojai/agent-runtime';

export class BudgetAnalysisTool extends BaseTool {
  name = 'budgetAnalysis';
  description = 'Analyze lead budget to determine financial readiness and property options';

  parameters = [
    {
      name: 'budgetMin',
      type: 'number',
      description: 'Minimum budget in INR',
      required: true
    },
    {
      name: 'budgetMax',
      type: 'number',
      description: 'Maximum budget in INR',
      required: true
    },
    {
      name: 'financing',
      type: 'string',
      description: 'Financing preference (cash, home loan, part-payment)',
      required: false,
      enum: ['cash', 'home_loan', 'part_payment', 'unsure']
    }
  ];

  async execute(params: Record<string, any>, context: AgentContext): Promise<ToolResult> {
    try {
      const { budgetMin, budgetMax, financing } = params;
      const avgBudget = (budgetMin + budgetMax) / 2;
      const rangePercent = ((budgetMax - budgetMin) / budgetMax) * 100;

      // Determine budget segment
      let segment: string;
      let affordabilityScore: number;

      if (budgetMax >= 10000000) {
        segment = 'Premium';
        affordabilityScore = 90;
      } else if (budgetMax >= 5000000) {
        segment = 'Upper Mid';
        affordabilityScore = 75;
      } else if (budgetMax >= 2000000) {
        segment = 'Mid';
        affordabilityScore = 60;
      } else {
        segment = 'Budget';
        affordabilityScore = 40;
      }

      // Financing analysis
      let loanEligibility: any = null;
      if (financing === 'home_loan' || financing === 'unsure') {
        const maxLoan = budgetMax * 0.8; // 80% LTV
        const emiEstimate = this.calculateEMI(maxLoan, 8.5, 20); // 8.5% rate, 20 years

        loanEligibility = {
          maxLoanAmount: maxLoan,
          estimatedEMI: emiEstimate,
          requiredDownPayment: budgetMax * 0.2,
          monthlyIncomeRequired: emiEstimate * 5 // 5x EMI rule
        };
      }

      return {
        result: {
          budget: {
            min: budgetMin,
            max: budgetMax,
            average: avgBudget,
            rangePercent
          },
          segment,
          affordabilityScore,
          financing: financing || 'unsure',
          loanEligibility,
          recommendations: this.getRecommendations(segment, avgBudget)
        }
      };
    } catch (error) {
      return {
        result: null,
        error: `Budget analysis failed: ${error}`
      };
    }
  }

  private calculateEMI(principal: number, rate: number, years: number): number {
    const monthlyRate = rate / 12 / 100;
    const months = years * 12;
    return Math.round(
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1)
    );
  }

  private getRecommendations(segment: string, avgBudget: number): string[] {
    const recommendations: string[] = [];

    if (segment === 'Premium') {
      recommendations.push('Consider luxury projects with premium amenities');
      recommendations.push('Explorebuilder tie-ups for better rates');
    } else if (segment === 'Upper Mid') {
      recommendations.push('Look for projects with good connectivity');
      recommendations.push('Consider under-construction properties for better value');
    } else if (segment === 'Mid') {
      recommendations.push('Check government schemes for affordable housing');
      recommendations.push('Consider outskirts with upcoming infrastructure');
    } else {
      recommendations.push('Explore compact apartments in emerging areas');
      recommendations.push('Look for RERA-registered projects');
    }

    return recommendations;
  }
}

export default new BudgetAnalysisTool();