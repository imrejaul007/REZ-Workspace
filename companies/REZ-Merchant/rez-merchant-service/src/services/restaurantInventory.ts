/**
 * Restaurant Inventory Service
 * Extends BaseInventoryService with restaurant-specific inventory operations
 */

import { BaseInventoryService } from '@rez/base-services/inventory';
import { logger } from '../config/logger';

interface IngredientStock {
  ingredientId: string;
  name: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  lastUpdated: Date;
}

interface RecipeCost {
  dishId: string;
  dishName: string;
  totalCost: number;
  ingredients: Array<{
    ingredientId: string;
    name: string;
    quantity: number;
    unitCost: number;
  }>;
}

interface WasteEntry {
  id: string;
  reason: string;
  items: Array<{
    ingredientId: string;
    name: string;
    quantity: number;
    estimatedCost: number;
  }>;
  timestamp: Date;
  reportedBy: string;
}

export class RestaurantInventoryService extends BaseInventoryService {
  /**
   * Track ingredient stock levels and alert when below reorder level
   */
  async trackIngredient(ingredientId: string, stock: number): Promise<IngredientStock> {
    const ingredient = await this.getIngredient(ingredientId);

    const updated: IngredientStock = {
      ingredientId,
      name: ingredient.name,
      currentStock: stock,
      unit: ingredient.unit,
      reorderLevel: ingredient.reorderLevel,
      lastUpdated: new Date(),
    };

    await this.updateStock(ingredientId, stock);

    // Alert if below reorder level
    if (stock < ingredient.reorderLevel) {
      await this.sendReorderAlert(ingredientId, stock, ingredient.reorderLevel);
    }

    return updated;
  }

  /**
   * Calculate the total recipe cost for a dish
   */
  async getRecipeCost(dishId: string): Promise<RecipeCost> {
    const dish = await this.getDish(dishId);
    const ingredients = await this.getDishIngredients(dishId);

    let totalCost = 0;
    const ingredientCosts = ingredients.map((ing) => {
      const cost = ing.quantity * ing.unitPrice;
      totalCost += cost;
      return {
        ingredientId: ing.ingredientId,
        name: ing.name,
        quantity: ing.quantity,
        unitCost: ing.unitPrice,
      };
    });

    return {
      dishId,
      dishName: dish.name,
      totalCost,
      ingredients: ingredientCosts,
    };
  }

  /**
   * Deduct ingredients from inventory when an order is placed
   */
  async deductForOrder(orderId: string): Promise<void> {
    const order = await this.getOrder(orderId);
    const items = order.items;

    for (const item of items) {
      const recipe = await this.getDishIngredients(item.dishId);
      const quantityMultiplier = item.quantity;

      for (const ingredient of recipe) {
        const deductAmount = ingredient.quantity * quantityMultiplier;
        const currentStock = await this.getCurrentStock(ingredient.ingredientId);
        await this.updateStock(
          ingredient.ingredientId,
          currentStock - deductAmount
        );
      }
    }

    await this.recordDeduction(orderId, items);
  }

  /**
   * Record waste or loss incidents for inventory tracking
   */
  async addWasteLoss(reason: string, items: Array<{
    ingredientId: string;
    name: string;
    quantity: number;
    estimatedCost: number;
  }>): Promise<WasteEntry> {
    const wasteEntry: WasteEntry = {
      id: this.generateId(),
      reason,
      items,
      timestamp: new Date(),
      reportedBy: this.getCurrentUserId(),
    };

    // Deduct wasted items from inventory
    for (const item of items) {
      const currentStock = await this.getCurrentStock(item.ingredientId);
      await this.updateStock(item.ingredientId, currentStock - item.quantity);
    }

    await this.saveWasteEntry(wasteEntry);

    return wasteEntry;
  }

  // Protected methods with actual database calls
  protected async getIngredient(ingredientId: string): Promise<{
    name: string;
    unit: string;
    reorderLevel: number;
  }> {
    try {
      const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3011/api/inventory';

      const response = await fetch(`${inventoryServiceUrl}/ingredients/${ingredientId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Ingredient not found: ${ingredientId}`);
        }
        throw new Error(`Inventory service error: ${response.status}`);
      }

