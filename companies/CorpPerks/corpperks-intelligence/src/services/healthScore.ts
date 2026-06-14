// Workforce Health Score Service
// Computes composite health metrics for workforce intelligence

import { randomInt } from 'crypto';
import { WorkforceHealthScore, RiskIndicator } from '../types/index.js';
import config from '../config/index.js';

interface DepartmentHealth {
  name: string;
  score: number;
  components: {
    engagement: number;
    attendance: number;
    productivity: number;
    sentiment: number;
  };
}

class HealthScoreService {
  async calculateHealthScore(tenantId: string): Promise<WorkforceHealthScore> {
    // Calculate component scores (0-100)
    const components = {
      engagement: this.calculateEngagementScore(tenantId),
      attendance: this.calculateAttendanceScore(tenantId),
      productivity: this.calculateProductivityScore(tenantId),
      sentiment: this.calculateSentimentScore(tenantId),
    };

    // Calculate weighted overall score
    const weights = config.healthScore;
    const overall =
      components.engagement * weights.engagement +
      components.attendance * weights.attendance +
      components.productivity * weights.productivity +
      components.sentiment * weights.sentiment;

    // Calculate trends
    const trends = this.calculateTrends(tenantId);

    // Identify risk indicators
    const riskIndicators = this.identifyRisks(components, tenantId);

    // Find healthiest and at-risk departments
    const deptHealth = this.calculateDepartmentHealth(tenantId);
    const healthiestDept = deptHealth.reduce((best, d) => (d.score > best.score ? d : best));
    const atRiskDept = deptHealth.reduce((worst, d) => (d.score < worst.score ? d : worst));

    return {
      overall: Math.round(overall),
      components,
      trends,
      riskIndicators,
      healthiestDept: healthiestDept.name,
      atRiskDept: atRiskDept.name,
      tenantId,
      generatedAt: new Date(),
    };
  }

  private calculateEngagementScore(tenantId: string): number {
    // Simulate engagement score calculation
    // In production, this would aggregate survey responses, recognition data, etc.
    const baseScore = 75;
    // Statistical simulation: variance -5 to +10
    const variance = (randomInt(0, 150) / 10) - 5;
    return Math.min(100, Math.max(0, baseScore + variance));
  }

  private calculateAttendanceScore(tenantId: string): number {
    // Simulate attendance score calculation
    // Based on present rate, punctuality, WFH compliance
    const baseScore = 80;
    // Statistical simulation: variance -4 to +8
    const variance = (randomInt(0, 120) / 10) - 4;
    return Math.min(100, Math.max(0, baseScore + variance));
  }

  private calculateProductivityScore(tenantId: string): number {
    // Simulate productivity score
    // Based on task completion, output metrics, efficiency
    const baseScore = 72;
    // Statistical simulation: variance -6 to +12
    const variance = (randomInt(0, 180) / 10) - 6;
    return Math.min(100, Math.max(0, baseScore + variance));
  }

  private calculateSentimentScore(tenantId: string): number {
    // Simulate sentiment score
    // Based on feedback, communication tone, collaboration metrics
    const baseScore = 68;
    // Statistical simulation: variance -8 to +12
    const variance = (randomInt(0, 200) / 10) - 8;
    return Math.min(100, Math.max(0, baseScore + variance));
  }

  private calculateTrends(tenantId: string): { weekly: number; monthly: number } {
    // Simulate trend calculation
    // Compare current week/month vs previous
    // Statistical simulation: weekly -3% to +5%, monthly -5% to +7%
    const weekly = -3 + (randomInt(0, 80) / 10);
    const monthly = -5 + (randomInt(0, 120) / 10);

    return {
      weekly: Math.round(weekly * 10) / 10,
      monthly: Math.round(monthly * 10) / 10,
    };
  }

