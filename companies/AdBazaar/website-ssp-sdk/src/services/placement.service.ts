import { PlacementModel, IPlacement } from '../models/index.js';
import { CreatePlacementRequest, Placement } from '../types/index.js';
import { generatePlacementId, createLogger } from '../utils/index.js';
import { config } from '../config/index.js';

const logger = createLogger('PlacementService');

export class PlacementService {
  async createPlacement(data: CreatePlacementRequest): Promise<IPlacement> {
    logger.info(`Creating placement: ${data.name} for publisher: ${data.publisherId}`);

    const placementId = generatePlacementId();

    const placement = new PlacementModel({
      placementId,
      publisherId: data.publisherId,
      name: data.name,
      pageUrl: data.pageUrl,
      adFormats: data.adFormats as Placement['adFormats'],
      size: data.size,
      position: data.position as Placement['position'],
      minCPM: data.minCPM || config.sdk.defaultMinCPM,
      status: 'active',
    });

    await placement.save();
    logger.info(`Placement created: ${placementId}`);

    return placement;
  }

  async getPlacementById(placementId: string): Promise<IPlacement | null> {
    logger.debug(`Getting placement: ${placementId}`);
    return PlacementModel.findOne({ placementId });
  }

  async getPlacementsByPublisher(publisherId: string): Promise<IPlacement[]> {
    logger.debug(`Getting placements for publisher: ${publisherId}`);
    return PlacementModel.find({ publisherId }).sort({ createdAt: -1 });
  }

  async updatePlacement(placementId: string, updates: Partial<Placement>): Promise<IPlacement | null> {
    logger.info(`Updating placement: ${placementId}`);

    const placement = await PlacementModel.findOneAndUpdate(
      { placementId },
      { $set: updates },
      { new: true }
    );

    if (placement) {
      logger.info(`Placement updated: ${placementId}`);
    }

    return placement;
  }

  async updatePlacementStatus(placementId: string, status: 'active' | 'paused' | 'archived'): Promise<IPlacement | null> {
    logger.info(`Updating placement status: ${placementId} -> ${status}`);

    return PlacementModel.findOneAndUpdate(
      { placementId },
      { $set: { status } },
      { new: true }
    );
  }

  async getPlacementConfig(placementId: string): Promise<{
    placementId: string;
    adFormats: string[];
    size: { width: number; height: number };
    position: string;
    minCPM: number;
    status: string;
  } | null> {
    logger.debug(`Getting placement config: ${placementId}`);

    const placement = await PlacementModel.findOne({ placementId });
    if (!placement) {
      return null;
    }

    return {
      placementId: placement.placementId,
      adFormats: placement.adFormats,
      size: placement.size,
      position: placement.position,
      minCPM: placement.minCPM,
      status: placement.status,
    };
  }

  async deletePlacement(placementId: string): Promise<boolean> {
    logger.info(`Deleting placement: ${placementId}`);

    const result = await PlacementModel.deleteOne({ placementId });
    return result.deletedCount > 0;
  }
}

export const placementService = new PlacementService();