      const ingredient = await response.json();
      return {
        name: ingredient.name || '',
        unit: ingredient.unit || '',
        reorderLevel: ingredient.reorderLevel || 0,
      };
    } catch (error) {
      logger.warn('Failed to fetch ingredient from inventory service', {
        ingredientId,
        error: error instanceof Error ? error.message : String(error),
      });
      return { name: '', unit: '', reorderLevel: 0 };
    }
  }

  protected async updateStock(ingredientId: string, newStock: number): Promise<void> {
    try {
      const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3011/api/inventory';

      const response = await fetch(`${inventoryServiceUrl}/ingredients/${ingredientId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });

      if (!response.ok) {
        throw new Error(`Inventory service error: ${response.status}`);
      }

      logger.info('Stock updated via inventory service', { ingredientId, newStock });
    } catch (error) {
      logger.warn('Failed to update stock via inventory service', {
        ingredientId,
        newStock,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  protected async getDish(dishId: string): Promise<{ name: string }> {
    try {
      const menuServiceUrl = process.env.MENU_SERVICE_URL || 'http://localhost:3007/api/menu';

      const response = await fetch(`${menuServiceUrl}/dishes/${dishId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Dish not found: ${dishId}`);
        }
        throw new Error(`Menu service error: ${response.status}`);
      }

      const dish = await response.json();
      return { name: dish.name || '' };
    } catch (error) {
      logger.warn('Failed to fetch dish from menu service', {
        dishId,
        error: error instanceof Error ? error.message : String(error),
      });
      return { name: '' };
    }
  }

  protected async getDishIngredients(dishId: string): Promise<Array<{
    ingredientId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>> {
    try {
      const menuServiceUrl = process.env.MENU_SERVICE_URL || 'http://localhost:3007/api/menu';

      const response = await fetch(`${menuServiceUrl}/dishes/${dishId}/ingredients`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Menu service error: ${response.status}`);
      }

      const ingredients = await response.json();
      return ingredients.map((ing: { ingredientId: string; name: string; quantity: number; unitPrice: number }) => ({
        ingredientId: ing.ingredientId,
        name: ing.name,
        quantity: ing.quantity,
        unitPrice: ing.unitPrice,
      }));
    } catch (error) {
      logger.warn('Failed to fetch dish ingredients from menu service', {
        dishId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  protected async getOrder(orderId: string): Promise<{
    items: Array<{ dishId: string; quantity: number }>;
  }> {
    try {
      const ordersServiceUrl = process.env.ORDERS_SERVICE_URL || 'http://localhost:3005/api/orders';

      const response = await fetch(`${ordersServiceUrl}/${orderId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Order not found: ${orderId}`);
        }
        throw new Error(`Orders service error: ${response.status}`);
      }

      const order = await response.json();
      return {
        items: order.items?.map((item: { dishId: string; quantity: number }) => ({
          dishId: item.dishId,
          quantity: item.quantity,
        })) || [],
      };
    } catch (error) {
      logger.warn('Failed to fetch order from orders service', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
      return { items: [] };
    }
  }

  protected async getCurrentStock(ingredientId: string): Promise<number> {
    try {
      const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3011/api/inventory';

      const response = await fetch(`${inventoryServiceUrl}/ingredients/${ingredientId}/current-stock`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return 0;
        }
        throw new Error(`Inventory service error: ${response.status}`);
      }

      const result = await response.json();
      return result.stock || 0;
    } catch (error) {
      logger.warn('Failed to fetch current stock from inventory service', {
        ingredientId,
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  protected async recordDeduction(
    orderId: string,
    items: Array<{ dishId: string; quantity: number }>
  ): Promise<void> {
    try {
      const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3011/api/inventory';

      const response = await fetch(`${inventoryServiceUrl}/deductions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, items, timestamp: new Date().toISOString() }),
      });

      if (!response.ok) {
        throw new Error(`Inventory service error: ${response.status}`);
      }

      logger.info('Deduction recorded via inventory service', { orderId, itemsCount: items.length });
    } catch (error) {
      logger.warn('Failed to record deduction via inventory service', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  protected async saveWasteEntry(entry: WasteEntry): Promise<void> {
    try {
      const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3011/api/inventory';

      const response = await fetch(`${inventoryServiceUrl}/waste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`Inventory service error: ${response.status}`);
      }

      logger.info('Waste entry saved via inventory service', { entryId: entry.id });
    } catch (error) {
      logger.warn('Failed to save waste entry via inventory service', {
        entryId: entry.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  protected async sendReorderAlert(
    ingredientId: string,
    currentStock: number,
    reorderLevel: number
  ): Promise<void> {
    try {
      const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004/api/notifications/send';

      const response = await fetch(notificationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reorder_alert',
          ingredientId,
          currentStock,
          reorderLevel,
          message: `Ingredient ${ingredientId} is below reorder level. Current: ${currentStock}, Required: ${reorderLevel}`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Notification service error: ${response.status} - ${errorText}`);
      }

      logger.info('Reorder alert sent via notification service', { ingredientId, currentStock, reorderLevel });
    } catch (error) {
      // Log warning but don't fail the operation
      logger.warn('Failed to send reorder alert via notification service', {
        ingredientId,
        currentStock,
        reorderLevel,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * FIX (security): Replaced Math.random() with crypto.randomUUID() for secure ID generation
   */
  protected generateId(): string {
    try {
      const { randomUUID } = require('crypto');
      return `waste_${Date.now()}_${randomUUID().replace(/-/g, '').substring(0, 9)}`;
    } catch {
      // Legacy fallback (only for environments without crypto)
      return `waste_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  protected getCurrentUserId(): string {
    return 'system';
  }
}

export default RestaurantInventoryService;
