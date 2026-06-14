import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services';
import { templateService } from '../services';
import {
  validateOrThrow,
  notificationPayloadSchema,
  batchNotificationSchema,
} from '../utils/validators';
import { ApiResponse, BatchNotificationResult, Notification } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class NotificationController {
  async send(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const payload = validateOrThrow(notificationPayloadSchema, req.body);

      const notification = await notificationService.sendNotification(payload);

      const response: ApiResponse<Notification> = {
        success: true,
        data: notification,
        meta: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async sendToAllChannels(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const payload = validateOrThrow(notificationPayloadSchema, req.body);

      if (!payload.recipient.channels || payload.recipient.channels.length === 0) {
        throw new Error('At least one channel is required');
      }

      const notifications = await notificationService.sendToAllChannels(payload);

      const response: ApiResponse<Notification[]> = {
        success: true,
        data: notifications,
        meta: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async sendBatch(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const payload = validateOrThrow(batchNotificationSchema, req.body);

      const result: BatchNotificationResult = await notificationService.sendBatch(payload);

      const response: ApiResponse<BatchNotificationResult> = {
        success: true,
        data: result,
        meta: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const notification = await notificationService.getNotification(id);

      if (!notification) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Notification not found: ${id}`,
          },
          meta: {
            requestId: uuidv4(),
            timestamp: new Date().toISOString(),
          },
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<Notification> = {
        success: true,
        data: notification,
        meta: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getUserNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const {
        channel,
        status,
        page = '1',
        limit = '20',
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const { notifications, total } = await notificationService.getUserNotifications(
        userId,
        {
          channel: channel as unknown,
          status: status as unknown,
          limit: limitNum,
          offset: (pageNum - 1) * limitNum,
        }
      );

      const response: ApiResponse<Notification[]> & {
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      } = {
        success: true,
        data: notifications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        meta: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status, metadata } = req.body;

      if (!status) {
        throw new Error('Status is required');
      }

      const notification = await notificationService.updateStatus(
        id,
        status,
        metadata
      );

      if (!notification) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Notification not found: ${id}`,
          },
          meta: {
            requestId: uuidv4(),
            timestamp: new Date().toISOString(),
          },
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<Notification> = {
        success: true,
        data: notification,
        meta: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async preview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { templateId, variables } = req.body;

      if (!templateId) {
        throw new Error('Template ID is required');
      }

      const template = await templateService.getTemplateById(templateId);

      if (!template) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Template not found: ${templateId}`,
          },
          meta: {
            requestId: uuidv4(),
            timestamp: new Date().toISOString(),
          },
        };
        res.status(404).json(response);
        return;
      }

      const rendered = templateService.renderTemplateWithHtml(
        template,
        variables || {}
      );

      const response: ApiResponse<typeof rendered> = {
        success: true,
        data: rendered,
        meta: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
export default notificationController;
