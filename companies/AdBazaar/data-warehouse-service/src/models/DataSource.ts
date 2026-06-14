import mongoose, { Schema } from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IDataSource = any;

const DataSourceSchema = new Schema(
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
    tableSchema: {
      tables: [
        {
          name: { type: String, required: true },
          columns: [
            {
              name: { type: String, required: true },
              type: { type: String, required: true },
              nullable: { type: Boolean, default: true },
              primaryKey: { type: Boolean, default: false }
            }
          ]
        }
      ]
    },
    organizationId: { type: String, required: true, index: true },
    isActive: { type: Boolean, default: true },
    lastSync: { type: Date },
    syncError: { type: String }
  },
  { timestamps: true }
);

DataSourceSchema.index({ organizationId: 1, type: 1 });
DataSourceSchema.index({ isActive: 1, type: 1 });

export const DataSource = mongoose.model('DataSource', DataSourceSchema);