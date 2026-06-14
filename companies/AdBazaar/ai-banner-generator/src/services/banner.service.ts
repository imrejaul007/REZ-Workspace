/**
 * Banner Generation Service
 * Handles AI-powered banner generation
 */

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import config from '../config';
import logger from '../utils/logger';
import { BannerGenerationModel } from '../models';
import { redisService } from './redis.service';
import {
  BannerGenerationRequest,
  BannerGeneration,
  BannerOutput,
  BannerMetadata,
  BannerVariant,
} from '../types';

class BannerGenerationService {
  /**
   * Generate a new banner from description
   */
  async generateBanner(
    advertiserId: string,
    request: BannerGenerationRequest
  ): Promise<BannerGeneration> {
    const generationId = `gen-${uuidv4().slice(0, 12)}`;
    const startTime = Date.now();

    // Create generation record with processing status
    const generation = new BannerGenerationModel({
      generationId,
      advertiserId,
      request,
      status: 'processing',
    });

    await generation.save();

    // Cache the processing state
    await redisService.cacheGeneration(generationId, { status: 'processing' });

    try {
      // Generate the banner (simulated AI generation)
      const output = await this.performGeneration(generationId, request);

      // Calculate generation time
      const generationTime = Date.now() - startTime;

      // Update with result
      const metadata: BannerMetadata = {
        generationTime,
        model: 'gpt-image-v2',
        confidence: 0.92,
      };

      await BannerGenerationModel.findOneAndUpdate(
        { generationId },
        {
          output,
          metadata,
          status: 'completed',
        }
      );

      // Update cache
      await redisService.cacheGeneration(generationId, {
        status: 'completed',
        output,
        metadata,
      });

      logger.info('Banner generated successfully', { generationId, generationTime });

      return {
        generationId,
        advertiserId,
        request,
        output,
        metadata,
        status: 'completed',
        createdAt: generation.createdAt,
        updatedAt: new Date(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await BannerGenerationModel.findOneAndUpdate(
        { generationId },
        {
          status: 'failed',
          error: errorMessage,
        }
      );

      await redisService.invalidateGenerationCache(generationId);

      logger.error('Banner generation failed', { generationId, error: errorMessage });
      throw error;
    }
  }

  /**
   * Generate multiple variants of a banner
   */
  async generateVariants(
    advertiserId: string,
    baseGenerationId: string,
    options: {
      count?: number;
      variations?: { style?: string; colors?: string[] }[];
    } = {}
  ): Promise<BannerGeneration[]> {
    const baseGeneration = await BannerGenerationModel.findOne({ generationId: baseGenerationId });

    if (!baseGeneration) {
      throw new Error('Base generation not found');
    }

    if (baseGeneration.status !== 'completed') {
      throw new Error('Base generation not completed');
    }

    const count = options.count || 3;
    const variants: BannerGeneration[] = [];

    for (let i = 0; i < count; i++) {
      const variation = options.variations?.[i] || {};
      const variantRequest: BannerGenerationRequest = {
        ...baseGeneration.request,
        style: (variation.style as BannerGenerationRequest['style']) || baseGeneration.request.style,
        colors: variation.colors || baseGeneration.request.colors,
      };

      const variant = await this.generateBanner(advertiserId, variantRequest);
      variants.push(variant);
    }

    return variants;
  }

  /**
   * Regenerate a banner with changes
   */
  async regenerateBanner(
    generationId: string,
    advertiserId: string,
    changes: Partial<BannerGenerationRequest> = {}
  ): Promise<BannerGeneration> {
    const existing = await BannerGenerationModel.findOne({ generationId });

    if (!existing) {
      throw new Error('Generation not found');
    }

    if (existing.advertiserId !== advertiserId) {
      throw new Error('Unauthorized');
    }

    const updatedRequest: BannerGenerationRequest = {
      ...existing.request,
      ...changes,
    };

    return this.generateBanner(advertiserId, updatedRequest);
  }

  /**
   * Get banner generation by ID
   */
  async getGeneration(generationId: string): Promise<BannerGeneration | null> {
    // Check cache first
    const cached = await redisService.getCachedGeneration(generationId);
    if (cached) {
      return cached as BannerGeneration;
    }

    const generation = await BannerGenerationModel.findOne({ generationId });
    if (generation) {
      const result: BannerGeneration = {
        generationId: generation.generationId,
        advertiserId: generation.advertiserId,
        request: generation.request,
        output: generation.output,
        metadata: generation.metadata,
        status: generation.status,
        error: generation.error,
        createdAt: generation.createdAt,
        updatedAt: generation.updatedAt,
      };

      // Cache if completed
      if (generation.status === 'completed') {
        await redisService.cacheGeneration(generationId, result);
      }

      return result;
    }

    return null;
  }

  /**
   * Get generations by advertiser
   */
  async getGenerationsByAdvertiser(
    advertiserId: string,
    options: { page?: number; limit?: number; status?: string } = {}
  ): Promise<{ data: BannerGeneration[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const query: Record<string, unknown> = { advertiserId };

    if (options.status) {
      query.status = options.status;
    }

    const [generations, total] = await Promise.all([
      BannerGenerationModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      BannerGenerationModel.countDocuments(query),
    ]);

    return {
      data: generations.map((g) => ({
        generationId: g.generationId,
        advertiserId: g.advertiserId,
        request: g.request,
        output: g.output,
        metadata: g.metadata,
        status: g.status,
        error: g.error,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      })),
      total,
    };
  }

  /**
   * Get generation statistics
   */
  async getStatistics(advertiserId?: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    processing: number;
    avgGenerationTime: number;
  }> {
    const query: Record<string, unknown> = {};
    if (advertiserId) query.advertiserId = advertiserId;

    const stats = await BannerGenerationModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgTime: { $avg: '$metadata.generationTime' },
        },
      },
    ]);

