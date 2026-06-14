import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { LaundryService } from './services/laundry.service.js';

const app = express();
const PORT = 4048;

app.use(cors());
app.use(express.json());

const laundryService = new LaundryService();

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-laundry-service',
    timestamp: new Date().toISOString(),
  });
});

// Create laundry order
app.post('/api/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId, guestName, guestPhone, items, serviceType, roomNumber, priority, notes } = req.body;
    const order = await laundryService.createOrder(hotelId, guestName, guestPhone, items, serviceType, roomNumber, priority, notes);
    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
});

// Get order by ID
app.get('/api/orders/:orderId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await laundryService.getOrder(req.params.orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
});

// Get hotel orders
app.get('/api/hotels/:hotelId/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = req.params;
    const status = req.query.status as any;
    const orders = await laundryService.getHotelOrders(hotelId, status);
    res.json({ success: true, orders, count: orders.length });
  } catch (error) {
    next(error);
  }
});

// Get room orders
app.get('/api/hotels/:hotelId/rooms/:roomNumber/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId, roomNumber } = req.params;
    const orders = await laundryService.getRoomOrders(hotelId, roomNumber);
    res.json({ success: true, orders, count: orders.length });
  } catch (error) {
    next(error);
  }
});

// Update order status
app.patch('/api/orders/:orderId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const order = await laundryService.updateStatus(req.params.orderId, status);
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Mark as picked up
app.post('/api/orders/:orderId/pickup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await laundryService.markPickedUp(req.params.orderId);
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Mark as ready
app.post('/api/orders/:orderId/ready', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await laundryService.markReady(req.params.orderId);
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Mark as delivered
app.post('/api/orders/:orderId/deliver', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await laundryService.markDelivered(req.params.orderId);
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel order
app.post('/api/orders/:orderId/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const order = await laundryService.cancelOrder(req.params.orderId, reason);
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Process payment
app.post('/api/orders/:orderId/payment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { method } = req.body;
    const order = await laundryService.processPayment(req.params.orderId, method);
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get active orders with stats
app.get('/api/hotels/:hotelId/orders/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = req.params;
    const data = await laundryService.getActiveOrders(hotelId);
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
});

// Get machine status
app.get('/api/machines', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const machines = await laundryService.getMachineStatus();
    res.json({ success: true, machines, count: machines.length });
  } catch (error) {
    next(error);
  }
});

// Get daily stats
app.get('/api/hotels/:hotelId/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = req.params;
    const { date } = req.query;
    const stats = await laundryService.getDailyStats(hotelId, date ? new Date(date as string) : undefined);
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`ReZ Laundry Service running on port ${PORT}`);
});

export default app;
