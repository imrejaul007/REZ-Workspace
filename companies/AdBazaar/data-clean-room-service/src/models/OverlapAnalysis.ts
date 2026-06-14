import mongoose, { Schema, Document } from 'mongoose';

export interface IOverlapAnalysis extends Document {
  analysisId: string;
  uploadId1: string;
  uploadId2: string;
  brandId: string;
  analysisType: 'exact' | 'fuzzy' | 'segment';
  totalRecords1: number;
  totalRecords2: number;
  overlappingRecords: number;
  overlapPercentage: number;
  uniqueToUpload1: number;
  uniqueToUpload2: number;
  jaccardIndex: number;
  segmentOverlap: Record<string, {
    overlap: number;
    percentage: number;
  }>;
  createdAt: Date;
}

const OverlapAnalysisSchema = new Schema<IOverlapAnalysis>(
  {
    analysisId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    uploadId1: {
      type: String,
      required: true,
      index: true,
    },
    uploadId2: {
      type: String,
      required: true,
      index: true,
    },
    brandId: {
      type: String,
      required: true,
      index: true,
    },
    analysisType: {
      type: String,
      enum: ['exact', 'fuzzy', 'segment'],
      default: 'exact',
    },
    totalRecords1: {
      type: Number,
      default: 0,
    },
    totalRecords2: {
      type: Number,
      default: 0,
    },
    overlappingRecords: {
      type: Number,
      default: 0,
    },
    overlapPercentage: {
      type: Number,
      default: 0,
    },
    uniqueToUpload1: {
      type: Number,
      default: 0,
    },
    uniqueToUpload2: {
      type: Number,
      default: 0,
    },
    jaccardIndex: {
      type: Number,
      default: 0,
    },
    segmentOverlap: {
      type: Map,
      of: new Schema({
        overlap: Number,
        percentage: Number,
      }, { _id: false }),
    },
  },
  {
    timestamps: true,
    collection: 'overlap_analyses',
  }
);

// Indexes
OverlapAnalysisSchema.index({ uploadId1: 1, uploadId2: 1 });
OverlapAnalysisSchema.index({ brandId: 1, createdAt: -1 });

export const OverlapAnalysis = mongoose.model<IOverlapAnalysis>('OverlapAnalysis', OverlapAnalysisSchema);