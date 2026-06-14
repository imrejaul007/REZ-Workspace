import { v4 as uuidv4 } from 'uuid';
import { NLCampaignBuildModel, NLCampaignBuildDocument } from '../models/campaign-build.model';
import { nlpParserService } from './nlp-parser.service';
import { campaignGeneratorService } from './campaign-generator.service';
import { redis } from '../config/redis';
import { logger } from 'utils/logger.js';
import {
  NLCampaignBuild,
  BuildStatus,
  BuildCampaignRequest,
  GeneratedCampaign,
  ParsedIntent
} from '../types';

export interface BuildResult {
  buildId: string;
  success: boolean;
  campaign?: GeneratedCampaign;
  parsed?: ParsedIntent;
  confidence: number;
  suggestions: string[];
  warnings: string[];
  errors?: string[];
  processingTime?: number;
}

export class CampaignBuilderService {
  async build(request: BuildCampaignRequest): Promise<BuildResult> {
    const startTime = Date.now();
    const buildId = uuidv4();

    try {
      logger.info(`Starting campaign build ${buildId}`, {
        advertiserId: request.advertiserId,
        textLength: request.naturalLanguage.length
      });

      // Create initial build record
      const build = await this.createInitialBuild(buildId, request);

      // Phase 1: Parse natural language
      await this.updateBuildStatus(buildId, 'parsing');

      const { parsed, confidence: parseConfidence, warnings: parseWarnings } = await nlpParserService.parse(
        request.naturalLanguage,
        request.context
      );

      logger.info(`Parsing completed for ${buildId}`, { confidence: parseConfidence });

      // Phase 2: Generate campaign
      await this.updateBuildStatus(buildId, 'generating');

      const { campaign, suggestions, warnings } = await campaignGeneratorService.generate(
        parsed,
        request.advertiserId
      );

      // Calculate overall confidence
      const overallConfidence = (parseConfidence + this.calculateCampaignConfidence(campaign)) / 2;

      // Save completed build
      await this.saveCompletedBuild(buildId, {
        parsed,
        generatedCampaign: campaign,
        confidence: overallConfidence,
        suggestions: [...suggestions, ...warnings],
        warnings: parseWarnings,
        metadata: {
          processingTime: Date.now() - startTime
        }
      });

      // Cache the result
      await this.cacheBuildResult(buildId, campaign);

      const processingTime = Date.now() - startTime;

      logger.info(`Campaign build completed ${buildId}`, {
        confidence: overallConfidence,
        processingTime
      });

      return {
        buildId,
        success: true,
        campaign,
        parsed,
        confidence: overallConfidence,
        suggestions,
        warnings: [...warnings, ...parseWarnings],
        processingTime
      };

    } catch (error) {
      logger.error(`Campaign build failed ${buildId}:`, error);

      // Save failed build
      await this.saveFailedBuild(buildId, request, error as Error);

      return {
        buildId,
        success: false,
        confidence: 0,
        suggestions: [],
        errors: [(error as Error).message],
        processingTime: Date.now() - startTime
      };
    }
  }

  async getBuild(buildId: string, advertiserId?: string): Promise<NLCampaignBuild | null> {
    // Try cache first
    const cached = await redis.getCache<NLCampaignBuild>(`build:${buildId}`);
    if (cached) {
      return cached;
    }

    // Query database
    const query: Record<string, string> = { buildId };
    if (advertiserId) {
      query.advertiserId = advertiserId;
    }

    const build = await NLCampaignBuildModel.findOne(query).exec();
    if (build) {
      // Cache for future requests
      await redis.setCache(`build:${buildId}`, build.toObject(), 3600);
    }

    return build?.toObject() || null;
  }

  async getCampaign(buildId: string, advertiserId?: string): Promise<GeneratedCampaign | null> {
    const build = await this.getBuild(buildId, advertiserId);
    return build?.generatedCampaign || null;
  }

  async validate(campaign: Partial<GeneratedCampaign>, strict = false): Promise<{
    valid: boolean;
    errors: Array<{ field: string; message: string; severity: 'error' | 'warning'; suggestion?: string }>;
    warnings: Array<{ field: string; message: string; severity: 'error' | 'warning'; suggestion?: string }>;
    score: number;
  }> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning'; suggestion?: string }> = [];
    const warnings: Array<{ field: string; message: string; severity: 'error' | 'warning'; suggestion?: string }> = [];

    // Validate required fields
    if (!campaign.name) {
      errors.push({ field: 'name', message: 'Campaign name is required', severity: 'error' });
    }

    if (!campaign.objective) {
      errors.push({ field: 'objective', message: 'Campaign objective is required', severity: 'error' });
    }

    if (!campaign.budget) {
      errors.push({ field: 'budget', message: 'Budget is required', severity: 'error' });
    } else if (campaign.budget.amount < 1000) {
      warnings.push({
        field: 'budget.amount',
        message: 'Budget is below recommended minimum of ₹1,000',
        severity: 'warning',
        suggestion: 'Consider increasing budget for better campaign performance'
      });
    }

    if (!campaign.targeting) {
      errors.push({ field: 'targeting', message: 'Targeting configuration is required', severity: 'error' });
    } else if (!campaign.targeting.locations || campaign.targeting.locations.length === 0) {
      errors.push({
        field: 'targeting.locations',
        message: 'At least one location is required',
        severity: 'error'
      });
    }

    if (!campaign.ads || campaign.ads.length === 0) {
      errors.push({ field: 'ads', message: 'At least one ad is required', severity: 'error' });
    } else {
      campaign.ads.forEach((ad, index) => {
        if (!ad.headline) {
          errors.push({
            field: `ads[${index}].headline`,
            message: `Ad ${index + 1} headline is required`,
            severity: 'error'
          });
        }
        if (!ad.callToAction) {
          errors.push({
            field: `ads[${index}].callToAction`,
            message: `Ad ${index + 1} call to action is required`,
            severity: 'error'
          });
        }
      });
    }

