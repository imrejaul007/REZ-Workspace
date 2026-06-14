/**
 * Restaurant AI Service
 * Extends AIService with restaurant-specific AI operations
 */

import { AIService } from '@rez/base-services/ai';
import { logger } from '../config/logger';

interface DishRecommendation {
  dishId: string;
  dishName: string;
  score: number;
  reason: string;
  estimatedPrepTime: number;
  price: number;
}

interface PrepTimeForecast {
  orderId: string;
  estimatedPrepTime: number;
  breakdown: Array<{
    dishId: string;
    dishName: string;
    prepTime: number;
    cookTime: number;
  }>;
  currentKitchenLoad: number;
  suggestedCompletionTime: Date;
}

interface KitchenBottleneck {
  station: string;
  type: 'equipment' | 'staff' | 'ingredient';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedItems: string[];
  recommendation: string;
}

export class RestaurantAIService extends AIService {
  /**
   * Get personalized dish recommendations for a customer
   */
  async getDishRecommendations(customerId: string): Promise<DishRecommendation[]> {
    // Get customer preferences and history
    const preferences = await this.getCustomerPreferences(customerId);
    const orderHistory = await this.getCustomerOrderHistory(customerId);
    const dietaryRestrictions = await this.getDietaryRestrictions(customerId);

    // Get all available dishes
    const availableDishes = await this.getAvailableDishes();

    // Score each dish based on customer profile
    const scoredDishes = availableDishes.map((dish) => {
      let score = 0;
      let reason = '';

      // Check if customer has ordered similar dishes
      const historicalSimilarity = this.calculateHistoricalSimilarity(
        dish,
        orderHistory
      );
      score += historicalSimilarity * 0.4;

      // Check dietary compatibility
      const dietaryScore = this.checkDietaryCompatibility(
        dish,
        dietaryRestrictions
      );
      score += dietaryScore * 0.3;

      // Check preference alignment
      const preferenceScore = this.checkPreferenceAlignment(
        dish,
        preferences
      );
      score += preferenceScore * 0.3;

      if (historicalSimilarity > 0.8) {
        reason = 'Based on your order history';
      } else if (dietaryScore > 0.9) {
        reason = 'Matches your dietary preferences';
      } else if (preferenceScore > 0.7) {
        reason = 'Popular with similar customers';
      } else {
        reason = 'Highly rated dish';
      }

      return {
        dishId: dish.id,
        dishName: dish.name,
        score,
        reason,
        estimatedPrepTime: dish.prepTime,
        price: dish.price,
      };
    });

    // Sort by score and return top recommendations
    return scoredDishes
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  /**
   * Get prep time forecast for an order
   */
  async getPrepTimeForecast(orderId: string): Promise<PrepTimeForecast> {
    const order = await this.getOrderDetails(orderId);
    const kitchenStatus = await this.getKitchenStatus();

    let totalPrepTime = 0;
    const breakdown: PrepTimeForecast['breakdown'] = [];

    for (const item of order.items) {
      const dishPrep = await this.getDishPrepTime(item.dishId);
      totalPrepTime += dishPrep.prepTime + dishPrep.cookTime;

      breakdown.push({
        dishId: item.dishId,
        dishName: item.dishName,
        prepTime: dishPrep.prepTime,
        cookTime: dishPrep.cookTime,
      });
    }

    // Factor in current kitchen load
    const loadFactor = 1 + (kitchenStatus.currentLoad / 100) * 0.5;
    const adjustedPrepTime = Math.ceil(totalPrepTime * loadFactor);

    return {
      orderId,
      estimatedPrepTime: adjustedPrepTime,
      breakdown,
      currentKitchenLoad: kitchenStatus.currentLoad,
      suggestedCompletionTime: new Date(Date.now() + adjustedPrepTime * 60 * 1000),
    };
  }

  /**
   * Detect kitchen bottlenecks and provide recommendations
   */
  async detectKitchenBottleneck(): Promise<KitchenBottleneck[]> {
    const kitchenStatus = await this.getKitchenStatus();
    const equipmentStatus = await this.getEquipmentStatus();
    const staffStatus = await this.getStaffStatus();
    const inventoryStatus = await this.getInventoryStatus();

    const bottlenecks: KitchenBottleneck[] = [];

    // Check equipment bottlenecks
    for (const equipment of equipmentStatus) {
      if (equipment.utilization > 90) {
        bottlenecks.push({
          station: equipment.station,
          type: 'equipment',
          description: `${equipment.name} at ${equipment.utilization}% capacity`,
          severity: equipment.utilization > 95 ? 'critical' : 'high',
          affectedItems: equipment.affectedDishes,
          recommendation: 'Consider adding backup equipment or adjusting prep schedule',
        });
      }
    }

    // Check staff bottlenecks
    for (const station of staffStatus) {
      if (station.pendingOrders > station.capacity * 2) {
        bottlenecks.push({
          station: station.name,
          type: 'staff',
          description: `${station.pendingOrders} orders pending, capacity: ${station.capacity}`,
          severity: station.pendingOrders > station.capacity * 4 ? 'critical' : 'medium',
          affectedItems: station.assignedItems,
          recommendation: 'Consider reassigning staff or extending prep times',
        });
      }
    }

    // Check ingredient bottlenecks
    for (const ingredient of inventoryStatus) {
      if (ingredient.stock < ingredient.reorderLevel) {
        bottlenecks.push({
          station: 'inventory',
          type: 'ingredient',
          description: `${ingredient.name} below reorder level: ${ingredient.stock}/${ingredient.reorderLevel}`,
          severity: ingredient.stock < ingredient.minimumStock ? 'high' : 'medium',
          affectedItems: ingredient.usedInDishes,
          recommendation: `Reorder ${ingredient.name} immediately`,
        });
      }
    }

    return bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  // Protected methods with actual AI/ML service integration
  protected async getCustomerPreferences(customerId: string): Promise<Record<string, unknown>> {
    try {
      const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:3010/api/ml/customer-preferences';

      const response = await fetch(`${mlServiceUrl}/${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn(`No preferences found for customer: ${customerId}`);
          return {};
        }
        throw new Error(`ML service error: ${response.status}`);
      }

      const preferences = await response.json();
      return preferences;
    } catch (error) {
      logger.warn('Failed to fetch customer preferences from ML service', {
        customerId,
        error: error instanceof Error ? error.message : String(error),
      });
      return {};
    }
  }

  protected async getCustomerOrderHistory(customerId: string): Promise<Array<{
    dishId: string;
    dishName: string;
    rating?: number;
  }>> {
    try {
      const ordersServiceUrl = process.env.ORDERS_SERVICE_URL || 'http://localhost:3005/api/orders';

      const response = await fetch(`${ordersServiceUrl}/customer/${customerId}/items`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Orders service error: ${response.status}`);
      }

      const orderItems = await response.json();
      return orderItems.map((item: { dishId: string; dishName: string; rating?: number }) => ({
        dishId: item.dishId,
        dishName: item.dishName,
        rating: item.rating,
      }));
    } catch (error) {
      logger.warn('Failed to fetch customer order history', {
        customerId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  protected async getDietaryRestrictions(customerId: string): Promise<string[]> {
    try {
      const customersServiceUrl = process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:3006/api/customers';

      const response = await fetch(`${customersServiceUrl}/${customerId}/dietary-restrictions`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Customers service error: ${response.status}`);
      }

      const restrictions = await response.json();
      return restrictions;
    } catch (error) {
      logger.warn('Failed to fetch dietary restrictions', {
        customerId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  protected async getAvailableDishes(): Promise<Array<{
    id: string;
    name: string;
    prepTime: number;
    price: number;
    tags: string[];
  }>> {
    try {
      const menuServiceUrl = process.env.MENU_SERVICE_URL || 'http://localhost:3007/api/menu/dishes';

      const response = await fetch(`${menuServiceUrl}?available=true`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Menu service error: ${response.status}`);
      }

      const dishes = await response.json();
      return dishes.map((dish: { id: string; name: string; prepTime: number; price: number; tags: string[] }) => ({
        id: dish.id,
        name: dish.name,
        prepTime: dish.prepTime,
        price: dish.price,
        tags: dish.tags || [],
      }));
    } catch (error) {
      logger.warn('Failed to fetch available dishes from menu service', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  protected calculateHistoricalSimilarity(
    dish: { id: string; name: string; tags: string[] },
    history: Array<{ dishId: string; dishName: string; rating?: number }>
  ): number {
    // Simple tag-based similarity
    const historyDishIds = new Set(history.map((h) => h.dishId));
    if (historyDishIds.has(dish.id)) {
      const orderedDish = history.find((h) => h.dishId === dish.id);
      return orderedDish?.rating ? orderedDish.rating / 5 : 1;
    }
    return 0.2; // Base score for new dishes
  }

  protected checkDietaryCompatibility(
    dish: { tags: string[] },
    restrictions: string[]
  ): number {
    if (restrictions.length === 0) return 1;
    const restrictedTags = new Set(restrictions.map((r) => r.toLowerCase()));
    const dishTags = new Set(dish.tags.map((t) => t.toLowerCase()));

    for (const restriction of restrictedTags) {
      if (dishTags.has(restriction)) return 0;
    }
    return 1;
  }

  protected checkPreferenceAlignment(
    dish: { tags: string[] },
    preferences: Record<string, unknown>
  ): number {
    try {
      const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:3010/api/ml/preference-match';

      // Use ML service to calculate preference alignment score
      const response = fetch(`${mlServiceUrl}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish, preferences }),
      }).then(res => res.json()).catch(() => null);

      if (response && typeof response.score === 'number') {
        return response.score;
      }
    } catch (error) {
      logger.warn('Failed to get preference alignment from ML service', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return 0.5;
  }

  protected async getOrderDetails(orderId: string): Promise<{
    items: Array<{ dishId: string; dishName: string; quantity: number }>;
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
        items: order.items || [],
      };
    } catch (error) {
      logger.warn('Failed to fetch order details', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
      return { items: [] };
    }
  }

  protected async getKitchenStatus(): Promise<{ currentLoad: number }> {
    try {
      const kitchenServiceUrl = process.env.KITCHEN_SERVICE_URL || 'http://localhost:3008/api/kitchen/status';

      const response = await fetch(kitchenServiceUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Kitchen service error: ${response.status}`);
      }

      const status = await response.json();
      return { currentLoad: status.currentLoad || status.load || 50 };
    } catch (error) {
      logger.warn('Failed to fetch kitchen status', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { currentLoad: 50 };
    }
  }

  protected async getDishPrepTime(dishId: string): Promise<{ prepTime: number; cookTime: number }> {
    try {
      const menuServiceUrl = process.env.MENU_SERVICE_URL || 'http://localhost:3007/api/menu';

      const response = await fetch(`${menuServiceUrl}/dishes/${dishId}/prep-time`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Return default values if dish not found
          return { prepTime: 10, cookTime: 15 };
        }
        throw new Error(`Menu service error: ${response.status}`);
      }

      const prepData = await response.json();
      return {
        prepTime: prepData.prepTime || 10,
        cookTime: prepData.cookTime || 15,
      };
    } catch (error) {
      logger.warn('Failed to fetch dish prep time', {
        dishId,
        error: error instanceof Error ? error.message : String(error),
      });
      return { prepTime: 10, cookTime: 15 };
    }
  }

  protected async getEquipmentStatus(): Promise<Array<{
    station: string;
    name: string;
    utilization: number;
    affectedDishes: string[];
  }>> {
    try {
      const kitchenServiceUrl = process.env.KITCHEN_SERVICE_URL || 'http://localhost:3008/api/kitchen/equipment';

      const response = await fetch(kitchenServiceUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Kitchen service error: ${response.status}`);
      }

      const equipment = await response.json();
      return equipment.map((eq: { station: string; name: string; utilization: number; affectedDishes: string[] }) => ({
        station: eq.station,
        name: eq.name,
        utilization: eq.utilization,
        affectedDishes: eq.affectedDishes || [],
      }));
    } catch (error) {
      logger.warn('Failed to fetch equipment status', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  protected async getStaffStatus(): Promise<Array<{
    name: string;
    capacity: number;
    pendingOrders: number;
    assignedItems: string[];
  }>> {
    try {
      const staffServiceUrl = process.env.STAFF_SERVICE_URL || 'http://localhost:3009/api/staff/kitchen-status';

      const response = await fetch(staffServiceUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Staff service error: ${response.status}`);
      }

      const staff = await response.json();
      return staff.map((s: { name: string; capacity: number; pendingOrders: number; assignedItems: string[] }) => ({
        name: s.name,
        capacity: s.capacity,
        pendingOrders: s.pendingOrders,
        assignedItems: s.assignedItems || [],
      }));
    } catch (error) {
      logger.warn('Failed to fetch staff status', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  protected async getInventoryStatus(): Promise<Array<{
    name: string;
    stock: number;
    reorderLevel: number;
    minimumStock: number;
    usedInDishes: string[];
  }>> {
    try {
      const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3011/api/inventory/status';

      const response = await fetch(inventoryServiceUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Inventory service error: ${response.status}`);
      }

      const inventory = await response.json();
      return inventory.map((item: { name: string; stock: number; reorderLevel: number; minimumStock: number; usedInDishes: string[] }) => ({
        name: item.name,
        stock: item.stock,
        reorderLevel: item.reorderLevel,
        minimumStock: item.minimumStock,
        usedInDishes: item.usedInDishes || [],
      }));
    } catch (error) {
      logger.warn('Failed to fetch inventory status', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}

export default RestaurantAIService;
