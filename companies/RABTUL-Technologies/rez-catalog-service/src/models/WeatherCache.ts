/**
 * Weather Cache Model
 * Stores weather data for restaurant location-based recommendations
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IWeatherCache extends Document {
  locationKey: string; // lat_lng rounded to 2 decimals
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'hot' | 'cold' | 'mild';
  humidity: number;
  description: string;
  isComfortable: boolean; // 18-25C is comfortable
  fetchedAt: Date;
  expiresAt: Date;
}

const WeatherCacheSchema = new Schema(
  {
    locationKey: { type: String, required: true, unique: true, index: true },
    temperature: { type: Number, required: true },
    condition: {
      type: String,
      enum: ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'hot', 'cold', 'mild'],
      required: true,
    },
    humidity: { type: Number, default: 50 },
    description: { type: String, default: '' },
    isComfortable: { type: Boolean, default: true },
    fetchedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: 'weather_cache' }
);

// TTL index for automatic expiration
WeatherCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
WeatherCacheSchema.index({ condition: 1, isComfortable: 1 });

export const WeatherCache = mongoose.model<IWeatherCache>('WeatherCache', WeatherCacheSchema);
