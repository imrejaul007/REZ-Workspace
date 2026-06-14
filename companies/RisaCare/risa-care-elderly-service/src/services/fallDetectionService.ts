import { v4 as uuidv4 } from 'uuid';
import {
  FallIncident,
  FallRiskAssessment,
  ReportFallDTO,
  FallSeverity,
  RiskLevel,
  ElderlyProfile,
} from '../models/elderlyCare';
import { elderlyProfileService } from './elderlyProfileService';
import {
  FallIncidentModel,
  FallRiskAssessmentModel,
  IFallIncident,
  IFallRiskAssessment,
} from '../models/mongodb';
import logger from '../utils/logger';

// Risk factor weights for fall risk assessment
const RISK_FACTORS = {
  age: { weight: 0.15, ranges: [{ max: 70, value: 0 }, { max: 80, value: 0.3 }, { max: 90, value: 0.6 }, { max: 120, value: 1 }] },
  mobilityLevel: {
    weight: 0.25,
    values: { independent: 0, limited: 0.3, assisted: 0.6, wheelchair: 0.8, bedridden: 1 }
  },
  fallHistory: { weight: 0.20, perFall: 0.2 },
  livingSituation: {
    weight: 0.10,
    values: { with_family: 0, with_spouse: 0.2, alone: 0.4, assisted_living: 0.1, nursing_home: 0.05 }
  },
  medicalConditions: {
    weight: 0.15,
    conditions: ['dementia', 'parkinson', 'osteoporosis', 'arthritis', 'stroke', 'vision', 'balance']
  },
  medications: { weight: 0.15, perMedication: 0.05, highRiskMed: 0.1 }
};

export class FallDetectionService {
  /**
   * Report a fall incident
   */
  async reportFall(dto: ReportFallDTO): Promise<FallIncident> {
    logger.info('Reporting fall incident', { patientId: dto.patientId, severity: dto.severity });

    const incident = new FallIncidentModel({
      patientId: dto.patientId,
      date: dto.date || new Date(),
      time: dto.time,
      location: dto.location,
      severity: dto.severity,
      cause: dto.cause,
      description: dto.description,
      treatment: dto.treatment,
      hospitalVisit: dto.hospitalVisit,
    });

    await incident.save();

    // Also add to patient's profile fall history
    try {
      await elderlyProfileService.addFallToHistory(dto.patientId, {
        date: incident.date,
        severity: incident.severity,
        location: incident.location,
        cause: incident.cause,
      });
    } catch (error) {
      logger.warn('Could not update profile fall history', { patientId: dto.patientId, error });
    }

    // Trigger emergency if severe
    if (incident.severity === 'severe' || incident.severity === 'injury') {
      logger.warn('Severe fall detected - emergency protocol may be needed', { patientId: dto.patientId });
    }

    logger.info('Fall incident reported successfully', { patientId: dto.patientId, incidentId: incident._id });

    return incident.toObject() as unknown as FallIncident;
  }

  /**
   * Assess fall risk for a patient
   */
  async assessFallRisk(patientId: string): Promise<FallRiskAssessment> {
    logger.info('Assessing fall risk', { patientId });

    const profile = await elderlyProfileService.getProfile(patientId);
    if (!profile) {
      throw new Error(`Patient profile not found: ${patientId}`);
    }

    const factors = this.calculateRiskFactors(profile);
    const score = this.calculateRiskScore(factors);
    const riskLevel = this.getRiskLevel(score);
    const recommendations = this.generateRecommendations(profile, riskLevel, factors);

    const assessment = new FallRiskAssessmentModel({
      patientId,
      date: new Date(),
      score,
      riskLevel,
      factors,
      recommendations,
    });

    await assessment.save();

    logger.info('Fall risk assessed', { patientId, score, riskLevel });

    return assessment.toObject() as unknown as FallRiskAssessment;
  }

  /**
   * Get fall history for a patient
   */
  async getFallHistory(patientId: string, limit?: number): Promise<FallIncident[]> {
    logger.info('Fetching fall history', { patientId });

    let query = FallIncidentModel.find({ patientId }).sort({ date: -1 });

    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const incidents = await query.lean();
    return incidents as unknown as FallIncident[];
  }

  /**
   * Get current risk score for a patient
   */
  async getRiskScore(patientId: string): Promise<FallRiskAssessment | null> {
    logger.info('Getting current risk score', { patientId });

    const assessment = await FallRiskAssessmentModel
      .findOne({ patientId })
      .sort({ date: -1 })
      .lean();

    if (!assessment) {
      // Generate assessment if none exists
      return this.assessFallRisk(patientId);
    }

    return assessment as unknown as FallRiskAssessment;
  }

  /**
   * Get all risk assessments for a patient
   */
  async getRiskHistory(patientId: string): Promise<FallRiskAssessment[]> {
    logger.info('Fetching risk assessment history', { patientId });

    const assessments = await FallRiskAssessmentModel
      .find({ patientId })
      .sort({ date: -1 })
      .lean();

    return assessments as unknown as FallRiskAssessment[];
  }

  /**
   * Calculate risk factors based on profile
   */
  private calculateRiskFactors(profile: ElderlyProfile): FallRiskAssessment['factors'] {
    const factors: FallRiskAssessment['factors'] = [];

    // Age factor
    const ageRange = RISK_FACTORS.age.ranges.find(r => profile.age <= r.max);
    const ageValue = ageRange ? ageRange.value : 1;
    factors.push({
      category: 'demographics',
      factor: 'age',
      weight: RISK_FACTORS.age.weight,
      value: ageValue,
    });

    // Mobility level factor
    const mobilityValue = RISK_FACTORS.mobilityLevel.values[profile.mobilityLevel] || 0;
    factors.push({
      category: 'mobility',
      factor: 'mobilityLevel',
      weight: RISK_FACTORS.mobilityLevel.weight,
      value: mobilityValue,
    });

    // Fall history factor
    const recentFalls = profile.fallHistory.filter(f => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return new Date(f.date) >= sixMonthsAgo;
    }).length;
    const fallValue = Math.min(recentFalls * RISK_FACTORS.fallHistory.perFall, 1);
    factors.push({
      category: 'history',
      factor: 'fallHistory',
      weight: RISK_FACTORS.fallHistory.weight,
      value: fallValue,
    });

