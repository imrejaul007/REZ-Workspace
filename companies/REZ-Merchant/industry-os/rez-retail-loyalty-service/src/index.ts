/**
 * REZ Retail Loyalty Service
 * Loyalty program for retail stores
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

const customerSchema = new mongoose.Schema({
  merchantId: String, phone: String, email: String, name: String,
  points: { type: Number, default: 0 }, tier: { type: String, enum: ['Silver', 'Gold', 'Platinum'], default: 'Silver' },
  transactions: [{ date: Date, amount: Number, points: Number, orderId: String }],
  createdAt: Date, updatedAt: Date
});
const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-retail-loyalty-service', timestamp: new Date().toISOString() });
});

app.post('/api/register', async (req: Request, res: Response) => {
  const { merchantId, phone, email, name } = req.body;
  let customer = await Customer.findOne({ merchantId, phone });
  if (customer) return res.json({ success: true, data: customer, message: 'Already registered' });
  customer = new Customer({ merchantId, phone, email, name, createdAt: new Date() });
  await customer.save();
  res.json({ success: true, data: customer });
});

app.post('/api/earn', async (req: Request, res: Response) => {
  const { merchantId, phone, amount, orderId } = req.body;
  const customer = await Customer.findOne({ merchantId, phone });
  if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
  const points = Math.floor(amount);
  customer.points += points;
  customer.transactions.push({ date: new Date(), amount, points, orderId });
  if (customer.points >= 10000) customer.tier = 'Platinum';
  else if (customer.points >= 5000) customer.tier = 'Gold';
  await customer.save();
  res.json({ success: true, data: { points: customer.points, tier: customer.tier, earned: points } });
});

app.post('/api/redeem', async (req: Request, res: Response) => {
  const { merchantId, phone, points } = req.body;
  const customer = await Customer.findOne({ merchantId, phone });
  if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
  if (customer.points < points) return res.status(400).json({ success: false, error: 'Insufficient points' });
  customer.points -= points;
  await customer.save();
  res.json({ success: true, data: { points: customer.points, redeemed: points } });
});

app.get('/api/customer/:merchantId/:phone', async (req: Request, res: Response) => {
  const customer = await Customer.findOne({ merchantId: req.params.merchantId, phone: req.params.phone });
  if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
  res.json({ success: true, data: customer });
});

app.get('/api/tiers', (req: Request, res: Response) => {
  res.json({ success: true, data: [{ tier: 'Silver', minPoints: 0, discount: 0 }, { tier: 'Gold', minPoints: 5000, discount: 5 }, { tier: 'Platinum', minPoints: 10000, discount: 10 }] });
});

const PORT = process.env.PORT || 4051;
app.listen(PORT, () => logger.info(`rez-retail-loyalty-service on port ${PORT}`));
export default app;
