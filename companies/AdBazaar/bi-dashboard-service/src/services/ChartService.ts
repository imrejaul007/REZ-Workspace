import { Chart, IChart } from '../models/Chart.js';
import logger from '../utils/logger.js';

export class ChartService {
  async createChart(data: Partial<IChart>): Promise<IChart> {
    try {
      const chart = new Chart(data);
      await chart.save();
      logger.info(`Created chart: ${chart.name}`);
      return chart;
    } catch (error) {
      logger.error('Error creating chart:', error);
      throw error;
    }
  }

  async getCharts(organizationId: string, type?: string): Promise<IChart[]> {
    try {
      const query: any = { organizationId };
      if (type) query.type = type;
      return await Chart.find(query).sort({ usageCount: -1 });
    } catch (error) {
      logger.error('Error getting charts:', error);
      throw error;
    }
  }

  async getTemplates(type?: string): Promise<IChart[]> {
    try {
      const query: any = { isTemplate: true };
      if (type) query.type = type;
      return await Chart.find(query).sort({ usageCount: -1 });
    } catch (error) {
      logger.error('Error getting chart templates:', error);
      throw error;
    }
  }

  async getChartById(chartId: string, organizationId: string): Promise<IChart | null> {
    try {
      return await Chart.findOne({ _id: chartId, organizationId });
    } catch (error) {
      logger.error(`Error getting chart ${chartId}:`, error);
      throw error;
    }
  }

  async updateChart(chartId: string, data: Partial<IChart>, organizationId: string): Promise<IChart | null> {
    try {
      const chart = await Chart.findOneAndUpdate(
        { _id: chartId, organizationId },
        { $set: data },
        { new: true }
      );

      if (chart) {
        logger.info(`Updated chart: ${chart.name}`);
      }
      return chart;
    } catch (error) {
      logger.error(`Error updating chart ${chartId}:`, error);
      throw error;
    }
  }

  async deleteChart(chartId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await Chart.deleteOne({ _id: chartId, organizationId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting chart ${chartId}:`, error);
      throw error;
    }
  }

  async renderChart(chartId: string, organizationId: string, data?: any): Promise<any> {
    try {
      const chart = await Chart.findOne({ _id: chartId, organizationId });
      if (!chart) {
        throw new Error('Chart not found');
      }

      await Chart.findByIdAndUpdate(chartId, { $inc: { usageCount: 1 } });

      const chartData = data || this.generateMockData(chart);

      return {
        chart,
        data: chartData,
        config: {
          type: chart.type,
          visualization: chart.visualization,
          thresholds: chart.thresholds,
          annotations: chart.annotations
        }
      };
    } catch (error) {
      logger.error(`Error rendering chart ${chartId}:`, error);
      throw error;
    }
  }

  private generateMockData(chart: IChart): any {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const datasets = chart.dataConfig.yAxis.map((axis, i) => ({
      label: axis,
      data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 10000)),
      backgroundColor: chart.visualization.colorScheme?.[i] || 'rgba(54, 162, 235, 0.5)'
    }));

    return {
      labels,
      datasets
    };
  }
}

export default new ChartService();