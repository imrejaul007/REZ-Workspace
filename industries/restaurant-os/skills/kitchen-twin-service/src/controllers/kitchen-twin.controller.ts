import { Request, Response } from 'express';
import { kitchenTwinService } from '../services/kitchen-twin.service';
import { logger } from '../utils/logger';
import {
  CreateKitchenTwinRequest,
  UpdateStationRequest,
  AssignOrderToStationRequest,
  BumpOrderFromStationRequest
} from '../schemas/kitchen-twin.schema';

export class KitchenTwinController {
  async createKitchenTwin(req: Request, res: Response): Promise<void> {
    try {
      const request: CreateKitchenTwinRequest = req.body;

      if (!request.restaurantId || !request.name) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required fields: restaurantId, name' }
        });
        return;
      }

      const result = await kitchenTwinService.createKitchenTwin(request);

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating Kitchen Twin', { error: (error as Error).message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } });
    }
  }

  async getKitchenTwin(req: Request, res: Response): Promise<void> {
    try {
      const { kitchenId } = req.params;

      if (!kitchenId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'kitchenId is required' }
        });
        return;
      }

      const result = await kitchenTwinService.getKitchenTwin(kitchenId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
        return;
      }
      logger.error('Error fetching Kitchen Twin', { error: message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async updateStation(req: Request, res: Response): Promise<void> {
    try {
      const { kitchenId } = req.params;
      const request: UpdateStationRequest = req.body;

      if (!kitchenId || !request.stationId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required fields: kitchenId, stationId' }
        });
        return;
      }

      const result = await kitchenTwinService.updateStation(kitchenId, request);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
        return;
      }
      logger.error('Error updating station', { error: message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async assignOrderToStation(req: Request, res: Response): Promise<void> {
    try {
      const { kitchenId } = req.params;
      const request: AssignOrderToStationRequest = req.body;

      if (!kitchenId || !request.stationId || !request.orderId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required fields: kitchenId, stationId, orderId' }
        });
        return;
      }

      const result = await kitchenTwinService.assignOrderToStation(kitchenId, request);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
        return;
      }
      logger.error('Error assigning order to station', { error: message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async bumpOrderFromStation(req: Request, res: Response): Promise<void> {
    try {
      const { kitchenId } = req.params;
      const request: BumpOrderFromStationRequest = req.body;

      if (!kitchenId || !request.stationId || !request.orderId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required fields: kitchenId, stationId, orderId' }
        });
        return;
      }

      await kitchenTwinService.bumpOrderFromStation(kitchenId, request);
      res.status(200).json({ success: true, message: 'Order bumped successfully' });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
        return;
      }
      logger.error('Error bumping order from station', { error: message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async getStationPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { kitchenId } = req.params;

      if (!kitchenId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'kitchenId is required' }
        });
        return;
      }

      const result = await kitchenTwinService.getStationPerformance(kitchenId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
        return;
      }
      logger.error('Error getting station performance', { error: message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async getKitchenAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { kitchenId } = req.params;

      if (!kitchenId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'kitchenId is required' }
        });
        return;
      }

      const result = await kitchenTwinService.getKitchenAnalytics(kitchenId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
        return;
      }
      logger.error('Error getting kitchen analytics', { error: message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async deleteKitchenTwin(req: Request, res: Response): Promise<void> {
    try {
      const { kitchenId } = req.params;

      if (!kitchenId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'kitchenId is required' }
        });
        return;
      }

      await kitchenTwinService.deleteKitchenTwin(kitchenId);
      res.status(200).json({ success: true, message: 'Kitchen Twin deleted successfully' });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
        return;
      }
      logger.error('Error deleting Kitchen Twin', { error: message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }
}

export const kitchenTwinController = new KitchenTwinController();