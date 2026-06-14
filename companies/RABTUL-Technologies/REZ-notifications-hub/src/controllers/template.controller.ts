import { Request, Response, NextFunction } from 'express';
import { templateService } from '../services';
import {
  validateOrThrow,
  createTemplateSchema,
  updateTemplateSchema,
} from '../utils/validators';
import { ApiResponse, NotificationTemplate } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class TemplateController {
  async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = validateOrThrow(createTemplateSchema, req.body);

      const template = await templateService.createTemplate(input);

      const response: ApiResponse<NotificationTemplate> = {
        success: true,
        data: template,
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

      const template = await templateService.getTemplateById(id);

      if (!template) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Template not found: ${id}`,
          },
          meta: {
            requestId: uuidv4(),
            timestamp: new Date().toISOString(),
          },
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<NotificationTemplate> = {
        success: true,
        data: template,
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

  async getByName(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name } = req.params;

      const template = await templateService.getTemplateByName(name);

      if (!template) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Template not found: ${name}`,
          },
          meta: {
            requestId: uuidv4(),
            timestamp: new Date().toISOString(),
          },
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<NotificationTemplate> = {
        success: true,
        data: template,
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
      const { id } = req.params;
      const input = validateOrThrow(updateTemplateSchema, req.body);

      const template = await templateService.updateTemplate(id, input);

      if (!template) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Template not found: ${id}`,
          },
          meta: {
            requestId: uuidv4(),
            timestamp: new Date().toISOString(),
          },
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<NotificationTemplate> = {
        success: true,
        data: template,
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
      const { id } = req.params;

      const deleted = await templateService.deleteTemplate(id);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Template not found: ${id}`,
          },
          meta: {
            requestId: uuidv4(),
            timestamp: new Date().toISOString(),
          },
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted: true },
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

  async list(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { channel, category, isActive } = req.query;

      const templates = await templateService.listTemplates({
        channel: channel as unknown,
        category: category as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });

      const response: ApiResponse<NotificationTemplate[]> = {
        success: true,
        data: templates,
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

  async getCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const categories = await templateService.getCategories();

      const response: ApiResponse<string[]> = {
        success: true,
        data: categories,
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

export const templateController = new TemplateController();
export default templateController;
