import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import {
  getMenu,
  getMenuItem,
  createOrder,
  getOrder,
  getOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  type OrderStatus,
} from './services/room-order.service.js';

const app = express();
const PORT = 4043;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-room-service',
    timestamp: new Date().toISOString(),
  });
});

// Get menu
app.get('/api/menu', (_req: Request, res: Response) => {
  const menu = getMenu();
  res.json({ menu, count: menu.length });
});

app.get('/api/menu/:id', (req: Request, res: Response) => {
  const item = getMenuItem(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Menu item not found' });
    return;
  }
  res.json({ item });
});

// Create order
app.post('/api/orders', (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = createOrder(req.body);
    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
});

// Get order by ID
app.get('/api/orders/:id', (req: Request, res: Response) => {
  const order = getOrder(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json({ order });
});

// Get orders with filters
app.get('/api/orders', (req: Request, res: Response) => {
  const filters: { hotelId?: string; status?: OrderStatus; guestId?: string } = {};
  if (req.query.hotelId) filters.hotelId = req.query.hotelId as string;
  if (req.query.status) filters.status = req.query.status as OrderStatus;
  if (req.query.guestId) filters.guestId = req.query.guestId as string;

  const orders = getOrders(filters);
  res.json({ orders, count: orders.length });
});

// Update order status
app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const order = updateOrderStatus(req.params.id, status);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json({ success: true, order });
});

// Cancel order
app.post('/api/orders/:id/cancel', (req: Request, res: Response) => {
  const order = cancelOrder(req.params.id);
  if (!order) {
    res.status(400).json({ error: 'Cannot cancel order' });
    return;
  }
  res.json({ success: true, order });
});

// Get order statistics
app.get('/api/stats/:hotelId', (req: Request, res: Response) => {
  const stats = getOrderStats(req.params.hotelId);
  res.json({ stats });
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`ReZ Room Service running on port ${PORT}`);
});

export default app;
