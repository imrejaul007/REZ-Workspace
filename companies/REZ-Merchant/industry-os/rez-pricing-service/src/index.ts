/**
 * REZ Pricing Service
 * Dynamic pricing engine
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console()] });
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());

const pricingSchema = new mongoose.Schema({
  merchantId: String, productId: String, productName: String,
  basePrice: Number, currentPrice: Number, currency: { type: String, default: 'INR' },
  minPrice: Number, maxPrice: Number,
  rules: [{ name: String, type: String, condition: Object, adjustment: Object, priority: Number }],
  pricingHistory: [{ price: Number, timestamp: Date, reason: String }],
  updatedAt: Date
});
const Pricing = mongoose.models.Pricing || mongoose.model('Pricing', pricingSchema);

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', service: 'rez-pricing-service' }));

app.post('/api/pricing', async (req: Request, res: Response) => {
  const pricing = new Pricing({ ...req.body, currentPrice: req.body.basePrice, updatedAt: new Date() });
  await pricing.save();
  res.json({ success: true, data: pricing });
});

app.get('/api/pricing/:merchantId/:productId', async (req: Request, res: Response) => {
  const pricing = await Pricing.findOne({ merchantId: req.params.merchantId, productId: req.params.productId });
  res.json({ success: true, data: pricing });
});

app.post('/api/calculate', async (req: Request, res: Response) => {
  const { merchantId, productId, quantity, customerId, time, location } = req.body;
  const pricing = await Pricing.findOne({ merchantId, productId });
  if (!pricing) return res.status(404).json({ success: false, error: 'Pricing not found' });
  
  let price = pricing.basePrice;
  // Apply rules (simplified)
  if (quantity > 5) price *= 0.95; // Bulk discount
  if (time) {
    const hour = new Date(time).getHours();
    if (hour >= 14 && hour <= 17) price *= 0.9; // Happy hour
  }
  
  price = Math.max(price, pricing.minPrice || 0);
  price = Math.min(price, pricing.maxPrice || price * 2);
  
  res.json({ success: true, data: { basePrice: pricing.basePrice, calculatedPrice: Math.round(price * 100) / 100, currency: pricing.currency } });
});

app.get('/api/pricing/:merchantId', async (req: Request, res: Response) => {
  const pricing = await Pricing.find({ merchantId: req.params.merchantId });
  res.json({ success: true, data: pricing });
});

app.put('/api/pricing/:id', async (req: Request, res: Response) => {
  const pricing = await Pricing.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: pricing });
});

const PORT = process.env.PORT || 4022;
app.listen(PORT, () => logger.info(`rez-pricing-service on port ${PORT}`));
export default app;
