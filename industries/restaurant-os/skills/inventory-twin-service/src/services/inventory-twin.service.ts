import { v4 as uuidv4 } from 'uuid';
import { InventoryTwin } from '../models/inventory-twin.model';
import {
  CreateInventoryTwinRequest,
  CreateInventoryTwinResponse,
  GetInventoryTwinResponse,
  AddInventoryItemRequest,
  AdjustStockRequest,
  LogWasteRequest,
  CreatePurchaseOrderRequest,
  GetInventoryAnalyticsResponse,
  ItemCategory,
  UrgencyLevel
} from '../schemas/inventory-twin.schema';
import { logger } from '../utils/logger';
import { messageBroker } from '../utils/message-broker';

export class InventoryTwinService {
  async createInventoryTwin(request: CreateInventoryTwinRequest): Promise<CreateInventoryTwinResponse> {
    const inventoryId = uuidv4();
    const twinId = `twin.restaurant.inventory.${inventoryId}`;

    logger.info('Creating Inventory Twin', { inventoryId, restaurantId: request.restaurantId });

    const existingTwin = await InventoryTwin.findByInventoryId(inventoryId);
    if (existingTwin) {
      throw new Error(`Inventory Twin already exists for inventoryId: ${inventoryId}`);
    }

    const items = request.items?.map(item => ({
      itemId: uuidv4(),
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      unit: item.unit,
      reorderPoint: item.reorderPoint,
      reorderQuantity: item.reorderQuantity || 50,
      costPerUnit: item.costPerUnit || 0,
      expiryDate: item.expiryDate,
      location: item.location || 'main',
      suppliers: [],
      consumptionRate: 0,
      daysUntilStockout: 999
    })) || [];

    const inventoryTwin = new InventoryTwin({
      twinId,
      inventoryId,
      restaurantId: request.restaurantId,
      items,
      wasteLog: [],
      totalValue: items.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0)
    });

    inventoryTwin.checkReorderPoints();
    inventoryTwin.checkExpiryAlerts();

    await inventoryTwin.save();

    await messageBroker.publish('restaurant.inventory.created', {
      twinId,
      inventoryId,
      restaurantId: request.restaurantId,
      twinOsEntityId: twinId,
      timestamp: new Date().toISOString()
    });

    logger.info('Inventory Twin created successfully', { twinId, inventoryId });

