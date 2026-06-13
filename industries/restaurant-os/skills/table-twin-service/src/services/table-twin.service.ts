import { TableTwin } from '../models/table-twin.model';
import {
  CreateTableTwinRequest,
  CreateTableTwinResponse,
  GetTableTwinResponse,
  UpdateTableStatusRequest,
  UpdateTableStatusResponse,
  SeatTableRequest,
  SeatTableResponse,
  ClearTableRequest,
  ClearTableResponse,
  UpdateTurnTimeRequest,
  ListTablesRequest,
  ListTablesResponse,
  GetTableAvailabilityRequest,
  GetTableAvailabilityResponse,
  TableStatus,
  TableZone,
  defaultTurnTimes,
  defaultTodayMetrics
} from '../schemas/table-twin.schema';
import { logger } from '../utils/logger';
import { messageBroker } from '../utils/message-broker';
import { rezPOSClient } from '../utils/rez-pos-client';

export class TableTwinService {
  /**
   * Create a new Table Twin
   */
  async createTableTwin(request: CreateTableTwinRequest): Promise<CreateTableTwinResponse> {
    const twinId = `twin.restaurant.table.${request.tableId}`;
    const twinOsEntityId = twinId;

    logger.info('Creating Table Twin', { tableId: request.tableId, restaurantId: request.restaurantId });

    const existingTwin = await TableTwin.findByTableId(request.tableId);
    if (existingTwin) {
      throw new Error(`Table Twin already exists for tableId: ${request.tableId}`);
    }

    const tableTwin = new TableTwin({
      twinId,
      tableId: request.tableId,
      restaurantId: request.restaurantId,
      tableNumber: request.tableNumber,
      seats: request.seats,
      zone: request.zone || TableZone.INDOOR,
      status: TableStatus.AVAILABLE,
      turnTimes: defaultTurnTimes,
      todayMetrics: defaultTodayMetrics
    });

    await tableTwin.save();

    await messageBroker.publish('restaurant.table.created', {
      twinId,
      tableId: request.tableId,
      restaurantId: request.restaurantId,
      twinOsEntityId,
      timestamp: new Date().toISOString()
    });

    logger.info('Table Twin created successfully', { twinId, tableId: request.tableId });

    return {
      twinId,
      tableId: request.tableId,
      twinOsEntityId,
      createdAt: tableTwin.createdAt.toISOString()
    };
  }

  /**
   * Get Table Twin by ID
   */
  async getTableTwin(tableId: string): Promise<GetTableTwinResponse> {
    logger.info('Fetching Table Twin', { tableId });

    const tableTwin = await TableTwin.findByTableId(tableId);
    if (!tableTwin) {
      throw new Error(`Table Twin not found for tableId: ${tableId}`);
    }

    return tableTwin.toJSON() as GetTableTwinResponse;
  }

  /**
   * Update Table Status
   */
  async updateTableStatus(
    tableId: string,
    request: UpdateTableStatusRequest
  ): Promise<UpdateTableStatusResponse> {
    logger.info('Updating Table Twin status', { tableId, status: request.status });

    const tableTwin = await TableTwin.findByTableId(tableId);
    if (!tableTwin) {
      throw new Error(`Table Twin not found for tableId: ${tableId}`);
    }

    const previousStatus = tableTwin.status;
    tableTwin.status = request.status;

    if (request.customerCount !== undefined) {
      tableTwin.currentCustomerCount = request.customerCount;
    }

    // Update turn times based on status
    const now = new Date().toISOString();
    switch (request.status) {
      case TableStatus.SEATED:
        tableTwin.turnTimes.seatedAt = now;
        break;
      case TableStatus.ORDERING:
        tableTwin.turnTimes.orderPlacedAt = now;
        break;
      case TableStatus.BILLING:
        tableTwin.turnTimes.billRequestedAt = now;
        break;
      case TableStatus.AVAILABLE:
      case TableStatus.CLEANING:
        tableTwin.turnTimes.clearedAt = now;
        break;
    }

    await tableTwin.save();

    await messageBroker.publish('restaurant.table.status.changed', {
      twinId: tableTwin.twinId,
      tableId,
      previousStatus,
      newStatus: request.status,
      timestamp: now
    });

    // Notify POS
    await rezPOSClient.updateTableStatus(tableId, request.status);

    logger.info('Table Twin status updated', { twinId: tableTwin.twinId, tableId });

    return {
      twinId: tableTwin.twinId,
      tableId,
      status: request.status,
      turnTimes: tableTwin.turnTimes,
      updatedAt: tableTwin.updatedAt.toISOString()
    };
  }

