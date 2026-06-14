/**
 * REZ Developer Portal Service
 * API documentation, keys, and developer tools
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Schemas
const apiKeySchema = new mongoose.Schema({
  key: String, name: String, merchantId: String,
  permissions: [String], rateLimit: Number,
  active: { type: Boolean, default: true },
  lastUsed: Date, createdAt: Date
});
const APIKey = mongoose.models.APIKey || mongoose.model('APIKey', apiKeySchema);

const usageSchema = new mongoose.Schema({
  keyId: mongoose.Schema.Types.ObjectId, endpoint: String,
  method: String, statusCode: Number,
  responseTime: Number, timestamp: Date
});
const Usage = mongoose.models.Usage || mongoose.models('Usage', usageSchema);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-developer-portal', timestamp: new Date().toISOString() });
});

// API Keys
app.post('/api/keys', async (req: Request, res: Response) => {
  const { name, merchantId, permissions, rateLimit } = req.body;
  const key = `rez_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const apiKey = new APIKey({ key, name, merchantId, permissions: permissions || ['read'], rateLimit: rateLimit || 100, createdAt: new Date() });
  await apiKey.save();
  logger.info('API key created', { merchantId, name });
  res.json({ success: true, data: { apiKey: key, name, permissions } });
});

app.get('/api/keys/:merchantId', async (req: Request, res: Response) => {
  const keys = await APIKey.find({ merchantId: req.params.merchantId }, '-key');
  res.json({ success: true, data: keys });
});

app.delete('/api/keys/:keyId', async (req: Request, res: Response) => {
  await APIKey.findByIdAndDelete(req.params.keyId);
  res.json({ success: true });
});

// Usage
app.get('/api/usage/:keyId', async (req: Request, res: Response) => {
  const { period = '24h' } = req.query;
  const since = period === '24h' ? Date.now() - 86400000 : Date.now() - 604800000;
  const usage = await Usage.find({ keyId: req.params.keyId, timestamp: { $gte: since } });
  const total = usage.length;
  const avgResponseTime = total > 0 ? usage.reduce((sum, u) => sum + u.responseTime, 0) / total : 0;
  const errors = usage.filter(u => u.statusCode >= 400).length;
  res.json({ success: true, data: { requests: total, avgResponseTime: Math.round(avgResponseTime), errors } });
});

// Docs
app.get('/api/docs', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: 'REZ Merchant API',
      version: 'v2.0',
      endpoints: [
        { path: '/api/businesses', method: 'GET', description: 'List businesses' },
        { path: '/api/orders', method: 'POST', description: 'Create order' },
        { path: '/api/menu', method: 'GET', description: 'Get menu' }
      ]
    }
  });
});

app.get('/api/rate-limits', (req: Request, res: Response) => {
  res.json({ success: true, data: { default: 100, authenticated: 1000, enterprise: 10000 } });
});

const PORT = process.env.PORT || 4100;
app.listen(PORT, () => logger.info(`rez-developer-portal on port ${PORT}`));
export default app;
