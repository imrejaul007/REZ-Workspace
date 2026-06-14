/**
 * REZ Cross-Merchant Service
 * Features that work across multiple merchants
 * 
 * @author REZ Team
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.combine(winston.format.timestamp(), winston.format.json()), transports: [new winston.transports.Console()] });
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());

// Schemas
const crossMerchantOrderSchema = new mongoose.Schema({
  customerId: String, merchantIds: [String], items: Array, status: String, totalAmount: Number, createdAt: Date
});
const CrossMerchantOrder = mongoose.models.CrossMerchantOrder || mongoose.model('CrossMerchantOrder', crossMerchantOrderSchema);

const customerProfileSchema = new mongoose.Schema({
  customerId: String, name: String, email: String, phone: String, totalOrders: Number, totalSpent: Number
});
const CustomerProfile = mongoose.models.CustomerProfile || mongoose.model('CustomerProfile', customerProfileSchema);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'rez-cross-merchant-service' }));

// Multi-merchant orders
app.post('/api/orders', async (req: Request, res: Response) => {
  const order = new CrossMerchantOrder({ ...req.body, createdAt: new Date() });
  await order.save();
  res.json({ success: true, data: order });
});
app.get('/api/orders/:customerId', async (req: Request, res: Response) => {
  const orders = await CrossMerchantOrder.find({ customerId: req.params.customerId }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});
app.get('/api/orders/detail/:id', async (req: Request, res: Response) => {
  const order = await CrossMerchantOrder.findById(req.params.id);
  res.json({ success: true, data: order });
});

// Customer profiles across merchants
app.get('/api/customers/:customerId', async (req: Request, res: Response) => {
  const profile = await CustomerProfile.findOne({ customerId: req.params.customerId });
  res.json({ success: true, data: profile });
});
app.post('/api/customers', async (req: Request, res: Response) => {
  const profile = new CustomerProfile(req.body);
  await profile.save();
  res.json({ success: true, data: profile });
});
app.put('/api/customers/:customerId/activity', async (req: Request, res: Response) => {
  const { orderValue } = req.body;
  const profile = await CustomerProfile.findOneAndUpdate(
    { customerId: req.params.customerId },
    { $inc: { totalOrders: 1, totalSpent: orderValue || 0 } },
    { new: true }
  );
  res.json({ success: true, data: profile });
});

// Unified loyalty
app.get('/api/loyalty/:customerId/summary', async (req: Request, res: Response) => {
  res.json({ success: true, data: { points: 0, tier: 'Bronze', merchants: [] } });
});

// Wallet balance across merchants
app.get('/api/wallet/:customerId', async (req: Request, res: Response) => {
  res.json({ success: true, data: { balance: 0, currency: 'INR' } });
});
app.post('/api/wallet/topup', async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
});

const PORT = process.env.PORT || 4093;
app.listen(PORT, () => logger.info(`rez-cross-merchant-service on port ${PORT}`));
export default app;
