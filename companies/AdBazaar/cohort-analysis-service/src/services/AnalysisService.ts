import { Analysis, IAnalysis } from '../models/Analysis.js';
import logger from '../utils/logger.js';

export class AnalysisService {
  async getAnalysisById(analysisId: string, organizationId: string): Promise<IAnalysis | null> {
    try {
      return await Analysis.findOne({ _id: analysisId, organizationId });
    } catch (error) {
      logger.error(`Error getting analysis ${analysisId}:`, error);
      throw error;
    }
  }

  async getAnalysisByCohort(cohortId: string, organizationId: string): Promise<IAnalysis[]> {
    try {
      return await Analysis.find({ cohortId, organizationId })
        .sort({ computedAt: -1 });
    } catch (error) {
      logger.error(`Error getting analyses for cohort ${cohortId}:`, error);
      throw error;
    }
  }

  async listAnalyses(organizationId: string, page = 1, limit = 20): Promise<{ analyses: IAnalysis[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const [analyses, total] = await Promise.all([
        Analysis.find({ organizationId })
          .sort({ computedAt: -1 })
          .skip(skip)
          .limit(limit),
        Analysis.countDocuments({ organizationId })
      ]);

      return { analyses, total };
    } catch (error) {
      logger.error('Error listing analyses:', error);
      throw error;
    }
  }

  async deleteAnalysis(analysisId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await Analysis.deleteOne({ _id: analysisId, organizationId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting analysis ${analysisId}:`, error);
      throw error;
    }
  }

  async getAnalysisStats(organizationId: string): Promise<any> {
    try {
      const [total, byType] = await Promise.all([
        Analysis.countDocuments({ organizationId }),
        Analysis.aggregate([
          { $match: { organizationId } },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ])
      ]);

      const avgDuration = await Analysis.aggregate([
        { $match: { organizationId } },
        { $group: { _id: null, avg: { $avg: '$duration' } } }
      ]);

      return {
        total,
        byType: Object.fromEntries(byType.map((t: any) => [t._id, t.count])),
        averageDuration: avgDuration[0]?.avg || 0
      };
    } catch (error) {
      logger.error('Error getting analysis stats:', error);
      throw error;
    }
  }
}

export default new AnalysisService();