import { DataSource } from '../models/DataSource.js';
import { DataSchemaModel } from '../models/Schema.js';
import { Sync } from '../models/Sync.js';
import { Table } from '../models/Table.js';
import logger from '../utils/logger.js';
import { evaluate } from 'mathjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ISync = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ISchema = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IDataSource = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ITable = Record<string, any>;

export class DataService {
  async syncData(sourceId: string, type: 'full' | 'incremental' | 'realtime', triggeredBy: string): Promise<ISync> {
    try {
      const source = await DataSource.findById(sourceId);
      if (!source) {
        throw new Error('Data source not found');
      }

      const sync = new Sync({
        sourceId,
        type,
        status: 'running',
        startedAt: new Date(),
        recordsProcessed: 0,
        recordsFailed: 0,
        triggeredBy,
        organizationId: source.organizationId
      });

      await sync.save();

      try {
        const data = await this.fetchData(source, type);

        await this.processAndStoreData(source, data, sync);

        sync.status = 'completed';
        sync.completedAt = new Date();
        await sync.save();

        source.lastSync = new Date();
        source.syncError = undefined;
        await source.save();
      } catch (error: any) {
        sync.status = 'failed';
        sync.error = error.message;
        sync.completedAt = new Date();
        await sync.save();

        source.syncError = error.message;
        await source.save();
      }

      return sync;
    } catch (error) {
      logger.error(`Error syncing data for source ${sourceId}:`, error);
      throw error;
    }
  }

  async getData(sourceName: string, organizationId: string, query?: any): Promise<any> {
    try {
      const source = await DataSource.findOne({ name: sourceName, organizationId });
      if (!source) {
        throw new Error('Data source not found');
      }

      const tables = await Table.find({ sourceId: source._id, isActive: true });

      const data: any = {};
      for (const table of tables) {
        data[table.name] = this.fetchTableData(table, query);
      }

      return {
        source: source.name,
        type: source.type,
        tables: data,
        lastSync: source.lastSync
      };
    } catch (error) {
      logger.error(`Error getting data for source ${sourceName}:`, error);
      throw error;
    }
  }

  async transformData(
    sourceId: string,
    transformations: Array<{
      type: 'filter' | 'map' | 'aggregate' | 'join';
      field?: string;
      expression?: string;
      operations?: any;
    }>
  ): Promise<any> {
    try {
      const source = await DataSource.findById(sourceId);
      if (!source) {
        throw new Error('Data source not found');
      }

      let data = await this.fetchData(source, 'incremental');

      for (const transformation of transformations) {
        data = this.applyTransformation(data, transformation);
      }

      return {
        sourceId,
        sourceName: source.name,
        transformations: transformations.map(t => t.type),
        recordCount: Array.isArray(data) ? data.length : 0,
        data
      };
    } catch (error) {
      logger.error(`Error transforming data for source ${sourceId}:`, error);
      throw error;
    }
  }

  async getSchema(sourceName: string, organizationId: string): Promise<ISchema | null> {
    try {
      const source = await DataSource.findOne({ name: sourceName, organizationId });
      if (!source) {
        throw new Error('Data source not found');
      }

      const schema = await DataSchemaModel.findOne({ sourceId: source._id.toString() });
      return schema;
    } catch (error) {
      logger.error(`Error getting schema for source ${sourceName}:`, error);
      throw error;
    }
  }

  async executeQuery(sourceId: string, query: string, params?: any): Promise<any> {
    try {
      const source = await DataSource.findById(sourceId);
      if (!source) {
        throw new Error('Data source not found');
      }

      const startTime = Date.now();
      const results = this.executeMockQuery(query, params);
      const executionTime = Date.now() - startTime;

      return {
        query,
        results,
        rowCount: results.length,
        executionTime
      };
    } catch (error) {
      logger.error(`Error executing query for source ${sourceId}:`, error);
      throw error;
    }
  }

  private async fetchData(source: IDataSource, type: string): Promise<any[]> {
    switch (source.type) {
      case 'google_analytics':
        return this.fetchGoogleAnalyticsData(source);
      case 'facebook_ads':
        return this.fetchFacebookAdsData(source);
      case 'google_ads':
        return this.fetchGoogleAdsData(source);
      default:
        return this.generateMockData(source);
    }
  }

