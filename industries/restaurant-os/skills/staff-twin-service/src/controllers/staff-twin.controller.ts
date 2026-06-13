import { Request, Response } from 'express';
import { staffTwinService } from '../services/staff-twin.service';
import { logger } from '../utils/logger';

export class StaffTwinController {
  async createStaffTwin(req: Request, res: Response): Promise<void> {
    try {
      const { staffId, restaurantId, name, phone, email, role, certifications } = req.body;
      if (!staffId || !restaurantId || !name || !phone || !role) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      const result = await staffTwinService.createStaffTwin({ staffId, restaurantId, name, phone, email, role, certifications });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating Staff Twin', { error: (error as Error).message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } });
    }
  }

  async getStaffTwin(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      if (!staffId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'staffId is required' } });
        return;
      }
      const result = await staffTwinService.getStaffTwin(staffId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }

  async checkIn(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      if (!staffId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'staffId is required' } });
        return;
      }
      await staffTwinService.checkIn(staffId, req.body);
      res.status(200).json({ success: true, message: 'Checked in successfully' });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }

  async checkOut(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      if (!staffId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'staffId is required' } });
        return;
      }
      await staffTwinService.checkOut(staffId, req.body);
      res.status(200).json({ success: true, message: 'Checked out successfully' });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }

  async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      if (!staffId || !req.body.shifts) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      await staffTwinService.updateSchedule(staffId, req.body);
      res.status(200).json({ success: true, message: 'Schedule updated successfully' });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }

  async deleteStaffTwin(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      if (!staffId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'staffId is required' } });
        return;
      }
      await staffTwinService.deleteStaffTwin(staffId);
      res.status(200).json({ success: true, message: 'Staff Twin deleted successfully' });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }
}

export const staffTwinController = new StaffTwinController();