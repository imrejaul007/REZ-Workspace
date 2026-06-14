/**
 * REZ Drive-Thru KDS Service
 * Kitchen display for drive-thru restaurants
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose';
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

const orderSchema = new mongoose.Schema({
  orderId: String, merchantId: String, vehicleId: String,
  items: [{ name: String, qty: Number, notes: String }],
  status: { type: String, enum: ['received', 'preparing', 'ready', 'delivered'] },
  lane: Number, position: Number, estimatedTime: Number,
  arrivedAt: Date, readyAt: Date, deliveredAt: Date
});
const DriveThruOrder = mongoose.models.DriveThruOrder || mongoose.model('DriveThruOrder', orderSchema);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-drive-thru-kds', timestamp: new Date().toISOString() });
});

app.post('/api/orders', async (req: Request, res: Response) => {
  const order = new DriveThruOrder({ ...req.body, arrivedAt: new Date() });
  await order.save();
  io.to(`drive-thru-${req.body.merchantId}`).emit('new-order', order);
  res.json({ success: true, data: order });
});

app.get('/api/orders/:merchantId', async (req: Request, res: Response) => {
  const orders = await DriveThruOrder.find({ merchantId: req.params.merchantId, status: { $ne: 'delivered' } }).sort({ arrivedAt: -1 });
  res.json({ success: true, data: orders });
});

app.put('/api/orders/:id/status', async (req: Request, res: Response) => {
  const { status } = req.body;
  const update: any = { status };
  if (status === 'ready') update.readyAt = new Date();
  if (status === 'delivered') update.deliveredAt = new Date();
  const order = await DriveThruOrder.findByIdAndUpdate(req.params.id, update, { new: true });
  io.to(`drive-thru-${order.merchantId}`).emit('order-update', order);
  res.json({ success: true, data: order });
});

io.on('connection', (socket) => {
  socket.on('join-kitchen', (merchantId) => socket.join(`drive-thru-${merchantId}`));
});

const PORT = process.env.PORT || 4066;
server.listen(PORT, () => logger.info(`rez-drive-thru-kds on port ${PORT}`));
export default app;
