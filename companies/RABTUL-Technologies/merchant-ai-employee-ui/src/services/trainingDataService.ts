// Merchant AI Employee UI - Training Data Service (MongoDB-backed)
// Manages FAQ, product knowledge, and conversation training data for AI agents

import { v4 as uuidv4 } from 'uuid';
import { TrainingData, TrainingJob } from '../models';
import { logger } from '../utils/logger';
import { TrainingDataType } from '../types';
import type { TrainingJob as TrainingJobType } from '../types';

interface TrainingDataInput {
  type: TrainingDataType;
  question: string;
  answer: string;
  intent?: string;
  entities?: string[];
  metadata?: {
    category?: string;
    tags?: string[];
    confidence?: number;
    source?: string;
  };
  enabled?: boolean;
}

interface BatchImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export class TrainingDataService {

  async addTrainingData(merchantId: string, data: TrainingDataInput) {
    const record = await TrainingData.create({
      merchantId,
      ...data,
      enabled: data.enabled ?? true,
      usageCount: 0,
    });

    logger.info(`[TrainingData] Added training data ${record._id} for merchant ${merchantId}`);
    return record;
  }

  async updateTrainingData(id: string, updates: Partial<TrainingDataInput>) {
    const record = await TrainingData.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );
    return record;
  }

  async getTrainingData(id: string) {
    return TrainingData.findById(id);
  }

  async listTrainingData(
    merchantId: string,
    options: {
      type?: TrainingDataType;
      enabled?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { type, enabled, page = 1, limit = 50 } = options;

    const filter: Record<string, unknown> = { merchantId };
    if (type) filter.type = type;
    if (enabled !== undefined) filter.enabled = enabled;

    const [data, total] = await Promise.all([
      TrainingData.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      TrainingData.countDocuments(filter),
    ]);

    return { data, total };
  }

  async deleteTrainingData(id: string): Promise<boolean> {
    const result = await TrainingData.findByIdAndDelete(id);
    return !!result;
  }

  async bulkDelete(merchantId: string, ids: string[]): Promise<number> {
    const result = await TrainingData.deleteMany({
      _id: { $in: ids },
      merchantId,
    });
    return result.deletedCount || 0;
  }

  async importBatch(merchantId: string, records: TrainingDataInput[]): Promise<BatchImportResult> {
    const result: BatchImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    for (const record of records) {
      try {
        const duplicate = await TrainingData.findOne({
          merchantId,
          question: { $regex: new RegExp(`^${record.question}$`, 'i') },
        });

        if (duplicate) {
          result.skipped++;
          continue;
        }

        await TrainingData.create({
          merchantId,
          ...record,
          enabled: record.enabled ?? true,
          usageCount: 0,
        });
        result.imported++;
      } catch (error) {
        logger.error('[TrainingData] Failed to import record', { question: record.question, error });
        result.errors.push(`Failed to import: ${record.question}`);
      }
    }

    return result;
  }

  async startTrainingJob(
    merchantId: string,
    agentId: string,
    dataTypes?: TrainingDataType[]
  ): Promise<TrainingJobType> {
    const jobId = `job_${uuidv4()}`;

    const filter: Record<string, unknown> = { merchantId, enabled: true };
    if (dataTypes && dataTypes.length > 0) {
      filter.type = { $in: dataTypes };
    }

    const totalSamples = await TrainingData.countDocuments(filter);

    const job = await TrainingJob.create({
      _id: jobId,
      merchantId,
      agentId,
      status: 'queued',
      progress: 0,
      samplesProcessed: 0,
      totalSamples,
    });

    logger.info(`[TrainingData] Started training job ${jobId} with ${totalSamples} samples`);

    this.processTrainingAsync(jobId).catch(err => {
      logger.error(`[TrainingData] Background training job ${jobId} failed to start`, { error: err });
    });

    return {
      id: job._id.toString(),
      merchantId: job.merchantId,
      agentId: job.agentId,
      status: job.status,
      progress: job.progress,
      samplesProcessed: job.samplesProcessed,
      totalSamples: job.totalSamples,
      createdAt: job.createdAt,
    };
  }

  async getTrainingJob(jobId: string): Promise<TrainingJobType | null> {
    const job = await TrainingJob.findById(jobId);
    if (!job) return null;

    return {
      id: job._id.toString(),
      merchantId: job.merchantId,
      agentId: job.agentId,
      status: job.status,
      progress: job.progress,
      samplesProcessed: job.samplesProcessed,
      totalSamples: job.totalSamples,
      error: job.error,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
    };
  }

  async listTrainingJobs(merchantId: string): Promise<TrainingJobType[]> {
    const jobs = await TrainingJob.find({ merchantId })
      .sort({ createdAt: -1 })
      .limit(50);

    return jobs.map(job => ({
      id: job._id.toString(),
      merchantId: job.merchantId,
      agentId: job.agentId,
      status: job.status,
      progress: job.progress,
      samplesProcessed: job.samplesProcessed,
      totalSamples: job.totalSamples,
      error: job.error,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
    }));
  }

  async getKnowledgeBaseStats(merchantId: string) {
    const records = await TrainingData.find({ merchantId });

    const byType: Record<string, number> = {};
    for (const typeKey of Object.keys(TrainingDataType)) {
      const type = TrainingDataType[typeKey as keyof typeof TrainingDataType];
      byType[type] = records.filter(r => r.type === type).length;
    }

    const totalUsage = records.reduce((sum, r) => sum + r.usageCount, 0);

    return {
      totalItems: records.length,
      byType,
      enabledItems: records.filter(r => r.enabled).length,
      avgUsage: records.length > 0 ? totalUsage / records.length : 0,
    };
  }

  private async processTrainingAsync(jobId: string): Promise<void> {
    const job = await TrainingJob.findById(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      job.startedAt = new Date();
      await job.save();

      const totalSamples = job.totalSamples;
      let processed = 0;

      const batchSize = 10;
      while (processed < totalSamples) {
        processed = Math.min(processed + batchSize, totalSamples);
        job.samplesProcessed = processed;
        job.progress = Math.round((processed / totalSamples) * 100);
        await job.save();

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      job.status = 'completed';
      job.completedAt = new Date();
      await job.save();

      logger.info(`[TrainingData] Training job ${jobId} completed`);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      await job.save();
      logger.error(`[TrainingData] Training job ${jobId} failed`, { error });
    }
  }
}

export const trainingDataService = new TrainingDataService();
export default trainingDataService;
