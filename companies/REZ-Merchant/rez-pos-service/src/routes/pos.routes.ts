import { Router, Request, Response, NextFunction } from 'express';
import {
  CreateOrderRequest,
  AddItemRequest,
  ApplyDiscountRequest,
  SplitBillRequest,
  ProcessPaymentRequest,
  VoidOrderRequest,
  RefundRequest,
  ApiResponse,
  Order,
  OrderStatus,
  Receipt
} from '../types';
import { orderService } from '../services/orderService';
import { logger } from '../utils/logger';

const router = Router();

// Helper function to create API response
function createResponse<T>(success: boolean, data?: T, error?: { code: string; message: string }): ApiResponse<T> {
  return {
    success,
    data,
    error,
    timestamp: new Date().toISOString()
  };
}

// Error handling middleware
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==================== ORDER ROUTES ====================

/**
 * @route POST /api/pos/orders
 * @desc Create a new order
 */
router.post('/orders', asyncHandler(async (req: Request, res: Response) => {
  const request: CreateOrderRequest = req.body;
  const result = await orderService.createOrder(request);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'CREATE_ORDER_FAILED', message: result.error || 'Failed to create order' }));
    return;
  }

  logger.info(`Order created: ${result.order?.orderNumber}`);
  res.status(201).json(createResponse(true, result.order));
}));

/**
 * @route GET /api/pos/orders
 * @desc Get all active orders or orders by status
 */
router.get('/orders', asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as OrderStatus | undefined;
  let orders: Order[];

  if (status) {
    orders = await orderService.getOrdersByStatus(status);
  } else {
    orders = await orderService.getActiveOrders();
  }

  res.json(createResponse(true, orders));
}));

/**
 * @route GET /api/pos/orders/daily
 * @desc Get orders for a specific date
 */
router.get('/orders/daily', asyncHandler(async (req: Request, res: Response) => {
  const dateParam = req.query.date as string | undefined;
  const date = dateParam ? new Date(dateParam) : new Date();
  const orders = await orderService.getDailyOrders(date);
  res.json(createResponse(true, orders));
}));

/**
 * @route GET /api/pos/orders/:id
 * @desc Get order by ID
 */
router.get('/orders/:id', asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrder(req.params.id);

  if (!order) {
    res.status(404).json(createResponse(false, undefined, { code: 'ORDER_NOT_FOUND', message: 'Order not found' }));
    return;
  }

  res.json(createResponse(true, order));
}));

/**
 * @route GET /api/pos/orders/number/:orderNumber
 * @desc Get order by order number
 */
router.get('/orders/number/:orderNumber', asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderByNumber(req.params.orderNumber);

  if (!order) {
    res.status(404).json(createResponse(false, undefined, { code: 'ORDER_NOT_FOUND', message: 'Order not found' }));
    return;
  }

  res.json(createResponse(true, order));
}));

/**
 * @route PUT /api/pos/orders/:id/status
 * @desc Update order status
 */
router.put('/orders/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const result = await orderService.updateOrderStatus(req.params.id, status);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'UPDATE_STATUS_FAILED', message: result.error || 'Failed to update status' }));
    return;
  }

  logger.info(`Order ${result.order?.orderNumber} status updated to ${status}`);
  res.json(createResponse(true, result.order));
}));

/**
 * @route POST /api/pos/orders/:id/confirm
 * @desc Confirm an order
 */
router.post('/orders/:id/confirm', asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.confirmOrder(req.params.id);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'CONFIRM_FAILED', message: result.error || 'Failed to confirm order' }));
    return;
  }

  res.json(createResponse(true, result.order));
}));

/**
 * @route POST /api/pos/orders/:id/start-preparing
 * @desc Start preparing an order
 */
router.post('/orders/:id/start-preparing', asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.startPreparing(req.params.id);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'PREPARE_FAILED', message: result.error || 'Failed to start preparing' }));
    return;
  }

  res.json(createResponse(true, result.order));
}));

/**
 * @route POST /api/pos/orders/:id/ready
 * @desc Mark order as ready
 */
router.post('/orders/:id/ready', asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.markReady(req.params.id);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'READY_FAILED', message: result.error || 'Failed to mark as ready' }));
    return;
  }

  res.json(createResponse(true, result.order));
}));

/**
 * @route POST /api/pos/orders/:id/served
 * @desc Mark order as served
 */
