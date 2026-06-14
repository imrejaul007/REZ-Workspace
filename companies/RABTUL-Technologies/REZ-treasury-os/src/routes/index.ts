/**
 * TreasuryOS Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { cashManagementService } from '../services/cashManagementService';
import { investmentService } from '../services/investmentService';
import { forecastService } from '../services/forecastService';
import { webhookService } from '../services/webhookService';
import { bankStatementService } from '../services/bankStatement/bankStatementService';
import { mlForecastService } from '../services/mlForecasting/mlForecastService';
import { fxHedgingService } from '../services/fxHedging/fxHedgingService';

const router = Router();

// ============================================
// CASH MANAGEMENT ROUTES
// ============================================

// Create account
router.post('/accounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = await cashManagementService.createAccount({
      businessId: req.body.businessId,
      businessName: req.body.businessName,
      accountType: req.body.accountType,
      currency: req.body.currency,
      bankName: req.body.bankName,
      bankAccountNumber: req.body.bankAccountNumber,
      bankAccountType: req.body.bankAccountType
    });
    res.status(201).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

// Get accounts
router.get('/accounts/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accounts = await cashManagementService.getBusinessAccounts(req.params.businessId);
    res.json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
});

// Get account
router.get('/accounts/:businessId/position', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const position = await cashManagementService.getCashPosition(req.params.businessId);
    res.json({ success: true, data: position });
  } catch (error) {
    next(error);
  }
});

// Deposit
router.post('/accounts/:accountId/deposit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await cashManagementService.deposit(
      req.params.accountId,
      req.body.amount,
      req.body.reference,
      req.body.referenceType,
      req.body.description
    );
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
});

// Withdraw
router.post('/accounts/:accountId/withdraw', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await cashManagementService.withdraw(
      req.params.accountId,
      req.body.amount,
      req.body.reference,
      req.body.referenceType,
      req.body.description
    );
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
});

// Transfer
router.post('/transfers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transfer = await cashManagementService.transfer({
      fromAccountId: req.body.fromAccountId,
      toAccountId: req.body.toAccountId,
      amount: req.body.amount,
      description: req.body.description,
      reference: req.body.reference
    });
    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    next(error);
  }
});

// Get transactions
router.get('/accounts/:accountId/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, type, limit, skip } = req.query;
    const transactions = await cashManagementService.getTransactions(req.params.accountId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      type: type as string,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined
    });
    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
});

// Cash flow summary
router.get('/cash-flow/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await cashManagementService.getCashFlowSummary(
      req.params.businessId,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

// Reserve funds
router.post('/accounts/:accountId/reserve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await cashManagementService.reserveFunds(req.params.accountId, req.body.amount);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Release funds
router.post('/accounts/:accountId/release', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await cashManagementService.releaseFunds(req.params.accountId, req.body.amount);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================
// INVESTMENT ROUTES
// ============================================

// Create investment
router.post('/investments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const investment = await investmentService.createInvestment({
      businessId: req.body.businessId,
      accountId: req.body.accountId,
      type: req.body.type,
      name: req.body.name,
      provider: req.body.provider,
      principal: req.body.principal,
      interestRate: req.body.interestRate,
      interestType: req.body.interestType,
      compoundingFrequency: req.body.compoundingFrequency,
      startDate: new Date(req.body.startDate),
      tenureDays: req.body.tenureDays,
      autoRenew: req.body.autoRenew,
      notes: req.body.notes
    });
    res.status(201).json({ success: true, data: investment });
  } catch (error) {
    next(error);
  }
});

// Get investments
router.get('/investments/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const investments = await investmentService.getBusinessInvestments(req.params.businessId, {
      status: req.query.status as string,
      type: req.query.type as string
    });
    res.json({ success: true, data: investments });
  } catch (error) {
    next(error);
  }
});

// Get investment summary
router.get('/investments/:businessId/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await investmentService.getInvestmentSummary(req.params.businessId);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

// Update investment value
router.patch('/investments/:investmentId/value', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await investmentService.updateInvestmentValue(
      req.params.investmentId,
      req.body.value,
      req.body.benchmarkValue
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Redeem investment
router.post('/investments/:investmentId/redeem', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await investmentService.redeemInvestment(
      req.params.investmentId,
      req.body.targetAccountId,
      {
        premature: req.body.premature,
        reinvest: req.body.reinvest
      }
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get investment returns
router.get('/investments/:investmentId/returns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const returns = await investmentService.getInvestmentReturns(
      req.params.investmentId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({ success: true, data: returns });
  } catch (error) {
    next(error);
  }
});

// ============================================
// FORECAST ROUTES
// ============================================

// Generate forecast
router.post('/forecast/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forecast = await forecastService.generateForecast(req.params.businessId, {
      startingBalance: req.body.startingBalance,
      confidenceOverride: req.body.confidence
    });
    res.status(201).json({ success: true, data: forecast });
  } catch (error) {
    next(error);
  }
});

// Get current forecast
router.get('/forecast/:businessId/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forecast = await forecastService.getCurrentForecast(req.params.businessId);
    res.json({ success: true, data: forecast });
  } catch (error) {
    next(error);
  }
});

// Predict shortfall
router.get('/forecast/:businessId/shortfall', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prediction = await forecastService.predictShortfall(req.params.businessId, {
      requiredBalance: req.query.requiredBalance ? parseFloat(req.query.requiredBalance as string) : undefined,
      lookAheadWeeks: req.query.lookAheadWeeks ? parseInt(req.query.lookAheadWeeks as string) : undefined
    });

    // Create alert if shortfall predicted
    if (prediction.willShortfall) {
      const alert = await forecastService.createShortfallAlert(req.params.businessId, prediction);
      res.json({ success: true, data: prediction, alert });
    } else {
      res.json({ success: true, data: prediction });
    }
  } catch (error) {
    next(error);
  }
});

// Update forecast with actuals
router.patch('/forecast/:forecastId/actuals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await forecastService.updateForecastWithActuals(
      req.params.forecastId,
      req.body.actualInflow,
      req.body.actualOutflow,
      req.body.actualClosingBalance
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get active alerts
router.get('/alerts/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await forecastService.getActiveAlerts(req.params.businessId);
    res.json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
});

// Acknowledge alert
router.post('/alerts/:alertId/acknowledge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await forecastService.acknowledgeAlert(req.params.alertId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Resolve alert
router.post('/alerts/:alertId/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await forecastService.resolveAlert(req.params.alertId, req.body.resolution);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================
// BANK STATEMENT ROUTES
// ============================================
import { bankStatementService } from '../services/bankStatement/bankStatementService';

// Import bank statement
router.post('/bank-statements/import', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, fileContent, fileName, bankType } = req.body;
    const result = await bankStatementService.processBankStatement(
      accountId,
      fileContent,
      fileName,
      bankType
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get supported banks
router.get('/bank-statements/banks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banks = bankStatementService.getSupportedBanks();
    res.json({ success: true, data: banks });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ML FORECASTING ROUTES
// ============================================
import { mlForecastService } from '../services/mlForecasting/mlForecastService';

// Generate ML forecast
router.post('/forecast/:businessId/ml', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forecast = await mlForecastService.generateMLForecast({
      businessId: req.params.businessId,
      historicalDays: req.body.historicalDays || 90,
      forecastWeeks: req.body.forecastWeeks || 13,
      includeSeasonality: req.body.includeSeasonality ?? true,
      includeExternalFactors: req.body.includeExternalFactors ?? true
    });
    res.status(201).json({ success: true, data: forecast });
  } catch (error) {
    next(error);
  }
});

// Get ML insights
router.get('/forecast/:businessId/ml/insights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forecast = await mlForecastService.generateMLForecast({
      businessId: req.params.businessId,
      historicalDays: parseInt(req.query.historicalDays as string) || 90,
      forecastWeeks: 0, // Just get insights, not full forecast
      includeSeasonality: true,
      includeExternalFactors: true
    });
    res.json({ success: true, data: forecast.insights });
  } catch (error) {
    next(error);
  }
});

// Detect anomaly
router.post('/forecast/anomaly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, value, metric } = req.body;
    const anomaly = await mlForecastService.detectRealTimeAnomaly(value, businessId, metric);
    res.json({ success: true, data: anomaly });
  } catch (error) {
    next(error);
  }
});

// ============================================
// FX HEDGING ROUTES
// ============================================
import { fxHedgingService } from '../services/fxHedging/fxHedgingService';

// Get FX rate
router.get('/fx/rate/:from/:to', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rate = await fxHedgingService.getRate(req.params.from, req.params.to);
    res.json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
});

// Get spot rate
router.get('/fx/spot/:from/:to', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const spot = await fxHedgingService.getSpotRate(req.params.from, req.params.to);
    res.json({ success: true, data: spot });
  } catch (error) {
    next(error);
  }
});

// Create forward hedge
router.post('/fx/hedge/forward', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const position = await fxHedgingService.createForwardHedge({
      businessId: req.body.businessId,
      currency: req.body.currency,
      amount: req.body.amount,
      hedgeRatio: req.body.hedgeRatio || 1,
      forwardRate: req.body.forwardRate,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      counterparty: req.body.counterparty
    });
    res.status(201).json({ success: true, data: position });
  } catch (error) {
    next(error);
  }
});

// Create option hedge
router.post('/fx/hedge/option', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const position = await fxHedgingService.createOptionHedge({
      businessId: req.body.businessId,
      currency: req.body.currency,
      amount: req.body.amount,
      hedgeRatio: req.body.hedgeRatio || 1,
      strikeRate: req.body.strikeRate,
      premium: req.body.premium,
      optionType: req.body.optionType,
      expiryDate: new Date(req.body.expiryDate),
      counterparty: req.body.counterparty
    });
    res.status(201).json({ success: true, data: position });
  } catch (error) {
    next(error);
  }
});

// Get FX exposure
router.get('/fx/exposure/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currency = req.query.currency as string || 'USD';
    const exposure = await fxHedgingService.calculateExposure(req.params.businessId, currency);
    res.json({ success: true, data: exposure });
  } catch (error) {
    next(error);
  }
});

// Get hedge positions
router.get('/fx/positions/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const positions = await fxHedgingService.getPositions(req.params.businessId);
    res.json({ success: true, data: positions });
  } catch (error) {
    next(error);
  }
});

// Get hedge recommendations
router.get('/fx/recommendations/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recommendations = await fxHedgingService.getRecommendations(req.params.businessId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    next(error);
  }
});

// Settle hedge position
router.post('/fx/positions/:positionId/settle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const position = await fxHedgingService.settlePosition(
      req.params.positionId,
      req.body.settlementRate
    );
    res.json({ success: true, data: position });
  } catch (error) {
    next(error);
  }
});

// Execute auto-hedge
router.post('/fx/auto-hedge/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const positions = await fxHedgingService.executeAutoHedge(req.params.businessId);
    res.json({ success: true, data: positions });
  } catch (error) {
    next(error);
  }
});

// Get supported currencies
router.get('/fx/currencies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currencies = fxHedgingService.getSupportedCurrencies();
    const pairs = fxHedgingService.getCurrencyPairs();
    res.json({ success: true, data: { currencies, pairs } });
  } catch (error) {
    next(error);
  }
});

// ============================================
// WEBHOOK ROUTES
// ============================================
import { webhookService } from '../services/webhookService';

// Subscribe to webhooks
router.post('/webhooks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await webhookService.subscribe({
      businessId: req.body.businessId,
      url: req.body.url,
      secret: req.body.secret,
      events: req.body.events,
      active: true
    });
    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

// Get webhook subscriptions
router.get('/webhooks/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscriptions = await webhookService.getSubscriptionsForEvent(
      req.body.eventType as any,
      req.params.businessId
    );
    res.json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
});

// Get webhook deliveries
router.get('/webhooks/:webhookId/deliveries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deliveries = await webhookService.getDeliveryHistory(
      req.params.webhookId,
      {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        status: req.query.status as string
      }
    );
    res.json({ success: true, data: deliveries });
  } catch (error) {
    next(error);
  }
});

// Delete webhook
router.delete('/webhooks/:webhookId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await webhookService.unsubscribe(req.params.webhookId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
