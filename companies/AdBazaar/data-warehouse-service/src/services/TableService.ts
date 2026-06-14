import { Table, ITable } from '../models/Table.js';
import logger from '../utils/logger.js';

export class TableService {
  async getTables(sourceId: string, organizationId: string): Promise<ITable[]> {
    try {
      return await Table.find({ sourceId, organizationId, isActive: true })
        .select('-__v')
        .sort({ name: 1 });
    } catch (error) {
      logger.error(`Error getting tables for source ${sourceId}:`, error);
      throw error;
    }
  }

  async getTableById(tableId: string, organizationId: string): Promise<ITable | null> {
    try {
      return await Table.findOne({ _id: tableId, organizationId });
    } catch (error) {
      logger.error(`Error getting table ${tableId}:`, error);
      throw error;
    }
  }

  async createTable(data: Partial<ITable>): Promise<ITable> {
    try {
      const table = new Table(data);
      await table.save();
      logger.info(`Created table: ${table.name}`);
      return table;
    } catch (error) {
      logger.error('Error creating table:', error);
      throw error;
    }
  }

  async updateTable(tableId: string, data: Partial<ITable>, organizationId: string): Promise<ITable | null> {
    try {
      const table = await Table.findOneAndUpdate(
        { _id: tableId, organizationId },
        { $set: data },
        { new: true }
      );

      if (table) {
        logger.info(`Updated table: ${table.name}`);
      }
      return table;
    } catch (error) {
      logger.error(`Error updating table ${tableId}:`, error);
      throw error;
    }
  }

  async deleteTable(tableId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await Table.findOneAndUpdate(
        { _id: tableId, organizationId },
        { $set: { isActive: false } }
      );
      return !!result;
    } catch (error) {
      logger.error(`Error deleting table ${tableId}:`, error);
      throw error;
    }
  }

  async getTableStats(tableId: string, organizationId: string): Promise<any> {
    try {
      const table = await Table.findOne({ _id: tableId, organizationId });
      if (!table) {
        throw new Error('Table not found');
      }

      return {
        name: table.name,
        rowCount: table.rowCount,
        sizeBytes: table.sizeBytes,
        columnCount: table.columns.length,
        indexes: table.indexes,
        lastUpdated: table.lastUpdated
      };
    } catch (error) {
      logger.error(`Error getting table stats ${tableId}:`, error);
      throw error;
    }
  }

  async getTableData(tableId: string, organizationId: string, limit: number = 100): Promise<any[]> {
    try {
      const table = await Table.findOne({ _id: tableId, organizationId });
      if (!table) {
        throw new Error('Table not found');
      }

      return Array.from({ length: Math.min(limit, table.rowCount) }, (_, i) => ({
        _id: `row_${i}`,
        ...Object.fromEntries(table.columns.map(col => [col.name, this.generateValue(col.dataType)]))
      }));
    } catch (error) {
      logger.error(`Error getting table data ${tableId}:`, error);
      throw error;
    }
  }

  private generateValue(dataType: string): any {
    switch (dataType) {
      case 'string':
        return `value_${Math.random().toString(36).substr(2, 9)}`;
      case 'number':
        return Math.floor(Math.random() * 1000);
      case 'boolean':
        return Math.random() > 0.5;
      case 'date':
        return new Date().toISOString();
      default:
        return null;
    }
  }
}

export default new TableService();