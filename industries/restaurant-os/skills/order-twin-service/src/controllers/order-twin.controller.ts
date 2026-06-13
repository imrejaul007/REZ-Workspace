import { Request, Response } from 'express';
import { orderTwinService } from '../services/order-twin.service';
import { logger } from '../utils/logger';
import { CreateOrderRequest, UpdateOrderStatusRequest, AddItemsRequest, UpdateItemStatusRequest, ProcessPaymentRequest, ListOrdersRequest } from '../schemas/order-twin.schema';

export class OrderTwinController {
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const request: CreateOrderRequest = req.body;
      if (!request.restaurantId || !request.items || request.items.length === 0) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      const result = await orderTwinService.createOrder(request);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating Order Twin', { error: (error as Error).message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } });
    }
  }

  async getOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'orderId is required' } });
        return;
      }
      const result = await orderTwinService.getOrder(orderId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const request: UpdateOrderStatusRequest = req.body;
      if (!orderId || !request.status) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      const result = await orderTwinService.updateOrderStatus(orderId, request);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } });
    }
  }

  async addItems(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const request: AddItemsRequest = req.body;
      if (!orderId || !request.items || request.items.length === 0) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      const result = await orderTwinService.addItems(orderId, request);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') || message.includes('Cannot add') ? 400 : 500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async updateItemStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const request: UpdateItemStatusRequest = req.body;
      if (!orderId || !request.menuItemId || !request.status) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      await orderTwinService.updateItemStatus(orderId, request);
      res.status(200).json({ success: true, message: 'Item status updated' });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const request: ProcessPaymentRequest = req.body;
      if (!orderId || !request.paymentMethod || request.amount === undefined) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        return;
      }
      const result = await orderTwinService.processPayment(orderId, request);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  async listOrders(req: Request, res: Response): Promise<void> {
    try {
      const request: ListOrdersRequest = {
        restaurantId: req.query.restaurantId as string,
        status: req.query.status as any,
        orderType: req.query.orderType as any,
        tableId: req.query.tableId as string,
        date: req.query.date as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };
      if (!request.restaurantId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'restaurantId is required' } });
        return;
      }
      const result = await orderTwinService.listOrders(request);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error listing orders', { error: (error as Error).message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } });
    }
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = req.query.restaurantId as string;
      const date = req.query.date as string;
      if (!restaurantId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'restaurantId is required' } });
        return;
      }
      const result = await orderTwinService.getOrderAnalytics(restaurantId, date);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error getting analytics', { error: (error as Error).message });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } });
    }
  }

  async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'orderId is required' } });
        return;
      }
      await orderTwinService.deleteOrder(orderId);
      res.status(200).json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
      const message = (error as Error).message;
      res.status(message.includes('not found') ? 404 : 500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }
}

export const orderTwinController = new OrderTwinController();