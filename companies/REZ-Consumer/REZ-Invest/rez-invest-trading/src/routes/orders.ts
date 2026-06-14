import { Router, Request, Response } from 'express';
import { z } from 'zod';

export const ordersRouter = Router();

// Types
type OrderType = 'market' | 'limit' | 'stop_loss' | 'stop_loss_m';
type OrderSide = 'buy' | 'sell';
type ProductType = 'CNC' | 'INTRADAY' | 'MTF';
type OrderStatus = 'pending' | 'open' | 'completed' | 'cancelled' | 'rejected';

interface Order {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  orderType: OrderType;
  side: OrderSide;
  productType: ProductType;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  status: OrderStatus;
  filledQty: number;
  avgPrice: number;
  createdAt: Date;
  updatedAt: Date;
  exchangeOrderId?: string;
}

interface SIP {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  status: 'active' | 'paused' | 'cancelled';
  nextRunDate: Date;
  lastRunDate?: Date;
}

// Mock data store
const orders: Order[] = [
  {
    id: 'ord_001',
    userId: 'user_123',
    symbol: 'RELIANCE',
    name: 'Reliance Industries',
    exchange: 'NSE',
    orderType: 'limit',
    side: 'buy',
    productType: 'CNC',
    quantity: 10,
    price: 2500,
    status: 'completed',
    filledQty: 10,
    avgPrice: 2500,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    exchangeOrderId: 'NSE_ORD_12345',
  },
  {
    id: 'ord_002',
    userId: 'user_123',
    symbol: 'HDFCBANK',
    name: 'HDFC Bank',
    exchange: 'NSE',
    orderType: 'market',
    side: 'buy',
    productType: 'INTRADAY',
    quantity: 50,
    status: 'completed',
    filledQty: 50,
    avgPrice: 1720,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'ord_003',
    userId: 'user_123',
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    exchange: 'NSE',
    orderType: 'stop_loss',
    side: 'sell',
    productType: 'CNC',
    quantity: 5,
    price: 3850,
    triggerPrice: 3800,
    status: 'open',
    filledQty: 0,
    avgPrice: 0,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

const sips: SIP[] = [
  {
    id: 'sip_001',
    userId: 'user_123',
    symbol: 'ICICIPRULI',
    name: 'ICICI Prudential Bluechip Fund',
    amount: 5000,
    frequency: 'monthly',
    status: 'active',
    nextRunDate: new Date('2024-02-01'),
    lastRunDate: new Date('2024-01-01'),
  },
];

// Validation schemas
const placeOrderSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  exchange: z.enum(['NSE', 'BSE']),
  orderType: z.enum(['market', 'limit', 'stop_loss', 'stop_loss_m']),
  side: z.enum(['buy', 'sell']),
  productType: z.enum(['CNC', 'INTRADAY', 'MTF']),
  quantity: z.number().int().positive(),
  price: z.number().positive().optional(),
  triggerPrice: z.number().positive().optional(),
});

const modifyOrderSchema = z.object({
  quantity: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
  triggerPrice: z.number().positive().optional(),
});

const createSIPSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().positive().min(100),
  frequency: z.enum(['weekly', 'monthly', 'quarterly']),
});

// Get all orders
ordersRouter.get('/', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const userOrders = orders.filter((o) => o.userId === userId);

  const pending = userOrders.filter((o) => o.status === 'pending' || o.status === 'open').length;
  const completed = userOrders.filter((o) => o.status === 'completed').length;

  res.json({
    success: true,
    orders: userOrders,
    summary: {
      total: userOrders.length,
      pending,
      completed,
    },
  });
});

// Get order by ID
ordersRouter.get('/:id', (req: Request, res: Response) => {
  const orderId = req.params.id;
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json({
    success: true,
    order,
  });
});

// Place new order
ordersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = placeOrderSchema.parse(req.body);

    const orderId = `ord_${Date.now()}`;
    const newOrder: Order = {
      id: orderId,
      userId,
      ...data,
      status: data.orderType === 'market' ? 'pending' : 'open',
      filledQty: 0,
      avgPrice: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    orders.push(newOrder);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: newOrder,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Modify order
ordersRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const data = modifyOrderSchema.parse(req.body);

    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot modify completed or cancelled order' });
    }

    if (data.quantity) order.quantity = data.quantity;
    if (data.price) order.price = data.price;
    if (data.triggerPrice) order.triggerPrice = data.triggerPrice;
    order.updatedAt = new Date();

    res.json({
      success: true,
      message: 'Order modified successfully',
      order,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel order
ordersRouter.delete('/:id', (req: Request, res: Response) => {
  const orderId = req.params.id;
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.status === 'completed') {
    return res.status(400).json({ error: 'Cannot cancel completed order' });
  }

  order.status = 'cancelled';
  order.updatedAt = new Date();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    order,
  });
});

// Get order book (open orders)
ordersRouter.get('/book/open', (_req: Request, res: Response) => {
  const openOrders = orders.filter(
    (o) => o.status === 'open' || o.status === 'pending'
  );

  res.json({
    success: true,
    orders: openOrders,
    count: openOrders.length,
  });
});

// Get SIPs
ordersRouter.get('/sip/all', (_req: Request, res: Response) => {
  const userId = 'user_123';
  const userSips = sips.filter((s) => s.userId === userId);

  res.json({
    success: true,
    sips: userSips,
    count: userSips.length,
  });
});

// Create SIP
ordersRouter.post('/sip', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = createSIPSchema.parse(req.body);

    const sip: SIP = {
      id: `sip_${Date.now()}`,
      userId,
      ...data,
      status: 'active',
      nextRunDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    sips.push(sip);

    res.status(201).json({
      success: true,
      message: 'SIP created successfully',
      sip,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Modify SIP
ordersRouter.put('/sip/:id', async (req: Request, res: Response) => {
  try {
    const sipId = req.params.id;
    const sip = sips.find((s) => s.id === sipId);

    if (!sip) {
      return res.status(404).json({ error: 'SIP not found' });
    }

    const { amount, frequency, status } = req.body;
    if (amount) sip.amount = amount;
    if (frequency) sip.frequency = frequency;
    if (status) sip.status = status;

    res.json({
      success: true,
      message: 'SIP updated successfully',
      sip,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel SIP
ordersRouter.delete('/sip/:id', (req: Request, res: Response) => {
  const sipId = req.params.id;
  const sip = sips.find((s) => s.id === sipId);

  if (!sip) {
    return res.status(404).json({ error: 'SIP not found' });
  }

  sip.status = 'cancelled';

  res.json({
    success: true,
    message: 'SIP cancelled successfully',
    sip,
  });
});
