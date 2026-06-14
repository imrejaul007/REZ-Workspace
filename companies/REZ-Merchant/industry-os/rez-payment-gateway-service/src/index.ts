/**
 * REZ Payment Gateway Service
 * Unified payment processing
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console()] });
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());

const transactionSchema = new mongoose.Schema({
  merchantId: String, orderId: String, customerId: String,
  amount: Number, currency: { type: String, default: 'INR' },
  method: { type: String, enum: ['upi', 'card', 'netbanking', 'wallet', 'cash'] },
  status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'] },
  gateway: String, gatewayTxnId: String,
  paymentDetails: mongoose.Schema.Types.Mixed,
  createdAt: Date, updatedAt: Date
});
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', service: 'rez-payment-gateway-service' }));

app.post('/api/payments/initiate', async (req: Request, res: Response) => {
  const { merchantId, orderId, amount, currency, method, customerId } = req.body;
  const txn = new Transaction({ merchantId, orderId, amount, currency: currency || 'INR', method, customerId, status: 'pending', createdAt: new Date() });
  await txn.save();
  // Mock gateway response
  res.json({ success: true, data: { transactionId: txn._id, amount, status: 'pending' } });
});

app.post('/api/payments/confirm', async (req: Request, res: Response) => {
  const { transactionId, gatewayTxnId } = req.body;
  const txn = await Transaction.findByIdAndUpdate(transactionId, { status: 'success', gatewayTxnId, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: txn });
});

app.post('/api/payments/refund', async (req: Request, res: Response) => {
  const { transactionId, amount } = req.body;
  const txn = await Transaction.findByIdAndUpdate(transactionId, { status: 'refunded', updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: txn });
});

app.get('/api/payments/:transactionId', async (req: Request, res: Response) => {
  const txn = await Transaction.findById(req.params.transactionId);
  res.json({ success: true, data: txn });
});

app.get('/api/payments/merchant/:merchantId', async (req: Request, res: Response) => {
  const { status, startDate, endDate } = req.query;
  const query: any = { merchantId: req.params.merchantId };
  if (status) query.status = status;
  const txns = await Transaction.find(query).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: txns });
});

const PORT = process.env.PORT || 4032;
app.listen(PORT, () => logger.info(`rez-payment-gateway-service on port ${PORT}`));
export default app;
