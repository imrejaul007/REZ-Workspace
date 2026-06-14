/**
 * REZ KDS Mobile Service
 * Kitchen Display System mobile backend
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin: '*' } });

app.use(helmet());
app.use(cors());
app.use(express.json());

// Schemas
const kdsOrderSchema = new mongoose.Schema({
  orderId: String, merchantId: String, tableId: String,
  items: [{ name: String, qty: Number, notes: String, status: String }],
  status: { type: String, enum: ['pending', 'preparing', 'ready', 'served'], default: 'pending' },
  priority: { type: Number, default: 0 },
  estimatedTime: Number,
  createdAt: Date, startedAt: Date, readyAt: Date
});
const KDSOrder = mongoose.models.KDSOrder || mongoose.model('KDSOrder', kdsOrderSchema);

const stationSchema = new mongoose.Schema({
  merchantId: String, name: String, type: String, capacity: Number
});
const Station = mongoose.models.Station || mongoose.model('Station', stationSchema);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'REZ-kds-mobile' }));

// Orders
app.post('/api/orders', async (req, res) => {
  const order = new KDSOrder({ ...req.body, createdAt: new Date() });
  await order.save();
  io.to(`kitchen-${req.body.merchantId}`).emit('new-order', order);
  res.json({ success: true, data: order });
});

app.get('/api/orders/:merchantId', async (req, res) => {
  const orders = await KDSOrder.find({ merchantId: req.params.merchantId, status: { $ne: 'served' } }).sort({ priority: -1, createdAt: 1 });
  res.json({ success: true, data: orders });
});

app.put('/api/orders/:id/start', async (req, res) => {
  const order = await KDSOrder.findByIdAndUpdate(req.params.id, { status: 'preparing', startedAt: new Date() }, { new: true });
  io.to(`kitchen-${order.merchantId}`).emit('order-started', order);
  res.json({ success: true, data: order });
});

app.put('/api/orders/:id/ready', async (req, res) => {
  const order = await KDSOrder.findByIdAndUpdate(req.params.id, { status: 'ready', readyAt: new Date() }, { new: true });
  io.to(`kitchen-${order.merchantId}`).emit('order-ready', order);
  res.json({ success: true, data: order });
});

app.put('/api/orders/:id/bump', async (req, res) => {
  const order = await KDSOrder.findByIdAndUpdate(req.params.id, { status: 'served' }, { new: true });
  io.to(`kitchen-${order.merchantId}`).emit('order-bumped', order);
  res.json({ success: true, data: order });
});

app.put('/api/orders/:id/priority', async (req, res) => {
  const { priority } = req.body;
  const order = await KDSOrder.findByIdAndUpdate(req.params.id, { priority }, { new: true });
  io.to(`kitchen-${order.merchantId}`).emit('priority-changed', order);
  res.json({ success: true, data: order });
});

// Stations
app.get('/api/stations/:merchantId', async (req, res) => {
  const stations = await Station.find({ merchantId: req.params.merchantId });
  res.json({ success: true, data: stations });
});

app.post('/api/stations', async (req, res) => {
  const station = new Station(req.body);
  await station.save();
  res.json({ success: true, data: station });
});

// Socket.IO
io.on('connection', (socket) => {
  socket.on('join-kitchen', (merchantId) => {
    socket.join(`kitchen-${merchantId}`);
    logger.info('KDS mobile client joined', { merchantId });
  });
  socket.on('order-update', (data) => {
    io.to(`kitchen-${data.merchantId}`).emit('order-update', data);
  });
  socket.on('station-update', (data) => {
    io.to(`kitchen-${data.merchantId}`).emit('station-update', data);
  });
});

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => logger.info(`REZ-kds-mobile running on port ${PORT}`));

export default app;
