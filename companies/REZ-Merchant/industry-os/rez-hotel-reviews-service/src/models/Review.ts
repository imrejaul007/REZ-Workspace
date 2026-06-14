/**
 * Review Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { Review, ReviewStatus, Sentiment, TravelType } from '../types';

export interface IReview extends Omit<Review, 'id'>, Document {}

const ReviewSchema = new Schema<IReview>(
  {
    id: { type: String, required: true, unique: true, index: true },
    bookingId: { type: String, required: true, index: true },
    hotelId: { type: String, required: true, index: true },
    guestId: { type: String, required: true, index: true },
    guestName: { type: String, required: true },
    overallRating: { type: Number, required: true, min: 1, max: 5 },
    categories: {
      cleanliness: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
      amenities: { type: Number, min: 1, max: 5 },
      comfort: { type: Number, min: 1, max: 5 },
      staff: { type: Number, min: 1, max: 5 },
      food: { type: Number, min: 1, max: 5 },
    },
    title: { type: String },
    content: { type: String, required: true },
    images: [{ type: String }],
    stayDate: { type: String },
    wouldRecommend: { type: Boolean, default: true },
    travelType: {
      type: String,
      enum: Object.values(TravelType),
    },
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.PENDING,
      index: true,
    },
    sentiment: {
      type: String,
      enum: Object.values(Sentiment),
    },
    sentimentScore: { type: Number },
    helpful: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
    managerResponse: {
      content: { type: String },
      managerName: { type: String },
      respondedAt: { type: String },
    },
    isPublic: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'hotel_reviews',
  }
);

// Compound indexes
ReviewSchema.index({ hotelId: 1, status: 1 });
ReviewSchema.index({ hotelId: 1, overallRating: 1 });
ReviewSchema.index({ hotelId: 1, createdAt: -1 });
ReviewSchema.index({ bookingId: 1 }, { unique: true });

export const ReviewModel = mongoose.model<IReview>('Review', ReviewSchema);
