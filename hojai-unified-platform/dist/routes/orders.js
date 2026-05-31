import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { requireAuth, requireRole, successResponse } from '../middleware/auth.js';
import { handleError } from '../utils/errors.js';
// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================
const orders = new Map();
const refunds = new Map();
let orderCounter = 10000;
function generateOrderNumber() {
    orderCounter++;
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `ORD-${year}${month}${day}-${orderCounter}`;
}
// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
const CreateOrderSchema = z.object({
    customerId: z.string(),
    customerName: z.string(),
    customerEmail: z.string().email(),
    customerPhone: z.string(),
    items: z.array(z.object({
        productId: z.string(),
        variantId: z.string().optional(),
        name: z.string(),
        sku: z.string(),
        price: z.number().positive(),
        quantity: z.number().int().min(1),
        image: z.string().optional(),
        variant: z.string().optional()
    })),
    delivery: z.object({
        address: z.string(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        instructions: z.string().optional()
    }),
    payment: z.object({
        method: z.enum(['upi', 'card', 'wallet', 'cod', 'netbanking'])
    }),
    channel: z.enum(['whatsapp', 'instagram', 'webchat', 'sms', 'email', 'pos', 'app']).default('webchat'),
    source: z.string().optional(),
    cartId: z.string().optional(),
    couponCode: z.string().optional(),
    // Totals (calculated)
    subtotal: z.number(),
    tax: z.number(),
    deliveryFee: z.number(),
    discount: z.number(),
    total: z.number(),
    metadata: z.record(z.unknown()).optional()
});
const UpdateOrderStatusSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled', 'refunded'])
});
const UpdateDeliveryStatusSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'preparing', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled', 'returned']),
    estimatedTime: z.string().optional(),
    instructions: z.string().optional()
});
const UpdatePaymentStatusSchema = z.object({
    status: z.enum(['pending', 'processing', 'paid', 'failed', 'refunded', 'partial']),
    transactionId: z.string().optional()
});
const CreateRefundSchema = z.object({
    amount: z.number().positive(),
    reason: z.string().min(10).max(500)
});
const ListOrdersQuerySchema = z.object({
    status: z.enum(['pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled', 'refunded']).optional(),
    paymentStatus: z.enum(['pending', 'processing', 'paid', 'failed', 'refunded', 'partial']).optional(),
    customerId: z.string().optional(),
    search: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    limit: z.string().default('50'),
    offset: z.string().default('0')
});
// ============================================================================
// ROUTER
// ============================================================================
const router = Router();
// ============================================================================
// ORDER CRUD
// ============================================================================
// Create order
router.post('/orders', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default';
        const validated = CreateOrderSchema.parse(req.body);
        const order = {
            id: uuidv4(),
            orderNumber: generateOrderNumber(),
            tenantId,
            customerId: validated.customerId,
            customerName: validated.customerName,
            customerEmail: validated.customerEmail,
            customerPhone: validated.customerPhone,
            items: validated.items.map(item => ({
                ...item,
                total: item.price * item.quantity
            })),
            subtotal: validated.subtotal,
            tax: validated.tax,
            deliveryFee: validated.deliveryFee,
            discount: validated.discount,
            total: validated.total,
            currency: 'INR',
            payment: {
                method: validated.payment.method,
                status: validated.payment.method === 'cod' ? 'pending' : 'pending'
            },
            delivery: {
                ...validated.delivery,
                status: 'pending'
            },
            channel: validated.channel,
            source: validated.source,
            cartId: validated.cartId,
            couponCode: validated.couponCode,
            status: 'pending',
            metadata: validated.metadata,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        orders.set(order.id, order);
        // TODO: Emit order created event
        // await eventBus.emit('order.created', order);
        successResponse(res, order, 201);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return handleError(res, error, 400);
        }
        handleError(res, error);
    }
});
// List orders
router.get('/orders', requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const validated = ListOrdersQuerySchema.parse(req.query);
        let filtered = Array.from(orders.values()).filter(o => o.tenantId === authReq.tenant.tenantId);
        if (validated.status) {
            filtered = filtered.filter(o => o.status === validated.status);
        }
        if (validated.paymentStatus) {
            filtered = filtered.filter(o => o.payment.status === validated.paymentStatus);
        }
        if (validated.customerId) {
            filtered = filtered.filter(o => o.customerId === validated.customerId);
        }
        if (validated.search) {
            const searchLower = (validated.search).toLowerCase();
            filtered = filtered.filter(o => o.orderNumber.toLowerCase().includes(searchLower) ||
                o.customerName.toLowerCase().includes(searchLower) ||
                o.customerPhone.includes(searchLower));
        }
        if (validated.dateFrom) {
            const from = new Date(validated.dateFrom);
            filtered = filtered.filter(o => o.createdAt >= from);
        }
        if (validated.dateTo) {
            const to = new Date(validated.dateTo);
            filtered = filtered.filter(o => o.createdAt <= to);
        }
        // Sort by newest first
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const total = filtered.length;
        const paginated = filtered.slice(Number(validated.offset), Number(validated.offset) + Number(validated.limit));
        successResponse(res, {
            orders: paginated,
            total,
            limit: Number(validated.limit),
            offset: Number(validated.offset)
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return handleError(res, error, 400);
        }
        handleError(res, error);
    }
});
// Get single order
router.get('/orders/:id', requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const order = orders.get(req.params.id);
        if (!order || order.tenantId !== authReq.tenant.tenantId) {
            return handleError(res, 'Order not found', 404);
        }
        successResponse(res, order);
    }
    catch (error) {
        handleError(res, error);
    }
});
// Get order by number
router.get('/orders/number/:orderNumber', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default';
        const order = Array.from(orders.values()).find(o => o.orderNumber === req.params.orderNumber && o.tenantId === tenantId);
        if (!order) {
            return handleError(res, 'Order not found', 404);
        }
        successResponse(res, order);
    }
    catch (error) {
        handleError(res, error);
    }
});
// Get customer's orders
router.get('/customers/:customerId/orders', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default';
        const customerOrders = Array.from(orders.values())
            .filter(o => o.customerId === req.params.customerId && o.tenantId === tenantId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        successResponse(res, {
            orders: customerOrders,
            total: customerOrders.length
        });
    }
    catch (error) {
        handleError(res, error);
    }
});
// ============================================================================
// ORDER STATUS MANAGEMENT
// ============================================================================
// Update order status
router.patch('/orders/:id/status', requireAuth, requireRole('agent', 'admin'), async (req, res) => {
    try {
        const authReq = req;
        const order = orders.get(req.params.id);
        if (!order || order.tenantId !== authReq.tenant.tenantId) {
            return handleError(res, 'Order not found', 404);
        }
        const validated = UpdateOrderStatusSchema.parse(req.body);
        order.status = validated.status;
        order.updatedAt = new Date();
        // Auto-update payment status for certain transitions
        if (validated.status === 'cancelled') {
            if (order.payment.status === 'paid') {
                // Mark for refund
                order.payment.status = 'refunded';
            }
        }
        successResponse(res, order);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return handleError(res, error, 400);
        }
        handleError(res, error);
    }
});
// Update delivery status
router.patch('/orders/:id/delivery', requireAuth, requireRole('agent', 'admin'), async (req, res) => {
    try {
        const authReq = req;
        const order = orders.get(req.params.id);
        if (!order || order.tenantId !== authReq.tenant.tenantId) {
            return handleError(res, 'Order not found', 404);
        }
        const validated = UpdateDeliveryStatusSchema.parse(req.body);
        order.delivery.status = validated.status;
        if (validated.estimatedTime) {
            order.delivery.estimatedTime = validated.estimatedTime;
        }
        if (validated.instructions) {
            order.delivery.instructions = validated.instructions;
        }
        order.updatedAt = new Date();
        // Update order status based on delivery status
        if (validated.status === 'dispatched' || validated.status === 'out_for_delivery') {
            order.status = 'dispatched';
            order.delivery.dispatchedAt = new Date();
        }
        else if (validated.status === 'delivered') {
            order.status = 'delivered';
            order.delivery.deliveredAt = new Date();
            // Auto-complete payment for COD
            if (order.payment.method === 'cod' && order.payment.status === 'pending') {
                order.payment.status = 'paid';
                order.payment.paidAt = new Date();
            }
        }
        else if (validated.status === 'cancelled') {
            order.status = 'cancelled';
        }
        successResponse(res, order);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return handleError(res, error, 400);
        }
        handleError(res, error);
    }
});
// Update payment status
router.patch('/orders/:id/payment', requireAuth, requireRole('agent', 'admin'), async (req, res) => {
    try {
        const authReq = req;
        const order = orders.get(req.params.id);
        if (!order || order.tenantId !== authReq.tenant.tenantId) {
            return handleError(res, 'Order not found', 404);
        }
        const validated = UpdatePaymentStatusSchema.parse(req.body);
        order.payment.status = validated.status;
        if (validated.transactionId) {
            order.payment.transactionId = validated.transactionId;
        }
        order.updatedAt = new Date();
        // Auto-confirm order when payment is paid
        if (validated.status === 'paid') {
            order.payment.paidAt = new Date();
            if (order.status === 'pending') {
                order.status = 'confirmed';
            }
        }
        successResponse(res, order);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return handleError(res, error, 400);
        }
        handleError(res, error);
    }
});
// ============================================================================
// PAYMENT PROCESSING
// ============================================================================
// Initiate payment (create payment link/intent)
router.post('/orders/:id/pay', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default';
        const order = orders.get(req.params.id);
        if (!order || order.tenantId !== tenantId) {
            return handleError(res, 'Order not found', 404);
        }
        if (order.payment.status === 'paid') {
            return handleError(res, 'Order already paid', 400);
        }
        // TODO: Integrate with actual payment gateway (Razorpay, Stripe, etc.)
        // For now, return mock payment link
        const paymentLink = `https://pay.hojai.ai/${order.id}?amount=${order.total}&currency=INR`;
        successResponse(res, {
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: order.total,
            currency: 'INR',
            paymentLink,
            paymentMethods: ['upi', 'card', 'wallet', 'netbanking', 'cod']
        });
    }
    catch (error) {
        handleError(res, error);
    }
});
// Confirm payment (webhook from payment gateway)
router.post('/orders/:id/confirm-payment', async (req, res) => {
    try {
        const { transactionId, status, amount } = req.body;
        // TODO: Verify webhook signature
        // const isValid = verifyPaymentWebhookSignature(req.body, signature);
        const order = orders.get(req.params.id);
        if (!order) {
            return handleError(res, 'Order not found', 404);
        }
        // Verify amount matches
        if (amount && amount !== order.total) {
            console.warn(`Payment amount mismatch for order ${order.orderNumber}: expected ${order.total}, got ${amount}`);
        }
        if (status === 'success' || status === 'captured') {
            order.payment.status = 'paid';
            order.payment.transactionId = transactionId;
            order.payment.paidAt = new Date();
            if (order.status === 'pending') {
                order.status = 'confirmed';
            }
        }
        else {
            order.payment.status = 'failed';
            order.payment.transactionId = transactionId;
        }
        order.updatedAt = new Date();
        successResponse(res, order);
    }
    catch (error) {
        handleError(res, error);
    }
});
// ============================================================================
// REFUNDS
// ============================================================================
// Create refund request
router.post('/orders/:id/refunds', requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const order = orders.get(req.params.id);
        if (!order || order.tenantId !== authReq.tenant.tenantId) {
            return handleError(res, 'Order not found', 404);
        }
        if (order.payment.status !== 'paid') {
            return handleError(res, 'Order has no paid amount to refund', 400);
        }
        const validated = CreateRefundSchema.parse(req.body);
        if (validated.amount > order.total) {
            return handleError(res, 'Refund amount exceeds order total', 400);
        }
        const refund = {
            id: uuidv4(),
            orderId: order.id,
            amount: validated.amount,
            reason: validated.reason,
            status: 'pending',
            createdAt: new Date()
        };
        refunds.set(refund.id, refund);
        successResponse(res, refund, 201);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return handleError(res, error, 400);
        }
        handleError(res, error);
    }
});
// List refunds for order
router.get('/orders/:id/refunds', requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const order = orders.get(req.params.id);
        if (!order || order.tenantId !== authReq.tenant.tenantId) {
            return handleError(res, 'Order not found', 404);
        }
        const orderRefunds = Array.from(refunds.values())
            .filter(r => r.orderId === order.id)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        successResponse(res, { refunds: orderRefunds });
    }
    catch (error) {
        handleError(res, error);
    }
});
// Process refund (approve/reject)
router.patch('/refunds/:id', requireAuth, requireRole('agent', 'admin'), async (req, res) => {
    try {
        const authReq = req;
        const refund = refunds.get(req.params.id);
        if (!refund) {
            return handleError(res, 'Refund not found', 404);
        }
        const { status } = req.body;
        if (!['approved', 'rejected', 'processing', 'completed'].includes(status)) {
            return handleError(res, 'Invalid status', 400);
        }
        refund.status = status;
        if (status === 'completed') {
            refund.processedAt = new Date();
            // Update order payment status
            const order = orders.get(refund.orderId);
            if (order) {
                // Calculate total refunded
                const totalRefunded = Array.from(refunds.values())
                    .filter(r => r.orderId === order.id && r.status === 'completed')
                    .reduce((sum, r) => sum + r.amount, 0);
                if (totalRefunded >= order.total) {
                    order.payment.status = 'refunded';
                }
                else {
                    order.payment.status = 'partial';
                }
            }
        }
        successResponse(res, refund);
    }
    catch (error) {
        handleError(res, error);
    }
});
// ============================================================================
// ORDER ANALYTICS
// ============================================================================
// Get order statistics
router.get('/orders/stats/summary', requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const tenantOrders = Array.from(orders.values()).filter(o => o.tenantId === authReq.tenant.tenantId);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const stats = {
            total: tenantOrders.length,
            totalRevenue: tenantOrders
                .filter(o => o.payment.status === 'paid')
                .reduce((sum, o) => sum + o.total, 0),
            byStatus: {
                pending: tenantOrders.filter(o => o.status === 'pending').length,
                confirmed: tenantOrders.filter(o => o.status === 'confirmed').length,
                preparing: tenantOrders.filter(o => o.status === 'preparing').length,
                dispatched: tenantOrders.filter(o => o.status === 'dispatched').length,
                delivered: tenantOrders.filter(o => o.status === 'delivered').length,
                cancelled: tenantOrders.filter(o => o.status === 'cancelled').length,
                refunded: tenantOrders.filter(o => o.status === 'refunded').length
            },
            byPaymentStatus: {
                pending: tenantOrders.filter(o => o.payment.status === 'pending').length,
                paid: tenantOrders.filter(o => o.payment.status === 'paid').length,
                failed: tenantOrders.filter(o => o.payment.status === 'failed').length,
                refunded: tenantOrders.filter(o => o.payment.status === 'refunded').length
            },
            byChannel: {},
            today: {
                orders: tenantOrders.filter(o => o.createdAt >= today).length,
                revenue: tenantOrders
                    .filter(o => o.createdAt >= today && o.payment.status === 'paid')
                    .reduce((sum, o) => sum + o.total, 0)
            },
            thisWeek: {
                orders: tenantOrders.filter(o => o.createdAt >= weekAgo).length,
                revenue: tenantOrders
                    .filter(o => o.createdAt >= weekAgo && o.payment.status === 'paid')
                    .reduce((sum, o) => sum + o.total, 0)
            },
            thisMonth: {
                orders: tenantOrders.filter(o => o.createdAt >= monthStart).length,
                revenue: tenantOrders
                    .filter(o => o.createdAt >= monthStart && o.payment.status === 'paid')
                    .reduce((sum, o) => sum + o.total, 0)
            },
            avgOrderValue: tenantOrders.length > 0
                ? tenantOrders.reduce((sum, o) => sum + o.total, 0) / tenantOrders.length
                : 0
        };
        // Channel breakdown
        for (const order of tenantOrders) {
            stats.byChannel[order.channel] = (stats.byChannel[order.channel] || 0) + 1;
        }
        successResponse(res, stats);
    }
    catch (error) {
        handleError(res, error);
    }
});
// ============================================================================
// EXPORT
// ============================================================================
export default router;
//# sourceMappingURL=orders.js.map