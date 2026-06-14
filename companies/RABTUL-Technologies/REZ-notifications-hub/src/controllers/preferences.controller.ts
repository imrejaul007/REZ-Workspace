import { Request, Response, NextFunction } from 'express';
import { preferencesService } from '../services';
import { validateOrThrow, updatePreferencesSchema, categoryPreferencesSchema } from '../utils/validators';
import { ApiResponse, NotificationPreferences, CategoryPreferences } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class PreferencesController {
  async get(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;

      const preferences = await preferencesService.getPreferences(userId);

      const response: ApiResponse<NotificationPreferences> = {
        success: true,
        data: preferences,
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

  async update(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const input = validateOrThrow(updatePreferencesSchema, {
        ...req.body,
        userId,
      });

      const preferences = await preferencesService.updatePreferences(userId, input);

      const response: ApiResponse<NotificationPreferences> = {
        success: true,
        data: preferences,
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

  async getCategoryPreferences(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;

      const categoryPrefs = await preferencesService.getCategoryPreferences(userId);

      const response: ApiResponse<CategoryPreferences> = {
        success: true,
        data: categoryPrefs,
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

  async updateCategoryPreferences(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const input = validateOrThrow(
        categoryPreferencesSchema.array(),
        req.body
      );

      const categoryPrefs = await preferencesService.updateCategoryPreferences(
        userId,
        input
      );

      const response: ApiResponse<CategoryPreferences> = {
        success: true,
        data: categoryPrefs,
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

  async delete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;

      const deleted = await preferencesService.deletePreferences(userId);

      const response: ApiResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted },
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

export const preferencesController = new PreferencesController();
export default preferencesController;
