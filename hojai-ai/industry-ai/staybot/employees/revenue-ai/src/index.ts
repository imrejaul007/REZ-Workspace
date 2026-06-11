import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3010;

app.use(express.json());

// In-memory stores
const revenueRecords: Map<string, any> = new Map();
const revenueStreams: Map<string, any> = new Map();

// Initialize default revenue streams
const defaultStreams = [
  { id: 'rooms', name: 'Room Revenue', category: 'accommodation', percentage: 65 },
  { id: 'fnb', name: 'Food & Beverage', category: 'dining', percentage: 20 },
  { id: 'spa', name: 'Spa Services', category: 'wellness', percentage: 8 },
  { id: 'parking', name: 'Parking', category: 'facilities', percentage: 4 },
  { id: 'other', name: 'Other Services', category: 'misc', percentage: 3 }
];

defaultStreams.forEach(s => revenueStreams.set(s.id, s));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'revenue-ai', timestamp: new Date().toISOString() });
});

// Get all revenue streams
app.get('/api/revenue/streams', (_req: Request, res: Response) => {
  const streams = Array.from(revenueStreams.values());
  res.json({ success: true, count: streams.length, data: streams });
});

// Add revenue stream
app.post('/api/revenue/streams', (req: Request, res: Response) => {
  const { name, category, percentage } = req.body;

  if (!name) {
    res.status(400).json({ success: false, error: 'name is required' });
    return;
  }

  const stream = {
    id: uuidv4(),
    name,
    category: category || 'misc',
    percentage: percentage || 0,
    totalRevenue: 0,
    createdAt: new Date().toISOString()
  };

  revenueStreams.set(stream.id, stream);
  res.status(201).json({ success: true, data: stream });
});

// Get all revenue records
app.get('/api/revenue', (req: Request, res: Response) => {
  const { streamId, startDate, endDate } = req.query;
  let filtered = Array.from(revenueRecords.values());

  if (streamId) {
    filtered = filtered.filter((r: any) => r.streamId === streamId);
  }
  if (startDate) {
    filtered = filtered.filter((r: any) => new Date(r.date) >= new Date(startDate as string));
  }
  if (endDate) {
    filtered = filtered.filter((r: any) => new Date(r.date) <= new Date(endDate as string));
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Record revenue
app.post('/api/revenue', (req: Request, res: Response) => {
  const { streamId, amount, source, description, date } = req.body;

  if (!streamId || amount === undefined) {
    res.status(400).json({ success: false, error: 'streamId and amount are required' });
    return;
  }

  const stream = revenueStreams.get(streamId);
  if (!stream) {
    res.status(404).json({ success: false, error: 'Revenue stream not found' });
    return;
  }

  const record = {
    id: uuidv4(),
    streamId,
    streamName: stream.name,
    amount: parseFloat(amount),
    source: source || 'manual',
    description: description || '',
    date: date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };

  revenueRecords.set(record.id, record);

  // Update stream total
  stream.totalRevenue = (stream.totalRevenue || 0) + record.amount;
  revenueStreams.set(streamId, stream);

  res.status(201).json({ success: true, data: record });
});

// Get revenue summary
app.get('/api/revenue/summary', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  let records = Array.from(revenueRecords.values());

  if (startDate) {
    records = records.filter((r: any) => new Date(r.date) >= new Date(startDate as string));
  }
  if (endDate) {
    records = records.filter((r: any) => new Date(r.date) <= new Date(endDate as string));
  }

  const totalRevenue = records.reduce((sum: number, r: any) => sum + r.amount, 0);

  // Revenue by stream
  const byStream: Record<string, number> = {};
  records.forEach((r: any) => {
    byStream[r.streamId] = (byStream[r.streamId] || 0) + r.amount;
  });

  // Revenue by date
  const byDate: Record<string, number> = {};
  records.forEach((r: any) => {
    byDate[r.date] = (byDate[r.date] || 0) + r.amount;
  });

  res.json({
    success: true,
    data: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      recordCount: records.length,
      byStream,
      byDate,
      averagePerDay: records.length > 0 ? Math.round(totalRevenue / Object.keys(byDate).length * 100) / 100 : 0
    }
  });
});

// Delete revenue record
app.delete('/api/revenue/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = revenueRecords.delete(id);

  if (deleted) {
    res.json({ success: true, message: 'Revenue record deleted' });
  } else {
    res.status(404).json({ success: false, error: 'Revenue record not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Revenue AI service running on port ${PORT}`);
});

export default app;