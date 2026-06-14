import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ActivationJob, MatchJob } from '../models';
import { ActivationRequest, ActivationResult, ActivationTarget } from '../types';
import { config } from '../config';
import logger from '../config/logger';

export class ActivationService {
  private readonly dspEndpoints: Record<string, string>;
  private readonly sspEndpoints: Record<string, string>;

  constructor() {
    // DSP endpoints (Google, Meta, Trade Desk, etc.)
    this.dspEndpoints = {
      google: 'https://audience.googleapis.com/v1/audiences',
      meta: 'https://graph.facebook.com/v18.0/act_{account_id}/customaudiences',
      trade_desk: 'https://api.thetradedesk.com/v3/audience/segment',
    };

    // SSP endpoints
    this.sspEndpoints = {
      pubmatic: 'https://api.pubmatic.com/v1/audience',
      appnexus: 'https://api.appnexus.com/auditorium/audience',
      openx: 'https://api.openx.net/v1/audiences',
    };
  }

  /**
   * Activate matched audience to target platform
   */
  async activateAudience(request: ActivationRequest): Promise<ActivationResult> {
    const activationId = uuidv4();

    logger.info('Starting audience activation', {
      activationId,
      matchId: request.matchId,
      target: request.target,
    });

    try {
      // Get match job to verify it exists and get details
      const matchJob = await MatchJob.findOne({ matchId: request.matchId });
      if (!matchJob) {
        throw new Error(`Match job not found: ${request.matchId}`);
      }

      // Create activation job
      const activationJob = new ActivationJob({
        activationId,
        matchId: request.matchId,
        brandId: matchJob.brandId,
        target: request.target,
        targetConfig: request.targetConfig,
        options: {
          includeMetadata: request.options?.includeMetadata ?? false,
          createLookalikes: request.options?.createLookalikes ?? false,
          lookalikeSize: request.options?.lookalikeSize ?? 10,
        },
        status: 'processing',
      });
      await activationJob.save();

      // Activate based on target
      let result: ActivationResult;

      switch (request.target) {
        case 'dsp':
          result = await this.activateToDSP(request, matchJob.matchedRecords);
          break;

        case 'ssp':
          result = await this.activateToSSP(request, matchJob.matchedRecords);
          break;

        case 'dmp':
          result = await this.activateToDMP(request, matchJob.matchedRecords);
          break;

        case 'lookalike':
          result = await this.createLookalikeAudience(request, matchJob.matchedRecords);
          break;

        case 'custom':
          result = await this.activateToCustom(request, matchJob.matchedRecords);
          break;

        default:
          throw new Error(`Unsupported target: ${request.target}`);
      }

      // Update activation job
      activationJob.status = result.status;
      activationJob.recordsActivated = result.recordsActivated;
      activationJob.targetAudienceId = result.targetAudienceId;
      activationJob.targetResponse = result.targetResponse;
      activationJob.completedAt = new Date();
      await activationJob.save();

      logger.info('Audience activation completed', {
        activationId,
        matchId: request.matchId,
        recordsActivated: result.recordsActivated,
        targetAudienceId: result.targetAudienceId,
      });

      return result;
    } catch (error) {
      logger.error('Audience activation failed', {
        activationId,
        matchId: request.matchId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Update job status to failed
      await ActivationJob.findOneAndUpdate(
        { activationId },
        {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      throw error;
    }
  }

  /**
   * Activate to DSP (Google, Meta, Trade Desk)
   */
  private async activateToDSP(
    request: ActivationRequest,
    matchedRecords: number
  ): Promise<ActivationResult> {
    const platform = request.targetConfig.platform || 'google';
    const endpoint = this.dspEndpoints[platform];

    if (!endpoint) {
      throw new Error(`Unsupported DSP platform: ${platform}`);
    }

    try {
      // Simulate DSP API call
      const response = await this.callExternalAPI(endpoint, {
        audienceName: request.targetConfig.audienceName || 'REZ_Audience',
        estimatedReach: matchedRecords,
        dataSource: 'clean_room',
      });

      return {
        activationId: uuidv4(),
        matchId: request.matchId,
        target: 'dsp',
        status: 'completed',
        recordsActivated: matchedRecords,
        targetAudienceId: response.audienceId || `dsp_${Date.now()}`,
        targetResponse: response,
        createdAt: new Date(),
        completedAt: new Date(),
      };
    } catch (error) {
      logger.error('DSP activation failed', { platform, error });
      throw error;
    }
  }

  /**
   * Activate to SSP
   */
  private async activateToSSP(
    request: ActivationRequest,
    matchedRecords: number
  ): Promise<ActivationResult> {
    const platform = request.targetConfig.platform || 'pubmatic';
    const endpoint = this.sspEndpoints[platform];

    if (!endpoint) {
      throw new Error(`Unsupported SSP platform: ${platform}`);
    }

    try {
      const response = await this.callExternalAPI(endpoint, {
        segmentName: request.targetConfig.audienceName || 'REZ_Segment',
        audienceSize: matchedRecords,
      });

      return {
        activationId: uuidv4(),
        matchId: request.matchId,
        target: 'ssp',
        status: 'completed',
        recordsActivated: matchedRecords,
        targetAudienceId: response.segmentId || `ssp_${Date.now()}`,
        targetResponse: response,
        createdAt: new Date(),
        completedAt: new Date(),
      };
    } catch (error) {
      logger.error('SSP activation failed', { platform, error });
      throw error;
    }
  }

  /**
   * Activate to DMP
   */
  private async activateToDMP(
    request: ActivationRequest,
    matchedRecords: number
  ): Promise<ActivationResult> {
    // Simulate DMP activation
    logger.info('DMP activation simulated', {
      matchId: request.matchId,
      matchedRecords,
    });

    return {
      activationId: uuidv4(),
      matchId: request.matchId,
      target: 'dmp',
      status: 'completed',
      recordsActivated: matchedRecords,
      targetAudienceId: `dmp_${Date.now()}`,
      targetResponse: {
        platform: 'dmp',
        activated: true,
        estimatedReach: matchedRecords,
      },
      createdAt: new Date(),
      completedAt: new Date(),
    };
  }

  /**
   * Create lookalike audience
   */
  private async createLookalikeAudience(
    request: ActivationRequest,
    matchedRecords: number
  ): Promise<ActivationResult> {
    const lookalikeSize = request.options?.lookalikeSize || 10;
    const estimatedLookalikes = Math.floor(matchedRecords * (lookalikeSize / 100) * 1000);

    logger.info('Creating lookalike audience', {
      matchId: request.matchId,
      matchedRecords,
      lookalikeSize,
      estimatedLookalikes,
    });

    return {
      activationId: uuidv4(),
      matchId: request.matchId,
      target: 'lookalike',
      status: 'completed',
      recordsActivated: estimatedLookalikes,
      targetAudienceId: `lookalike_${Date.now()}`,
      targetResponse: {
        lookalikeSize: `${lookalikeSize}%`,
        estimatedReach: estimatedLookalikes,
        sourceRecords: matchedRecords,
        similarityThreshold: 0.85,
      },
      createdAt: new Date(),
      completedAt: new Date(),
    };
  }

  /**
   * Activate to custom endpoint
   */
  private async activateToCustom(
    request: ActivationRequest,
    matchedRecords: number
  ): Promise<ActivationResult> {
    const customEndpoint = request.targetConfig.customEndpoint;

    if (!customEndpoint) {
      throw new Error('Custom endpoint not specified');
    }

    try {
      const response = await this.callExternalAPI(customEndpoint, {
        audienceName: request.targetConfig.audienceName || 'REZ_Audience',
        records: matchedRecords,
      });

      return {
        activationId: uuidv4(),
        matchId: request.matchId,
        target: 'custom',
        status: 'completed',
        recordsActivated: matchedRecords,
        targetAudienceId: response.id || `custom_${Date.now()}`,
        targetResponse: response,
        createdAt: new Date(),
        completedAt: new Date(),
      };
    } catch (error) {
      logger.error('Custom activation failed', { error });
      throw error;
    }
  }

  /**
   * Call external API with proper headers
   */
  private async callExternalAPI(
    endpoint: string,
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // In production, this would make actual API calls
    // For now, simulate successful response
    logger.debug('Calling external API', { endpoint, payload });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      audienceId: `audience_${Date.now()}`,
      endpoint,
      ...payload,
      activatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get activation by ID
   */
  async getActivation(activationId: string): Promise<IActivationJob | null> {
    return ActivationJob.findOne({ activationId });
  }

  /**
   * Get activations by match ID
   */
  async getActivationsByMatch(matchId: string): Promise<IActivationJob[]> {
    return ActivationJob.find({ matchId }).sort({ createdAt: -1 });
  }

  /**
   * Get activations by brand
   */
  async getActivationsByBrand(brandId: string, limit = 50): Promise<IActivationJob[]> {
    return ActivationJob.find({ brandId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export interface IActivationJob extends Document {
  activationId: string;
  matchId: string;
  brandId: string;
  target: ActivationTarget;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  recordsActivated: number;
  createdAt: Date;
  completedAt?: Date;
}

import { Document } from 'mongoose';

export const activationService = new ActivationService();