  private async processAndStoreData(source: IDataSource, data: any[], sync: ISync): Promise<void> {
    let processed = 0;
    let failed = 0;

    for (const record of data) {
      try {
        processed++;
      } catch (error) {
        failed++;
      }
    }

    sync.recordsProcessed = processed;
    sync.recordsFailed = failed;
    await sync.save();

    const table = await Table.findOneAndUpdate(
      { sourceId: source._id, name: 'default' },
      {
        $set: {
          rowCount: processed,
          lastUpdated: new Date()
        },
        $setOnInsert: {
          name: 'default',
          sourceId: source._id,
          schema: 'public',
          columns: [
            { name: 'id', dataType: 'string', nullable: false, primaryKey: true },
            { name: 'created_at', dataType: 'date', nullable: false, primaryKey: false }
          ],
          organizationId: source.organizationId
        }
      },
      { upsert: true, new: true }
    );
  }

  private applyTransformation(data: any[], transformation: any): any[] {
    switch (transformation.type) {
      case 'filter':
        return data.filter((record: any) => {
          if (transformation.expression) {
            return this.safeEvaluate(transformation.expression, record);
          }
          return true;
        });
      case 'map':
        return data.map((record: any) => {
          if (transformation.field && transformation.expression) {
            const value = this.safeEvaluate(transformation.expression, record);
            return { ...record, [transformation.field]: value };
          }
          return record;
        });
      case 'aggregate':
        return this.aggregateData(data, transformation.operations);
      default:
        return data;
    }
  }

  /**
   * Safely evaluate mathematical expressions using mathjs
   * Prevents code injection attacks from user input
   */
  private safeEvaluate(expression: string, context: Record<string, any>): any {
    // Validate expression contains only safe characters (alphanumeric, operators, dots, underscores)
    const safePattern = /^[\w\s.,+\-*/%()]+$/;
    if (!safePattern.test(expression)) {
      logger.warn('Blocked potentially unsafe expression', { expression });
      return undefined;
    }

    try {
      // Use mathjs evaluate which is sandboxed and safe
      const result = evaluate(expression, context);
      return result;
    } catch (error) {
      logger.error('Failed to evaluate expression', { expression, error });
      return undefined;
    }
  }

  private aggregateData(data: any[], operations: any): any[] {
    if (!operations || !operations.groupBy) return data;

    const grouped = data.reduce((acc: any, record: any) => {
      const key = record[operations.groupBy];
      if (!acc[key]) acc[key] = [];
      acc[key].push(record);
      return acc;
    }, {});

    return Object.entries(grouped).map(([key, records]: [string, any]) => {
      const result: any = { [operations.groupBy]: key };
      if (operations.fields) {
        for (const field of operations.fields) {
          const values = records.map((r: any) => r[field.name] || 0);
          result[field.name] = values.reduce((a: number, b: number) => a + b, 0);
        }
      }
      return result;
    });
  }

  private fetchTableData(table: ITable, query?: any): any[] {
    return Array.from({ length: Math.min(table.rowCount, 100) }, (_, i) => ({
      id: `row_${i}`,
      ...Object.fromEntries((table.columns as any[]).map((col: any) => [col.name, this.generateValue(col.dataType)]))
    }));
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

  private executeMockQuery(query: string, params?: any): any[] {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      value: Math.random() * 1000,
      category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      timestamp: new Date().toISOString()
    }));
  }

  private fetchGoogleAnalyticsData(source: IDataSource): any[] {
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      sessions: Math.floor(Math.random() * 10000),
      users: Math.floor(Math.random() * 8000),
      pageviews: Math.floor(Math.random() * 50000),
      bounceRate: Math.random() * 100,
      avgSessionDuration: Math.random() * 300
    }));
  }

  private fetchFacebookAdsData(source: IDataSource): any[] {
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      impressions: Math.floor(Math.random() * 1000000),
      clicks: Math.floor(Math.random() * 50000),
      spend: Math.random() * 5000,
      reach: Math.floor(Math.random() * 500000),
      frequency: Math.random() * 5
    }));
  }

  private fetchGoogleAdsData(source: IDataSource): any[] {
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      impressions: Math.floor(Math.random() * 2000000),
      clicks: Math.floor(Math.random() * 100000),
      cost: Math.random() * 10000,
      conversions: Math.floor(Math.random() * 1000),
      ctr: Math.random() * 10,
      cpc: Math.random() * 5
    }));
  }

  private generateMockData(source: IDataSource): any[] {
    return Array.from({ length: 100 }, (_, i) => ({
      id: `record_${i}`,
      value: Math.random() * 1000,
      category: ['Category A', 'Category B', 'Category C'][Math.floor(Math.random() * 3)],
      timestamp: new Date().toISOString()
    }));
  }
}

export default new DataService();