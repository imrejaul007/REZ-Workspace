/**
 * REZ Self-Kiosk Service
 * Self-service ordering kiosk
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console()] });
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());

const kioskOrderSchema = new mongoose.Schema({
  kioskId: String, merchantId: String, tableId: String,
  items: [{ productId: String, name: String, qty: Number, price: Number }],
  subtotal: Number, tax: Number, total: Number,
  status: { type: String, enum: ['cart', 'ordering', 'paid', 'preparing', 'ready', 'completed'] },
  paymentMethod: String, paymentStatus: String,
  createdAt: Date, completedAt: Date
});
const KioskOrder = mongoose.models.KioskOrder || mongoose.model('KioskOrder', kioskOrderSchema);

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', service: 'rez-self-kiosk' }));

// Menu
app.get('/api/menu/:merchantId', async (req: Request, res: Response) => {
  res.json({ success: true, data: { categories: [], items: [] } });
});

// Order
app.post('/api/orders', async (req: Request, res: Response) => {
  const order = new KioskOrder({ ...req.body, status: 'cart', createdAt: new Date() });
  await order.save();
  res.json({ success: true, data: order });
});

app.get('/api/orders/:id', async (req: Request, res: Response) => {
  const order = await KioskOrder.findById(req.params.id);
  res.json({ success: true, data: order });
});

app.put('/api/orders/:id/items', async (req: Request, res: Response) => {
  const { items } = req.body;
  const order = await KioskOrder.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false });
  order.items = items;
  order.subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  order.total = order.subtotal * 1.18;
  order.status = 'ordering';
  await order.save();
  res.json({ success: true, data: order });
});

app.post('/api/orders/:id/pay', async (req: Request, res: Response) => {
  const { method } = req.body;
  const order = await KioskOrder.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false });
  order.paymentMethod = method;
  order.paymentStatus = 'success';
  order.status = 'paid';
  await order.save();
  res.json({ success: true, data: order });
});

app.get('/api/status/:kioskId', async (req: Request, res: Response) => {
  const orders = await KioskOrder.find({ kioskId: req.params.kioskId, status: { $in: ['preparing', 'ready'] } }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

const PORT = process.env.PORT || 3050;
app.listen(PORT, () => logger.info(`rez-self-kiosk on port ${PORT}`));
export default app;
