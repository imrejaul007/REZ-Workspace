import { Request, Response } from 'express';
import { loyaltyTwinService } from '../services/loyalty-twin.service';
import { logger } from '../utils/logger';

export class LoyaltyTwinController {
  async createLoyaltyTwin(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, merchantId } = req.body;
      if (!customerId || !merchantId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      const result = await loyaltyTwinService.createLoyaltyTwin({ customerId, merchantId });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating Loyalty Twin', { error: (error as Error).message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } });
    }
  }

  async earnPoints(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, points, orderId, description } = req.body;
      if (!customerId || points === undefined) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      const result = await loyaltyTwinService.earnPoints({ customerId, points, orderId, description });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }

  async redeemPoints(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, points, rewardId, description } = req.body;
      if (!customerId || points === undefined) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      const result = await loyaltyTwinService.redeemPoints({ customerId, points, rewardId, description });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('Insufficient')) {
        res.status(400).json({ success: false, error: { code: 'INSUFFICIENT_POINTS', message } });
        return;
      }
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }

  async getLoyaltyStatus(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      if (!customerId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'customerId is required' } });
        return;
      }
      const result = await loyaltyTwinService.getLoyaltyStatus(customerId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }

  async deleteLoyaltyTwin(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      if (!customerId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'customerId is required' } });
        return;
      }
      await loyaltyTwinService.deleteLoyaltyTwin(customerId);
      res.status(200).json({ success: true, message: 'Loyalty Twin deleted successfully' });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }
}

export const loyaltyTwinController = new LoyaltyTwinController();