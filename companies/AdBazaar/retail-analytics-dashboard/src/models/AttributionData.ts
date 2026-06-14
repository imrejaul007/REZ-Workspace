import mongoose, { Schema, Document } from 'mongoose';

export interface IAttributionChannel {
  channel: string;
  touchpoints: number;
  revenue: number;
  conversionRate: number;
  attributionWeight: number;
}

export interface IAttributionData extends Document {
  campaignId: string;
  campaignName: string;
  retailerId: string;
  retailerName: string;
  date: Date;
  model: 'first-touch' | 'last-touch' | 'linear' | 'time-decay' | 'position-based';
  channels: IAttributionChannel[];
  totalRevenue: number;
  totalConversions: number;
  attributionAccuracy: number;
  lookbackWindow: number;
  touchpointLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttributionChannelSchema = new Schema<IAttributionChannel>({
  channel: { type: String, required: true },
  touchpoints: { type: Number, required: true },
  revenue: { type: Number, required: true },
  conversionRate: { type: Number, required: true },
  attributionWeight: { type: Number, required: true },
});

const AttributionDataSchema = new Schema<IAttributionData>(
  {
    campaignId: { type: String, required: true, index: true },
    campaignName: { type: String, required: true },
    retailerId: { type: String, required: true, index: true },
    retailerName: { type: String, required: true },
    date: { type: Date, required: true, index: true },
    model: {
      type: String,
      enum: ['first-touch', 'last-touch', 'linear', 'time-decay', 'position-based'],
      required: true,
      index: true,
    },
    channels: [AttributionChannelSchema],
    totalRevenue: { type: Number, required: true },
    totalConversions: { type: Number, required: true },
    attributionAccuracy: { type: Number, required: true },
    lookbackWindow: { type: Number, required: true },
    touchpointLimit: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

AttributionDataSchema.index({ campaignId: 1, date: -1 });
AttributionDataSchema.index({ retailerId: 1, model: 1, date: -1 });

export const AttributionData = mongoose.model<IAttributionData>(
  'AttributionData',
  AttributionDataSchema
);