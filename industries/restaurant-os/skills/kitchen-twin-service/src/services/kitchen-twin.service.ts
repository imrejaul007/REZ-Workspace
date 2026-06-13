import { v4 as uuidv4 } from 'uuid';
import { KitchenTwin } from '../models/kitchen-twin.model';
import {
  CreateKitchenTwinRequest,
  CreateKitchenTwinResponse,
  GetKitchenTwinResponse,
  UpdateStationRequest,
  UpdateStationResponse,
  AssignOrderToStationRequest,
  AssignOrderToStationResponse,
  BumpOrderFromStationRequest,
  GetStationPerformanceResponse,
  GetKitchenAnalyticsResponse,
  StationStatus,
  defaultStations
} from '../schemas/kitchen-twin.schema';
import { logger } from '../utils/logger';
import { messageBroker } from '../utils/message-broker';
import { kitchenAIClient } from '../utils/kitchen-ai-client';

export class KitchenTwinService {
  async createKitchenTwin(request: CreateKitchenTwinRequest): Promise<CreateKitchenTwinResponse> {
    const kitchenId = uuidv4();
    const twinId = `twin.restaurant.kitchen.${kitchenId}`;

    logger.info('Creating Kitchen Twin', { kitchenId, restaurantId: request.restaurantId });

    const existingTwin = await KitchenTwin.findByKitchenId(kitchenId);
    if (existingTwin) {
      throw new Error(`Kitchen Twin already exists for kitchenId: ${kitchenId}`);
    }

    const stations = request.stations?.map((s, idx) => ({
      stationId: `${s.type}-${idx + 1}`,
      name: s.name,
      type: s.type,
      assignedItems: s.assignedItems || [],
      currentOrders: [],
      capacity: s.capacity || 5,
      status: StationStatus.OPEN,
      avgCookTime: 10,
      currentLoad: 0
    })) || defaultStations.map(s => ({ ...s, stationId: uuidv4() }));

    const kitchenTwin = new KitchenTwin({
      twinId,
      kitchenId,
      restaurantId: request.restaurantId,
      name: request.name,
      stations,
      activeOrders: [],
      pendingOrders: 0,
      alerts: []
    });

    await kitchenTwin.save();

    await messageBroker.publish('restaurant.kitchen.created', {
      twinId,
      kitchenId,
      restaurantId: request.restaurantId,
      twinOsEntityId: twinId,
      timestamp: new Date().toISOString()
    });

    logger.info('Kitchen Twin created successfully', { twinId, kitchenId });

    return {
      twinId,
      kitchenId,
      twinOsEntityId: twinId,
      createdAt: kitchenTwin.createdAt.toISOString()
    };
  }

  async getKitchenTwin(kitchenId: string): Promise<GetKitchenTwinResponse> {
    logger.info('Fetching Kitchen Twin', { kitchenId });

    const kitchenTwin = await KitchenTwin.findByKitchenId(kitchenId);
    if (!kitchenTwin) {
      throw new Error(`Kitchen Twin not found for kitchenId: ${kitchenId}`);
    }

    return kitchenTwin.toJSON() as GetKitchenTwinResponse;
  }

  async updateStation(
    kitchenId: string,
    request: UpdateStationRequest
  ): Promise<UpdateStationResponse> {
    logger.info('Updating station', { kitchenId, stationId: request.stationId });

    const kitchenTwin = await KitchenTwin.findByKitchenId(kitchenId);
    if (!kitchenTwin) {
      throw new Error(`Kitchen Twin not found for kitchenId: ${kitchenId}`);
    }

    const station = kitchenTwin.stations.find(s => s.stationId === request.stationId);
    if (!station) {
      throw new Error(`Station not found: ${request.stationId}`);
    }

    if (request.status) {
      station.status = request.status;
    }
    if (request.assignedItems) {
      station.assignedItems = request.assignedItems;
    }
    if (request.capacity) {
      station.capacity = request.capacity;
    }

    await kitchenTwin.save();

    await messageBroker.publish('restaurant.kitchen.station.updated', {
      twinId: kitchenTwin.twinId,
      kitchenId,
      station,
      timestamp: new Date().toISOString()
    });

    return {
      twinId: kitchenTwin.twinId,
      kitchenId,
      station,
      updatedAt: kitchenTwin.updatedAt.toISOString()
    };
  }

