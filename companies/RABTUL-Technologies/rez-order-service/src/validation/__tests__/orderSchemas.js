"use strict";
/**
 * Zod validation schemas for Order service.
 * These schemas validate all incoming requests at the API boundary.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamQuerySchema = exports.OrderQuerySchema = exports.OrderCancelSchema = exports.OrderStatusUpdateSchema = exports.OrderDeliverySchema = exports.OrderPaymentSchema = exports.OrderTotalsSchema = exports.OrderItemSchema = void 0;
const zod_1 = require("zod");
exports.OrderItemSchema = zod_1.z.object({
    itemId: zod_1.z.union([zod_1.z.string(), zod_1.z.instanceof(Object)]).optional(),
    name: zod_1.z.string().optional(),
    quantity: zod_1.z.number().int().positive().optional(),
    price: zod_1.z.number().positive().optional(),
});
exports.OrderTotalsSchema = zod_1.z.object({
    subtotal: zod_1.z.number().nonnegative().optional(),
    tax: zod_1.z.number().nonnegative().optional(),
    discount: zod_1.z.number().nonnegative().optional(),
    deliveryFee: zod_1.z.number().nonnegative().optional(),
    total: zod_1.z.number().nonnegative().optional(),
});
exports.OrderPaymentSchema = zod_1.z.object({
    method: zod_1.z.string().optional(),
    status: zod_1.z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'expired', 'refund_initiated', 'refund_processing', 'refunded', 'refund_failed']).optional(),
    amount: zod_1.z.number().positive().optional(),
});
exports.OrderDeliverySchema = zod_1.z.object({
    type: zod_1.z.string().optional(),
    address: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.OrderStatusUpdateSchema = zod_1.z.object({
    status: zod_1.z.enum(['placed', 'confirmed', 'preparing', 'ready', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled', 'cancelling', 'returned', 'refunded']),
});
exports.OrderCancelSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
exports.OrderQuerySchema = zod_1.z.object({
    merchantId: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
    status: zod_1.z.enum(['placed', 'confirmed', 'preparing', 'ready', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled', 'cancelling', 'returned', 'refunded']).optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
exports.StreamQuerySchema = zod_1.z.object({
    merchantId: zod_1.z.string(),
});
