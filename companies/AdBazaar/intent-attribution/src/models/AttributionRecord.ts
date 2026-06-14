import mongoose, { Schema, Document } from 'mongoose';

// Attribution Record Interface
export interface IAttributionRecord extends Document {
  recordId: string;
  signalId: string;
  userId: string;
  source: string;
  eventType: string;
  category: string;
  timestamp: Date;
  windowType: 'view' | 'click';
  attributed: boolean;
  attributedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attribution Record Schema
const AttributionRecordSchema = new Schema<IAttributionRecord>(
  {
    recordId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    signalId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    source: {
      type: String,
      required: true,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    windowType: {
      type: String,
      required: true,
      enum: ['view', 'click'],
      default: 'view'
    },
    attributed: {
      type: Boolean,
      default: false,
      index: true
    },
    attributedTo: {
      type: String,
      sparse: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'attribution_records'
  }
);

// Compound indexes
AttributionRecordSchema.index({ userId: 1, timestamp: -1 });
AttributionRecordSchema.index({ signalId: 1, timestamp: -1 });
AttributionRecordSchema.index({ source: 1, timestamp: -1 });
AttributionRecordSchema.index({ category: 1, timestamp: -1 });
AttributionRecordSchema.index({ attributed: 1, timestamp: -1 });
AttributionRecordSchema.index({ attributed:1, attributedTo: 1 });

// TTL index for automatic cleanup (90 days)
AttributionRecordSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60, partialFilterExpression: { attributed: true } }
);

// Static methods
AttributionRecordSchema.statics.findByUserId = function(userId: string, limit = 50, skip = 0) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

AttributionRecordSchema.statics.findBySignalId = function(signalId: string) {
  return this.find({ signalId })
    .sort({ timestamp: -1 })
    .lean();
};

AttributionRecordSchema.statics.findUnattributedByUser = function(userId: string, daysWindow: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysWindow);

  return this.find({
    userId,
    attributed: false,
    timestamp: { $gte: cutoffDate }
  })
    .sort({ timestamp: -1 })
    .lean();
};

AttributionRecordSchema.statics.markAsAttributed = function(recordIds: string[], conversionId: string) {
  return this.updateMany(
    { recordId: { $in: recordIds } },
    { attributed: true, attributedTo: conversionId }
  );
};

// Query helpers
AttributionRecordSchema.statics.getTouchpointsForUser = async function(
  userId: string,
  beforeDate: Date,
  clickWindowDays: number,
  viewWindowDays: number
) {
  const clickCutoff = new Date(beforeDate);
  clickCutoff.setDate(clickCutoff.getDate() - clickWindowDays);

  const viewCutoff = new Date(beforeDate);
  viewCutoff.setDate(viewCutoff.getDate() - viewWindowDays);

  return this.aggregate([
    {
      $match: {
        userId,
        timestamp: { $lte: beforeDate }
      }
    },
    {
      $facet: {
        clicks: [
          {
            $match: {
              windowType: 'click',
              timestamp: { $gte: clickCutoff }
            }
          },
          { $sort: { timestamp: -1 } }
        ],
        views: [
          {
            $match: {
              windowType: 'view',
              timestamp: { $gte: viewCutoff }
            }
          },
          { $sort: { timestamp: -1 } }
        ]
      }
    }
  ]);
};

export const AttributionRecord = mongoose.model<IAttributionRecord>('AttributionRecord', AttributionRecordSchema);
export default AttributionRecord;