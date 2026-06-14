/**
 * Restaurant Customer 360 Service
 * Extends CustomerService with restaurant-specific customer insights
 */

import { CustomerService } from '@rez/base-services/customer';
import { logger } from '../config/logger';

// Database model imports - adjust paths as needed
// These would typically come from your models directory
interface CustomerOrder {
  id: string;
  customerId: string;
  createdAt: Date;
  items: Array<{
    dishId: string;
    dishName: string;
    quantity: number;
    price: number;
    rating?: number;
  }>;
  total: number;
  status: string;
  rating?: number;
}

interface CustomerProfile {
  id: string;
  customerId: string;
  allergies?: Array<{ ingredient: string }>;
  dietaryRestrictions?: Array<{ description: string; strict: boolean }>;
  preferences?: Array<{ type: string; description?: string; value?: string }>;
}

interface OrderHistoryEntry {
  orderId: string;
  date: Date;
  items: Array<{
    dishId: string;
    dishName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  rating?: number;
}

interface FavoriteDish {
  dishId: string;
  dishName: string;
  orderCount: number;
  lastOrdered: Date;
  averageRating: number;
}

interface DietaryPreference {
  type: string;
  description: string;
  severity: 'strict' | 'preferred' | 'avoid';
  ingredients?: string[];
}

export class RestaurantCustomerService extends CustomerService {
  /**
   * Get complete order history for a customer
   */
  async getOrderHistory(customerId: string): Promise<OrderHistoryEntry[]> {
    const orders = await this.getCustomerOrders(customerId);

    return orders.map((order) => ({
      orderId: order.id,
      date: order.createdAt,
      items: order.items.map((item) => ({
        dishId: item.dishId,
        dishName: item.dishName,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: order.total,
      status: order.status,
      rating: order.rating,
    }));
  }

  /**
   * Get customer's most frequently ordered dishes
   */
  async getFavoriteDishes(customerId: string): Promise<FavoriteDish[]> {
    const orders = await this.getCustomerOrders(customerId);

    // Aggregate dish orders
    const dishMap = new Map<string, {
      dishId: string;
      dishName: string;
      orderCount: number;
      lastOrdered: Date;
      totalRating: number;
      ratingCount: number;
    }>();

    for (const order of orders) {
      for (const item of order.items) {
        const existing = dishMap.get(item.dishId);
        if (existing) {
          existing.orderCount += item.quantity;
          existing.lastOrdered = order.createdAt;
          if (item.rating) {
            existing.totalRating += item.rating;
            existing.ratingCount += 1;
          }
        } else {
          dishMap.set(item.dishId, {
            dishId: item.dishId,
            dishName: item.dishName,
            orderCount: item.quantity,
            lastOrdered: order.createdAt,
            totalRating: item.rating || 0,
            ratingCount: item.rating ? 1 : 0,
          });
        }
      }
    }

    // Convert to array and calculate averages
    const favorites: FavoriteDish[] = [];
    dishMap.forEach((data) => {
      favorites.push({
        dishId: data.dishId,
        dishName: data.dishName,
        orderCount: data.orderCount,
        lastOrdered: data.lastOrdered,
        averageRating: data.ratingCount > 0
          ? data.totalRating / data.ratingCount
          : 0,
      });
    });

    // Sort by order count descending
    return favorites.sort((a, b) => b.orderCount - a.orderCount);
  }

  /**
   * Get customer's dietary preferences and restrictions
   */
  async getDietaryPreferences(customerId: string): Promise<DietaryPreference[]> {
    const customer = await this.getCustomerProfile(customerId);
    const preferences: DietaryPreference[] = [];

    if (customer.allergies) {
      for (const allergy of customer.allergies) {
        preferences.push({
          type: 'allergy',
          description: `Allergic to ${allergy.ingredient}`,
          severity: 'strict',
          ingredients: [allergy.ingredient],
        });
      }
    }

    if (customer.dietaryRestrictions) {
      for (const restriction of customer.dietaryRestrictions) {
        preferences.push({
          type: 'restriction',
          description: restriction.description,
          severity: restriction.strict ? 'strict' : 'preferred',
        });
      }
    }

    if (customer.preferences) {
      for (const pref of customer.preferences) {
        if (pref.type === 'vegetarian' || pref.type === 'vegan') {
          preferences.push({
            type: pref.type,
            description: `Follows ${pref.type} diet`,
            severity: 'preferred',
          });
        }
        if (pref.type === 'spice_level') {
          preferences.push({
            type: 'spice',
            description: `Prefers ${pref.value} spice level`,
            severity: 'preferred',
          });
        }
      }
    }

    return preferences;
  }

  // Protected methods with actual database calls
  protected async getCustomerOrders(customerId: string): Promise<Array<{
    id: string;
    createdAt: Date;
    items: Array<{
      dishId: string;
      dishName: string;
      quantity: number;
      price: number;
      rating?: number;
    }>;
    total: number;
    status: string;
    rating?: number;
  }>> {
    try {
      const ordersServiceUrl = process.env.ORDERS_SERVICE_URL || 'http://localhost:3005/api/orders';

      const response = await fetch(`${ordersServiceUrl}/customer/${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn(`No orders found for customer: ${customerId}`);
          return [];
        }
        throw new Error(`Orders service error: ${response.status}`);
      }

      const orders: CustomerOrder[] = await response.json();

      return orders.map((order) => ({
        id: order.id,
        createdAt: order.createdAt,
        items: order.items,
        total: order.total,
        status: order.status,
        rating: order.rating,
      }));
    } catch (error) {
      logger.warn('Failed to fetch customer orders from service, attempting direct DB lookup', {
        customerId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback: Try direct database query
      try {
        const dbUrl = process.env.CUSTOMER_DB_URL || 'http://localhost:27017';
        const response = await fetch(`${dbUrl}/orders/find`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filter: { customerId },
            projection: { id: '$_id', createdAt: 1, items: 1, total: 1, status: 1, rating: 1 },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          return result.map((doc: Record<string, unknown>) => ({
            id: String(doc.id),
            createdAt: doc.createdAt,
            items: doc.items || [],
            total: doc.total || 0,
            status: doc.status || 'unknown',
            rating: doc.rating,
          }));
        }
      } catch (dbError) {
        logger.error('Direct database lookup also failed', {
          customerId,
          error: dbError instanceof Error ? dbError.message : String(dbError),
        });
      }

      return [];
    }
  }

  protected async getCustomerProfile(customerId: string): Promise<{
    allergies?: Array<{ ingredient: string }>;
    dietaryRestrictions?: Array<{ description: string; strict: boolean }>;
    preferences?: Array<{ type: string; description?: string; value?: string }>;
  }> {
    try {
      const customersServiceUrl = process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:3006/api/customers';

      const response = await fetch(`${customersServiceUrl}/${customerId}/profile`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn(`Customer profile not found: ${customerId}`);
          return {};
        }
        throw new Error(`Customers service error: ${response.status}`);
      }

      const profile: CustomerProfile = await response.json();

      return {
        allergies: profile.allergies,
        dietaryRestrictions: profile.dietaryRestrictions,
        preferences: profile.preferences,
      };
    } catch (error) {
      logger.warn('Failed to fetch customer profile from service, attempting direct DB lookup', {
        customerId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback: Try direct database query
      try {
        const dbUrl = process.env.CUSTOMER_DB_URL || 'http://localhost:27017';
        const response = await fetch(`${dbUrl}/customers/findOne`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filter: { customerId },
            projection: { allergies: 1, dietaryRestrictions: 1, preferences: 1 },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          return {
            allergies: result.allergies || [],
            dietaryRestrictions: result.dietaryRestrictions || [],
            preferences: result.preferences || [],
          };
        }
      } catch (dbError) {
        logger.error('Direct database lookup also failed', {
          customerId,
          error: dbError instanceof Error ? dbError.message : String(dbError),
        });
      }

      return {};
    }
  }
}

export default RestaurantCustomerService;
