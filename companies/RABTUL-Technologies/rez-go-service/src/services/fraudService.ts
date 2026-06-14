import { GoSession } from '../models/GoSession.js';
import { config } from '../config/index.js';

export interface FraudCheckResult {
  score: number;
  risk: 'low' | 'medium' | 'high';
  factors: FraudFactor[];
  recommendations: string[];
  requiresAudit: boolean;
}

export interface FraudFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

export class FraudService {
  /**
   * Calculate fraud score for a session
   */
  async calculateFraudScore(sessionId: string): Promise<FraudCheckResult> {
    const session = await GoSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }

    const factors: FraudFactor[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Factor 1: Cart value anomaly
    const cartValueFactor = this.evaluateCartValue(session.total, session.items.length);
    factors.push(cartValueFactor);
    totalScore += cartValueFactor.score * cartValueFactor.weight;
    totalWeight += cartValueFactor.weight;

    // Factor 2: Item velocity (items per minute)
    const velocityFactor = this.evaluateVelocity(session);
    factors.push(velocityFactor);
    totalScore += velocityFactor.score * velocityFactor.weight;
    totalWeight += velocityFactor.weight;

    // Factor 3: Session duration
    const durationFactor = this.evaluateDuration(session);
    factors.push(durationFactor);
    totalScore += durationFactor.score * durationFactor.weight;
    totalWeight += durationFactor.weight;

    // Factor 4: High-value items
    const highValueFactor = this.evaluateHighValueItems(session);
    factors.push(highValueFactor);
    totalScore += highValueFactor.score * highValueFactor.weight;
    totalWeight += highValueFactor.weight;

    // Factor 5: Rapid quantity changes
    const quantityFactor = this.evaluateQuantityChanges(session);
    factors.push(quantityFactor);
    totalScore += quantityFactor.score * quantityFactor.weight;
    totalWeight += quantityFactor.weight;

    // Factor 6: Previous fraud history (would integrate with user history)
    const historyFactor = await this.evaluateHistory(session.userId);
    factors.push(historyFactor);
    totalScore += historyFactor.score * historyFactor.weight;
    totalWeight += historyFactor.weight;

    // Calculate final weighted score
    const finalScore = Math.round((totalScore / totalWeight) * 100);

    // Determine risk level
    let risk: 'low' | 'medium' | 'high';
    if (finalScore < config.FRAUD_THRESHOLD_MEDIUM) {
      risk = 'low';
    } else if (finalScore < config.FRAUD_THRESHOLD_HIGH) {
      risk = 'medium';
    } else {
      risk = 'high';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(factors, risk);

    // Determine if audit is required
    const requiresAudit = risk === 'high' || finalScore >= config.FRAUD_THRESHOLD_MEDIUM;

    // Update session
    await GoSession.updateOne(
      { sessionId },
      {
        fraudScore: finalScore,
        auditRequired: requiresAudit,
      }
    );

    return {
      score: finalScore,
      risk,
      factors,
      recommendations,
      requiresAudit,
    };
  }

  /**
   * Evaluate cart value for anomalies
   */
  private evaluateCartValue(total: number, itemCount: number): FraudFactor {
    const avgItemValue = itemCount > 0 ? total / itemCount : 0;

    // High cart value (above ₹5000)
    if (total > 5000) {
      return {
        name: 'High Cart Value',
        score: 40,
        weight: 2,
        description: `Cart total of ₹${total} is unusually high`,
      };
    }

    // Very low avg item value (suspiciously cheap items)
    if (avgItemValue < 10 && itemCount > 5) {
      return {
        name: 'Low Average Item Value',
        score: 30,
        weight: 1.5,
        description: 'Average item value is suspiciously low',
      };
    }

    // Very high avg item value (expensive items)
    if (avgItemValue > 1000 && itemCount > 3) {
      return {
        name: 'High Value Items',
        score: 25,
        weight: 1.5,
        description: 'Multiple high-value items in cart',
      };
    }

    // Normal range
    return {
      name: 'Cart Value',
      score: 10,
      weight: 1,
      description: 'Cart value within normal range',
    };
  }

  /**
   * Evaluate scanning velocity (items per minute)
   */
  private evaluateVelocity(session: any): FraudFactor {
    const now = new Date();
    const durationMs = now.getTime() - new Date(session.startedAt).getTime();
    const durationMin = durationMs / (1000 * 60);
    const itemCount = session.items.length;

    if (itemCount === 0) {
      return {
        name: 'Scanning Velocity',
        score: 0,
        weight: 1,
        description: 'No items scanned yet',
      };
    }

    const itemsPerMin = itemCount / Math.max(durationMin, 1);

    // Very fast scanning (more than 10 items per minute)
    if (itemsPerMin > 10) {
      return {
        name: 'High Scanning Velocity',
        score: 50,
        weight: 2,
        description: `Scanning ${itemsPerMin.toFixed(1)} items/min is very fast`,
      };
    }

    // Fast scanning (more than 5 items per minute)
    if (itemsPerMin > 5) {
      return {
        name: 'Fast Scanning',
        score: 25,
        weight: 1.5,
        description: `Scanning ${itemsPerMin.toFixed(1)} items/min`,
      };
    }

    // Normal
    return {
      name: 'Scanning Velocity',
      score: 10,
      weight: 1,
      description: `Scanning ${itemsPerMin.toFixed(1)} items/min (normal)`,
    };
  }

  /**
   * Evaluate session duration
   */
  private evaluateDuration(session: any): FraudFactor {
    const now = new Date();
    const durationMs = now.getTime() - new Date(session.startedAt).getTime();
    const durationMin = durationMs / (1000 * 60);

    // Very short session (under 2 minutes with many items)
    if (durationMin < 2 && session.items.length > 5) {
      return {
        name: 'Very Short Session',
        score: 45,
        weight: 2,
        description: `Session completed in ${durationMin.toFixed(0)} minutes with ${session.items.length} items`,
      };
    }

    // Short session (under 5 minutes)
    if (durationMin < 5 && session.items.length > 3) {
      return {
        name: 'Short Session',
        score: 20,
        weight: 1.5,
        description: `Session completed in ${durationMin.toFixed(0)} minutes`,
      };
    }

    // Very long session (over 2 hours)
    if (durationMin > 120) {
      return {
        name: 'Long Session',
        score: 15,
        weight: 1,
        description: `Session duration of ${durationMin.toFixed(0)} minutes`,
      };
    }

    // Normal
    return {
      name: 'Session Duration',
      score: 5,
      weight: 1,
      description: `Session duration of ${durationMin.toFixed(0)} minutes (normal)`,
    };
  }

  /**
   * Evaluate high-value items in cart
   */
  private evaluateHighValueItems(session: any): FraudFactor {
    const highValueThreshold = 1000; // ₹1000
    const highValueItems = session.items.filter(
      (item: any) => item.price >= highValueThreshold
    );

    if (highValueItems.length >= 3) {
      return {
        name: 'Multiple High-Value Items',
        score: 35,
        weight: 2,
        description: `${highValueItems.length} items valued at ₹${highValueThreshold}+`,
      };
    }

    if (highValueItems.length > 0) {
      return {
        name: 'High-Value Items',
        score: 15,
        weight: 1.5,
        description: `${highValueItems.length} high-value item(s) in cart`,
      };
    }

    return {
      name: 'Item Values',
      score: 5,
      weight: 1,
      description: 'No high-value items in cart',
    };
  }

  /**
   * Evaluate rapid quantity changes
   */
  private evaluateQuantityChanges(session: any): FraudFactor {
    // Look for items with unusually high quantities
    const highQuantityItems = session.items.filter(
      (item: any) => item.quantity > 10
    );

    if (highQuantityItems.length > 0) {
      return {
        name: 'High Quantity Items',
        score: 25,
        weight: 1.5,
        description: `${highQuantityItems.length} item(s) with quantity > 10`,
      };
    }

    return {
      name: 'Quantity Changes',
      score: 5,
      weight: 1,
      description: 'Quantity levels normal',
    };
  }

  /**
   * Evaluate user history (would integrate with user fraud database)
   */
  private async evaluateHistory(userId: string): Promise<FraudFactor> {
    // This would query a user fraud history database
    // For now, return default low risk

    // In production, check:
    // - Previous fraud incidents
    // - Chargeback history
    // - Return rate
    // - Account age

    return {
      name: 'User History',
      score: 10,
      weight: 1,
      description: 'No fraud history found',
    };
  }

  /**
   * Generate recommendations based on factors
   */
  private generateRecommendations(factors: FraudFactor[], risk: 'low' | 'medium' | 'high'): string[] {
    const recommendations: string[] = [];

    for (const factor of factors) {
      if (factor.score > 30) {
        switch (factor.name) {
          case 'High Cart Value':
            recommendations.push('Consider verifying cart contents with customer');
            break;
          case 'High Scanning Velocity':
            recommendations.push('Monitor for rapid unauthorized scanning');
            break;
          case 'Very Short Session':
            recommendations.push('Recommend exit verification for short sessions');
            break;
          case 'Multiple High-Value Items':
            recommendations.push('High-value items may require verification');
            break;
        }
      }
    }

    if (risk === 'high') {
      recommendations.push('Session flagged for mandatory audit');
      recommendations.push('Consider manual verification before exit');
    }

    if (recommendations.length === 0) {
      recommendations.push('No special action required');
    }

    return recommendations;
  }

  /**
   * Real-time fraud check during session
   */
  async realtimeCheck(sessionId: string): Promise<FraudCheckResult> {
    // Quick check without full calculation
    const session = await GoSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }

    const result = await this.calculateFraudScore(sessionId);

    // Return simplified result for real-time display
    return {
      ...result,
      factors: result.factors.filter((f) => f.score > 20), // Only high-risk factors
    };
  }
}

export const fraudService = new FraudService();