    return {
      twinId,
      inventoryId,
      twinOsEntityId: twinId,
      createdAt: inventoryTwin.createdAt.toISOString()
    };
  }

  async getInventoryTwin(inventoryId: string): Promise<GetInventoryTwinResponse> {
    logger.info('Fetching Inventory Twin', { inventoryId });

    const inventoryTwin = await InventoryTwin.findByInventoryId(inventoryId);
    if (!inventoryTwin) {
      throw new Error(`Inventory Twin not found for inventoryId: ${inventoryId}`);
    }

    return inventoryTwin.toJSON() as GetInventoryTwinResponse;
  }

  async addItem(inventoryId: string, request: AddInventoryItemRequest): Promise<void> {
    logger.info('Adding item to Inventory Twin', { inventoryId, itemName: request.name });

    const inventoryTwin = await InventoryTwin.findByInventoryId(inventoryId);
    if (!inventoryTwin) {
      throw new Error(`Inventory Twin not found for inventoryId: ${inventoryId}`);
    }

    const newItem = {
      itemId: uuidv4(),
      name: request.name,
      category: request.category,
      currentStock: request.currentStock,
      unit: request.unit,
      reorderPoint: request.reorderPoint,
      reorderQuantity: request.reorderQuantity || 50,
      costPerUnit: request.costPerUnit || 0,
      expiryDate: request.expiryDate,
      location: request.location || 'main',
      suppliers: request.suppliers || [],
      consumptionRate: 0,
      daysUntilStockout: 999
    };

    inventoryTwin.items.push(newItem);
    inventoryTwin.calculateTotalValue();
    inventoryTwin.checkReorderPoints();
    inventoryTwin.checkExpiryAlerts();

    await inventoryTwin.save();

    await messageBroker.publish('restaurant.inventory.item.added', {
      twinId: inventoryTwin.twinId,
      inventoryId,
      item: newItem,
      timestamp: new Date().toISOString()
    });
  }

  async adjustStock(inventoryId: string, request: AdjustStockRequest): Promise<void> {
    logger.info('Adjusting stock', { inventoryId, itemId: request.itemId, quantity: request.quantity });

    const inventoryTwin = await InventoryTwin.findByInventoryId(inventoryId);
    if (!inventoryTwin) {
      throw new Error(`Inventory Twin not found for inventoryId: ${inventoryId}`);
    }

    const item = inventoryTwin.items.find(i => i.itemId === request.itemId);
    if (!item) {
      throw new Error(`Item not found: ${request.itemId}`);
    }

    if (request.isAddition) {
      item.currentStock += request.quantity;
    } else {
      item.currentStock = Math.max(0, item.currentStock - request.quantity);
    }

    // Calculate days until stockout
    if (item.consumptionRate > 0) {
      item.daysUntilStockout = Math.floor(item.currentStock / item.consumptionRate);
    }

    inventoryTwin.calculateTotalValue();
    inventoryTwin.checkReorderPoints();
    inventoryTwin.checkExpiryAlerts();

    await inventoryTwin.save();

    await messageBroker.publish('restaurant.inventory.stock.adjusted', {
      twinId: inventoryTwin.twinId,
      inventoryId,
      itemId: request.itemId,
      newStock: item.currentStock,
      reason: request.reason,
      timestamp: new Date().toISOString()
    });
  }

  async deductForOrder(inventoryId: string, orderId: string, items: { menuItemId: string; name: string; quantity: number }[]): Promise<void> {
    logger.info('Deducting inventory for order', { inventoryId, orderId });

    const inventoryTwin = await InventoryTwin.findByInventoryId(inventoryId);
    if (!inventoryTwin) {
      throw new Error(`Inventory Twin not found for inventoryId: ${inventoryId}`);
    }

    // In a real implementation, this would look up the recipe/BOM for each item
    // and deduct the ingredients accordingly
    for (const orderItem of items) {
      // This is a simplified version - real implementation would use BOM
      logger.debug('Processing order item', { menuItemId: orderItem.menuItemId, quantity: orderItem.quantity });
    }

    await inventoryTwin.save();
  }

  async logWaste(inventoryId: string, request: LogWasteRequest): Promise<void> {
    logger.info('Logging waste', { inventoryId, itemId: request.itemId, quantity: request.quantity });

    const inventoryTwin = await InventoryTwin.findByInventoryId(inventoryId);
    if (!inventoryTwin) {
      throw new Error(`Inventory Twin not found for inventoryId: ${inventoryId}`);
    }

    const item = inventoryTwin.items.find(i => i.itemId === request.itemId);
    if (!item) {
      throw new Error(`Item not found: ${request.itemId}`);
    }

    const wasteEntry = {
      date: new Date().toISOString(),
      itemId: request.itemId,
      itemName: item.name,
      quantity: request.quantity,
      reason: request.reason,
      estimatedCost: request.quantity * item.costPerUnit
    };

    inventoryTwin.wasteLog.push(wasteEntry);
    item.currentStock = Math.max(0, item.currentStock - request.quantity);

    inventoryTwin.calculateTotalValue();
    inventoryTwin.checkReorderPoints();

    await inventoryTwin.save();

    await messageBroker.publish('restaurant.inventory.waste.logged', {
      twinId: inventoryTwin.twinId,
      inventoryId,
      waste: wasteEntry,
      timestamp: new Date().toISOString()
    });
  }

  async createPurchaseOrder(inventoryId: string, request: CreatePurchaseOrderRequest): Promise<{
    purchaseOrderId: string;
    items: { itemId: string; name: string; quantity: number; supplier: string; estimatedCost: number }[];
    totalCost: number;
  }> {
    logger.info('Creating purchase order', { inventoryId, itemCount: request.items.length });

    const inventoryTwin = await InventoryTwin.findByInventoryId(inventoryId);
    if (!inventoryTwin) {
      throw new Error(`Inventory Twin not found for inventoryId: ${inventoryId}`);
    }

    const purchaseOrderId = uuidv4();
    const orderItems: { itemId: string; name: string; quantity: number; supplier: string; estimatedCost: number }[] = [];
    let totalCost = 0;

    for (const orderItem of request.items) {
      const item = inventoryTwin.items.find(i => i.itemId === orderItem.itemId);
      if (!item) continue;

      const supplier = orderItem.supplierId
        ? item.suppliers.find(s => s.supplierId === orderItem.supplierId)
        : item.suppliers[0];

      const cost = (supplier?.costPerUnit || item.costPerUnit) * orderItem.quantity;
      totalCost += cost;

      orderItems.push({
        itemId: item.itemId,
        name: item.name,
        quantity: orderItem.quantity,
        supplier: supplier?.name || 'Default',
        estimatedCost: cost
      });
    }

    await messageBroker.publish('restaurant.inventory.purchaseorder.created', {
      twinId: inventoryTwin.twinId,
      inventoryId,
      purchaseOrderId,
      items: orderItems,
      totalCost,
      timestamp: new Date().toISOString()
    });

    return {
      purchaseOrderId,
      items: orderItems,
      totalCost
    };
  }

  async getInventoryAnalytics(inventoryId: string): Promise<GetInventoryAnalyticsResponse> {
    logger.info('Getting inventory analytics', { inventoryId });

    const inventoryTwin = await InventoryTwin.findByInventoryId(inventoryId);
    if (!inventoryTwin) {
      throw new Error(`Inventory Twin not found for inventoryId: ${inventoryId}`);
    }

    const totalItems = inventoryTwin.items.length;
    const lowStockCount = inventoryTwin.reorderAlerts.length;
    const expiringCount = inventoryTwin.expiringAlerts.length;

    // Calculate waste this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const wasteThisMonth = inventoryTwin.wasteLog
      .filter(w => new Date(w.date) >= startOfMonth)
      .reduce((sum, w) => sum + w.estimatedCost, 0);

    // Top consumed items
    const topConsumedItems = inventoryTwin.items
      .filter(i => i.consumptionRate > 0)
      .sort((a, b) => b.consumptionRate - a.consumptionRate)
      .slice(0, 10)
      .map(i => ({
        itemId: i.itemId,
        name: i.name,
        consumption: i.consumptionRate
      }));

    return {
      totalItems,
      totalValue: inventoryTwin.totalValue,
      lowStockCount,
      expiringCount,
      wasteThisMonth,
      avgFoodCostPercentage: 0, // Would be calculated from sales data
      topConsumedItems
    };
  }

  async deleteInventoryTwin(inventoryId: string): Promise<void> {
    logger.info('Deleting Inventory Twin', { inventoryId });

    const result = await InventoryTwin.deleteOne({ inventoryId });
    if (result.deletedCount === 0) {
      throw new Error(`Inventory Twin not found for inventoryId: ${inventoryId}`);
    }

    await messageBroker.publish('restaurant.inventory.deleted', {
      inventoryId,
      timestamp: new Date().toISOString()
    });
  }
}

export const inventoryTwinService = new InventoryTwinService();