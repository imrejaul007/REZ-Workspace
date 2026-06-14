/**
 * Drive-thru KDS Service
 * Multi-lane drive-thru order management
 */

import express from 'express';
import logger from './utils/logger';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: (process.env.ALLOWED_ORIGINS || 'https://rez.money').split(','),
    credentials: true
  }
});

app.use(express.json());

interface DriveThruLane {
  laneId: string;
  name: string;
  orders: DriveThruOrder[];
  status: 'open' | 'closed' | 'busy';
  avgWaitTime: number;
}

interface DriveThruOrder {
  orderId: string;
  vehicleId: string;
  items: unknown[];
  status: 'new' | 'preparing' | 'ready' | 'delivered';
  timestamp: Date;
  slaDeadline: Date;
  priority: 'normal' | 'rush';
}

const lanes = new Map<string, DriveThruLane>();

// Initialize lanes
lanes.set('lane1', { laneId: 'lane1', name: 'Lane 1', orders: [], status: 'open', avgWaitTime: 0 });
lanes.set('lane2', { laneId: 'lane2', name: 'Lane 2', orders: [], status: 'open', avgWaitTime: 0 });

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'rez-drive-thru-kds', lanes: lanes.size });
});

app.get('/api/lanes', (_req, res) => {
  const data = Array.from(lanes.values()).map(lane => ({
    ...lane,
    orderCount: lane.orders.length,
    orders: lane.orders.slice(0, 5),
  }));
  res.json({ success: true, data });
});

app.get('/api/lanes/:laneId', (req, res) => {
  const lane = lanes.get(req.params.laneId);
  if (!lane) {
    res.status(404).json({ success: false, error: 'Lane not found' });
    return;
  }
  res.json({ success: true, data: lane });
});

app.post('/api/lanes/:laneId/orders', (req, res) => {
  const lane = lanes.get(req.params.laneId);
  if (!lane) {
    res.status(404).json({ success: false, error: 'Lane not found' });
    return;
  }

  const order: DriveThruOrder = {
    orderId: req.body.orderId || `DT-${Date.now()}`,
    vehicleId: req.body.vehicleId || 'unknown',
    items: req.body.items || [],
    status: 'new',
    timestamp: new Date(),
    slaDeadline: new Date(Date.now() + 10 * 60 * 1000),
    priority: req.body.priority || 'normal',
  };

  lane.orders.push(order);
  io.emit('new_order', { laneId: lane.laneId, order });

  res.status(201).json({ success: true, data: order });
});

app.patch('/api/lanes/:laneId/orders/:orderId', (req, res) => {
  const lane = lanes.get(req.params.laneId);
  if (!lane) {
    res.status(404).json({ success: false, error: 'Lane not found' });
    return;
  }

  const order = lane.orders.find(o => o.orderId === req.params.orderId);
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  order.status = req.body.status;
  io.emit('order_update', { laneId: lane.laneId, order });
  res.json({ success: true, data: order });
});

app.delete('/api/lanes/:laneId/orders/:orderId', (req, res) => {
  const lane = lanes.get(req.params.laneId);
  if (!lane) {
    res.status(404).json({ success: false, error: 'Lane not found' });
    return;
  }

  const idx = lane.orders.findIndex(o => o.orderId === req.params.orderId);
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  const [completed] = lane.orders.splice(idx, 1);
  io.emit('order_completed', { laneId: lane.laneId, order: completed });
  res.json({ success: true, data: completed });
});

app.get('/api/lanes/:laneId/stats', (req, res) => {
  const lane = lanes.get(req.params.laneId);
  if (!lane) {
    res.status(404).json({ success: false, error: 'Lane not found' });
    return;
  }

  const now = Date.now();
  const onTime = lane.orders.filter(o => o.slaDeadline.getTime() > now).length;
  const breached = lane.orders.length - onTime;

  res.json({
    success: true,
    data: {
      laneId: lane.laneId,
      activeOrders: lane.orders.length,
      onTime,
      breached,
      onTimePercentage: lane.orders.length > 0 ? Math.round((onTime / lane.orders.length) * 100) : 100,
    },
  });
});

io.on('connection', socket => {
  console.log('Display connected:', socket.id);

  socket.on('subscribe', laneId => {
    socket.join(`lane_${laneId}`);
  });

  socket.on('unsubscribe', laneId => {
    socket.leave(`lane_${laneId}`);
  });
});

const PORT = process.env.PORT || 4037;
httpServer.listen(PORT, () => logger.info(`Drive-thru KDS on ${PORT}`));
