import mongoose, { Schema } from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ITable = any;

const TableSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    sourceId: { type: String, required: true, index: true },
    dbSchema: { type: String, required: true },
    columns: [
      {
        name: { type: String, required: true },
        dataType: { type: String, required: true },
        nullable: { type: Boolean, default: true },
        primaryKey: { type: Boolean, default: false }
      }
    ],
    rowCount: { type: Number, default: 0 },
    sizeBytes: { type: Number, default: 0 },
    lastUpdated: { type: Date },
    indexes: [
      {
        name: { type: String, required: true },
        columns: [{ type: String }],
        type: { type: String, default: 'btree' }
      }
    ],
    organizationId: { type: String, required: true, index: true },
    isActive: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

TableSchema.index({ organizationId: 1, sourceId: 1 });
TableSchema.index({ sourceId: 1, name: 1 });

export const Table = mongoose.model('Table', TableSchema);