/**
 * TreasuryOS Scheduled Jobs
 * Cron-based jobs for investment maturity, forecast updates, etc.
 */

import cron from 'node-cron';
import { investmentService } from '../services/investmentService';
import { forecastService } from '../services/forecastService';
import { TreasuryAccount } from '../models';
import { logger } from '../utils/logger';

/**
 * Process matured investments - runs daily at 1 AM
 */
export function scheduleMaturedInvestmentsJob(): void {
  cron.schedule('0 1 * * *', async () => {
    logger.info('[TreasuryOS] Running matured investments job');
    try {
      const result = await investmentService.processMaturedInvestments();
      logger.info('[TreasuryOS] Matured investments processed', {
        processed: result.processed,
        matured: result.matured.length,
        autoRenewed: result.autoRenewed.length
      });
    } catch (error) {
      logger.error('[TreasuryOS] Matured investments job failed', error);
    }
  });
}

/**
 * Refresh forecasts - runs every Monday at 6 AM
 */
export function scheduleForecastRefreshJob(): void {
  cron.schedule('0 6 * * 1', async () => {
    logger.info('[TreasuryOS] Running forecast refresh job');
    try {
      // Get all active businesses
      const businesses = await TreasuryAccount.distinct('businessId', { status: 'active' });

      for (const businessId of businesses) {
        try {
          const forecast = await forecastService.generateForecast(businessId);
          logger.info(`[TreasuryOS] Forecast generated for business ${businessId}`, {
            weeks: forecast.length
          });

          // Check for shortfalls
          const shortfall = await forecastService.predictShortfall(businessId);
          if (shortfall.willShortfall) {
            await forecastService.createShortfallAlert(businessId, shortfall);
            logger.warn(`[TreasuryOS] Shortfall predicted for business ${businessId}`, {
              shortfall: shortfall.projectedShortfall
            });
          }
        } catch (error) {
          logger.error(`[TreasuryOS] Forecast generation failed for ${businessId}`, error);
        }
      }
    } catch (error) {
      logger.error('[TreasuryOS] Forecast refresh job failed', error);
    }
  });
}

/**
 * Check for active alerts - runs every 4 hours
 */
export function scheduleAlertCheckJob(): void {
  cron.schedule('0 */4 * * *', async () => {
    logger.info('[TreasuryOS] Running alert check job');
    try {
      // Get all active alerts that need escalation
      const { ShortfallAlert } = await import('../models');
      const criticalAlerts = await ShortfallAlert.find({
        status: 'active',
        severity: 'critical',
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Created more than 24h ago
      });

      for (const alert of criticalAlerts) {
        logger.warn(`[TreasuryOS] Critical alert not resolved`, {
          alertId: alert.alertId,
          businessId: alert.businessId,
          shortfall: alert.projectedShortfall
        });
        // TODO: Send notification to ops team
      }
    } catch (error) {
      logger.error('[TreasuryOS] Alert check job failed', error);
    }
  });
}

/**
 * Investment value update - runs daily at midnight
 */
export function scheduleInvestmentValueUpdate(): void {
  cron.schedule('0 0 * * *', async () => {
    logger.info('[TreasuryOS] Running investment value update job');
    try {
      const { Investment } = await import('../models');
      const investments = await Investment.find({ status: 'active' });

      for (const investment of investments) {
        try {
          // Update current value based on accrual
          const daysElapsed = Math.floor(
            (Date.now() - new Date(investment.startDate).getTime()) / (24 * 60 * 60 * 1000)
          );

          if (investment.interestType === 'simple') {
            // Simple interest: principal + (principal * rate * days / 365)
            const interest = investment.principal * (investment.interestRate / 100) * (daysElapsed / 365);
            const newValue = investment.principal + interest;
            await investmentService.updateInvestmentValue(investment.investmentId, newValue);
          }
          // Compound interest would require more complex calculation based on compounding frequency
        } catch (error) {
          logger.error(`[TreasuryOS] Value update failed for ${investment.investmentId}`, error);
        }
      }

      logger.info(`[TreasuryOS] Investment values updated`, { count: investments.length });
    } catch (error) {
      logger.error('[TreasuryOS] Investment value update job failed', error);
    }
  });
}

/**
 * Initialize all scheduled jobs
 */
export function initializeJobs(): void {
  logger.info('[TreasuryOS] Initializing scheduled jobs');
  scheduleMaturedInvestmentsJob();
  scheduleForecastRefreshJob();
  scheduleAlertCheckJob();
  scheduleInvestmentValueUpdate();
  logger.info('[TreasuryOS] All scheduled jobs initialized');
}
