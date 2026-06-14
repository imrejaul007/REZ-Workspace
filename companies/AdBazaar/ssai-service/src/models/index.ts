import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  ContentType,
  ManifestType,
  AdBreakPosition,
  AdBreakStatus,
  StreamStatus,
  InsertedAdStatus,
} from '../types/index.js';

export interface IInsertedAd {
  id: string;
  adId: string;
  creativeUrl: string;
  clickUrl?: string;
  duration: number;
  offset: number;
  status: InsertedAdStatus;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IAdBreak {
  id: string;
  position: AdBreakPosition;
  offset?: number;
  duration: number;
  maxAds: number;
  status: AdBreakStatus;
  insertedAds: IInsertedAd[];
  scheduledTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
}

export interface IStreamManifest extends Document {
  streamId: string;
  contentId: string;
  contentType: ContentType;
  originalManifestUrl: string;
  modifiedManifestUrl: string;
  manifestType: ManifestType;
  adBreaks: IAdBreak[];
  slateUrl?: string;
  status: StreamStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISCTE35Cue extends Document {
  id: string;
  streamId: string;
  spliceEventType: string;
  spliceEventId: number;
  spliceCommandType: number;
  spliceInsert: {
    spliceEventId: number;
    spliceExecuteFlag: boolean;
    breakDuration: number;
    availNum?: number;
    availsExpected?: number;
  };
  segmentationDescriptor?: {
    segmentationEventId: number;
    segmentationTypeId: number;
    segmentNum?: number;
    segmentsExpected?: number;
    subSegmentNum?: number;
    subSegmentsExpected?: number;
  };
  ptsOffset?: number;
  duration?: number;
  rawData?: Buffer;
  processedAt: Date;
}

const InsertedAdSchema = new Schema<IInsertedAd>(
  {
    id: { type: String, required: true },
    adId: { type: String, required: true },
    creativeUrl: { type: String, required: true },
    clickUrl: { type: String },
    duration: { type: Number, required: true },
    offset: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'playing', 'completed', 'skipped'],
      default: 'pending',
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { _id: false }
);

const AdBreakSchema = new Schema<IAdBreak>(
  {
    id: { type: String, required: true },
    position: {
      type: String,
      enum: ['preroll', 'midroll', 'postroll'],
      required: true,
    },
    offset: { type: Number },
    duration: { type: Number, required: true },
    maxAds: { type: Number, default: 10 },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed'],
      default: 'scheduled',
    },
    insertedAds: [InsertedAdSchema],
    scheduledTime: { type: Date },
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
  },
  { _id: false }
);

const StreamManifestSchema = new Schema<IStreamManifest>(
  {
    streamId: { type: String, required: true, unique: true, index: true },
    contentId: { type: String, required: true, index: true },
    contentType: {
      type: String,
      enum: ['live', 'vod'],
      required: true,
    },
    originalManifestUrl: { type: String, required: true },
    modifiedManifestUrl: { type: String },
    manifestType: {
      type: String,
      enum: ['hls', 'dash'],
      required: true,
    },
    adBreaks: [AdBreakSchema],
    slateUrl: { type: String },
    status: {
      type: String,
      enum: ['active', 'inactive', 'completed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    collection: 'stream_manifests',
  }
);

StreamManifestSchema.index({ status: 1, contentType: 1 });
StreamManifestSchema.index({ createdAt: -1 });

const SCTE35CueSchema = new Schema<ISCTE35Cue>(
  {
    id: { type: String, required: true, unique: true, index: true },
    streamId: { type: String, required: true, index: true },
    spliceEventType: {
      type: String,
      enum: ['splice_insert', 'splice_schedule', 'time_signal', 'bandwidth_sharing'],
      required: true,
    },
    spliceEventId: { type: Number, required: true },
    spliceCommandType: { type: Number, required: true },
    spliceInsert: {
      spliceEventId: { type: Number, required: true },
      spliceExecuteFlag: { type: Boolean, required: true },
      breakDuration: { type: Number, required: true },
      availNum: { type: Number },
      availsExpected: { type: Number },
    },
    segmentationDescriptor: {
      segmentationEventId: { type: Number },
      segmentationTypeId: { type: Number },
      segmentNum: { type: Number },
      segmentsExpected: { type: Number },
      subSegmentNum: { type: Number },
      subSegmentsExpected: { type: Number },
    },
    ptsOffset: { type: Number },
    duration: { type: Number },
    rawData: { type: Buffer },
    processedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'scte35_cues',
  }
);

SCTE35CueSchema.index({ streamId: 1, processedAt: -1 });
SCTE35CueSchema.index({ spliceEventId: 1 });

export const StreamManifestModel: Model<IStreamManifest> = mongoose.model<IStreamManifest>(
  'StreamManifest',
  StreamManifestSchema
);

export const SCTE35CueModel: Model<ISCTE35Cue> = mongoose.model<ISCTE35Cue>(
  'SCTE35Cue',
  SCTE35CueSchema
);

export async function initDatabase(mongodbUri: string): Promise<void> {
  try {
    await mongoose.connect(mongodbUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
}