import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services';
import { ApiResponse, NotificationAnalytics, ChannelAnalytics } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class AnalyticsController {
  async getAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { startDate, endDate, userId, channel } = req.query;

      const analytics = await analyticsService.getAnalytics({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        userId: userId as string,
        channel: channel as unknown,
      });

      const response: ApiResponse<NotificationAnalytics> = {
        success: true,
        data: analytics,
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

  async getUserAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;

      const analytics = await analyticsService.getUserAnalytics(userId);

      const response: ApiResponse<NotificationAnalytics> = {
        success: true,
        data: analytics,
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

  async getChannelAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { channel } = req.params;

      const analytics = await analyticsService.getChannelAnalytics(channel as unknown);

      const response: ApiResponse<ChannelAnalytics> = {
        success: true,
        data: analytics,
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

  async getTemplatePerformance(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { templateId } = req.params;

      const performance = await analyticsService.getTemplatePerformance(templateId);

      const response: ApiResponse<typeof performance> = {
        success: true,
        data: performance,
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

  async getHourlyDistribution(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { startDate, endDate, channel } = req.query;

      const distribution = await analyticsService.getHourlyDistribution({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        channel: channel as unknown,
      });

      const response: ApiResponse<typeof distribution> = {
        success: true,
        data: distribution,
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

  async getRecentActivity(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { limit = '50' } = req.query;

      const activity = await analyticsService.getRecentActivity(parseInt(limit as string, 10));

      const response: ApiResponse<typeof activity> = {
        success: true,
        data: activity,
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

export const analyticsController = new AnalyticsController();
export default analyticsController;
