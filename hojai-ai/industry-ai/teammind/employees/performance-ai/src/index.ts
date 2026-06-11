import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

// In-memory store for performance data
const performanceMetrics: Map<string, any> = new Map();

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'performance-ai', timestamp: new Date().toISOString() });
});

// Get all performance metrics
app.get('/api/performance', (_req: Request, res: Response) => {
  const metrics = Array.from(performanceMetrics.values());
  res.json({ success: true, count: metrics.length, data: metrics });
});

// Get employee performance by ID
app.get('/api/performance/:employeeId', (req: Request, res: Response) => {
  const { employeeId } = req.params;
  const metrics = Array.from(performanceMetrics.values()).filter(
    (m: any) => m.employeeId === employeeId
  );
  res.json({ success: true, employeeId, metrics });
});

// Create performance record
app.post('/api/performance', (req: Request, res: Response) => {
  const { employeeId, score, kpis, reviewPeriod } = req.body;

  if (!employeeId || score === undefined) {
    res.status(400).json({ success: false, error: 'employeeId and score are required' });
    return;
  }

  const record = {
    id: uuidv4(),
    employeeId,
    score: Math.min(100, Math.max(0, score)),
    kpis: kpis || {},
    reviewPeriod: reviewPeriod || 'monthly',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  performanceMetrics.set(record.id, record);
  res.status(201).json({ success: true, data: record });
});

// Update performance record
app.put('/api/performance/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = performanceMetrics.get(id);

  if (!existing) {
    res.status(404).json({ success: false, error: 'Performance record not found' });
    return;
  }

  const { score, kpis, reviewPeriod } = req.body;
  const updated = {
    ...existing,
    ...(score !== undefined && { score: Math.min(100, Math.max(0, score)) }),
    ...(kpis !== undefined && { kpis }),
    ...(reviewPeriod !== undefined && { reviewPeriod }),
    updatedAt: new Date().toISOString()
  };

  performanceMetrics.set(id, updated);
  res.json({ success: true, data: updated });
});

// Get KPI summary for team
app.get('/api/performance/kpi/summary', (_req: Request, res: Response) => {
  const metrics = Array.from(performanceMetrics.values());
  const avgScore = metrics.length > 0
    ? metrics.reduce((sum: number, m: any) => sum + m.score, 0) / metrics.length
    : 0;

  res.json({
    success: true,
    data: {
      totalRecords: metrics.length,
      averageScore: Math.round(avgScore * 100) / 100,
      topPerformers: metrics.filter((m: any) => m.score >= 80).length,
      needsImprovement: metrics.filter((m: any) => m.score < 60).length
    }
  });
});

// Delete performance record
app.delete('/api/performance/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = performanceMetrics.delete(id);

  if (deleted) {
    res.json({ success: true, message: 'Performance record deleted' });
  } else {
    res.status(404).json({ success: false, error: 'Performance record not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Performance AI service running on port ${PORT}`);
});

export default app;