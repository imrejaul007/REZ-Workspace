import { Router } from 'express';
import overviewRouter from './overview';
import salesRouter from './sales';
import productsRouter from './products';
import customersRouter from './customers';
import reportingRouter from './reporting';
import forecastRouter from './forecast';
import demandForecastRouter from './demandForecast';
import exportRouter from './export';
import realtimeRouter from './realtime';
import churnPredictionRouter from './churnPrediction';
import ltvRouter from './ltv';
import customerSegmentsRouter from './customerSegments';

const router = Router();
router.use(overviewRouter);
router.use(salesRouter);
router.use(productsRouter);
router.use(customersRouter);
router.use(reportingRouter);
router.use(forecastRouter);
router.use(demandForecastRouter);
router.use(exportRouter);
router.use(realtimeRouter);
router.use(churnPredictionRouter);
router.use(ltvRouter);
router.use(customerSegmentsRouter);

export default router;
