/**
 * REZ Dynamic Pricing Service
 * Real-time price adjustments based on demand, time, inventory
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

const priceSchema = new mongoose.Schema({
  merchantId: String, productId: String, basePrice: Number,
  currentPrice: Number, minPrice: Number, maxPrice: Number,
  demand: { type: String, enum: ['low', 'normal', 'high', 'surge'] },
  factors: [{ name: String, multiplier: Number }],
  updatedAt: Date
});
const DynamicPrice = mongoose.models.DynamicPrice || mongoose.model('DynamicPrice', priceSchema);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-dynamic-pricing-service', timestamp: new Date().toISOString() });
});

app.post('/api/price', async (req: Request, res: Response) => {
  const { merchantId, productId, basePrice, minPrice, maxPrice } = req.body;
  const price = new DynamicPrice({ merchantId, productId, basePrice, currentPrice: basePrice, minPrice, maxPrice, updatedAt: new Date() });
  await price.save();
  res.json({ success: true, data: price });
});

app.get('/api/price/:merchantId/:productId', async (req: Request, res: Response) => {
  const price = await DynamicPrice.findOne({ merchantId: req.params.merchantId, productId: req.params.productId });
  res.json({ success: true, data: price });
});

app.post('/api/calculate', async (req: Request, res: Response) => {
  const { basePrice, demand, time, inventory, dayOfWeek } = req.body;
  let price = basePrice || 100;
  if (demand === 'high') price *= 1.2;
  if (demand === 'surge') price *= 1.5;
  if (demand === 'low') price *= 0.85;
  if (inventory < 10) price *= 1.1;
  if (dayOfWeek === 6 || dayOfWeek === 0) price *= 1.15;
  res.json({ success: true, data: { basePrice, calculatedPrice: Math.round(price * 100) / 100, demand } });
});

app.put('/api/price/:id', async (req: Request, res: Response) => {
  const price = await DynamicPrice.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: price });
});

const PORT = process.env.PORT || 4040;
app.listen(PORT, () => logger.info(`rez-dynamic-pricing-service on port ${PORT}`));
export default app;
