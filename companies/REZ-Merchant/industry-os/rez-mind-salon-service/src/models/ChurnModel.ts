/**
 * Churn Prediction ML Model Module
 *
 * This module contains the churn prediction model for salon customers.
 * In production, this would be replaced with a trained model.
 */

export interface ChurnFeatures {
  daysSinceLastVisit: number;
  visitFrequency: number;
  avgDaysBetweenVisits: number;
  totalSpent: number;
  loyaltyTier: number; // 0=none, 1=bronze, 2=silver, 3=gold, 4=platinum
  numServices: number;
  recentDecline: number; // Ratio of recent visits to historical average
}

export interface ChurnPrediction {
  churnProbability: number;
  riskLevel: 'high' | 'medium' | 'low';
  riskFactors: { factor: string; contribution: number }[];
}

export class ChurnModel {
  private coefficients: Record<keyof ChurnFeatures, number> = {
    daysSinceLastVisit: 0.15,
    visitFrequency: -0.25,
    avgDaysBetweenVisits: 0.10,
    totalSpent: -0.05,
    loyaltyTier: -0.20,
    numServices: -0.10,
    recentDecline: 0.30,
  };

  private intercept = -0.5;

  /**
   * Predict churn probability based on customer features
   */
  predict(features: ChurnFeatures): ChurnPrediction {
    // Calculate raw score using logistic regression
    let score = this.intercept;

    score += this.coefficients.daysSinceLastVisit * Math.min(features.daysSinceLastVisit / 30, 3);
    score += this.coefficients.visitFrequency * Math.min(features.visitFrequency, 5);
    score += this.coefficients.avgDaysBetweenVisits * (features.avgDaysBetweenVisits / 30);
    score += this.coefficients.totalSpent * (features.totalSpent / 1000);
    score += this.coefficients.loyaltyTier * features.loyaltyTier;
    score += this.coefficients.numServices * Math.min(features.numServices / 20, 2);
    score += this.coefficients.recentDecline * features.recentDecline;

    // Convert to probability using sigmoid function
    const churnProbability = 1 / (1 + Math.exp(-score));

    // Determine risk level
    let riskLevel: ChurnPrediction['riskLevel'];
    if (churnProbability >= 0.6) {
      riskLevel = 'high';
    } else if (churnProbability >= 0.3) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Calculate factor contributions
    const riskFactors = this.calculateRiskFactors(features, churnProbability);

    return {
      churnProbability: Math.round(churnProbability * 100) / 100,
      riskLevel,
      riskFactors,
    };
  }

  private calculateRiskFactors(
    features: ChurnFeatures,
    probability: number
  ): { factor: string; contribution: number }[] {
    const factors: { factor: string; contribution: number }[] = [];

    // Days since last visit contribution
    if (features.daysSinceLastVisit > 45) {
      factors.push({
        factor: 'Long time since last visit',
        contribution: 0.15,
      });
    }

    // Declining visits contribution
    if (features.recentDecline > 0.5) {
      factors.push({
        factor: 'Declining visit frequency',
        contribution: 0.20,
      });
    }

    // Low loyalty tier contribution
    if (features.loyaltyTier < 2) {
      factors.push({
        factor: 'Low loyalty engagement',
        contribution: -0.10,
      });
    }

    // High value customers are less likely to churn
    if (features.totalSpent > 1000) {
      factors.push({
        factor: 'High-value customer',
        contribution: -0.15,
      });
    }

    return factors.sort((a, b) => b.contribution - a.contribution);
  }

  /**
   * Train the model with historical data
   */
  train(trainingData: { features: ChurnFeatures; churned: boolean }[]): void {
    // Simplified training - in production use proper ML libraries
    // This is a placeholder for model training logic

    const avgChurned = trainingData.filter((d) => d.churned).length / trainingData.length;
    this.intercept = Math.log(avgChurned / (1 - avgChurned));
  }
}

export const churnModel = new ChurnModel();
