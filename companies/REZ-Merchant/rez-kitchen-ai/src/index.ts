/**
 * REZ Kitchen AI Service
 * AI-powered kitchen optimization and order analysis
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import http from 'http';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(helmet());
app.use(cors());
app.use(express.json());

// Schemas
const kitchenMetricsSchema = new mongoose.Schema({
  orderId: String, merchantId: String, status: String,
  startTime: Date, endTime: Date, items: Number, priority: Number,
  predictedTime: Number, actualTime: Number, station: String
});
const KitchenMetrics = mongoose.models.KitchenMetrics || mongoose.model('KitchenMetrics', kitchenMetricsSchema);

const stationSchema = new mongoose.Schema({
  merchantId: String, name: String, type: String,
  capacity: Number, currentLoad: Number,
  status: { type: String, enum: ['active', 'idle', 'maintenance'] }
});
const Station = mongoose.models.Station || mongoose.model('Station', stationSchema);

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-kitchen-ai', timestamp: new Date().toISOString() });
});

app.post('/api/analyze-order', async (req: Request, res: Response) => {
  try {
    const { orderId, items, merchantId } = req.body;
    const complexity = items.length * 2 + Math.floor(Math.random() * 5);
    const predictedTime = complexity * 1.5;
    const suggestions = [
      items.length > 5 ? 'Consider splitting into multiple batches' : null,
      items.some((i: string) => i.includes('biryani') || i.includes('pizza')) ? 'Start with items that have longer prep time' : null,
      'Prioritize hot items last',
      'Delegate prep work early'
    ].filter(Boolean);
    
    res.json({ success: true, data: { orderId, complexity, predictedTime: Math.round(predictedTime), station: `station-${(complexity % 3) + 1}`, suggestions } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/optimize-station', async (req: Request, res: Response) => {
  try {
    const { orders } = req.body;
    const sorted = orders.sort((a: any, b: any) => b.priority - a.priority || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const optimized = sorted.map((order: any, i: number) => ({ ...order, station: `station-${(i % 3) + 1}`, queuePosition: i + 1 }));
    res.json({ success: true, data: optimized });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/metrics/:merchantId', async (req: Request, res: Response) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const metrics = await KitchenMetrics.find({ merchantId: req.params.merchantId, startTime: { $gte: since } }).limit(100);
    const avgTime = metrics.length > 0 ? metrics.reduce((sum, m) => sum + (m.actualTime || 0), 0) / metrics.length : 0;
    res.json({ success: true, data: { totalOrders: metrics.length, avgCookingTime: Math.round(avgTime), metrics } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/predict-volume', async (req: Request, res: Response) => {
  try {
    const { merchantId, time } = req.body;
    const hour = new Date(time).getHours();
    let predicted = 10;
    if (hour >= 12 && hour <= 14) predicted = 25;
    else if (hour >= 19 && hour <= 21) predicted = 30;
    else if (hour >= 6 && hour <= 9) predicted = 15;
    res.json({ success: true, data: { predictedOrders: predicted, confidence: 0.85, timeSlot: `${hour}:00 - ${hour + 1}:00` } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/stations/:merchantId', async (req: Request, res: Response) => {
  try {
    const stations = await Station.find({ merchantId: req.params.merchantId });
    res.json({ success: true, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Socket.IO
io.on('connection', (socket) => {
  logger.info('Kitchen AI client connected', { socketId: socket.id });
  socket.on('join-kitchen', (merchantId: string) => {
    socket.join(`kitchen-${merchantId}`);
  });
  socket.on('order-update', (data: any) => {
    io.to(`kitchen-${data.merchantId}`).emit('kitchen-update', data);
  });
});

const PORT = process.env.PORT || 4082;
server.listen(PORT, () => logger.info(`rez-kitchen-ai running on port ${PORT}`));

export default app;
