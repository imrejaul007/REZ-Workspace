import { SchemaModel, ISchema } from '../models/Schema.js';
import logger from '../utils/logger.js';

export class SchemaService {
  async createSchema(sourceId: string, name: string, tables: any[], organizationId: string): Promise<ISchema> {
    try {
      const schema = new SchemaModel({
        sourceId,
        name,
        tables,
        organizationId
      });

      await schema.save();
      logger.info(`Created schema: ${name}`);
      return schema;
    } catch (error) {
      logger.error('Error creating schema:', error);
      throw error;
    }
  }

  async getSchemaBySourceId(sourceId: string): Promise<ISchema | null> {
    try {
      return await SchemaModel.findOne({ sourceId }).sort({ version: -1 });
    } catch (error) {
      logger.error(`Error getting schema for source ${sourceId}:`, error);
      throw error;
    }
  }

  async updateSchema(schemaId: string, tables: any[], organizationId: string): Promise<ISchema | null> {
    try {
      const existingSchema = await SchemaModel.findOne({ _id: schemaId, organizationId });
      if (!existingSchema) {
        throw new Error('Schema not found');
      }

      const updatedSchema = new SchemaModel({
        sourceId: existingSchema.sourceId,
        name: existingSchema.name,
        version: existingSchema.version + 1,
        tables,
        organizationId
      });

      await updatedSchema.save();
      logger.info(`Updated schema ${schemaId} to version ${updatedSchema.version}`);
      return updatedSchema;
    } catch (error) {
      logger.error(`Error updating schema ${schemaId}:`, error);
      throw error;
    }
  }

  async getSchemaHistory(sourceId: string): Promise<ISchema[]> {
    try {
      return await SchemaModel.find({ sourceId }).sort({ version: -1 });
    } catch (error) {
      logger.error(`Error getting schema history for source ${sourceId}:`, error);
      throw error;
    }
  }

  async validateSchema(schemaId: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const schema = await SchemaModel.findById(schemaId);
      if (!schema) {
        throw new Error('Schema not found');
      }

      const errors: string[] = [];

      for (const table of schema.tables) {
        const columnNames = new Set<string>();
        for (const column of table.columns) {
          if (columnNames.has(column.name)) {
            errors.push(`Duplicate column name: ${column.name} in table ${table.name}`);
          }
          columnNames.add(column.name);
        }

        if (table.columns.filter(c => c.primaryKey).length === 0) {
          errors.push(`Table ${table.name} has no primary key`);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      logger.error(`Error validating schema ${schemaId}:`, error);
      throw error;
    }
  }

  async inferSchema(sampleData: any[]): Promise<any[]> {
    if (!sampleData || sampleData.length === 0) {
      return [];
    }

    const columns: any[] = [];
    const sample = sampleData[0];

    for (const [key, value] of Object.entries(sample)) {
      let dataType = 'string';

      if (typeof value === 'number') {
        dataType = Number.isInteger(value) ? 'number' : 'number';
      } else if (typeof value === 'boolean') {
        dataType = 'boolean';
      } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
        dataType = 'date';
      } else if (Array.isArray(value)) {
        dataType = 'array';
      } else if (typeof value === 'object') {
        dataType = 'object';
      }

      columns.push({
        name: key,
        dataType,
        nullable: true,
        primaryKey: key.toLowerCase() === 'id',
        unique: key.toLowerCase() === 'id'
      });
    }

    return columns;
  }
}

export default new SchemaService();