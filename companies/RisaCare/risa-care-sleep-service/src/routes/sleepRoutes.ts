import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sleepStorage, LogSleepInputSchema, SetGoalInputSchema, UpdateGoalInputSchema, LogFactorInputSchema, AddDisorderInputSchema, SleepDisorder, SleepDisorderType, SleepDisorderStatus } from '../models/sleep';
import { sleepTrackingService } from '../services/sleepTrackingService';
import { sleepAnalysisService } from '../services/sleepAnalysisService';
import { sleepGoalService } from '../services/sleepGoalService';
import { sleepImprovementService } from '../services/sleepImprovementService';
import { factorAnalysisService } from '../services/factorAnalysisService';

const router = Router();

// Helper function for validating inputs
const validateBody = (schema: any) => (req: Request, res: Response, next: Function) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error: any) {
    res.status(400).json({ error: 'Validation failed', details: error.errors });
  }
};

// ============== SLEEP RECORDS ==============

// POST /sleep - Log sleep
router.post('/sleep', validateBody(LogSleepInputSchema), (req: Request, res: Response) => {
  try {
    const result = sleepTrackingService.logSleep(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /sleep/:userId/:date - Get sleep record
router.get('/sleep/:userId/:date', (req: Request, res: Response) => {
  const { userId, date } = req.params;
  const record = sleepTrackingService.getSleepRecord(userId, date);
  if (!record) {
    return res.status(404).json({ error: 'Sleep record not found' });
  }
  res.json(record);
});

// GET /sleep/:userId/history - Get sleep history
router.get('/sleep/:userId/history', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { startDate, endDate, limit } = req.query;
  const records = sleepTrackingService.getSleepHistory(
    userId,
    startDate as string | undefined,
    endDate as string | undefined,
    limit ? parseInt(limit as string) : 30
  );
  res.json({ records, count: records.length });
});

// GET /sleep/:userId/analysis - Get sleep analysis
router.get('/sleep/:userId/analysis', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { days } = req.query;
  const daysNum = days ? parseInt(days as string) : 30;
  const patterns = sleepAnalysisService.analyzePatterns(userId, daysNum);
  const weeklySummary = sleepTrackingService.getWeeklySummary(userId);
  const goalComparison = sleepAnalysisService.compareToGoal(userId);
  const sleepStages = sleepAnalysisService.analyzeSleepStages(userId);
  res.json({ patterns, weeklySummary, goalComparison, sleepStages });
});

// GET /sleep/:userId/patterns - Get sleep patterns
router.get('/sleep/:userId/patterns', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { days } = req.query;
  const patterns = sleepAnalysisService.analyzePatterns(userId, days ? parseInt(days as string) : 30);
  if (!patterns) {
    return res.status(404).json({ error: 'Not enough data for pattern analysis. Need at least 3 sleep records.' });
  }
  res.json(patterns);
});

// GET /sleep/:userId/trend - Get sleep trend data
router.get('/sleep/:userId/trend', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { days } = req.query;
  const trend = sleepTrackingService.getSleepTrend(userId, days ? parseInt(days as string) : 7);
  res.json(trend);
});

// GET /sleep/:userId/efficiency/:date - Get sleep efficiency
router.get('/sleep/:userId/efficiency/:date', (req: Request, res: Response) => {
  const { userId, date } = req.params;
  const record = sleepTrackingService.getSleepRecord(userId, date);
  if (!record) {
    return res.status(404).json({ error: 'Sleep record not found' });
  }
  const efficiency = sleepTrackingService.calculateSleepEfficiency(record);
  res.json({ recordId: record.recordId, date, efficiency });
});

// ============== GOALS ==============

// POST /goals - Set sleep goal
router.post('/goals', validateBody(SetGoalInputSchema), (req: Request, res: Response) => {
  try {
    const result = sleepGoalService.setGoal(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /goals/:userId - Get goal
router.get('/goals/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const goal = sleepGoalService.getGoal(userId);
  if (!goal) {
    return res.status(404).json({ error: 'No sleep goal found for this user' });
  }
  res.json(goal);
});

// PUT /goals/:goalId - Update goal
router.put('/goals/:goalId', validateBody(UpdateGoalInputSchema), (req: Request, res: Response) => {
  const { goalId } = req.params;
  const result = sleepGoalService.updateGoal(goalId, req.body);
  if (!result) {
    return res.status(404).json({ error: 'Goal not found' });
  }
  res.json(result);
});

// GET /goals/:userId/progress - Get goal progress
router.get('/goals/:userId/progress', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { days } = req.query;
  const progress = sleepGoalService.trackGoalProgress(userId, days ? parseInt(days as string) : 30);
  res.json(progress);
});

// DELETE /goals/:goalId - Delete goal
router.delete('/goals/:goalId', (req: Request, res: Response) => {
  const { goalId } = req.params;
  const deleted = sleepGoalService.deleteGoal(goalId);
  if (!deleted) {
    return res.status(404).json({ error: 'Goal not found' });
  }
  res.json({ message: 'Goal deleted successfully' });
});

// ============== INSIGHTS ==============

// GET /insights/:userId - Get insights
router.get('/insights/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const insights = sleepAnalysisService.generateInsights(userId);
  res.json({ insights, count: insights.length });
});

// GET /insights/:userId/disorders - Get disorder indicators
router.get('/insights/:userId/disorders', (req: Request, res: Response) => {
  const { userId } = req.params;
  const indicators = sleepAnalysisService.detectDisorders(userId);
  res.json({ indicators, count: indicators.length });
});

// ============== RECOMMENDATIONS ==============

// GET /recommendations/:userId - Get recommendations
router.get('/recommendations/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const recommendations = sleepImprovementService.getRecommendations(userId);
  const tips = sleepImprovementService.getSleepTips();
  const hygieneScore = sleepImprovementService.getSleepHygieneScore(userId);
  const bedtimeSuggestion = sleepImprovementService.suggestBedtime(userId);
  const improvementPlan = sleepImprovementService.getImprovementPlan(userId);
  res.json({ recommendations, tips, hygieneScore, bedtimeSuggestion, improvementPlan });
});

