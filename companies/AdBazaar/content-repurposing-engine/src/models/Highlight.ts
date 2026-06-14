import mongoose, { Document, Schema } from 'mongoose';

export interface IHighlight {
  id: string;
  sourceVideoId: string;
  startTime: number;
  endTime: number;
  duration: number;
  thumbnailUrl?: string;
  score: number;
  platform: string;
  status: 'processing' | 'ready' | 'failed';
  createdAt: Date;
}

export interface IHighlightDocument extends IHighlight, Document {
  _id: mongoose.Types.ObjectId;
}

const HighlightSchema = new Schema<IHighlightDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    sourceVideoId: { type: String, required: true, index: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    duration: { type: Number, required: true },
    thumbnailUrl: { type: String },
    score: { type: Number, required: true, default: 0 },
    platform: { type: String, required: true },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

HighlightSchema.index({ sourceVideoId: 1, platform: 1 });
HighlightSchema.index({ score: -1 });

// Virtual for duration calculation
HighlightSchema.virtual('calculatedDuration').get(function () {
  return this.endTime - this.startTime;
});

export const Highlight = mongoose.model<IHighlightDocument>('Highlight', HighlightSchema);
