"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryBridge = exports.InventoryBridgeService = void 0;
/**
 * HOJAI Merchant Bridge - Inventory Service
 * Inventory management
 */
const axios_1 = __importDefault(require("axios"));
const INVENTORY_API_URL = process.env.REZ_INVENTORY_URL || 'http://localhost:4007';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;
class InventoryBridgeService {
    baseUrl;
    token;
    constructor(baseUrl, token) {
        this.baseUrl = baseUrl || INVENTORY_API_URL;
        this.token = token || INTERNAL_TOKEN || '';
    }
    headers() {
        return {
            'X-Internal-Token': this.token,
            'Content-Type': 'application/json'
        };
    }
    /**
     * Get inventory items
     */
    async getItems(merchantId) {
        try {
            const res = await axios_1.default.get(`${this.baseUrl}/api/inventory/${merchantId}`, { headers: this.headers() });
            return res.data.items || [];
        }
        catch (error) {
            console.error('[InventoryBridge] Failed to get items:', error);
            return [];
        }
    }
    /**
     * Get low stock items
     */
    async getLowStock(merchantId) {
        try {
            const res = await axios_1.default.get(`${this.baseUrl}/api/inventory/${merchantId}/low-stock`, { headers: this.headers() });
            return res.data.items || [];
        }
        catch (error) {
            console.error('[InventoryBridge] Failed to get low stock:', error);
            return [];
        }
    }
    /**
     * Check item availability
     */
    async checkAvailability(merchantId, itemId, quantity) {
        try {
            const res = await axios_1.default.get(`${this.baseUrl}/api/inventory/${merchantId}/check/${itemId}?qty=${quantity}`, { headers: this.headers() });
            return res.data.available || false;
        }
        catch (error) {
            console.error('[InventoryBridge] Failed to check availability:', error);
            return true;
        }
    }
    /**
     * Update stock
     */
    async updateStock(merchantId, itemId, quantity) {
        try {
            await axios_1.default.patch(`${this.baseUrl}/api/inventory/${merchantId}/${itemId}`, { quantity }, { headers: this.headers() });
            return true;
        }
        catch (error) {
            console.error('[InventoryBridge] Failed to update stock:', error);
            return false;
        }
    }
    /**
     * Deduct from stock (for orders)
     */
    async deductStock(merchantId, itemId, quantity) {
        try {
            await axios_1.default.post(`${this.baseUrl}/api/inventory/${merchantId}/${itemId}/deduct`, { quantity }, { headers: this.headers() });
            return true;
        }
        catch (error) {
            console.error('[InventoryBridge] Failed to deduct stock:', error);
            return false;
        }
    }
}
exports.InventoryBridgeService = InventoryBridgeService;
exports.inventoryBridge = new InventoryBridgeService();
