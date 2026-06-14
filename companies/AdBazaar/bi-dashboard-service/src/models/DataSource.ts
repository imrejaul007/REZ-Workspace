import mongoose, { Document, Schema } from 'mongoose';

export interface IDataSource extends Document {
  name: string;
  type: 'mongodb' | 'postgresql' | 'mysql' | 'api' | 'rest' | 'graphql' | 'google_analytics' | 'facebook_ads' | 'google_ads';
  connection: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    url?: string;
    apiKey?: string;
    credentials?: Record<string, string>;
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
  };
  queryExamples?: string[];
  organizationId: string;
  isGlobal: boolean;
  isActive: boolean;
  refreshInterval: number;
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
      enum: ['mongodb', 'postgresql', 'mysql', 'api', 'rest', 'graphql', 'google_analytics', 'facebook_ads', 'google_ads'],
      required: true
    },
    connection: {
      host: { type: String },
      port: { type: Number },
      database: { type: String },
      username: { type: String },
      password: { type: String },
      url: { type: String },
      apiKey: { type: String },
      credentials: { type: Schema.Types.Mixed }
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
      ]
    },
    queryExamples: [{ type: String }],
    organizationId: { type: String, required: true, index: true },
    isGlobal: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    refreshInterval: { type: Number, default: 300000 },
    lastTested: { type: Date },
    lastError: { type: String }
  },
  { timestamps: true }
);

DataSourceSchema.index({ organizationId: 1, isActive: 1 });
DataSourceSchema.index({ isGlobal: 1, type: 1 });

export const DataSource = mongoose.model<IDataSource>('DataSource', DataSourceSchema);