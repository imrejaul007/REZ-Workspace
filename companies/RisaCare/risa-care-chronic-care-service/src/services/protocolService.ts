import { CareProtocol, IChronicCondition } from '../models/chronicCare';
import { CreateProtocolInput, ICareProtocol, TARGET_RANGES, ConditionType, ReadingType } from '../types';
import logger from '../utils/logger';

class ProtocolService {
  /**
   * Create a new care protocol for a condition
   */
  async createProtocol(
    conditionId: string,
    input: CreateProtocolInput
  ): Promise<ICareProtocol> {
    try {
      // Get condition to access patientId
      const condition = await import('../models/chronicCare').then(
        (m) => m.ChronicCondition.findById(conditionId)
      );

      if (!condition) {
        throw new Error('Condition not found');
      }

      const protocol = new CareProtocol({
        conditionId,
        patientId: condition.patientId,
        ...input
      });

      await protocol.save();

      logger.info('Care protocol created', {
        protocolId: protocol._id,
        conditionId,
        protocolName: input.protocolName
      });

      return protocol;
    } catch (error) {
      logger.error('Error creating protocol:', error);
      throw error;
    }
  }

  /**
   * Get protocol for a condition
   */
  async getProtocol(conditionId: string): Promise<ICareProtocol | null> {
    try {
      const protocol = await CareProtocol.findOne({
        conditionId,
        isActive: true
      }).lean();

      return protocol as ICareProtocol | null;
    } catch (error) {
      logger.error('Error getting protocol:', error);
      throw error;
    }
  }

