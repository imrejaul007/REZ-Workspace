"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryBridge = exports.InventoryBridgeService = exports.bookingBridge = exports.BookingBridgeService = exports.orderBridge = exports.OrderBridgeService = exports.merchantBridge = exports.MerchantBridgeService = void 0;
/**
 * HOJAI Merchant Bridge - Main Index
 * Connects Hojai AI to REZ Merchant platform
 */
__exportStar(require("./types.js"), exports);
var merchantService_js_1 = require("./merchantService.js");
Object.defineProperty(exports, "MerchantBridgeService", { enumerable: true, get: function () { return merchantService_js_1.MerchantBridgeService; } });
Object.defineProperty(exports, "merchantBridge", { enumerable: true, get: function () { return merchantService_js_1.merchantBridge; } });
var orderService_js_1 = require("./orderService.js");
Object.defineProperty(exports, "OrderBridgeService", { enumerable: true, get: function () { return orderService_js_1.OrderBridgeService; } });
Object.defineProperty(exports, "orderBridge", { enumerable: true, get: function () { return orderService_js_1.orderBridge; } });
var bookingService_js_1 = require("./bookingService.js");
Object.defineProperty(exports, "BookingBridgeService", { enumerable: true, get: function () { return bookingService_js_1.BookingBridgeService; } });
Object.defineProperty(exports, "bookingBridge", { enumerable: true, get: function () { return bookingService_js_1.bookingBridge; } });
var inventoryService_js_1 = require("./inventoryService.js");
Object.defineProperty(exports, "InventoryBridgeService", { enumerable: true, get: function () { return inventoryService_js_1.InventoryBridgeService; } });
Object.defineProperty(exports, "inventoryBridge", { enumerable: true, get: function () { return inventoryService_js_1.inventoryBridge; } });
/**
 * Usage Example:
 *
 * ```typescript
 * import { merchantBridge, orderBridge, bookingBridge } from '@hojai/merchant-bridge';
 *
 * // Get merchant context for AI
 * const context = await merchantBridge.getMerchantContext(merchantId);
 *
 * // Create order from WhatsApp
 * const order = await orderBridge.create({
 *   merchantId,
 *   customerId,
 *   items: [{ menuItemId: '123', quantity: 2 }],
 *   type: 'pickup'
 * });
 *
 * // Create booking
 * const booking = await bookingBridge.create({
 *   merchantId,
 *   customerId,
 *   date: '2026-05-29',
 *   time: '14:00',
 *   guests: 4
 * });
 * ```
 */