// GET /recommendations/:userId/bedtime - Get bedtime suggestion
router.get('/recommendations/:userId/bedtime', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { wakeTime } = req.query;
  const suggestion = sleepImprovementService.suggestBedtime(userId, wakeTime as string | undefined);
  res.json(suggestion);
});

// GET /recommendations/:userId/hygiene-score - Get hygiene score
router.get('/recommendations/:userId/hygiene-score', (req: Request, res: Response) => {
  const { userId } = req.params;
  const score = sleepImprovementService.getSleepHygieneScore(userId);
  res.json(score);
});

// GET /recommendations/tips - Get all sleep tips
router.get('/recommendations/tips', (req: Request, res: Response) => {
  const { category } = req.query;
  const tips = sleepImprovementService.getSleepTips(category as string | undefined);
  res.json({ tips, count: tips.length });
});

// ============== FACTORS ==============

// POST /factors - Log sleep factor
router.post('/factors', validateBody(LogFactorInputSchema), (req: Request, res: Response) => {
  try {
    const result = factorAnalysisService.logFactor(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /factors/:userId - Get factors
router.get('/factors/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { startDate, endDate, limit } = req.query;
  const factors = factorAnalysisService.getFactors(
    userId,
    startDate as string | undefined,
    endDate as string | undefined,
    limit ? parseInt(limit as string) : 30
  );
  res.json({ factors, count: factors.length });
});

// GET /factors/:userId/impact - Get factor impact analysis
router.get('/factors/:userId/impact', (req: Request, res: Response) => {
  const { userId } = req.params;
  const analysis = factorAnalysisService.analyzeFactorImpact(userId);
  res.json({ analysis, count: analysis.length });
});

// GET /factors/:userId/:type - Get factors by type
router.get('/factors/:userId/:type', (req: Request, res: Response) => {
  const { userId, type } = req.params;
  const { days } = req.query;
  const factors = factorAnalysisService.getFactorsByType(userId, type as any, days ? parseInt(days as string) : 30);
  res.json({ factors, count: factors.length });
});

// GET /factors/:userId/daily/:date - Get daily factor summary
router.get('/factors/:userId/daily/:date', (req: Request, res: Response) => {
  const { userId, date } = req.params;
  const summary = factorAnalysisService.getDailyFactorSummary(userId, date);
  res.json(summary);
});

// DELETE /factors/:factorId - Delete factor
router.delete('/factors/:factorId', (req: Request, res: Response) => {
  const { factorId } = req.params;
  const deleted = factorAnalysisService.deleteFactor(factorId);
  if (!deleted) {
    return res.status(404).json({ error: 'Factor not found' });
  }
  res.json({ message: 'Factor deleted successfully' });
});

// ============== DISORDERS ==============

// GET /disorders/:userId - Get disorders
router.get('/disorders/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const disorders: SleepDisorder[] = [];
  for (const disorder of sleepStorage.disorders.values()) {
    if (disorder.userId === userId) disorders.push(disorder);
  }
  disorders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ disorders, count: disorders.length });
});

// POST /disorders - Add disorder
router.post('/disorders', validateBody(AddDisorderInputSchema), (req: Request, res: Response) => {
  try {
    const disorderId = uuidv4();
    const now = new Date().toISOString();
    const disorder: SleepDisorder = {
      disorderId,
      userId: req.body.userId,
      type: req.body.type,
      severity: req.body.severity,
      diagnosedDate: req.body.diagnosedDate,
      status: req.body.status,
      notes: req.body.notes,
      createdAt: now,
      updatedAt: now
    };
    sleepStorage.disorders.set(disorderId, disorder);
    res.status(201).json(disorder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /disorders/:disorderId - Update disorder
router.put('/disorders/:disorderId', (req: Request, res: Response) => {
  const { disorderId } = req.params;
  const existing = sleepStorage.disorders.get(disorderId);
  if (!existing) {
    return res.status(404).json({ error: 'Disorder not found' });
  }
  const updated: SleepDisorder = { ...existing, ...req.body, disorderId, updatedAt: new Date().toISOString() };
  sleepStorage.disorders.set(disorderId, updated);
  res.json(updated);
});

// DELETE /disorders/:disorderId - Delete disorder
router.delete('/disorders/:disorderId', (req: Request, res: Response) => {
  const { disorderId } = req.params;
  const deleted = sleepStorage.disorders.delete(disorderId);
  if (!deleted) {
    return res.status(404).json({ error: 'Disorder not found' });
  }
  res.json({ message: 'Disorder deleted successfully' });
});

// ============== HEALTH ==============

// GET /health - Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-sleep',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    stats: {
      totalRecords: sleepStorage.records.size,
      totalGoals: sleepStorage.goals.size,
      totalInsights: sleepStorage.insights.size,
      totalDisorders: sleepStorage.disorders.size,
      totalFactors: sleepStorage.factors.size
    }
  });
});

export default router;