  private identifyRisks(
    components: { engagement: number; attendance: number; productivity: number; sentiment: number },
    tenantId: string
  ): RiskIndicator[] {
    const risks: RiskIndicator[] = [];

    if (components.engagement < 70) {
      risks.push({
        indicator: 'Employee engagement below target',
        severity: components.engagement < 60 ? 'high' : 'medium',
        trend: 'decreasing',
      });
    }

    if (components.attendance < 85) {
      risks.push({
        indicator: 'Attendance rate below target',
        severity: components.attendance < 80 ? 'high' : 'medium',
        trend: 'decreasing',
      });
    }

    if (components.productivity < 70) {
      risks.push({
        indicator: 'Productivity index below threshold',
        severity: components.productivity < 65 ? 'high' : 'medium',
        trend: 'decreasing',
      });
    }

    if (components.sentiment < 65) {
      risks.push({
        indicator: 'Employee sentiment declining',
        severity: components.sentiment < 55 ? 'high' : 'medium',
        trend: 'decreasing',
      });
    }

    // Check for overtime surge (30% probability)
    if (randomInt(0, 100) < 30) {
      risks.push({
        indicator: 'Engineering overtime hours increased 25%',
        severity: 'medium',
        department: 'Engineering',
        trend: 'increasing',
      });
    }

    // Check for attrition risk (40% probability)
    if (randomInt(0, 100) < 40) {
      risks.push({
        indicator: 'Attrition risk elevated in Sales team',
        severity: 'high',
        department: 'Sales',
        trend: 'increasing',
      });
    }

    return risks;
  }

  private calculateDepartmentHealth(tenantId: string): DepartmentHealth[] {
    // Simulate department health scores with statistical variance
    const departments: DepartmentHealth[] = [
      {
        name: 'Engineering',
        score: 78 + (randomInt(0, 100) / 10),
        components: {
          engagement: 80,
          attendance: 82,
          productivity: 85,
          sentiment: 75,
        },
      },
      {
        name: 'Sales',
        score: 72 + (randomInt(0, 100) / 10),
        components: {
          engagement: 74,
          attendance: 78,
          productivity: 80,
          sentiment: 68,
        },
      },
      {
        name: 'Marketing',
        score: 82 + (randomInt(0, 80) / 10),
        components: {
          engagement: 85,
          attendance: 80,
          productivity: 78,
          sentiment: 82,
        },
      },
      {
        name: 'Support',
        score: 70 + (randomInt(0, 100) / 10),
        components: {
          engagement: 72,
          attendance: 75,
          productivity: 74,
          sentiment: 65,
        },
      },
      {
        name: 'Operations',
        score: 75 + (randomInt(0, 100) / 10),
        components: {
          engagement: 76,
          attendance: 80,
          productivity: 78,
          sentiment: 72,
        },
      },
    ];

    return departments.map(d => ({
      ...d,
      score: Math.round(d.score),
    }));
  }

  async getDepartmentComparison(tenantId: string): Promise<{
    departments: DepartmentHealth[];
    comparison: {
      highestScore: string;
      lowestScore: string;
      averageScore: number;
    };
  }> {
    const departments = this.calculateDepartmentHealth(tenantId);

    return {
      departments,
      comparison: {
        highestScore: departments.reduce((best, d) => (d.score > best.score ? d : best)).name,
        lowestScore: departments.reduce((worst, d) => (d.score < worst.score ? d : worst)).name,
        averageScore: Math.round(
          departments.reduce((sum, d) => sum + d.score, 0) / departments.length
        ),
      },
    };
  }

  async getHealthHistory(
    tenantId: string,
    days: number = 30
  ): Promise<Array<{ date: Date; score: number }>> {
    // Generate simulated historical health scores
    const history: Array<{ date: Date; score: number }> = [];
    // Statistical simulation: starting score 72-80
    let currentScore = 72 + (randomInt(0, 80) / 10);

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Random walk with mean reversion (slight upward bias)
      // Statistical simulation: range approximately -1.44 to +1.56
      const randomFactor = (randomInt(0, 100) / 100 - 0.48) * 3;
      currentScore = Math.min(100, Math.max(50, currentScore + randomFactor));

      history.push({
        date,
        score: Math.round(currentScore),
      });
    }

    return history;
  }
}

export const healthScoreService = new HealthScoreService();
export default healthScoreService;