router.post('/orders/:id/served', asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.markServed(req.params.id);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'SERVED_FAILED', message: result.error || 'Failed to mark as served' }));
    return;
  }

  res.json(createResponse(true, result.order));
}));

// ==================== ORDER ITEM ROUTES ====================

/**
 * @route POST /api/pos/orders/:id/items
 * @desc Add item to order
 */
router.post('/orders/:id/items', asyncHandler(async (req: Request, res: Response) => {
  const request: AddItemRequest = req.body;
  const result = await orderService.addItem(req.params.id, request);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'ADD_ITEM_FAILED', message: result.error || 'Failed to add item' }));
    return;
  }

  logger.info(`Item added to order ${result.order?.orderNumber}`);
  res.json(createResponse(true, result.order));
}));

/**
 * @route PUT /api/pos/orders/:id/items/:itemId
 * @desc Update item quantity
 */
router.put('/orders/:id/items/:itemId', asyncHandler(async (req: Request, res: Response) => {
  const { quantity } = req.body;
  const result = await orderService.updateItemQuantity(req.params.id, req.params.itemId, quantity);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'UPDATE_ITEM_FAILED', message: result.error || 'Failed to update item' }));
    return;
  }

  res.json(createResponse(true, result.order));
}));

/**
 * @route DELETE /api/pos/orders/:id/items/:itemId
 * @desc Remove item from order
 */
router.delete('/orders/:id/items/:itemId', asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.removeItem(req.params.id, req.params.itemId);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'REMOVE_ITEM_FAILED', message: result.error || 'Failed to remove item' }));
    return;
  }

  res.json(createResponse(true, result.order));
}));

// ==================== DISCOUNT ROUTES ====================

/**
 * @route POST /api/pos/orders/:id/discount
 * @desc Apply discount to order
 */
router.post('/orders/:id/discount', asyncHandler(async (req: Request, res: Response) => {
  const request: ApplyDiscountRequest = req.body;
  const result = await orderService.applyDiscount(req.params.id, request);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'APPLY_DISCOUNT_FAILED', message: result.error || 'Failed to apply discount' }));
    return;
  }

  logger.info(`Discount applied to order ${result.order?.orderNumber}`);
  res.json(createResponse(true, result.order));
}));

/**
 * @route DELETE /api/pos/orders/:id/discount
 * @desc Remove discount from order
 */
router.delete('/orders/:id/discount', asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.removeDiscount(req.params.id);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'REMOVE_DISCOUNT_FAILED', message: result.error || 'Failed to remove discount' }));
    return;
  }

  res.json(createResponse(true, result.order));
}));

// ==================== BILLING ROUTES ====================

/**
 * @route GET /api/pos/orders/:id/bill
 * @desc Get bill calculation for order
 */
router.get('/orders/:id/bill', asyncHandler(async (req: Request, res: Response) => {
  const tip = parseFloat(req.query.tip as string) || 0;
  const result = await orderService.getBillCalculation(req.params.id, tip);

  if (!result.success) {
    res.status(404).json(createResponse(false, undefined, { code: 'ORDER_NOT_FOUND', message: result.error || 'Order not found' }));
    return;
  }

  res.json(createResponse(true, result.bill));
}));

/**
 * @route GET /api/pos/orders/:id/tips
 * @desc Get tip suggestions
 */
router.get('/orders/:id/tips', asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.getTipSuggestions(req.params.id);

  if (!result.success) {
    res.status(404).json(createResponse(false, undefined, { code: 'ORDER_NOT_FOUND', message: result.error || 'Order not found' }));
    return;
  }

  res.json(createResponse(true, result.suggestions));
}));

/**
 * @route POST /api/pos/orders/:id/split
 * @desc Split bill
 */
router.post('/orders/:id/split', asyncHandler(async (req: Request, res: Response) => {
  const request: SplitBillRequest = req.body;
  const result = await orderService.splitBill(req.params.id, request);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'SPLIT_FAILED', message: result.error || 'Failed to split bill' }));
    return;
  }

  res.json(createResponse(true, {
    splits: result.splits,
    perPersonAmount: result.perPersonAmount
  }));
}));

// ==================== PAYMENT ROUTES ====================

/**
 * @route POST /api/pos/orders/:id/payment
 * @desc Process payment for order
 */
