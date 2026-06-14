/**
 * Services Index
 */

export { cashManagementService, CashManagementService } from './cashManagementService';
export type { CreateAccountInput, TransferInput, SweepConfig } from './cashManagementService';

export { investmentService, InvestmentService } from './investmentService';
export type { CreateInvestmentInput, InvestmentSummary } from './investmentService';

export { forecastService, ForecastService } from './forecastService';
export type { ForecastInput, ForecastResult, ShortfallPrediction, VarianceAnalysis } from './forecastService';

export { webhookService, WebhookService } from './webhookService';
export type { WebhookEvent, WebhookEventType, WebhookSubscription } from './webhookService';

export { bankStatementService, BankStatementService } from './bankStatement/bankStatementService';
export type { ParsedTransaction, BankStatementResult, BankStatementConfig } from './bankStatement/bankStatementService';

export { mlForecastService, MLForecastService } from './mlForecasting/mlForecastService';
export type { MLForecastInput, MLForecastOutput, AnomalyDetectionResult, SeasonalPattern } from './mlForecasting/mlForecastService';

export { fxHedgingService, FXHedgingService } from './fxHedging/fxHedgingService';
export type { FXRate, HedgePosition, HedgeStrategy, FXExposure, HedgeRecommendation, SpotRate } from './fxHedging/fxHedgingService';
