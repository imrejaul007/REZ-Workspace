import { Request, Response } from 'express';
import { customerTwinService } from '../services/customer-twin.service';
import { logger } from '../utils/logger';

export class CustomerTwinController {
  async createCustomerTwin(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, name, phone, email } = req.body;
      if (!customerId || !name || !phone) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      const result = await customerTwinService.createCustomerTwin({ customerId, name, phone, email });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating Customer Twin', { error: (error as Error).message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } });
    }
  }

  async getCustomerTwin(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      if (!customerId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'customerId is required' } });
        return;
      }
      const result = await customerTwinService.getCustomerTwin(customerId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }

  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      if (!customerId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'customerId is required' } });
        return;
      }
      await customerTwinService.updatePreferences(customerId, req.body);
      res.status(200).json({ success: true, message: 'Preferences updated successfully' });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }

  async recordVisit(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      if (!customerId || !req.body.restaurantId || req.body.orderValue === undefined) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      await customerTwinService.recordVisit(customerId, req.body);
      res.status(200).json({ success: true, message: 'Visit recorded successfully' });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }

  async updateLoyalty(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      if (!customerId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'customerId is required' } });
        return;
      }
      await customerTwinService.updateLoyalty(customerId, req.body);
      res.status(200).json({ success: true, message: 'Loyalty updated successfully' });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }

  async deleteCustomerTwin(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      if (!customerId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'customerId is required' } });
        return;
      }
      await customerTwinService.deleteCustomerTwin(customerId);
      res.status(200).json({ success: true, message: 'Customer Twin deleted successfully' });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }
}

export const customerTwinController = new CustomerTwinController();