router.post('/orders/:id/payment', asyncHandler(async (req: Request, res: Response) => {
  const request: ProcessPaymentRequest = req.body;
  const result = await orderService.processPayment(req.params.id, request);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'PAYMENT_FAILED', message: result.error || 'Failed to process payment' }));
    return;
  }

  logger.info(`Payment processed for order: ${result.order?.orderNumber}, Amount: $${result.payment?.amount}`);
  res.json(createResponse(true, {
    payment: result.payment,
    change: result.change,
    order: result.order
  }));
}));

/**
 * @route POST /api/pos/orders/:id/refund
 * @desc Refund payment
 */
router.post('/orders/:id/refund', asyncHandler(async (req: Request, res: Response) => {
  const request: RefundRequest = req.body;
  const result = await orderService.refundPayment(req.params.id, request);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'REFUND_FAILED', message: result.error || 'Failed to process refund' }));
    return;
  }

  logger.info(`Refund processed for order: ${result.order?.orderNumber}, Amount: $${result.refundAmount}`);
  res.json(createResponse(true, {
    refundAmount: result.refundAmount,
    remainingBalance: result.remainingBalance,
    order: result.order
  }));
}));

// ==================== RECEIPT ROUTES ====================

/**
 * @route POST /api/pos/orders/:id/receipt
 * @desc Print receipt
 */
router.post('/orders/:id/receipt', asyncHandler(async (req: Request, res: Response) => {
  const { tip, splitId } = req.body;
  const result = await orderService.printReceipt(req.params.id, tip || 0, splitId);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'RECEIPT_FAILED', message: result.error || 'Failed to generate receipt' }));
    return;
  }

  logger.info(`Receipt generated for order: ${result.receipt?.orderId}`);
  res.json(createResponse(true, result.receipt));
}));

// ==================== VOID ROUTES ====================

/**
 * @route POST /api/pos/orders/:id/void
 * @desc Void an order
 */
router.post('/orders/:id/void', asyncHandler(async (req: Request, res: Response) => {
  const request: VoidOrderRequest = req.body;
  const result = await orderService.voidOrder(req.params.id, request);

  if (!result.success) {
    res.status(400).json(createResponse(false, undefined, { code: 'VOID_FAILED', message: result.error || 'Failed to void order' }));
    return;
  }

  logger.warn(`Order voided: ${result.order?.orderNumber}, Reason: ${request.reason}`);
  res.json(createResponse(true, result.order));
}));

// ==================== MENU ROUTES ====================

/**
 * @route GET /api/pos/menu
 * @desc Get all menu items
 */
router.get('/menu', asyncHandler(async (req: Request, res: Response) => {
  const items = await orderService.getMenuItems();
  res.json(createResponse(true, items));
}));

/**
 * @route GET /api/pos/menu/:id
 * @desc Get menu item by ID
 */
router.get('/menu/:id', asyncHandler(async (req: Request, res: Response) => {
  const item = await orderService.getMenuItem(req.params.id);

  if (!item) {
    res.status(404).json(createResponse(false, undefined, { code: 'ITEM_NOT_FOUND', message: 'Menu item not found' }));
    return;
  }

  res.json(createResponse(true, item));
}));

// ==================== STATISTICS ROUTES ====================

/**
 * @route GET /api/pos/stats
 * @desc Get order statistics
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = await orderService.getStatistics();
  res.json(createResponse(true, stats));
}));

/**
 * @route GET /api/pos/revenue
 * @desc Get revenue summary for a date range
 */
router.get('/revenue', asyncHandler(async (req: Request, res: Response) => {
  const startDateParam = req.query.startDate as string;
  const endDateParam = req.query.endDate as string;

  if (!startDateParam || !endDateParam) {
    res.status(400).json(createResponse(false, undefined, { code: 'INVALID_DATES', message: 'Start date and end date are required' }));
    return;
  }

  const startDate = new Date(startDateParam);
  const endDate = new Date(endDateParam);
  endDate.setHours(23, 59, 59, 999);

  const summary = await orderService.getRevenueSummary(startDate, endDate);
  res.json(createResponse(true, summary));
}));

// ==================== HEALTH CHECK ====================

/**
 * @route GET /api/pos/health
 * @desc Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json(createResponse(true, { status: 'healthy', service: 'rez-pos-service', timestamp: new Date().toISOString() }));
});

export default router;
