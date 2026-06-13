import { Router, Request, Response, NextFunction } from 'express';
import { investorTwinController } from '../controllers/investor-twin.controller';

const router = Router();

/**
 * @route   POST /api/twins/investor
 * @desc    Create a new Investor Twin
 * @access  Internal
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investorTwinController.createInvestorTwin(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/twins/investor
 * @desc    List Investor Twins
 * @access  Internal
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investorTwinController.listInvestors(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/twins/investor/:investorId
 * @desc    Get Investor Twin by ID
 * @access  Internal
 */
router.get('/:investorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investorTwinController.getInvestorTwin(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/twins/investor/:investorId/summary
 * @desc    Get Portfolio Summary
 * @access  Internal
 */
router.get('/:investorId/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investorTwinController.getPortfolioSummary(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/twins/investor/:investorId/risk-profile
 * @desc    Update Risk Profile
 * @access  Internal
 */
router.put('/:investorId/risk-profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investorTwinController.updateRiskProfile(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/twins/investor/:investorId/portfolio
 * @desc    Update Portfolio Allocations
 * @access  Internal
 */
router.put('/:investorId/portfolio', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investorTwinController.updatePortfolio(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/twins/investor/:investorId/holdings
 * @desc    Update Holdings
 * @access  Internal
 */
router.put('/:investorId/holdings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investorTwinController.updateHoldings(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/twins/investor/:investorId/transactions
 * @desc    Add Transaction
 * @access  Internal
 */
router.post('/:investorId/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investorTwinController.addTransaction(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/twins/investor/:investorId/metrics
 * @desc    Update Metrics
 * @access  Internal
 */
router.put('/:investorId/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investorTwinController.updateMetrics(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/twins/investor/:investorId/watchlist
 * @desc    Add to Watchlist
 * @access  Internal
 */
router.post('/:investorId/watchlist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investorTwinController.addToWatchlist(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/twins/investor/:investorId/watchlist/:symbol
 * @desc    Remove from Watchlist
 * @access  Internal
 */
router.delete('/:investorId/watchlist/:symbol', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investorTwinController.removeFromWatchlist(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/twins/investor/:investorId/preferences
 * @desc    Update Preferences
 * @access  Internal
 */
router.put('/:investorId/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investorTwinController.updatePreferences(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/twins/investor/:investorId
 * @desc    Delete Investor Twin
 * @access  Internal
 */
router.delete('/:investorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investorTwinController.deleteInvestorTwin(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/twins/investor/:investorId/refresh
 * @desc    Refresh Market Data
 * @access  Internal
 */
router.post('/:investorId/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investorTwinController.refreshMarketData(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