    // Living situation factor
    const livingValue = RISK_FACTORS.livingSituation.values[profile.livingSituation] || 0;
    factors.push({
      category: 'environment',
      factor: 'livingSituation',
      weight: RISK_FACTORS.livingSituation.weight,
      value: livingValue,
    });

    // Medical conditions factor
    const conditionsCount = profile.medicalConditions.filter(c =>
      RISK_FACTORS.medicalConditions.conditions.some(hc =>
        c.toLowerCase().includes(hc)
      )
    ).length;
    const conditionsValue = Math.min(conditionsCount * 0.2, 1);
    factors.push({
      category: 'medical',
      factor: 'medicalConditions',
      weight: RISK_FACTORS.medicalConditions.weight,
      value: conditionsValue,
    });

    // Medications factor
    const medCount = profile.medications.length;
    const medValue = Math.min(
      medCount * RISK_FACTORS.medications.perMedication + (medCount > 4 ? RISK_FACTORS.medications.highRiskMed : 0),
      1
    );
    factors.push({
      category: 'medication',
      factor: 'medications',
      weight: RISK_FACTORS.medications.weight,
      value: medValue,
    });

    return factors;
  }

  /**
   * Calculate overall risk score (0-100)
   */
  private calculateRiskScore(factors: FallRiskAssessment['factors']): number {
    let totalScore = 0;

    for (const factor of factors) {
      totalScore += factor.weight * factor.value;
    }

    return Math.round(totalScore * 100);
  }

  /**
   * Determine risk level from score
   */
  private getRiskLevel(score: number): RiskLevel {
    if (score < 25) return 'low';
    if (score < 50) return 'moderate';
    if (score < 75) return 'high';
    return 'very_high';
  }

  /**
   * Generate recommendations based on risk level
   */
  private generateRecommendations(
    profile: ElderlyProfile,
    riskLevel: RiskLevel,
    factors: FallRiskAssessment['factors']
  ): string[] {
    const recommendations: string[] = [];

    // General recommendations based on risk level
    switch (riskLevel) {
      case 'low':
        recommendations.push('Continue regular physical activity');
        recommendations.push('Maintain home safety measures');
        break;
      case 'moderate':
        recommendations.push('Consider balance exercises and physical therapy');
        recommendations.push('Review home for fall hazards');
        recommendations.push('Regular vision check-ups recommended');
        break;
      case 'high':
        recommendations.push('Consult healthcare provider for fall prevention program');
        recommendations.push('Consider medical alert device');
        recommendations.push('Home modification assessment recommended');
        recommendations.push('Review medications with doctor for side effects');
        break;
      case 'very_high':
        recommendations.push('Urgent consultation with healthcare provider recommended');
        recommendations.push('Wearable fall detection device strongly recommended');
        recommendations.push('Consider assisted living or caregiver support');
        recommendations.push('Comprehensive medication review required');
        recommendations.push('Physical therapy evaluation needed');
        break;
    }

    // Specific recommendations based on factors
    const highFactors = factors.filter(f => f.value > 0.6);
    for (const factor of highFactors) {
      switch (factor.factor) {
        case 'mobilityLevel':
          if (profile.mobilityLevel === 'limited' || profile.mobilityLevel === 'assisted') {
            recommendations.push('Use mobility aids consistently (cane, walker)');
          }
          break;
        case 'fallHistory':
          recommendations.push('Document any near-falls or balance issues immediately');
          break;
        case 'livingSituation':
          if (profile.livingSituation === 'alone') {
            recommendations.push('Daily check-in system recommended');
            recommendations.push('Consider panic button or emergency response system');
          }
          break;
        case 'medicalConditions':
          recommendations.push('Regular monitoring of conditions affecting balance');
          break;
      }
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Get fall statistics for a patient
   */
  async getFallStatistics(patientId: string): Promise<{
    totalFalls: number;
    recentFalls: number;
    severityBreakdown: Record<FallSeverity, number>;
    averageSeverity: number;
  }> {
    logger.info('Calculating fall statistics', { patientId });

    const incidents = await FallIncidentModel.find({ patientId }).lean();

    // Recent falls (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentFalls = incidents.filter(i => new Date(i.date) >= sixMonthsAgo);

    // Severity breakdown
    const severityBreakdown: Record<FallSeverity, number> = {
      minor: 0,
      moderate: 0,
      severe: 0,
      injury: 0,
    };
    for (const incident of incidents) {
      severityBreakdown[incident.severity as FallSeverity]++;
    }

    // Average severity (numeric)
    const severityValues: Record<string, number> = { minor: 1, moderate: 2, severe: 3, injury: 4 };
    const averageSeverity = incidents.length > 0
      ? incidents.reduce((sum, i) => sum + (severityValues[i.severity] || 0), 0) / incidents.length
      : 0;

    return {
      totalFalls: incidents.length,
      recentFalls: recentFalls.length,
      severityBreakdown,
      averageSeverity: Math.round(averageSeverity * 10) / 10,
    };
  }
}

export const fallDetectionService = new FallDetectionService();
export default fallDetectionService;