    const result = {
      total: 0,
      completed: 0,
      failed: 0,
      processing: 0,
      avgGenerationTime: 0,
    };

    for (const stat of stats) {
      result.total += stat.count;
      if (stat._id === 'completed') result.completed = stat.count;
      else if (stat._id === 'failed') result.failed = stat.count;
      else if (stat._id === 'processing') result.processing = stat.count;

      if (stat.avgTime) {
        result.avgGenerationTime = Math.round(stat.avgTime);
      }
    }

    return result;
  }

  /**
   * Perform the actual AI generation (simulated)
   */
  private async performGeneration(
    generationId: string,
    request: BannerGenerationRequest
  ): Promise<BannerOutput> {
    // In production, this would call OpenAI/DALL-E or similar
    const startTime = Date.now();

    if (config.OPENAI_ENABLED && config.OPENAI_API_KEY) {
      // Real implementation would go here
      // For now, simulate generation
      await this.simulateGenerationDelay();
    } else {
      // Simulate generation without API
      await this.simulateGenerationDelay();
    }

    // Generate variants based on standard sizes
    const variants = this.generateVariantsForSizes(
      request.dimensions,
      request.format
    );

    const { width, height } = request.dimensions;
    const format = request.format === 'video' ? 'mp4' :
                   request.format === 'animated' ? 'gif' : 'png';

    const imageUrl = `${config.IMAGE_CDN_URL}${config.IMAGE_CDN_UPLOAD_PATH}/${generationId}.${format}`;
    const thumbnailUrl = `${config.IMAGE_CDN_URL}${config.IMAGE_CDN_UPLOAD_PATH}/${generationId}_thumb.jpg`;

    return {
      imageUrl,
      thumbnailUrl,
      format: format as BannerOutput['format'],
      size: Math.round((width * height * 3) / 10), // Simulated size
      dimensions: request.dimensions,
      variants,
    };
  }

  /**
   * Generate variants for standard banner sizes
   */
  private generateVariantsForSizes(
    originalDimensions: { width: number; height: number },
    format: 'static' | 'animated' | 'video'
  ): BannerVariant[] {
    const variants: BannerVariant[] = [];
    const sizes = Object.entries(config.BANNER_SIZES);

    // Limit to 4 variants
    const selectedSizes = sizes.slice(0, 4);

    for (const [sizeName, dimensions] of selectedSizes) {
      if (dimensions.width === originalDimensions.width &&
          dimensions.height === originalDimensions.height) {
        continue; // Skip original size
      }

      variants.push({
        size: sizeName,
        imageUrl: `${config.IMAGE_CDN_URL}${config.IMAGE_CDN_UPLOAD_PATH}/${sizeName}.png`,
      });
    }

    return variants;
  }

  /**
   * Simulate generation delay
   */
  private async simulateGenerationDelay(): Promise<void> {
    // Random delay between 500ms and 2s
    const delay = Math.random() * 1500 + 500;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Predict performance based on banner characteristics
   */
  async predictPerformance(generationId: string): Promise<{
    predictedCTR: number;
    predictedConversion: number;
    confidence: number;
  }> {
    const generation = await this.getGeneration(generationId);

    if (!generation || generation.status !== 'completed') {
      throw new Error('Generation not found or not completed');
    }

    // Simple prediction model based on format and style
    let baseCTR = 0.02;
    let baseConversion = 0.03;

    const { format, style } = generation.request;

    // Format adjustments
    if (format === 'animated') {
      baseCTR *= 1.5;
      baseConversion *= 1.3;
    } else if (format === 'video') {
      baseCTR *= 2.0;
      baseConversion *= 1.5;
    }

    // Style adjustments
    switch (style) {
      case 'bold':
        baseCTR *= 1.2;
        break;
      case 'modern':
        baseCTR *= 1.15;
        break;
      case 'minimal':
        baseCTR *= 0.9;
        break;
    }

    return {
      predictedCTR: Math.round(baseCTR * 10000) / 10000,
      predictedConversion: Math.round(baseConversion * 10000) / 10000,
      confidence: generation.metadata?.confidence || 0.85,
    };
  }
}

export const bannerGenerationService = new BannerGenerationService();
export default bannerGenerationService;