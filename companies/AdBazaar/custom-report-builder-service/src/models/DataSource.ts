import mongoose, { Document, Schema } from 'mongoose';

export interface IDataSource extends Document {
  name: string;
  type: 'mongodb' | 'postgresql' | 'mysql' | 'api' | 'rest' | 'graphql';
  connection: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    url?: string;
    headers?: Record<string, string>;
  };
  schema: {
    tables?: Array<{
      name: string;
      columns: Array<{
        name: string;
        type: string;
        description?: string;
      }>;
    }>;
    endpoints?: Array<{
      path: string;
      method: string;
      responseSchema?: any;
    }>;
  };
  queryExamples?: string[];
  organizationId: string;
  isGlobal: boolean;
  isActive: boolean;
  lastTested?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DataSourceSchema = new Schema<IDataSource>(
  {
    name: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['mongodb', 'postgresql', 'mysql', 'api', 'rest', 'graphql'],
      required: true
    },
    connection: {
      host: { type: String },
      port: { type: Number },
      database: { type: String },
      username: { type: String },
      password: { type: String },
      url: { type: String },
      headers: { type: Schema.Types.Mixed }
    },
    schema: {
      tables: [
        {
          name: { type: String, required: true },
          columns: [
            {
              name: { type: String, required: true },
              type: { type: String, required: true },
              description: { type: String }
            }
          ]
        }
      ],
      endpoints: [
        {
          path: { type: String, required: true },
          method: { type: String, required: true },
          responseSchema: { type: Schema.Types.Mixed }
        }
      ]
    },
    queryExamples: [{ type: String }],
    organizationId: { type: String, required: true, index: true },
    isGlobal: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastTested: { type: Date },
    lastError: { type: String }
  },
  { timestamps: true }
);

DataSourceSchema.index({ organizationId: 1, isActive: 1 });
DataSourceSchema.index({ isGlobal: 1, type: 1 });

export const DataSource = mongoose.model<IDataSource>('DataSource', DataSourceSchema);