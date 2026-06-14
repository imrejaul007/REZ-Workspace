/**
 * Table Service
 *
 * Business logic for table management
 */

import { Table, ITable, TableStatus } from '../models/Table';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[table] ${msg}`, meta);

export interface CreateTableInput {
  restaurantId: string;
  branchId: string;
  tableNumber: string;
  floor?: string;
  capacity: {
    min: number;
    max: number;
  };
  tableType: 'indoor' | 'outdoor' | 'private' | 'bar' | 'vip';
  position?: {
    x: number;
    y: number;
  };
  amenities?: string[];
}

export interface UpdateTableInput {
  tableNumber?: string;
  floor?: string;
  capacity?: {
    min: number;
    max: number;
  };
  tableType?: 'indoor' | 'outdoor' | 'private' | 'bar' | 'vip';
  position?: {
    x: number;
    y: number;
  };
  amenities?: string[];
  isActive?: boolean;
}

/**
 * FIX (security): Generate secure ID using crypto
 */
function generateTableId(): string {
  try {
    const { randomUUID } = require('crypto');
    const uuid = randomUUID().replace(/-/g, '').substring(0, 4).toUpperCase();
    return `TB${Date.now().toString(36)}${uuid}`;
  } catch {
    return 'TB' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
}

class TableService {
  /**
   * Create a new table
   */
  async createTable(input: CreateTableInput): Promise<ITable> {
    const tableId = generateTableId();

    const table = new Table({
      tableId,
      ...input,
      status: 'available',
      isActive: true,
    });

    await table.save();
    log('Table created', { tableId, restaurantId: input.restaurantId, branchId: input.branchId });

    return table;
  }

  /**
   * Get table by ID
   */
  async getTable(tableId: string): Promise<ITable | null> {
    return Table.findOne({ tableId });
  }

  /**
   * Get tables for branch
   */
  async getTablesByBranch(
    branchId: string,
    filters?: {
      status?: TableStatus;
      floor?: string;
      tableType?: string;
      minCapacity?: number;
    }
  ): Promise<ITable[]> {
    const query: unknown = { branchId, isActive: true };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.floor) {
      query.floor = filters.floor;
    }

    if (filters?.tableType) {
      query.tableType = filters.tableType;
    }

    if (filters?.minCapacity) {
      query['capacity.min'] = { $lte: filters.minCapacity };
      query['capacity.max'] = { $gte: filters.minCapacity };
    }

    return Table.find(query).sort({ tableNumber: 1 });
  }

  /**
   * Find available tables for guest count
   */
  async findAvailableTables(
    branchId: string,
    guestCount: number
  ): Promise<ITable[]> {
    return Table.find({
      branchId,
      isActive: true,
      status: 'available',
      'capacity.min': { $lte: guestCount },
      'capacity.max': { $gte: guestCount },
    }).sort({ 'capacity.min': 1 });
  }

  /**
   * Update table
   */
  async updateTable(tableId: string, input: UpdateTableInput): Promise<ITable | null> {
    const table = await Table.findOneAndUpdate(
      { tableId },
      { $set: input },
      { new: true }
    );

    if (table) {
      log('Table updated', { tableId });
    }

    return table;
  }

  /**
   * Delete table (soft delete)
   */
  async deleteTable(tableId: string): Promise<boolean> {
    const result = await Table.findOneAndUpdate(
      { tableId },
      { $set: { isActive: false, status: 'blocked' } }
    );

    if (result) {
      log('Table deleted', { tableId });
      return true;
    }

    return false;
  }

  /**
   * Update table status
   */
  async updateStatus(tableId: string, status: TableStatus): Promise<ITable | null> {
    const updateData: unknown = { status };

    if (status !== 'reserved') {
      updateData.currentReservationId = null;
    }

    const table = await Table.findOneAndUpdate(
      { tableId },
      { $set: updateData },
      { new: true }
    );

    if (table) {
      log('Table status updated', { tableId, status });
    }

    return table;
  }

  /**
   * Assign reservation to table
   */
  async assignReservation(
    tableId: string,
    reservationId: string
  ): Promise<ITable | null> {
    const table = await Table.findOneAndUpdate(
      { tableId, status: 'available' },
      {
        $set: {
          status: 'reserved',
          currentReservationId: reservationId,
        },
      },
      { new: true }
    );

    if (table) {
      log('Reservation assigned to table', { tableId, reservationId });
    }

    return table;
  }

  /**
   * Release table (when guest leaves or reservation cancelled)
   */
  async releaseTable(tableId: string): Promise<ITable | null> {
    const table = await Table.findOneAndUpdate(
      { tableId },
      {
        $set: {
          status: 'available',
          currentReservationId: null,
        },
      },
      { new: true }
    );

    if (table) {
      log('Table released', { tableId });
    }

    return table;
  }

  /**
   * Mark table as occupied
   */
  async occupyTable(tableId: string): Promise<ITable | null> {
    const table = await Table.findOneAndUpdate(
      { tableId },
      { $set: { status: 'occupied' } },
      { new: true }
    );

    if (table) {
      log('Table occupied', { tableId });
    }

    return table;
  }

  /**
   * Get floor layout
   */
  async getFloorLayout(
    branchId: string,
    floor?: string
  ): Promise<ITable[]> {
    const query: unknown = { branchId, isActive: true };

    if (floor) {
      query.floor = floor;
    }

    return Table.find(query).sort({ 'position.x': 1, 'position.y': 1 });
  }

  /**
   * Get table statistics for branch
   */
  async getTableStats(branchId: string): Promise<{
    total: number;
    available: number;
    occupied: number;
    reserved: number;
    maintenance: number;
  }> {
    const tables = await Table.find({ branchId, isActive: true });

    return {
      total: tables.length,
      available: tables.filter((t: ITable) => t.status === 'available').length,
      occupied: tables.filter((t: ITable) => t.status === 'occupied').length,
      reserved: tables.filter((t: ITable) => t.status === 'reserved').length,
      maintenance: tables.filter((t: ITable) => t.status === 'maintenance').length,
    };
  }

  /**
   * Bulk create tables
   */
  async bulkCreateTables(tables: CreateTableInput[]): Promise<ITable[]> {
    const createdTables: ITable[] = [];

    for (const tableInput of tables) {
      const table = await this.createTable(tableInput);
      createdTables.push(table);
    }

    log('Bulk tables created', { count: createdTables.length });
    return createdTables;
  }
}

export const tableService = new TableService();
