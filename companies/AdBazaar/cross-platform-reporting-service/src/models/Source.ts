import mongoose, { Document, Schema } from 'mongoose';

export interface ISource extends Document {
  name: string;
  type: 'ads' | 'dooh' | 'creators' | 'campaigns' | 'analytics' | 'external';
  connection: {
    type: 'api' | 'database' | 'webhook' | 'file';
    endpoint?: string;
    credentials?: Record<string, string>;
  };
  schema: {
    fields: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
  };
  refreshInterval: number;
  organizationId: string;
  status: 'active' | 'inactive' | 'error';
  lastSync?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SourceSchema = new Schema<ISource>(
  {
    name: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['ads', 'dooh', 'creators', 'campaigns', 'analytics', 'external'],
      required: true
    },
    connection: {
      type: {
        type: String,
        enum: ['api', 'database', 'webhook', 'file'],
        required: true
      },
      endpoint: { type: String },
      credentials: { type: Schema.Types.Mixed }
    },
    schema: {
      fields: [
        {
          name: { type: String, required: true },
          type: { type: String, required: true },
          description: { type: String }
        }
      ]
    },
    refreshInterval: { type: Number, default: 3600000 },
    organizationId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'error'],
      default: 'active'
    },
    lastSync: { type: Date },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

SourceSchema.index({ organizationId: 1, type: 1 });

export const Source = mongoose.model<ISource>('Source', SourceSchema);