    if (!campaign.schedule) {
      errors.push({ field: 'schedule', message: 'Schedule is required', severity: 'error' });
    } else if (!campaign.schedule.startDate) {
      errors.push({
        field: 'schedule.startDate',
        message: 'Start date is required',
        severity: 'error'
      });
    }

    if (!campaign.bidStrategy) {
      errors.push({ field: 'bidStrategy', message: 'Bid strategy is required', severity: 'error' });
    }

    // Strict mode checks
    if (strict) {
      if (!campaign.tracking?.pixelIds || campaign.tracking.pixelIds.length === 0) {
        warnings.push({
          field: 'tracking.pixelIds',
          message: 'No tracking pixels configured',
          severity: 'warning',
          suggestion: 'Add tracking pixels for better conversion measurement'
        });
      }

      if (!campaign.optimization) {
        warnings.push({
          field: 'optimization',
          message: 'No optimization settings configured',
          severity: 'warning'
        });
      }
    }

    // Calculate validation score
    let score = 100;
    score -= errors.length * 20;
    score -= warnings.length * 5;

    const valid = errors.length === 0;

    return { valid, errors, warnings, score: Math.max(0, score) };
  }

  async adjust(buildId: string, feedback: string, changes?: Partial<GeneratedCampaign>): Promise<{
    success: boolean;
    updatedCampaign?: GeneratedCampaign;
    confidence: number;
    appliedChanges: string[];
  }> {
    const build = await NLCampaignBuildModel.findOne({ buildId }).exec();
    if (!build) {
      throw new Error(`Build ${buildId} not found`);
    }

    try {
      const { campaign, appliedChanges } = await campaignGeneratorService.adjust(
        build.generatedCampaign as GeneratedCampaign,
        feedback,
        changes
      );

      // Update the build
      build.generatedCampaign = campaign;
      build.suggestions = [...build.suggestions, ...appliedChanges];
      build.updatedAt = new Date();
      await build.save();

      // Update cache
      await redis.setCache(`build:${buildId}`, build.toObject(), 3600);

      const confidence = this.calculateCampaignConfidence(campaign);

      return {
        success: true,
        updatedCampaign: campaign,
        confidence,
        appliedChanges
      };

    } catch (error) {
      logger.error(`Failed to adjust campaign ${buildId}:`, error);
      throw error;
    }
  }

  async getBuildsByAdvertiser(advertiserId: string, limit = 20): Promise<NLCampaignBuild[]> {
    const builds = await NLCampaignBuildModel.findByAdvertiser(advertiserId, limit);
    return builds.map(b => b.toObject());
  }

  async getRecentBuilds(status?: BuildStatus, limit = 50): Promise<NLCampaignBuild[]> {
    const builds = await NLCampaignBuildModel.findRecentByStatus(status || 'completed', limit);
    return builds.map(b => b.toObject());
  }

  // Private helper methods
  private async createInitialBuild(buildId: string, request: BuildCampaignRequest): Promise<NLCampaignBuildDocument> {
    const build = new NLCampaignBuildModel({
      buildId,
      advertiserId: request.advertiserId,
      naturalLanguage: request.naturalLanguage,
      parsed: {
        goal: { type: 'awareness', target: 0 },
        audience: { location: [] },
        budget: { amount: 0, currency: 'INR' }
      },
      generatedCampaign: {} as any,
      confidence: 0,
      suggestions: [],
      status: 'parsing'
    });

    await build.save();
    return build;
  }

  private async updateBuildStatus(buildId: string, status: BuildStatus): Promise<void> {
    await NLCampaignBuildModel.findOneAndUpdate(
      { buildId },
      { status, updatedAt: new Date() }
    ).exec();
  }

  private async saveCompletedBuild(
    buildId: string,
    data: {
      parsed: ParsedIntent;
      generatedCampaign: GeneratedCampaign;
      confidence: number;
      suggestions: string[];
      warnings: string[];
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await NLCampaignBuildModel.findOneAndUpdate(
      { buildId },
      {
        status: 'completed',
        parsed: data.parsed,
        generatedCampaign: data.generatedCampaign,
        confidence: data.confidence,
        suggestions: data.suggestions,
        warnings: data.warnings,
        metadata: data.metadata,
        updatedAt: new Date()
      }
    ).exec();
  }

  private async saveFailedBuild(
    buildId: string,
    request: BuildCampaignRequest,
    error: Error
  ): Promise<void> {
    try {
      await NLCampaignBuildModel.findOneAndUpdate(
        { buildId },
        {
          status: 'failed',
          errors: [error.message],
          updatedAt: new Date()
        }
      ).exec();
    } catch (saveError) {
      logger.error(`Failed to save error state for ${buildId}:`, saveError);
    }
  }

  private async cacheBuildResult(buildId: string, campaign: GeneratedCampaign): Promise<void> {
    await redis.setCache(`campaign:${buildId}`, campaign, 3600);
  }

  private calculateCampaignConfidence(campaign: GeneratedCampaign): number {
    let confidence = 0.4;

    if (campaign.name) confidence += 0.1;
    if (campaign.objective) confidence += 0.1;
    if (campaign.budget?.amount > 0) confidence += 0.1;
    if (campaign.targeting?.locations?.length > 0) confidence += 0.1;
    if (campaign.ads?.length > 0) confidence += 0.1;
    if (campaign.schedule?.startDate) confidence += 0.05;
    if (campaign.bidStrategy) confidence += 0.05;

    return Math.min(0.95, confidence);
  }
}

export const campaignBuilderService = new CampaignBuilderService();
export default campaignBuilderService;