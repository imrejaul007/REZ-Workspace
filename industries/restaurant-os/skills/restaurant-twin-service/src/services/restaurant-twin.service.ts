import { RestaurantTwin } from '../models/restaurant-twin.model';
import {
  CreateRestaurantTwinRequest,
  CreateRestaurantTwinResponse,
  GetRestaurantTwinResponse,
  UpdateRestaurantStatusRequest,
  UpdateRestaurantStatusResponse,
  UpdateMetricsRequest,
  UpdateMetricsResponse,
  UpdateOperatingHoursRequest,
  UpdateOperatingHoursResponse,
  UpdateFeaturesRequest,
  UpdateFeaturesResponse,
  ListRestaurantsRequest,
  ListRestaurantsResponse,
  defaultFeatures,
  defaultMetrics,
  RestaurantStatus
} from '../schemas/restaurant-twin.schema';
import { logger } from '../utils/logger';
import { messageBroker } from '../utils/message-broker';
import { rezPOSClient } from '../utils/rez-pos-client';
import { rezDashboardClient } from '../utils/rez-dashboard-client';

export class RestaurantTwinService {
  /**
   * Create a new Restaurant Twin
   */
  async createRestaurantTwin(request: CreateRestaurantTwinRequest): Promise<CreateRestaurantTwinResponse> {
    const twinId = `twin.restaurant.${request.restaurantId}`;
    const twinOsEntityId = twinId;

    logger.info('Creating Restaurant Twin', { restaurantId: request.restaurantId, twinId });

    // Check if twin already exists
    const existingTwin = await RestaurantTwin.findByRestaurantId(request.restaurantId);
    if (existingTwin) {
      throw new Error(`Restaurant Twin already exists for restaurantId: ${request.restaurantId}`);
    }

    // Create the restaurant twin document
    const restaurantTwin = new RestaurantTwin({
      twinId,
      restaurantId: request.restaurantId,
      merchantId: request.merchantId,
      name: request.name,
      description: request.description,
      cuisineType: request.cuisineType,
      location: request.location,
      contact: request.contact,
      totalTables: request.totalTables,
      totalSeats: request.totalSeats,
      operatingHours: request.operatingHours,
      features: {
        ...defaultFeatures,
        ...request.features
      },
      currentMetrics: defaultMetrics,
      status: RestaurantStatus.CLOSED,
      lastUpdated: new Date().toISOString()
    });

    await restaurantTwin.save();

    // Publish event to TwinOS
    await messageBroker.publish('restaurant.twin.created', {
      twinId,
      restaurantId: request.restaurantId,
      merchantId: request.merchantId,
      name: request.name,
      twinOsEntityId,
      timestamp: new Date().toISOString()
    });

    // Sync with REZ POS
    await rezPOSClient.syncRestaurant({
      restaurantId: request.restaurantId,
      name: request.name,
      features: restaurantTwin.features
    });

    logger.info('Restaurant Twin created successfully', { twinId, restaurantId: request.restaurantId });

    return {
      twinId,
      restaurantId: request.restaurantId,
      twinOsEntityId,
      createdAt: restaurantTwin.createdAt.toISOString()
    };
  }

  /**
   * Get Restaurant Twin by ID
   */
  async getRestaurantTwin(restaurantId: string): Promise<GetRestaurantTwinResponse> {
    logger.info('Fetching Restaurant Twin', { restaurantId });

    const restaurantTwin = await RestaurantTwin.findByRestaurantId(restaurantId);
    if (!restaurantTwin) {
      throw new Error(`Restaurant Twin not found for restaurantId: ${restaurantId}`);
    }

    return restaurantTwin.toJSON() as GetRestaurantTwinResponse;
  }

  /**
   * Update Restaurant Status
   */
  async updateRestaurantStatus(
    restaurantId: string,
    request: UpdateRestaurantStatusRequest
  ): Promise<UpdateRestaurantStatusResponse> {
    logger.info('Updating Restaurant Twin status', { restaurantId, status: request.status });

    const restaurantTwin = await RestaurantTwin.findByRestaurantId(restaurantId);
    if (!restaurantTwin) {
      throw new Error(`Restaurant Twin not found for restaurantId: ${restaurantId}`);
    }

    restaurantTwin.status = request.status;
    restaurantTwin.lastUpdated = new Date().toISOString();
    await restaurantTwin.save();

    // Publish status change event
    await messageBroker.publish('restaurant.twin.status.changed', {
      twinId: restaurantTwin.twinId,
      restaurantId,
      previousStatus: restaurantTwin.status,
      newStatus: request.status,
      timestamp: new Date().toISOString()
    });

    // Notify REZ Dashboard
    await rezDashboardClient.notifyStatusChange(restaurantId, request.status);

    logger.info('Restaurant Twin status updated', { twinId: restaurantTwin.twinId, restaurantId });

    return {
      twinId: restaurantTwin.twinId,
      restaurantId,
      status: request.status,
      updatedAt: restaurantTwin.updatedAt.toISOString()
    };
  }

