import { logger } from '../../shared/logger';
import { v4 as uuidv4 } from 'uuid';
import {
  DomainType,
  DomainScore,
  HumanTwinState,
  TwinInsight,
  TwinPrediction,
  TimelineEvent,
  AggregatedSourceData,
  DOMAIN_WEIGHTS,
  PhysicalHealthData,
  MentalWellnessData,
  SexualWellnessData,
  LifestyleData,
  WorkLifeData,
  FamilyData,
  RelationshipData,
} from '../models/humanTwin.js';

// Service endpoints
const SERVICE_PORTS = {
  WOMENS_HEALTH: 4820,
  SEXUAL_WELLNESS: 4821,
  WORK_LIFE: 4822,
  WELLNESS: 4703,
  MENTAL_HEALTH: 4722,
  SLEEP: 4729,
} as const;

// In-memory storage for twin states (in production, use a proper database)
const twinStateCache: Map<string, HumanTwinState> = new Map();

// Default domain score
function createDefaultDomainScore(domain: DomainType): DomainScore {
  return {
    domain,
    score: 50,
    trend: 'stable',
    lastUpdated: new Date().toISOString(),
    dataPoints: 0,
    contributingFactors: [],
  };
}

// Calculate score from physical health data
function calculatePhysicalHealthScore(data: PhysicalHealthData | undefined): number {
  if (!data) return 50;

  let score = 50;
  const factors: string[] = [];

  // BMI scoring
  if (data.bmi !== undefined) {
    if (data.bmi >= 18.5 && data.bmi <= 24.9) {
      score += 10;
      factors.push('Healthy BMI');
    } else if (data.bmi >= 25 && data.bmi <= 29.9) {
      score -= 5;
      factors.push('Overweight');
    } else {
      score -= 10;
      factors.push('BMI out of healthy range');
    }
  }

  // Blood pressure scoring
  if (data.bloodPressure) {
    const { systolic, diastolic } = data.bloodPressure;
    if (systolic < 120 && diastolic < 80) {
      score += 10;
      factors.push('Normal blood pressure');
    } else if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
      score += 5;
    } else {
      score -= 10;
      factors.push('Elevated blood pressure');
    }
  }

  // Activity level
  const activityScores: Record<string, number> = {
    sedentary: -10,
    light: 0,
    moderate: 10,
    active: 15,
    very_active: 20,
  };
  if (data.activityLevel) {
    score += activityScores[data.activityLevel] || 0;
  }

  // Sleep
  if (data.sleepHours !== undefined) {
    if (data.sleepHours >= 7 && data.sleepHours <= 9) {
      score += 10;
      factors.push('Adequate sleep');
    } else if (data.sleepHours < 7) {
      score -= 10;
      factors.push('Sleep deprivation');
    }
  }

  return Math.max(0, Math.min(100, score));
}

