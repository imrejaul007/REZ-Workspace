import type { InventoryItem } from './types.js';
export declare class InventoryBridgeService {
    private baseUrl;
    private token;
    constructor(baseUrl?: string, token?: string);
    private headers;
    /**
     * Get inventory items
     */
    getItems(merchantId: string): Promise<InventoryItem[]>;
    /**
     * Get low stock items
     */
    getLowStock(merchantId: string): Promise<InventoryItem[]>;
    /**
     * Check item availability
     */
    checkAvailability(merchantId: string, itemId: string, quantity: number): Promise<boolean>;
    /**
     * Update stock
     */
    updateStock(merchantId: string, itemId: string, quantity: number): Promise<boolean>;
    /**
     * Deduct from stock (for orders)
     */
    deductStock(merchantId: string, itemId: string, quantity: number): Promise<boolean>;
}
export declare const inventoryBridge: InventoryBridgeService;
//# sourceMappingURL=inventoryService.d.ts.map