  /**
   * Seat Table
   */
  async seatTable(tableId: string, request: SeatTableRequest): Promise<SeatTableResponse> {
    logger.info('Seating table', { tableId, sessionId: request.sessionId });

    const tableTwin = await TableTwin.findByTableId(tableId);
    if (!tableTwin) {
      throw new Error(`Table Twin not found for tableId: ${tableId}`);
    }

    if (tableTwin.status !== TableStatus.AVAILABLE && tableTwin.status !== TableStatus.RESERVED) {
      throw new Error(`Table ${tableId} is not available for seating (current status: ${tableTwin.status})`);
    }

    const now = new Date().toISOString();

    tableTwin.status = TableStatus.SEATED;
    tableTwin.currentSessionId = request.sessionId;
    tableTwin.currentCustomerCount = request.customerCount;
    tableTwin.turnTimes = {
      ...defaultTurnTimes,
      seatedAt: now
    };

    // Update today's metrics
    tableTwin.todayMetrics.covers += request.customerCount;

    await tableTwin.save();

    await messageBroker.publish('restaurant.table.seated', {
      twinId: tableTwin.twinId,
      tableId,
      sessionId: request.sessionId,
      customerCount: request.customerCount,
      timestamp: now
    });

    logger.info('Table seated successfully', { twinId: tableTwin.twinId, tableId, sessionId: request.sessionId });

    return {
      twinId: tableTwin.twinId,
      tableId,
      sessionId: request.sessionId,
      seatedAt: now,
      updatedAt: tableTwin.updatedAt.toISOString()
    };
  }

  /**
   * Clear Table
   */
  async clearTable(tableId: string, request: ClearTableRequest): Promise<ClearTableResponse> {
    logger.info('Clearing table', { tableId });

    const tableTwin = await TableTwin.findByTableId(tableId);
    if (!tableTwin) {
      throw new Error(`Table Twin not found for tableId: ${tableId}`);
    }

    const now = new Date().toISOString();
    const seatedAt = tableTwin.turnTimes.seatedAt ? new Date(tableTwin.turnTimes.seatedAt).getTime() : Date.now();
    const clearedAt = Date.now();
    const turnTimeMinutes = Math.round((clearedAt - seatedAt) / 60000);

    // Calculate average turn time
    const prevAvgTurnTime = tableTwin.todayMetrics.avgTurnTime;
    const prevOrdersCount = tableTwin.todayMetrics.ordersCount;
    const newAvgTurnTime = Math.round(
      (prevAvgTurnTime * prevOrdersCount + turnTimeMinutes) / (prevOrdersCount + 1)
    );

    tableTwin.status = TableStatus.AVAILABLE;
    tableTwin.turnTimes = defaultTurnTimes;
    tableTwin.todayMetrics.ordersCount += 1;
    tableTwin.todayMetrics.avgTurnTime = newAvgTurnTime;

    // Get order total from session
    if (tableTwin.currentSessionId) {
      try {
        const sessionData = await rezPOSClient.getSessionTotal(tableTwin.currentSessionId);
        tableTwin.todayMetrics.revenue += sessionData.total;
      } catch (error) {
        logger.warn('Could not fetch session total', { sessionId: tableTwin.currentSessionId });
      }
    }

    const clearedSessionId = tableTwin.currentSessionId;
    const clearedOrderId = tableTwin.currentOrderId;
    tableTwin.currentSessionId = undefined;
    tableTwin.currentOrderId = undefined;
    tableTwin.currentCustomerCount = undefined;

    await tableTwin.save();

    await messageBroker.publish('restaurant.table.cleared', {
      twinId: tableTwin.twinId,
      tableId,
      clearedSessionId,
      clearedOrderId,
      turnTimeMinutes,
      reason: request.reason,
      timestamp: now
    });

    logger.info('Table cleared successfully', { twinId: tableTwin.twinId, tableId, turnTimeMinutes });

    return {
      twinId: tableTwin.twinId,
      tableId,
      clearedAt: now,
      avgTurnTime: newAvgTurnTime,
      revenue: tableTwin.todayMetrics.revenue,
      updatedAt: tableTwin.updatedAt.toISOString()
    };
  }

