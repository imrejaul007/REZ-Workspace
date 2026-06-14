import { Router, Request, Response } from 'express';
import { AIMatchingService } from '../services/ai-matching.service';
import { PredictiveDemandService } from '../services/predictive-demand.service';
import { ChurnPredictionService } from '../services/churn-retention.service';
import { SentimentService } from '../services/csat-sentiment.service';
import { LTVAttributionService } from '../services/ltv-attribution.service';

const router = Router();

const aiMatching = new AIMatchingService(null as any);
const demandService = new PredictiveDemandService();
const churnService = new ChurnPredictionService();
const sentimentService = new SentimentService();
const ltvService = new LTVAttributionService();

// AI Matching
router.post('/matching/driver', async (req: Request, res: Response) => {
  try {
    const { pickup, drop, vehicleType, userId, preferences, context } = req.body;
    const matches = await aiMatching.findBestDriver({ pickup, drop, vehicleType, userId, preferences, context });
    res.json({ success: true, matches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Demand Prediction
router.get('/demand/:zoneId', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const prediction = await demandService.predictDemand(req.params.zoneId, date ? new Date(date as string) : undefined);
    res.json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Churn Prediction
router.get('/churn/:userId', async (req: Request, res: Response) => {
  try {
    const risk = await churnService.predictChurn(req.params.userId);
    res.json({ success: true, risk });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sentiment Analysis
router.post('/sentiment', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const analysis = await sentimentService.analyzeSentiment(text);
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LTV Attribution
router.get('/ltv/:userId', async (req: Request, res: Response) => {
  try {
    const ltv = await ltvService.calculateLTV(req.params.userId);
    res.json({ success: true, ltv });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