  /**
   * Update a protocol
   */
  async updateProtocol(
    protocolId: string,
    updates: Partial<CreateProtocolInput>
  ): Promise<ICareProtocol | null> {
    try {
      const protocol = await CareProtocol.findByIdAndUpdate(
        protocolId,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();

      if (protocol) {
        logger.info('Protocol updated', {
          protocolId,
          updates: Object.keys(updates)
        });
      }

      return protocol as ICareProtocol | null;
    } catch (error) {
      logger.error('Error updating protocol:', error);
      throw error;
    }
  }

  /**
   * Get recommendations based on condition and protocol
   */
  async getRecommendations(
    conditionId: string
  ): Promise<{
    lifestyle: string[];
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      notes?: string;
    }>;
    monitoring: {
      frequency: string;
      metrics: string[];
    };
    targetRanges: Record<string, { min: number; max: number; unit: string }>;
  } | null> {
    try {
      const condition = await import('../models/chronicCare').then(
        (m) => m.ChronicCondition.findById(conditionId)
      );

      if (!condition) {
        return null;
      }

      const protocol = await this.getProtocol(conditionId);
      const targetRanges = TARGET_RANGES[condition.conditionType as ConditionType];

      // Get relevant reading types for this condition
      const relevantReadings: ReadingType[] = [];
      switch (condition.conditionType) {
        case 'diabetes':
          relevantReadings.push('blood_sugar', 'blood_pressure', 'weight');
          break;
        case 'hypertension':
          relevantReadings.push('blood_pressure', 'heart_rate', 'weight');
          break;
        case 'thyroid':
          relevantReadings.push('thyroid', 'weight', 'heart_rate', 'mood');
          break;
        case 'asthma':
        case 'copd':
          relevantReadings.push('lung_function', 'heart_rate');
          break;
        case 'heart_disease':
          relevantReadings.push('blood_pressure', 'heart_rate', 'weight');
          break;
        case 'arthritis':
          relevantReadings.push('pain_level', 'weight');
          break;
        case 'depression':
          relevantReadings.push('mood', 'weight');
          break;
        default:
          relevantReadings.push('blood_pressure', 'heart_rate', 'weight');
      }

      const metrics = relevantReadings.map((type) => {
        switch (type) {
          case 'blood_sugar':
            return 'Blood Sugar';
          case 'blood_pressure':
            return 'Blood Pressure';
          case 'heart_rate':
            return 'Heart Rate';
          case 'weight':
            return 'Weight';
          case 'thyroid':
            return 'Thyroid (TSH)';
          case 'lung_function':
            return 'Lung Function (FEV1)';
          case 'pain_level':
            return 'Pain Level';
          case 'mood':
            return 'Mood Score';
          default:
            return type;
        }
      });

      return {
        lifestyle: protocol?.lifestyleRecommendations || this.getDefaultLifestyleRecommendations(condition.conditionType as ConditionType),
        medications: protocol?.medications || [],
        monitoring: {
          frequency: protocol?.monitoringFrequency || 'daily',
          metrics
        },
        targetRanges: Object.fromEntries(
          relevantReadings.map((type) => [type, targetRanges[type]])
        ) as Record<string, { min: number; max: number; unit: string }>
      };
    } catch (error) {
      logger.error('Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Get default lifestyle recommendations based on condition
   */
  private getDefaultLifestyleRecommendations(conditionType: ConditionType): string[] {
    const recommendations: Record<ConditionType, string[]> = {
      diabetes: [
        'Monitor blood sugar levels regularly',
        'Follow a balanced diet with controlled carbohydrates',
        'Exercise for at least 30 minutes daily',
        'Take medications as prescribed',
        'Maintain a healthy weight',
        'Stay hydrated',
        'Get regular foot exams'
      ],
      hypertension: [
        'Reduce sodium intake to less than 2,300mg daily',
        'Exercise regularly for 30 minutes most days',
        'Maintain a healthy weight',
        'Limit alcohol consumption',
        'Manage stress through relaxation techniques',
        'Take blood pressure medications as prescribed',
        'Monitor blood pressure at home'
      ],
      thyroid: [
        'Take thyroid medication on empty stomach',
        'Wait 30-60 minutes before eating',
        'Avoid calcium/iron supplements within 4 hours',
        'Get regular thyroid function tests',
        'Maintain consistent iodine intake',
        'Report symptoms of hypo/hyperthyroidism'
      ],
      asthma: [
        'Avoid known triggers (allergens, smoke, pollution)',
        'Use controller inhaler as prescribed',
        'Keep rescue inhaler available at all times',
        'Follow an asthma action plan',
        'Get annual flu vaccine',
        'Exercise regularly to improve lung capacity',
        'Monitor peak flow readings'
      ],
      heart_disease: [
        'Follow a heart-healthy diet (low fat, low sodium)',
        'Exercise for at least 30 minutes most days',
        'Take all medications as prescribed',
        'Monitor cholesterol and blood pressure',
        'Quit smoking if applicable',
        'Manage stress levels',
        'Attend all cardiology appointments'
      ],
      copd: [
        'Quit smoking immediately',
        'Use supplemental oxygen if prescribed',
        'Practice breathing exercises',
        'Avoid air pollutants and irritants',
        'Get pneumococcal vaccine',
        'Attend pulmonary rehabilitation',
        'Maintain regular exercise routine'
      ],
      arthritis: [
        'Maintain a healthy weight to reduce joint stress',
        'Exercise regularly with low-impact activities',
        'Apply heat or cold therapy as needed',
        'Take anti-inflammatory medications as directed',
        'Protect joints during daily activities',
        'Consider physical therapy',
        'Use assistive devices if recommended'
      ],
      depression: [
        'Take antidepressants as prescribed',
        'Attend therapy sessions regularly',
        'Maintain a regular sleep schedule',
        'Exercise for at least 30 minutes daily',
        'Stay connected with friends and family',
        'Practice mindfulness and relaxation',
        'Set small, achievable daily goals'
      ],
      other: [
        'Follow your healthcare providers instructions',
        'Take medications as prescribed',
        'Attend all scheduled appointments',
        'Monitor symptoms and track changes',
        'Maintain a healthy lifestyle',
        'Report any concerning symptoms promptly'
      ]
    };

    return recommendations[conditionType];
  }

  /**
   * Deactivate a protocol
   */
  async deactivateProtocol(protocolId: string): Promise<boolean> {
    try {
      const result = await CareProtocol.findByIdAndUpdate(
        protocolId,
        { $set: { isActive: false } },
        { new: true }
      );

      if (result) {
        logger.info('Protocol deactivated', { protocolId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error deactivating protocol:', error);
      throw error;
    }
  }

  /**
   * Get all protocols for a patient
   */
  async getPatientProtocols(patientId: string): Promise<ICareProtocol[]> {
    try {
      const protocols = await CareProtocol.find({
        patientId,
        isActive: true
      })
        .sort({ createdAt: -1 })
        .lean();

      return protocols as ICareProtocol[];
    } catch (error) {
      logger.error('Error getting patient protocols:', error);
      throw error;
    }
  }
}

export default new ProtocolService();
