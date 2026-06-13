import { Request, Response, NextFunction } from 'express';
import { guestTwinService } from '../services';
import { logger } from '../utils/logger';

export class GuestTwinController {
  /**
   * POST /api/twins/guest - Create guest twin
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const guestTwin = await guestTwinService.create(req.body);
      res.status(201).json({
        success: true,
        data: guestTwin,
        message: 'Guest twin created successfully',
      });
    } catch (error) {
      logger.error('Error creating guest twin:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/guest/:id - Get guest twin
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const guestTwin = await guestTwinService.getById(id);

      if (!guestTwin) {
        res.status(404).json({
          success: false,
          error: 'Guest twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: guestTwin,
      });
    } catch (error) {
      logger.error('Error getting guest twin:', error);
      next(error);
    }
  }

  /**
   * PUT /api/twins/guest/:id/preferences - Update preferences
   */
  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const guestTwin = await guestTwinService.updatePreferences(id, req.body);

      if (!guestTwin) {
        res.status(404).json({
          success: false,
          error: 'Guest twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: guestTwin,
        message: 'Preferences updated successfully',
      });
    } catch (error) {
      logger.error('Error updating preferences:', error);
      next(error);
    }
  }

  /**
   * POST /api/twins/guest/:id/stay-history - Add stay history
   */
  async addStayHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const guestTwin = await guestTwinService.addStayHistory(id, req.body);

      if (!guestTwin) {
        res.status(404).json({
          success: false,
          error: 'Guest twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: guestTwin,
        message: 'Stay history added successfully',
      });
    } catch (error) {
      logger.error('Error adding stay history:', error);
      next(error);
    }
  }

  /**
   * PUT /api/twins/guest/:id/sentiment - Update sentiment
   */
  async updateSentiment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const guestTwin = await guestTwinService.updateSentiment(id, req.body);

      if (!guestTwin) {
        res.status(404).json({
          success: false,
          error: 'Guest twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: guestTwin,
        message: 'Sentiment updated successfully',
      });
    } catch (error) {
      logger.error('Error updating sentiment:', error);
      next(error);
    }
  }

  /**
   * PUT /api/twins/guest/:id/loyalty - Update loyalty
   */
  async updateLoyalty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const guestTwin = await guestTwinService.updateLoyalty(id, req.body);

      if (!guestTwin) {
        res.status(404).json({
          success: false,
          error: 'Guest twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: guestTwin,
        message: 'Loyalty updated successfully',
      });
    } catch (error) {
      logger.error('Error updating loyalty:', error);
      next(error);
    }
  }

  /**
   * POST /api/twins/guest/:id/tags - Add tags
   */
  async addTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { tags } = req.body;

      if (!Array.isArray(tags)) {
        res.status(400).json({
          success: false,
          error: 'Tags must be an array',
        });
        return;
      }

      const guestTwin = await guestTwinService.addTags(id, tags);

      if (!guestTwin) {
        res.status(404).json({
          success: false,
          error: 'Guest twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: guestTwin,
        message: 'Tags added successfully',
      });
    } catch (error) {
      logger.error('Error adding tags:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/twins/guest/:id - Archive guest twin
   */
  async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const guestTwin = await guestTwinService.archive(id);

      if (!guestTwin) {
        res.status(404).json({
          success: false,
          error: 'Guest twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: guestTwin,
        message: 'Guest twin archived successfully',
      });
    } catch (error) {
      logger.error('Error archiving guest twin:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/guest - Query guest twins
   */
  async query(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vipStatus, tier, tag, limit, offset } = req.query;

      const filters = {
        vipStatus: vipStatus === 'true' ? true : vipStatus === 'false' ? false : undefined,
        tier: tier as string,
        tag: tag as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      };

      const result = await guestTwinService.query(filters);

      res.json({
        success: true,
        data: result.guests,
        pagination: {
          total: result.total,
          limit: filters.limit || 20,
          offset: filters.offset || 0,
        },
      });
    } catch (error) {
      logger.error('Error querying guest twins:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/guest/stats - Get guest statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await guestTwinService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting guest statistics:', error);
      next(error);
    }
  }
}

export const guestTwinController = new GuestTwinController();
