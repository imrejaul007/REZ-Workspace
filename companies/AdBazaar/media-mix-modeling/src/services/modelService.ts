import { v4 as uuidv4 } from 'uuid';
import { MMMModel, Channel, ModelResult } from '../models';
import { CreateMMMModelRequest, UpdateMMMModelRequest, ChannelData } from '../types';
import { logger } from '../utils/logger';
import { activeModelsGauge } from '../utils/metrics';

export class ModelService {
  /**
   * Create a new MMM model with channels
   */
  async createModel(data: CreateMMMModelRequest): Promise<any> {
    try {
      logger.info('Creating new MMM model', { name: data.name, advertiserId: data.advertiserId });

      // Create channels first
      const channelIds = await this.createChannels(data.channels);

      // Create the model
      const model = new MMMModel({
        name: data.name,
        advertiserId: data.advertiserId,
        channels: channelIds,
        dateRange: {
          start: new Date(data.dateRange.start),
          end: new Date(data.dateRange.end)
        },
        targetMetric: data.targetMetric,
        attributionModel: data.attributionModel,
        controlVariables: data.controlVariables,
        status: 'DRAFT'
      });

      await model.save();

      // Update active models gauge
      await this.updateActiveModelsGauge();

      logger.info('MMM model created successfully', { modelId: model._id });

      return {
        id: model._id,
        name: model.name,
        advertiserId: model.advertiserId,
        channels: channelIds,
        dateRange: model.dateRange,
        targetMetric: model.targetMetric,
        attributionModel: model.attributionModel,
        controlVariables: model.controlVariables,
        status: model.status,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt
      };
    } catch (error) {
      logger.error('Failed to create MMM model', { error });
      throw error;
    }
  }

  /**
   * Get model by ID with channels
   */
  async getModel(modelId: string): Promise<any> {
    try {
      const model = await MMMModel.findById(modelId).populate('channels');

      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      return {
        id: model._id,
        name: model.name,
        advertiserId: model.advertiserId,
        channels: model.channels,
        dateRange: model.dateRange,
        targetMetric: model.targetMetric,
        attributionModel: model.attributionModel,
        controlVariables: model.controlVariables,
        status: model.status,
        lastTrainedAt: model.lastTrainedAt,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt
      };
    } catch (error) {
      logger.error('Failed to get model', { modelId, error });
      throw error;
    }
  }

  /**
   * List models with pagination
   */
  async listModels(advertiserId?: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const query = advertiserId ? { advertiserId } : {};
      const skip = (page - 1) * limit;

      const [models, total] = await Promise.all([
        MMMModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('channels'),
        MMMModel.countDocuments(query)
      ]);

      return {
        data: models.map(model => ({
          id: model._id,
          name: model.name,
          advertiserId: model.advertiserId,
          channels: model.channels,
          dateRange: model.dateRange,
          targetMetric: model.targetMetric,
          status: model.status,
          lastTrainedAt: model.lastTrainedAt,
          createdAt: model.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to list models', { error });
      throw error;
    }
  }

  /**
   * Update model
   */
  async updateModel(modelId: string, data: UpdateMMMModelRequest): Promise<any> {
    try {
      const model = await MMMModel.findById(modelId);

      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      if (data.name) model.name = data.name;
      if (data.dateRange) {
        model.dateRange = {
          start: new Date(data.dateRange.start),
          end: new Date(data.dateRange.end)
        };
      }
      if (data.targetMetric) model.targetMetric = data.targetMetric;
      if (data.attributionModel) model.attributionModel = data.attributionModel;

      // Update channels if provided
      if (data.channels) {
        // Delete old channels
        await Channel.deleteMany({ _id: { $in: model.channels } });

        // Create new channels
        const channelIds = await this.createChannels(data.channels);
        model.channels = channelIds;
      }

      await model.save();

      return await this.getModel(modelId);
    } catch (error) {
      logger.error('Failed to update model', { modelId, error });
      throw error;
    }
  }

  /**
   * Delete model
   */
  async deleteModel(modelId: string): Promise<void> {
    try {
      const model = await MMMModel.findById(modelId);

      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      // Delete associated channels
      await Channel.deleteMany({ _id: { $in: model.channels } });

      // Delete associated results
      await ModelResult.deleteMany({ modelId: model._id });

      // Delete the model
      await MMMModel.findByIdAndDelete(modelId);

      await this.updateActiveModelsGauge();

      logger.info('Model deleted', { modelId });
    } catch (error) {
      logger.error('Failed to delete model', { modelId, error });
      throw error;
    }
  }

  /**
   * Create channels for a model
   */
  private async createChannels(channels: ChannelData[]): Promise<string[]> {
    const channelDocs = channels.map(ch => ({
      channelId: uuidv4(),
      name: ch.name,
      type: ch.type,
      spend: ch.spend,
      reach: ch.reach,
      frequency: ch.frequency,
      impressions: ch.impressions,
      clicks: ch.clicks,
      conversions: ch.conversions,
      revenue: ch.revenue,
      conversionsPerSpend: ch.conversions && ch.spend ? ch.conversions / ch.spend : undefined,
      revenuePerSpend: ch.revenue && ch.spend ? ch.revenue / ch.spend : undefined
    }));

    const savedChannels = await Channel.insertMany(channelDocs);
    return savedChannels.map(ch => ch._id.toString());
  }

  /**
   * Get channels for a model
   */
  async getModelChannels(modelId: string): Promise<any[]> {
    const model = await MMMModel.findById(modelId).populate('channels');
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }
    return model.channels;
  }

  /**
   * Update model status
   */
  async updateModelStatus(modelId: string, status: string): Promise<void> {
    await MMMModel.findByIdAndUpdate(modelId, {
      status,
      ...(status === 'TRAINED' ? { lastTrainedAt: new Date() } : {})
    });
  }

  /**
   * Update active models gauge
   */
  private async updateActiveModelsGauge(): Promise<void> {
    const count = await MMMModel.countDocuments({ status: { $in: ['DRAFT', 'TRAINING', 'TRAINED'] } });
    activeModelsGauge.set(count);
  }
}

export const modelService = new ModelService();