  /**
   * Update Restaurant Metrics
   */
  async updateMetrics(
    restaurantId: string,
    request: UpdateMetricsRequest
  ): Promise<UpdateMetricsResponse> {
    logger.info('Updating Restaurant Twin metrics', { restaurantId });

    const restaurantTwin = await RestaurantTwin.findByRestaurantId(restaurantId);
    if (!restaurantTwin) {
      throw new Error(`Restaurant Twin not found for restaurantId: ${restaurantId}`);
    }

    // Update metrics
    if (request.currentCovers !== undefined) {
      restaurantTwin.currentMetrics.currentCovers = request.currentCovers;
    }
    if (request.pendingOrders !== undefined) {
      restaurantTwin.currentMetrics.pendingOrders = request.pendingOrders;
    }
    if (request.avgWaitTime !== undefined) {
      restaurantTwin.currentMetrics.avgWaitTime = request.avgWaitTime;
    }
    if (request.tableTurnover !== undefined) {
      restaurantTwin.currentMetrics.tableTurnover = request.tableTurnover;
    }
    if (request.activeStaff !== undefined) {
      restaurantTwin.currentMetrics.activeStaff = request.activeStaff;
    }
    if (request.kitchenUtilization !== undefined) {
      restaurantTwin.currentMetrics.kitchenUtilization = request.kitchenUtilization;
    }
    if (request.revenueToday !== undefined) {
      restaurantTwin.currentMetrics.revenueToday = request.revenueToday;
    }
    if (request.ordersToday !== undefined) {
      restaurantTwin.currentMetrics.ordersToday = request.ordersToday;
    }

    restaurantTwin.lastUpdated = new Date().toISOString();
    await restaurantTwin.save();

    // Publish metrics update event
    await messageBroker.publish('restaurant.twin.metrics.updated', {
      twinId: restaurantTwin.twinId,
      restaurantId,
      metrics: restaurantTwin.currentMetrics,
      timestamp: new Date().toISOString()
    });

    logger.info('Restaurant Twin metrics updated', { twinId: restaurantTwin.twinId, restaurantId });

    return {
      twinId: restaurantTwin.twinId,
      restaurantId,
      metrics: restaurantTwin.currentMetrics,
      updatedAt: restaurantTwin.updatedAt.toISOString()
    };
  }

  /**
   * Update Operating Hours
   */
  async updateOperatingHours(
    restaurantId: string,
    request: UpdateOperatingHoursRequest
  ): Promise<UpdateOperatingHoursResponse> {
    logger.info('Updating Restaurant Twin operating hours', { restaurantId });

    const restaurantTwin = await RestaurantTwin.findByRestaurantId(restaurantId);
    if (!restaurantTwin) {
      throw new Error(`Restaurant Twin not found for restaurantId: ${restaurantId}`);
    }

    restaurantTwin.operatingHours = request.operatingHours;
    restaurantTwin.lastUpdated = new Date().toISOString();
    await restaurantTwin.save();

    // Publish operating hours update event
    await messageBroker.publish('restaurant.twin.hours.updated', {
      twinId: restaurantTwin.twinId,
      restaurantId,
      operatingHours: request.operatingHours,
      timestamp: new Date().toISOString()
    });

    logger.info('Restaurant Twin operating hours updated', { twinId: restaurantTwin.twinId, restaurantId });

    return {
      twinId: restaurantTwin.twinId,
      restaurantId,
      operatingHours: request.operatingHours,
      updatedAt: restaurantTwin.updatedAt.toISOString()
    };
  }

  /**
   * Update Restaurant Features
   */
  async updateFeatures(
    restaurantId: string,
    request: UpdateFeaturesRequest
  ): Promise<UpdateFeaturesResponse> {
    logger.info('Updating Restaurant Twin features', { restaurantId });

    const restaurantTwin = await RestaurantTwin.findByRestaurantId(restaurantId);
    if (!restaurantTwin) {
      throw new Error(`Restaurant Twin not found for restaurantId: ${restaurantId}`);
    }

    restaurantTwin.features = {
      ...restaurantTwin.features,
      ...request.features
    };
    restaurantTwin.lastUpdated = new Date().toISOString();
    await restaurantTwin.save();

    // Publish features update event
    await messageBroker.publish('restaurant.twin.features.updated', {
      twinId: restaurantTwin.twinId,
      restaurantId,
      features: restaurantTwin.features,
      timestamp: new Date().toISOString()
    });

    logger.info('Restaurant Twin features updated', { twinId: restaurantTwin.twinId, restaurantId });

    return {
      twinId: restaurantTwin.twinId,
      restaurantId,
      features: restaurantTwin.features,
      updatedAt: restaurantTwin.updatedAt.toISOString()
    };
  }

  /**
   * List Restaurants
   */
  async listRestaurants(request: ListRestaurantsRequest): Promise<ListRestaurantsResponse> {
    logger.info('Listing Restaurant Twins', { request });

    const limit = request.limit || 20;
    const offset = request.offset || 0;

    let query: Record<string, unknown> = {};
    if (request.merchantId) {
      query.merchantId = request.merchantId;
    }
    if (request.status) {
      query.status = request.status;
    }
    if (request.cuisineType) {
      query.cuisineType = request.cuisineType;
    }

    const [restaurants, total] = await Promise.all([
      RestaurantTwin.find(query).skip(offset).limit(limit).sort({ name: 1 }),
      RestaurantTwin.countDocuments(query)
    ]);

    return {
      restaurants: restaurants.map(r => r.toJSON() as any),
      total,
      limit,
      offset
    };
  }

  /**
   * Delete Restaurant Twin
   */
  async deleteRestaurantTwin(restaurantId: string): Promise<void> {
    logger.info('Deleting Restaurant Twin', { restaurantId });

    const result = await RestaurantTwin.deleteOne({ restaurantId });
    if (result.deletedCount === 0) {
      throw new Error(`Restaurant Twin not found for restaurantId: ${restaurantId}`);
    }

    // Publish deletion event
    await messageBroker.publish('restaurant.twin.deleted', {
      restaurantId,
      timestamp: new Date().toISOString()
    });

    logger.info('Restaurant Twin deleted', { restaurantId });
  }
}

// Export singleton instance
export const restaurantTwinService = new RestaurantTwinService();
