import { Request, Response, NextFunction } from 'express';
import { optOutService } from '../services';
import { validateOrThrow, optOutSchema, globalOptOutSchema } from '../utils/validators';
import { ApiResponse, OptOutRecord, GlobalOptOut, NotificationChannel } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class OptOutController {
  async optOut(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = validateOrThrow(optOutSchema, req.body);

      const record = await optOutService.optOut(input);

      const response: ApiResponse<OptOutRecord> = {
        success: true,
        data: record,
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

  async optIn(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, channel } = req.params;

      const success = await optOutService.optIn(userId, channel as NotificationChannel);

      const response: ApiResponse<{ optedIn: boolean }> = {
        success: true,
        data: { optedIn: success },
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

  async check(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, channel } = req.params;

      const isOptedOut = await optOutService.isOptedOut(userId, channel as NotificationChannel);

      const response: ApiResponse<{ optedOut: boolean }> = {
        success: true,
        data: { optedOut: isOptedOut },
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

  async getUserOptOuts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;

      const records = await optOutService.getUserOptOuts(userId);

      const response: ApiResponse<OptOutRecord[]> = {
        success: true,
        data: records,
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

  async globalOptOut(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = validateOrThrow(globalOptOutSchema, req.body);

      const record = await optOutService.globalOptOut(input);

      const response: ApiResponse<GlobalOptOut> = {
        success: true,
        data: record,
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

  async checkGlobal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, phone } = req.query;

      if (!email && !phone) {
        throw new Error('Email or phone is required');
      }

      const isOptedOut = await optOutService.isGloballyOptedOut(
        email as string,
        phone as string
      );

      const response: ApiResponse<{ optedOut: boolean }> = {
        success: true,
        data: { optedOut: isOptedOut },
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

export const optOutController = new OptOutController();
export default optOutController;
