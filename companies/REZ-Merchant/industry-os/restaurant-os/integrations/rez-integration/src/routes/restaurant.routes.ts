/**
 * Restaurant Routes
 * Unified API for restaurant operations
 */

import { Router, Request, Response } from 'express';
import { dineInFlow, quickServiceFlow, qrOrderingFlow, reservationFlow, staffSchedulingFlow } from '../adapters/restaurant.flows';
import { posService } from '../services/pos.client';
import { menuService } from '../services/menu.client';
import { kdsService } from '../services/kds.client';
import { staffService } from '../services/staff.client';
import { tableBookingService } from '../services/table-booking.client';
import { paymentService, walletService, notificationService } from '../services/rabtul.client';
import { invoiceService } from '../services/invoice.client';
import { qrOrderingService, qrSessionService } from '../services/qr-ordering.client';

const router = Router();

// ============================================================
// ORDER MANAGEMENT
// ============================================================

// Create order
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const order = await posService.createOrder(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get order
router.get('/orders/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await posService.getOrder(req.params.orderId);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active orders
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = await posService.getActiveOrders();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// DINE-IN FLOW
// ============================================================

// Start reservation
router.post('/dinein/reservation', async (req: Request, res: Response) => {
  try {
    const reservation = await dineInFlow.startReservation(req.body);
    res.status(201).json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Seat guest
router.post('/dinein/:reservationId/seat', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.body;
    const result = await dineInFlow.seatGuest(req.params.reservationId, tableId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create dine-in order
router.post('/dinein/order', async (req: Request, res: Response) => {
  try {
    const order = await dineInFlow.createOrder(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process payment
router.post('/dinein/:orderId/pay', async (req: Request, res: Response) => {
  try {
    const result = await dineInFlow.processPayment(req.params.orderId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// QR ORDERING FLOW
// ============================================================

// Start QR session
router.get('/qr/:restaurantId/:tableId/session', async (req: Request, res: Response) => {
  try {
    const session = await qrOrderingFlow.startSession({
      restaurantId: req.params.restaurantId,
      tableId: req.params.tableId,
    });
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit QR order
router.post('/qr/order', async (req: Request, res: Response) => {
  try {
    const order = await qrOrderingFlow.submitOrder(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// QR - Get menu
router.get('/qr/:restaurantId/menu', async (req: Request, res: Response) => {
  try {
    const menu = await qrOrderingService.getMenuForTable(req.params.restaurantId);
    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// QR - Get items with filters
router.get('/qr/:restaurantId/items', async (req: Request, res: Response) => {
  try {
    const items = await qrOrderingService.getMenuItems(req.params.restaurantId, {
      category: req.query.category as string,
      dietary: req.query.dietary ? (req.query.dietary as string).split(',') : undefined,
      available: true,
    });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// QR - Search items
router.get('/qr/:restaurantId/search', async (req: Request, res: Response) => {
  try {
    const results = await qrOrderingService.searchItems(
      req.params.restaurantId,
      req.query.q as string
    );
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// QR - Get order status
router.get('/qr/order/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await qrOrderingService.getOrderStatus(req.params.orderId);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// QR - Create order (direct)
router.post('/qr/:restaurantId/order', async (req: Request, res: Response) => {
  try {
    const order = await qrOrderingService.createOrder({
      restaurantId: req.params.restaurantId,
      tableId: req.body.tableId,
      customerId: req.body.customerId,
      items: req.body.items,
      source: 'qr-code',
    });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// RESERVATION FLOW
// ============================================================

// Make reservation
router.post('/reservations', async (req: Request, res: Response) => {
  try {
    const reservation = await reservationFlow.makeReservation(req.body);
    res.status(201).json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get reservations
router.get('/reservations', async (req: Request, res: Response) => {
  try {
    const reservations = await tableBookingService.getReservations(req.query);
    res.json({ success: true, data: reservations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send reservation reminder
router.post('/reservations/:id/reminder', async (req: Request, res: Response) => {
  try {
    const result = await reservationFlow.sendReminder(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// MENU MANAGEMENT
// ============================================================

// Get menus
router.get('/menus', async (req: Request, res: Response) => {
  try {
    const menus = await menuService.getMenus(req.query);
    res.json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get menu items
router.get('/menus/:menuId/items', async (req: Request, res: Response) => {
  try {
    const items = await menuService.getItems(req.params.menuId, req.query);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// KDS (Kitchen Display)
// ============================================================

// Get KDS orders
router.get('/kds/orders', async (req: Request, res: Response) => {
  try {
    const orders = await kdsService.getOrders();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bump order
router.post('/kds/:orderId/bump', async (req: Request, res: Response) => {
  try {
    const result = await kdsService.bumpOrder(req.params.orderId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get KDS stations
router.get('/kds/stations', async (req: Request, res: Response) => {
  try {
    const stations = await kdsService.getStations();
    res.json({ success: true, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// STAFF MANAGEMENT
// ============================================================

// Get staff
router.get('/staff', async (req: Request, res: Response) => {
  try {
    const staff = await staffService.getStaff(req.query);
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get schedule
router.get('/staff/schedule', async (req: Request, res: Response) => {
  try {
    const schedule = await staffService.getSchedule(req.query);
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check in
router.post('/staff/checkin', async (req: Request, res: Response) => {
  try {
    const result = await staffSchedulingFlow.checkIn(req.body.staffId, req.body.shiftId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check out
router.post('/staff/checkout', async (req: Request, res: Response) => {
  try {
    const result = await staffSchedulingFlow.checkOut(req.body.staffId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// TABLES
// ============================================================

// Get tables
router.get('/tables', async (req: Request, res: Response) => {
  try {
    const tables = await tableBookingService.getTables(req.query);
    res.json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update table status
router.post('/tables/:tableId/status', async (req: Request, res: Response) => {
  try {
    const result = await tableBookingService.updateTableStatus(req.params.tableId, req.body.status);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// BILLING & INVOICES
// ============================================================

// Get bill
router.get('/orders/:orderId/bill', async (req: Request, res: Response) => {
  try {
    const bill = await posService.getBill(req.params.orderId);
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate invoice
router.post('/orders/:orderId/invoice', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.createInvoice({
      orderId: req.params.orderId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ANALYTICS
// ============================================================

// Get POS stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await posService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get revenue
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string | undefined;
    const revenue = await posService.getRevenue(period);
    res.json({ success: true, data: revenue });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// PROCUREMENT / INVENTORY
// ============================================================

// Search products (from NexTaBizz)
router.get('/procurement/products', async (req: Request, res: Response) => {
  try {
    const { procurementService } = require('../services/procurement.client');
    const products = await procurementService.searchProducts(req.query);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create procurement order
router.post('/procurement/orders', async (req: Request, res: Response) => {
  try {
    const { procurementService } = require('../services/procurement.client');
    const order = await procurementService.createOrder(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get procurement orders
router.get('/procurement/orders', async (req: Request, res: Response) => {
  try {
    const { procurementService } = require('../services/procurement.client');
    const orders = await procurementService.getOrders(req.query);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Request quote
router.post('/procurement/quotes', async (req: Request, res: Response) => {
  try {
    const { procurementService } = require('../services/procurement.client');
    const quote = await procurementService.requestQuote(req.body);
    res.status(201).json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// INVOICES
// ============================================================

// Get invoices
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const invoices = await invoiceService.getInvoices(req.query);
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get invoice
router.get('/invoices/:invoiceId', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.invoiceId);
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send invoice
router.post('/invoices/:invoiceId/send', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.sendInvoice(req.params.invoiceId, req.body);
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as restaurantRoutes };
