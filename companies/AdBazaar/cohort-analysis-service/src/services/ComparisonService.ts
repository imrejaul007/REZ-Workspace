import { Comparison, IComparison } from '../models/Comparison.js';
import logger from '../utils/logger.js';

export class ComparisonService {
  async getComparisonById(comparisonId: string, organizationId: string): Promise<IComparison | null> {
    try {
      return await Comparison.findOne({ _id: comparisonId, organizationId });
    } catch (error) {
      logger.error(`Error getting comparison ${comparisonId}:`, error);
      throw error;
    }
  }

  async listComparisons(organizationId: string, page = 1, limit = 20): Promise<{ comparisons: IComparison[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const [comparisons, total] = await Promise.all([
        Comparison.find({ organizationId })
          .sort({ computedAt: -1 })
          .skip(skip)
          .limit(limit),
        Comparison.countDocuments({ organizationId })
      ]);

      return { comparisons, total };
    } catch (error) {
      logger.error('Error listing comparisons:', error);
      throw error;
    }
  }

  async deleteComparison(comparisonId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await Comparison.deleteOne({ _id: comparisonId, organizationId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting comparison ${comparisonId}:`, error);
      throw error;
    }
  }

  async getComparisonStats(organizationId: string): Promise<any> {
    try {
      const [total, byType] = await Promise.all([
        Comparison.countDocuments({ organizationId }),
        Comparison.aggregate([
          { $match: { organizationId } },
          { $group: { _id: '$analysisType', count: { $sum: 1 } } }
        ])
      ]);

      return {
        total,
        byType: Object.fromEntries(byType.map((t: any) => [t._id, t.count]))
      };
    } catch (error) {
      logger.error('Error getting comparison stats:', error);
      throw error;
    }
  }
}

export default new ComparisonService();