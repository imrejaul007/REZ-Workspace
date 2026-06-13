import { Request, Response } from 'express';
import { inventoryTwinService } from '../services/inventory-twin.service';
import { logger } from '../utils/logger';
import { AddInventoryItemRequest, AdjustStockRequest, LogWasteRequest, CreatePurchaseOrderRequest } from '../schemas/inventory-twin.schema';

export class InventoryTwinController {
  async createInventoryTwin(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body;
      if (!request.restaurantId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'restaurantId is required' } });
        return;
      }
      const result = await inventoryTwinService.createInventoryTwin(request);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating Inventory Twin', { error: (error as Error).message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } });
    }
  }

  async getInventoryTwin(req: Request, res: Response): Promise<void> {
    try {
      const { inventoryId } = req.params;
      if (!inventoryId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'inventoryId is required' } });
        return;
      }
      const result = await inventoryTwinService.getInventoryTwin(inventoryId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
        return;
      }
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async addItem(req: Request, res: Response): Promise<void> {
    try {
      const { inventoryId } = req.params;
      const request: AddInventoryItemRequest = req.body;
      if (!inventoryId || !request.name || !request.category) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      await inventoryTwinService.addItem(inventoryId, request);
      res.status(200).json({ success: true, message: 'Item added successfully' });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
        return;
      }
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async adjustStock(req: Request, res: Response): Promise<void> {
    try {
      const { inventoryId } = req.params;
      const request: AdjustStockRequest = req.body;
      if (!inventoryId || !request.itemId || request.quantity === undefined) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      await inventoryTwinService.adjustStock(inventoryId, request);
      res.status(200).json({ success: true, message: 'Stock adjusted successfully' });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
        return;
      }
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async logWaste(req: Request, res: Response): Promise<void> {
    try {
      const { inventoryId } = req.params;
      const request: LogWasteRequest = req.body;
      if (!inventoryId || !request.itemId || !request.quantity || !request.reason) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      await inventoryTwinService.logWaste(inventoryId, request);
      res.status(200).json({ success: true, message: 'Waste logged successfully' });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
        return;
      }
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async createPurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { inventoryId } = req.params;
      const request: CreatePurchaseOrderRequest = req.body;
      if (!inventoryId || !request.items || request.items.length === 0) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      const result = await inventoryTwinService.createPurchaseOrder(inventoryId, request);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
        return;
      }
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { inventoryId } = req.params;
      if (!inventoryId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'inventoryId is required' } });
        return;
      }
      const result = await inventoryTwinService.getInventoryAnalytics(inventoryId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
        return;
      }
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async deleteInventoryTwin(req: Request, res: Response): Promise<void> {
    try {
      const { inventoryId } = req.params;
      if (!inventoryId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'inventoryId is required' } });
        return;
      }
      await inventoryTwinService.deleteInventoryTwin(inventoryId);
      res.status(200).json({ success: true, message: 'Inventory Twin deleted successfully' });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
        return;
      }
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }
}

export const inventoryTwinController = new InventoryTwinController();