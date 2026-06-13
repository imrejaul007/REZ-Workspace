import { Request, Response } from 'express';
import { investorTwinService } from '../services/investor-twin.service';
import { logger } from '../utils/logger';
import {
  CreateInvestorTwinRequest,
  UpdateRiskProfileRequest,
  UpdatePortfolioRequest,
  UpdateHoldingsRequest,
  AddTransactionRequest,
  UpdateMetricsRequest,
  AddToWatchlistRequest,
  RemoveFromWatchlistRequest,
  UpdatePreferencesRequest,
  ListInvestorsRequest,
  InvestorType,
  RiskTolerance
} from '../schemas/investor-twin.schema';

export class InvestorTwinController {
  /**
   * Create a new Investor Twin
   * POST /api/twins/investor
   */
  async createInvestorTwin(req: Request, res: Response): Promise<void> {
    try {
      const request: CreateInvestorTwinRequest = req.body;

      // Validate required fields
      if (!request.investorId || !request.type || !request.name) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: investorId, type, name'
          }
        });
        return;
      }

      if (!request.contact || !request.contact.phone || !request.contact.email) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required contact information: phone, email'
          }
        });
        return;
      }

      // Validate investor type
      const validTypes = Object.values(InvestorType);
      if (!validTypes.includes(request.type)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid investor type. Must be one of: ${validTypes.join(', ')}`
          }
        });
        return;
      }

      const result = await investorTwinService.createInvestorTwin(request);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message
          }
        });
        return;
      }
      logger.error('Error creating Investor Twin', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Get Investor Twin by ID
   * GET /api/twins/investor/:investorId
   */
  async getInvestorTwin(req: Request, res: Response): Promise<void> {
    try {
      const { investorId } = req.params;

      if (!investorId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'investorId is required'
          }
        });
        return;
      }

      const result = await investorTwinService.getInvestorTwin(investorId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error fetching Investor Twin', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Get Portfolio Summary
   * GET /api/twins/investor/:investorId/summary
   */
  async getPortfolioSummary(req: Request, res: Response): Promise<void> {
    try {
      const { investorId } = req.params;

      if (!investorId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'investorId is required'
          }
        });
        return;
      }

      const result = await investorTwinService.getPortfolioSummary(investorId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error fetching Portfolio Summary', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Update Risk Profile
   * PUT /api/twins/investor/:investorId/risk-profile
   */
  async updateRiskProfile(req: Request, res: Response): Promise<void> {
    try {
      const { investorId } = req.params;
      const request: UpdateRiskProfileRequest = req.body;

      if (!investorId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'investorId is required'
          }
        });
        return;
      }

      if (!request.riskProfile || typeof request.riskProfile !== 'object') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'riskProfile object is required'
          }
        });
        return;
      }

      const result = await investorTwinService.updateRiskProfile(investorId, request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error updating Risk Profile', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Update Portfolio
   * PUT /api/twins/investor/:investorId/portfolio
   */
  async updatePortfolio(req: Request, res: Response): Promise<void> {
    try {
      const { investorId } = req.params;
      const request: UpdatePortfolioRequest = req.body;

      if (!investorId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'investorId is required'
          }
        });
        return;
      }

      if (!request.portfolioAllocations || !Array.isArray(request.portfolioAllocations)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'portfolioAllocations array is required'
          }
        });
        return;
      }

      const result = await investorTwinService.updatePortfolio(investorId, request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error updating Portfolio', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Update Holdings
   * PUT /api/twins/investor/:investorId/holdings
   */
  async updateHoldings(req: Request, res: Response): Promise<void> {
    try {
      const { investorId } = req.params;
      const request: UpdateHoldingsRequest = req.body;

      if (!investorId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'investorId is required'
          }
        });
        return;
      }

      if (!request.holdings || !Array.isArray(request.holdings)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'holdings array is required'
          }
        });
        return;
      }

      const result = await investorTwinService.updateHoldings(investorId, request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error updating Holdings', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Add Transaction
   * POST /api/twins/investor/:investorId/transactions
   */
  async addTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { investorId } = req.params;
      const request: AddTransactionRequest = req.body;

      if (!investorId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'investorId is required'
          }
        });
        return;
      }

      if (!request.transaction || typeof request.transaction !== 'object') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'transaction object is required'
          }
        });
        return;
      }

      const result = await investorTwinService.addTransaction(investorId, request);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error adding Transaction', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Update Metrics
   * PUT /api/twins/investor/:investorId/metrics
   */
  async updateMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { investorId } = req.params;
      const request: UpdateMetricsRequest = req.body;

      if (!investorId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'investorId is required'
          }
        });
        return;
      }

      const result = await investorTwinService.updateMetrics(investorId, request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error updating Metrics', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Add to Watchlist
   * POST /api/twins/investor/:investorId/watchlist
   */
  async addToWatchlist(req: Request, res: Response): Promise<void> {
    try {
      const { investorId } = req.params;
      const request: AddToWatchlistRequest = req.body;

      if (!investorId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'investorId is required'
          }
        });
        return;
      }

      if (!request.symbol || !request.name) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'symbol and name are required'
          }
        });
        return;
      }

      const result = await investorTwinService.addToWatchlist(investorId, request);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      if (message.includes('already in watchlist')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message
          }
        });
        return;
      }
      logger.error('Error adding to Watchlist', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Remove from Watchlist
   * DELETE /api/twins/investor/:investorId/watchlist/:symbol
   */
  async removeFromWatchlist(req: Request, res: Response): Promise<void> {
    try {
      const { investorId, symbol } = req.params;

      if (!investorId || !symbol) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'investorId and symbol are required'
          }
        });
        return;
      }

      const result = await investorTwinService.removeFromWatchlist(investorId, { symbol });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error removing from Watchlist', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Update Preferences
   * PUT /api/twins/investor/:investorId/preferences
   */
  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const { investorId } = req.params;
      const request: UpdatePreferencesRequest = req.body;

      if (!investorId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'investorId is required'
          }
        });
        return;
      }

      if (!request.preferences || typeof request.preferences !== 'object') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'preferences object is required'
          }
        });
        return;
      }

      const result = await investorTwinService.updatePreferences(investorId, request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error updating Preferences', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * List Investors
   * GET /api/twins/investor
   */
  async listInvestors(req: Request, res: Response): Promise<void> {
    try {
      const request: ListInvestorsRequest = {
        type: req.query.type as InvestorType,
        status: req.query.status as 'active' | 'inactive' | 'suspended',
        riskTolerance: req.query.riskTolerance as RiskTolerance,
        minValue: req.query.minValue ? parseFloat(req.query.minValue as string) : undefined,
        maxValue: req.query.maxValue ? parseFloat(req.query.maxValue as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const result = await investorTwinService.listInvestors(request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error listing Investors', { error: (error as Error).message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: (error as Error).message
        }
      });
    }
  }

  /**
   * Delete Investor Twin
   * DELETE /api/twins/investor/:investorId
   */
  async deleteInvestorTwin(req: Request, res: Response): Promise<void> {
    try {
      const { investorId } = req.params;

      if (!investorId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'investorId is required'
          }
        });
        return;
      }

      await investorTwinService.deleteInvestorTwin(investorId);

      res.status(200).json({
        success: true,
        message: 'Investor Twin deleted successfully'
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error deleting Investor Twin', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Refresh Market Data
   * POST /api/twins/investor/:investorId/refresh
   */
  async refreshMarketData(req: Request, res: Response): Promise<void> {
    try {
      const { investorId } = req.params;

      if (!investorId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'investorId is required'
          }
        });
        return;
      }

      const result = await investorTwinService.refreshMarketData(investorId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error refreshing Market Data', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }
}

export const investorTwinController = new InvestorTwinController();