  async assignOrderToStation(
    kitchenId: string,
    request: AssignOrderToStationRequest
  ): Promise<AssignOrderToStationResponse> {
    logger.info('Assigning order to station', { kitchenId, stationId: request.stationId, orderId: request.orderId });

    const kitchenTwin = await KitchenTwin.findByKitchenId(kitchenId);
    if (!kitchenTwin) {
      throw new Error(`Kitchen Twin not found for kitchenId: ${kitchenId}`);
    }

    const station = kitchenTwin.stations.find(s => s.stationId === request.stationId);
    if (!station) {
      throw new Error(`Station not found: ${request.stationId}`);
    }

    station.currentOrders.push(request.orderId);
    station.currentLoad = station.currentOrders.length;

    if (!kitchenTwin.activeOrders.includes(request.orderId)) {
      kitchenTwin.activeOrders.push(request.orderId);
    }
    kitchenTwin.pendingOrders = kitchenTwin.activeOrders.length;

    // Update station status based on load
    if (station.currentLoad >= station.capacity) {
      station.status = StationStatus.OVERLOADED;
    } else if (station.currentLoad > station.capacity * 0.7) {
      station.status = StationStatus.BUSY;
    }

    // Calculate utilization
    kitchenTwin.currentUtilization = (kitchenTwin.stations.reduce((sum, s) => sum + s.currentLoad, 0) /
      kitchenTwin.stations.reduce((sum, s) => sum + s.capacity, 0)) * 100;

    await kitchenTwin.save();

    // Get AI recommendation for wait time
    const estimatedWaitTime = await kitchenAIClient.predictWaitTime(station);

    await messageBroker.publish('restaurant.kitchen.order.assigned', {
      twinId: kitchenTwin.twinId,
      kitchenId,
      stationId: request.stationId,
      orderId: request.orderId,
      timestamp: new Date().toISOString()
    });

    return {
      twinId: kitchenTwin.twinId,
      kitchenId,
      stationId: request.stationId,
      orderId: request.orderId,
      currentLoad: station.currentLoad,
      estimatedWaitTime,
      updatedAt: kitchenTwin.updatedAt.toISOString()
    };
  }

  async bumpOrderFromStation(
    kitchenId: string,
    request: BumpOrderFromStationRequest
  ): Promise<void> {
    logger.info('Bumping order from station', { kitchenId, stationId: request.stationId, orderId: request.orderId });

    const kitchenTwin = await KitchenTwin.findByKitchenId(kitchenId);
    if (!kitchenTwin) {
      throw new Error(`Kitchen Twin not found for kitchenId: ${kitchenId}`);
    }

    const station = kitchenTwin.stations.find(s => s.stationId === request.stationId);
    if (!station) {
      throw new Error(`Station not found: ${request.stationId}`);
    }

    station.currentOrders = station.currentOrders.filter(id => id !== request.orderId);
    station.currentLoad = station.currentOrders.length;

    if (station.currentLoad < station.capacity * 0.7) {
      station.status = StationStatus.OPEN;
    }

    // Update kitchen active orders
    kitchenTwin.activeOrders = kitchenTwin.activeOrders.filter(id => id !== request.orderId);
    kitchenTwin.pendingOrders = kitchenTwin.activeOrders.length;

    // Recalculate utilization
    kitchenTwin.currentUtilization = (kitchenTwin.stations.reduce((sum, s) => sum + s.currentLoad, 0) /
      kitchenTwin.stations.reduce((sum, s) => sum + s.capacity, 0)) * 100;

    await kitchenTwin.save();

    await messageBroker.publish('restaurant.kitchen.order.bumped', {
      twinId: kitchenTwin.twinId,
      kitchenId,
      stationId: request.stationId,
      orderId: request.orderId,
      timestamp: new Date().toISOString()
    });
  }

  async getStationPerformance(kitchenId: string): Promise<GetStationPerformanceResponse[]> {
    logger.info('Getting station performance', { kitchenId });

    const kitchenTwin = await KitchenTwin.findByKitchenId(kitchenId);
    if (!kitchenTwin) {
      throw new Error(`Kitchen Twin not found for kitchenId: ${kitchenId}`);
    }

    return kitchenTwin.stations.map(station => ({
      stationId: station.stationId,
      stationName: station.name,
      avgCookTime: station.avgCookTime,
      ordersCompleted: station.capacity * 10, // Placeholder
      utilizationRate: (station.currentLoad / station.capacity) * 100,
      bottlenecks: station.status === StationStatus.OVERLOADED ? [`Station ${station.name} is overloaded`] : []
    }));
  }

  async getKitchenAnalytics(kitchenId: string): Promise<GetKitchenAnalyticsResponse> {
    logger.info('Getting kitchen analytics', { kitchenId });

    const kitchenTwin = await KitchenTwin.findByKitchenId(kitchenId);
    if (!kitchenTwin) {
      throw new Error(`Kitchen Twin not found for kitchenId: ${kitchenId}`);
    }

    const stationPerformance = await this.getStationPerformance(kitchenId);
    const bottleneckStations = stationPerformance
      .filter(s => s.utilizationRate > 80)
      .map(s => s.stationId);

    const recommendations: string[] = [];
    if (bottleneckStations.length > 0) {
      recommendations.push('Consider redistributing orders to reduce station load');
    }
    if (kitchenTwin.currentUtilization > 80) {
      recommendations.push('Kitchen is near capacity, consider slowing order intake');
    }

    return {
      avgOrderCompletionTime: kitchenTwin.avgOrderCompletionTime,
      peakHourThroughput: kitchenTwin.peakHourThroughput,
      stationPerformance,
      bottleneckStations,
      recommendations
    };
  }

  async deleteKitchenTwin(kitchenId: string): Promise<void> {
    logger.info('Deleting Kitchen Twin', { kitchenId });

    const result = await KitchenTwin.deleteOne({ kitchenId });
    if (result.deletedCount === 0) {
      throw new Error(`Kitchen Twin not found for kitchenId: ${kitchenId}`);
    }

    await messageBroker.publish('restaurant.kitchen.deleted', {
      kitchenId,
      timestamp: new Date().toISOString()
    });
  }
}

export const kitchenTwinService = new KitchenTwinService();