import mongoose, { Schema } from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ISchema = any;

const DataSchema = new Schema(
  {
    sourceId: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },
    version: { type: Number, default: 1 },
    tables: [
      {
        name: { type: String, required: true },
        columns: [
          {
            name: { type: String, required: true },
            dataType: {
              type: String,
              enum: ['string', 'number', 'boolean', 'date', 'array', 'object', 'uuid'],
              required: true
            },
            nullable: { type: Boolean, default: true },
            primaryKey: { type: Boolean, default: false },
            unique: { type: Boolean, default: false },
            defaultValue: { type: Schema.Types.Mixed },
            references: {
              table: { type: String },
              column: { type: String }
            }
          }
        ],
        indexes: [
          {
            name: { type: String, required: true },
            columns: [{ type: String }],
            unique: { type: Boolean, default: false }
          }
        ]
      }
    ],
    relationships: [
      {
        sourceTable: { type: String, required: true },
        sourceColumn: { type: String, required: true },
        targetTable: { type: String, required: true },
        targetColumn: { type: String, required: true },
        type: {
          type: String,
          enum: ['one-to-one', 'one-to-many', 'many-to-many'],
          required: true
        }
      }
    ],
    organizationId: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

DataSchema.index({ sourceId: 1, version: 1 });

export const DataSchemaModel = mongoose.model('DataSchema', DataSchema);

// Alias for backwards compatibility
export const SchemaModel = DataSchemaModel;