// Calculate score from mental wellness data
function calculateMentalWellnessScore(data: MentalWellnessData | undefined): number {
  if (!data) return 50;

  let score = 50;

  if (data.mood !== undefined) {
    score = (score + (data.mood * 10)) / 2;
  }

  if (data.stressLevel !== undefined) {
    score -= ((data.stressLevel - 5) * 5);
  }

  if (data.anxietyLevel !== undefined) {
    score -= ((data.anxietyLevel - 5) * 5);
  }

  if (data.depressionRisk !== undefined) {
    score -= data.depressionRisk * 20;
  }

  if (data.mindfulnessMinutes !== undefined) {
    score += Math.min(10, data.mindfulnessMinutes / 10);
  }

  if (data.therapySessions !== undefined && data.therapySessions > 0) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

// Calculate score from sexual wellness data
function calculateSexualWellnessScore(data: SexualWellnessData | undefined): number {
  if (!data) return 50;

  let score = 50;

  if (data.libidoLevel !== undefined) {
    score = (score + (data.libidoLevel * 10)) / 2;
  }

  if (data.sexualSatisfaction !== undefined) {
    score = (score + (data.sexualSatisfaction * 10)) / 2;
  }

  if (data.relationshipIntimacy !== undefined) {
    score = (score + (data.relationshipIntimacy * 10)) / 2;
  }

  return Math.max(0, Math.min(100, score));
}

// Calculate score from lifestyle data
function calculateLifestyleScore(data: LifestyleData | undefined): number {
  if (!data) return 50;

  let score = 50;

  if (data.nutritionScore !== undefined) {
    score = (score + data.nutritionScore) / 2;
  }

  if (data.exerciseFrequency !== undefined) {
    if (data.exerciseFrequency >= 5) score += 15;
    else if (data.exerciseFrequency >= 3) score += 10;
    else if (data.exerciseFrequency >= 1) score += 5;
    else score -= 10;
  }

  if (data.screenTime !== undefined) {
    if (data.screenTime <= 2) score += 10;
    else if (data.screenTime <= 4) score += 5;
    else if (data.screenTime >= 8) score -= 10;
  }

  if (data.socialInteractions !== undefined) {
    if (data.socialInteractions >= 7) score += 10;
    else if (data.socialInteractions >= 3) score += 5;
    else score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

// Calculate score from work-life data
function calculateWorkLifeScore(data: WorkLifeData | undefined): number {
  if (!data) return 50;

  let score = 50;

  if (data.workLifeBalance !== undefined) {
    score = (score + (data.workLifeBalance * 10)) / 2;
  }

  if (data.jobSatisfaction !== undefined) {
    score = (score + (data.jobSatisfaction * 10)) / 2;
  }

  if (data.commuteSatisfaction !== undefined) {
    score = (score + (data.commuteSatisfaction * 10)) / 2;
  }

  return Math.max(0, Math.min(100, score));
}

// Calculate score from family data
function calculateFamilyScore(data: FamilyData | undefined): number {
  if (!data) return 50;

  let score = 50;

  if (data.familySatisfaction !== undefined) {
    score = (score + (data.familySatisfaction * 10)) / 2;
  }

  if (data.familyInteractions !== undefined) {
    if (data.familyInteractions >= 7) score += 10;
    else if (data.familyInteractions >= 3) score += 5;
    else score -= 5;
  }

  if (data.supportSystem) {
    const supportScores: Record<string, number> = { strong: 15, moderate: 5, weak: -10 };
    score += supportScores[data.supportSystem] || 0;
  }

  return Math.max(0, Math.min(100, score));
}

// Calculate score from relationship data
function calculateRelationshipScore(data: RelationshipData | undefined): number {
  if (!data) return 50;

  let score = 50;

  if (data.relationshipSatisfaction !== undefined) {
    score = (score + (data.relationshipSatisfaction * 10)) / 2;
  }

  if (data.communicationQuality !== undefined) {
    score = (score + (data.communicationQuality * 10)) / 2;
  }

  if (data.conflictFrequency !== undefined) {
    if (data.conflictFrequency <= 2) score += 10;
    else if (data.conflictFrequency <= 5) score += 5;
    else score -= 10;
  }

  if (data.dateNightFrequency !== undefined) {
    if (data.dateNightFrequency >= 4) score += 10;
    else if (data.dateNightFrequency >= 2) score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

export class HumanTwinService {
  private async fetchFromService<T>(port: number, endpoint: string): Promise<T | undefined> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`http://localhost:${port}${endpoint}`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object' && 'data' in data) {
          return (data as { data: T }).data;
        }
        return data as T;
      }
      return undefined;
    } catch (error) {
      logger.warn(`Failed to fetch from port ${port}${endpoint}:`, error);
      return undefined;
    }
  }

  private async aggregateSourceData(userId: string): Promise<AggregatedSourceData> {
    const [physicalHealth, mentalWellness, sexualWellness, lifestyle, workLife, family, relationship] =
      await Promise.all([
        this.fetchFromService<PhysicalHealthData>(
          SERVICE_PORTS.WOMENS_HEALTH,
          `/health/${userId}`
        ),
        this.fetchFromService<MentalWellnessData>(
          SERVICE_PORTS.MENTAL_HEALTH,
          `/wellness/${userId}`
        ),
        this.fetchFromService<SexualWellnessData>(
          SERVICE_PORTS.SEXUAL_WELLNESS,
          `/wellness/${userId}`
        ),
        this.fetchFromService<LifestyleData>(
          SERVICE_PORTS.WELLNESS,
          `/lifestyle/${userId}`
        ),
        this.fetchFromService<WorkLifeData>(
          SERVICE_PORTS.WORK_LIFE,
          `/balance/${userId}`
        ),
        this.fetchFromService<FamilyData>(
          SERVICE_PORTS.MENTAL_HEALTH,
          `/family/${userId}`
        ),
        this.fetchFromService<RelationshipData>(
          SERVICE_PORTS.MENTAL_HEALTH,
          `/relationship/${userId}`
        ),
      ]);

    return {
      physicalHealth,
      mentalWellness,
      sexualWellness,
      lifestyle,
      workLife,
      family,
      relationship,
    };
  }

  private calculateOverallScore(domains: HumanTwinState['domains']): number {
    let weightedSum = 0;

    for (const [domain, score] of Object.entries(domains)) {
      const weight = DOMAIN_WEIGHTS[domain as DomainType] || 0;
      weightedSum += score.score * weight;
    }

    return Math.round(weightedSum);
  }

  private determineTrend(scores: number[]): 'improving' | 'stable' | 'declining' {
    if (scores.length < 2) return 'stable';

    const recent = scores.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const older = scores.slice(0, Math.min(3, scores.length - 1));
    const oldAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : avg;

    const diff = avg - oldAvg;
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  private determineTwinHealth(overallScore: number): HumanTwinState['twinHealth'] {
    if (overallScore >= 80) return 'thriving';
    if (overallScore >= 60) return 'stable';
    if (overallScore >= 40) return 'needs_attention';
    return 'critical';
  }

  private generateCorrelationInsights(
    domains: HumanTwinState['domains'],
    sourceData: AggregatedSourceData
  ): TwinInsight[] {
    const insights: TwinInsight[] = [];

    // Mental health affects physical health
    const mentalScore = domains.mental_wellness.score;
    const physicalScore = domains.physical_health.score;
    if (mentalScore < 40 && physicalScore < 60) {
      insights.push({
        id: uuidv4(),
        type: 'correlation',
        title: 'Mental-Physical Connection',
        description: 'Your mental wellness scores are correlated with your physical health. Addressing mental health concerns may improve physical wellness.',
        confidence: 0.85,
        domains: ['mental_wellness', 'physical_health'],
        actionItems: ['Consider meditation for stress reduction', 'Schedule regular exercise'],
        generatedAt: new Date().toISOString(),
      });
    }

    // Work-life balance impact
    if (domains.work_life.score < 40 && domains.mental_wellness.score < 50) {
      insights.push({
        id: uuidv4(),
        type: 'correlation',
        title: 'Work-Life Balance Impact',
        description: 'Your work-life balance may be contributing to lower mental wellness scores.',
        confidence: 0.78,
        domains: ['work_life', 'mental_wellness'],
        actionItems: ['Set boundaries for work hours', 'Schedule personal time'],
        generatedAt: new Date().toISOString(),
      });
    }

    // Sleep impact on all domains
    const sleepHours = sourceData.physicalHealth?.sleepHours;
    if (sleepHours !== undefined && sleepHours < 6) {
      insights.push({
        id: uuidv4(),
        type: 'warning',
        title: 'Sleep Deprivation Alert',
        description: 'Your sleep patterns may be affecting multiple domains of your wellness.',
        confidence: 0.92,
        domains: ['physical_health', 'mental_wellness', 'lifestyle'],
        actionItems: ['Prioritize 7-9 hours of sleep', 'Create a consistent sleep schedule'],
        generatedAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  private generatePredictionsInternal(
    domains: HumanTwinState['domains'],
    overallScore: number
  ): TwinPrediction[] {
    const predictions: TwinPrediction[] = [];
    const now = new Date();

    // Health risk predictions
    if (domains.physical_health.score < 50) {
      predictions.push({
        id: uuidv4(),
        type: 'health_risk',
        title: 'Potential Physical Health Decline',
        description: 'Your physical health score indicates an increased risk of health issues if current patterns continue.',
        probability: 0.65,
        timeframe: 'next_quarter',
        affectedDomains: ['physical_health'],
        recommendations: [
          'Increase physical activity',
          'Improve sleep habits',
          'Schedule health checkup',
        ],
        riskLevel: 'medium',
        generatedAt: now.toISOString(),
      });
    }

    // Mental wellness prediction
    if (domains.mental_wellness.score < 40) {
      predictions.push({
        id: uuidv4(),
        type: 'health_risk',
        title: 'Mental Wellness Concern',
        description: 'Your mental wellness scores suggest potential risk of anxiety or depression if not addressed.',
        probability: 0.70,
        timeframe: 'next_month',
        affectedDomains: ['mental_wellness', 'work_life', 'relationship'],
        recommendations: [
          'Consider therapy or counseling',
          'Practice daily mindfulness',
          'Increase social support',
        ],
        riskLevel: 'high',
        generatedAt: now.toISOString(),
      });
    }

    // Opportunity predictions
    if (domains.lifestyle.score >= 70 && domains.mental_wellness.score >= 60) {
      predictions.push({
        id: uuidv4(),
        type: 'opportunity',
        title: 'Wellness Momentum',
        description: 'Your healthy lifestyle habits are creating positive momentum. Consider sharing your journey.',
        probability: 0.80,
        timeframe: 'next_month',
        affectedDomains: ['lifestyle', 'mental_wellness', 'physical_health'],
        recommendations: [
          'Maintain current habits',
          'Set new wellness goals',
          'Consider mentoring others',
        ],
        riskLevel: 'low',
        generatedAt: now.toISOString(),
      });
    }

    // Work-life opportunity
    if (domains.work_life.score >= 70) {
      predictions.push({
        id: uuidv4(),
        type: 'opportunity',
        title: 'Career Growth Potential',
        description: 'Your work-life balance is strong. This may be an ideal time to pursue career advancement.',
        probability: 0.75,
        timeframe: 'next_quarter',
        affectedDomains: ['work_life', 'mental_wellness'],
        recommendations: [
          'Explore new projects',
          'Consider skill development',
          'Network with colleagues',
        ],
        riskLevel: 'low',
        generatedAt: now.toISOString(),
      });
    }

    return predictions;
  }

  async getHumanTwin(userId: string): Promise<HumanTwinState> {
    // Check cache first
    const cached = twinStateCache.get(userId);
    if (cached) {
      // Refresh data if cache is older than 5 minutes
      const cacheAge = Date.now() - new Date(cached.lastSynced).getTime();
      if (cacheAge < 5 * 60 * 1000) {
        return cached;
      }
    }

    // Aggregate data from all source services
    const sourceData = await this.aggregateSourceData(userId);

    // Calculate domain scores
    const domains: HumanTwinState['domains'] = {
      physical_health: {
        domain: 'physical_health',
        score: calculatePhysicalHealthScore(sourceData.physicalHealth),
        trend: 'stable',
        lastUpdated: new Date().toISOString(),
        dataPoints: sourceData.physicalHealth ? 5 : 0,
      },
      mental_wellness: {
        domain: 'mental_wellness',
        score: calculateMentalWellnessScore(sourceData.mentalWellness),
        trend: 'stable',
        lastUpdated: new Date().toISOString(),
        dataPoints: sourceData.mentalWellness ? 5 : 0,
      },
      sexual_wellness: {
        domain: 'sexual_wellness',
        score: calculateSexualWellnessScore(sourceData.sexualWellness),
        trend: 'stable',
        lastUpdated: new Date().toISOString(),
        dataPoints: sourceData.sexualWellness ? 3 : 0,
      },
      lifestyle: {
        domain: 'lifestyle',
        score: calculateLifestyleScore(sourceData.lifestyle),
        trend: 'stable',
        lastUpdated: new Date().toISOString(),
        dataPoints: sourceData.lifestyle ? 5 : 0,
      },
      work_life: {
        domain: 'work_life',
        score: calculateWorkLifeScore(sourceData.workLife),
        trend: 'stable',
        lastUpdated: new Date().toISOString(),
        dataPoints: sourceData.workLife ? 4 : 0,
      },
      family: {
        domain: 'family',
        score: calculateFamilyScore(sourceData.family),
        trend: 'stable',
        lastUpdated: new Date().toISOString(),
        dataPoints: sourceData.family ? 4 : 0,
      },
      relationship: {
        domain: 'relationship',
        score: calculateRelationshipScore(sourceData.relationship),
        trend: 'stable',
        lastUpdated: new Date().toISOString(),
        dataPoints: sourceData.relationship ? 4 : 0,
      },
    };

    // Calculate overall score
    const overallScore = this.calculateOverallScore(domains);

    // Generate insights and predictions
    const insights = this.generateCorrelationInsights(domains, sourceData);
    const predictions = this.generatePredictionsInternal(domains, overallScore);

    // Create timeline events
    const timeline: TimelineEvent[] = [];
    if (sourceData.physicalHealth?.lastUpdated) {
      timeline.push({
        id: uuidv4(),
        date: sourceData.physicalHealth.lastUpdated,
        type: 'health_milestone',
        title: 'Physical Health Check',
        description: 'Physical health data recorded',
        impact: sourceData.physicalHealth.sleepHours ? 'positive' : 'neutral',
        affectedDomains: ['physical_health'],
      });
    }

    // Determine twin health status
    const twinHealth = this.determineTwinHealth(overallScore);

    // Determine overall trend
    const allScores = Object.values(domains).map((d) => d.score);
    const overallTrend = this.determineTrend(allScores);

    const twinState: HumanTwinState = {
      userId,
      overallScore,
      overallTrend,
      domains,
      insights,
      predictions,
      timeline,
      twinHealth,
      lastSynced: new Date().toISOString(),
      createdAt: cached?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Cache the result
    twinStateCache.set(userId, twinState);

    return twinState;
  }

  async updateDomainScore(
    userId: string,
    domain: DomainType,
    score: number
  ): Promise<DomainScore> {
    const twin = await this.getHumanTwin(userId);

    const updatedScore: DomainScore = {
      domain,
      score: Math.max(0, Math.min(100, score)),
      trend: 'stable',
      lastUpdated: new Date().toISOString(),
    };

    // Update the domain score in cache
    twin.domains[domain] = updatedScore;
    twin.overallScore = this.calculateOverallScore(twin.domains);
    twin.twinHealth = this.determineTwinHealth(twin.overallScore);
    twin.updatedAt = new Date().toISOString();
    twin.lastSynced = new Date().toISOString();

    // Add timeline event
    twin.timeline.push({
      id: uuidv4(),
      date: new Date().toISOString(),
      type: 'wellness_check',
      title: `${domain.replace('_', ' ')} score updated`,
      description: `Score changed to ${score}`,
      impact: score >= 60 ? 'positive' : score >= 40 ? 'neutral' : 'negative',
      affectedDomains: [domain],
    });

    twinStateCache.set(userId, twin);

    return updatedScore;
  }

  async generateInsights(userId: string): Promise<TwinInsight[]> {
    const twin = await this.getHumanTwin(userId);

    const insights: TwinInsight[] = [...twin.insights];

    // Add pattern-based insights
    const domainEntries = Object.entries(twin.domains);

    // Find lowest scoring domains
    const sortedDomains = domainEntries.sort((a, b) => a[1].score - b[1].score);
    const lowestDomain = sortedDomains[0];
    const highestDomain = sortedDomains[sortedDomains.length - 1];

    if (lowestDomain && lowestDomain[1].score < 40) {
      insights.push({
        id: uuidv4(),
        type: 'warning',
        title: `${lowestDomain[0].replace('_', ' ')} Needs Attention`,
        description: `Your ${lowestDomain[0].replace('_', ' ')} is your lowest-scoring domain. Consider focusing on improvements here.`,
        confidence: 0.90,
        domains: [lowestDomain[0] as DomainType],
        actionItems: [
          `Identify specific issues in ${lowestDomain[0].replace('_', ' ')}`,
          'Set small, achievable goals',
          'Track progress regularly',
        ],
        generatedAt: new Date().toISOString(),
      });
    }

    // Achievement insight
    if (highestDomain && highestDomain[1].score >= 80) {
      insights.push({
        id: uuidv4(),
        type: 'achievement',
        title: `${highestDomain[0].replace('_', ' ')} Excellence`,
        description: `Great job! Your ${highestDomain[0].replace('_', ' ')} is thriving at ${highestDomain[1].score}%.`,
        confidence: 0.95,
        domains: [highestDomain[0] as DomainType],
        generatedAt: new Date().toISOString(),
      });
    }

    // Cross-domain insights
    if (twin.overallScore >= 70) {
      insights.push({
        id: uuidv4(),
        type: 'recommendation',
        title: 'Holistic Wellness Opportunity',
        description: 'Your overall wellness is strong. Consider how improvements in one area might benefit others.',
        confidence: 0.75,
        domains: ['physical_health', 'mental_wellness', 'lifestyle'],
        actionItems: [
          'Review all domain scores',
          'Identify areas for optimization',
          'Share learnings with others',
        ],
        generatedAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  async generatePredictions(userId: string): Promise<TwinPrediction[]> {
    const twin = await this.getHumanTwin(userId);

    const predictions: TwinPrediction[] = [...twin.predictions];

    // Add trend-based predictions
    for (const [domain, data] of Object.entries(twin.domains)) {
      if (data.trend === 'declining' && data.score < 50) {
        predictions.push({
          id: uuidv4(),
          type: 'wellness_trend',
          title: `${domain.replace('_', ' ')} Decline Risk`,
          description: `Your ${domain.replace('_', ' ')} has been trending downward. Early intervention can prevent further decline.`,
          probability: 0.70,
          timeframe: 'next_month',
          affectedDomains: [domain as DomainType],
          recommendations: [
            'Analyze recent changes',
            'Identify contributing factors',
            'Implement corrective actions',
          ],
          riskLevel: 'medium',
          generatedAt: new Date().toISOString(),
        });
      }

      if (data.trend === 'improving' && data.score >= 60) {
        predictions.push({
          id: uuidv4(),
          type: 'opportunity',
          title: `${domain.replace('_', ' ')} Growth Potential`,
          description: `Your ${domain.replace('_', ' ')} is improving. Maintain momentum for continued growth.`,
          probability: 0.80,
          timeframe: 'next_quarter',
          affectedDomains: [domain as DomainType],
          recommendations: [
            'Continue current practices',
            'Set incremental goals',
            'Celebrate progress',
          ],
          riskLevel: 'low',
          generatedAt: new Date().toISOString(),
        });
      }
    }

    return predictions;
  }

  async getOverallScore(userId: string): Promise<{
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    health: HumanTwinState['twinHealth'];
    breakdown: {
      domain: DomainType;
      score: number;
      weight: number;
      contribution: number;
    }[];
  }> {
    const twin = await this.getHumanTwin(userId);

    const breakdown = Object.entries(twin.domains).map(([domain, data]) => ({
      domain: domain as DomainType,
      score: data.score,
      weight: DOMAIN_WEIGHTS[domain as DomainType],
      contribution: data.score * DOMAIN_WEIGHTS[domain as DomainType],
    }));

    return {
      score: twin.overallScore,
      trend: twin.overallTrend,
      health: twin.twinHealth,
      breakdown,
    };
  }

  async getTimeline(userId: string): Promise<TimelineEvent[]> {
    const twin = await this.getHumanTwin(userId);

    // Sort timeline by date, most recent first
    return twin.timeline.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  // Method to clear cache (for testing or reset)
  clearCache(userId?: string): void {
    if (userId) {
      twinStateCache.delete(userId);
    } else {
      twinStateCache.clear();
    }
  }
}

// Export singleton instance
export const humanTwinService = new HumanTwinService();