  /**
   * Update Turn Time
   */
  async updateTurnTime(tableId: string, request: UpdateTurnTimeRequest): Promise<void> {
    logger.info('Updating table turn time', { tableId, turnTimeType: request.turnTimeType });

    const tableTwin = await TableTwin.findByTableId(tableId);
    if (!tableTwin) {
      throw new Error(`Table Twin not found for tableId: ${tableId}`);
    }

    const now = new Date().toISOString();

    switch (request.turnTimeType) {
      case 'seated':
        tableTwin.turnTimes.seatedAt = now;
        break;
      case 'orderPlaced':
        tableTwin.turnTimes.orderPlacedAt = now;
        break;
      case 'billRequested':
        tableTwin.turnTimes.billRequestedAt = now;
        break;
      case 'cleared':
        tableTwin.turnTimes.clearedAt = now;
        break;
    }

    await tableTwin.save();

    await messageBroker.publish('restaurant.table.turntime.updated', {
      twinId: tableTwin.twinId,
      tableId,
      turnTimeType: request.turnTimeType,
      timestamp: now
    });
  }

  /**
   * List Tables
   */
  async listTables(request: ListTablesRequest): Promise<ListTablesResponse> {
    logger.info('Listing Table Twins', { request });

    const limit = request.limit || 50;
    const offset = request.offset || 0;

    let query: Record<string, unknown> = { restaurantId: request.restaurantId };
    if (request.status) {
      query.status = request.status;
    }
    if (request.zone) {
      query.zone = request.zone;
    }

    const [tables, total, stats] = await Promise.all([
      TableTwin.find(query).skip(offset).limit(limit).sort({ tableNumber: 1 }),
      TableTwin.countDocuments(query),
      TableTwin.getTableStats(request.restaurantId)
    ]);

    return {
      tables: tables.map(t => t.toJSON() as any),
      total,
      availableCount: stats.available,
      occupiedCount: stats.occupied
    };
  }

  /**
   * Get Table Availability
   */
  async getTableAvailability(request: GetTableAvailabilityRequest): Promise<GetTableAvailabilityResponse> {
    logger.info('Getting table availability', { restaurantId: request.restaurantId, partySize: request.partySize });

    const availableTables = await TableTwin.findAvailableTables(request.restaurantId, request.partySize);

    const tables = availableTables.map(t => ({
      tableId: t.tableId,
      tableNumber: t.tableNumber,
      seats: t.seats,
      zone: t.zone
    }));

    // Recommend the smallest table that fits
    const recommended = tables.length > 0 ? {
      tableId: tables[0].tableId,
      tableNumber: tables[0].tableNumber,
      seats: tables[0].seats
    } : undefined;

    return {
      availableTables: tables,
      recommendedTable: recommended
    };
  }

  /**
   * Delete Table Twin
   */
  async deleteTableTwin(tableId: string): Promise<void> {
    logger.info('Deleting Table Twin', { tableId });

    const result = await TableTwin.deleteOne({ tableId });
    if (result.deletedCount === 0) {
      throw new Error(`Table Twin not found for tableId: ${tableId}`);
    }

    await messageBroker.publish('restaurant.table.deleted', {
      tableId,
      timestamp: new Date().toISOString()
    });

    logger.info('Table Twin deleted', { tableId });
  }
}

export const tableTwinService = new TableTwinService();
