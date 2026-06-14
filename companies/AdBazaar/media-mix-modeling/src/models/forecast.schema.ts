import mongoose, { Document, Schema } from 'mongoose';

export interface IForecastPrediction {
  period: string;
  date: Date;
  value: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface IForecast {
  forecastId: string;
  period: string;
  startDate: Date;
  endDate: Date;
  predictions: Record<string, number>;
  confidence: {
    lower: number;
    upper: number;
    interval: number;
  };
  seasonality: Record<string, number>;
  trend: number;
  forecastData: IForecastPrediction[];
  generatedAt: Date;
}

export interface IForecastDocument extends IForecast, Document {
  modelId: mongoose.Types.ObjectId;
}

const ForecastSchema = new Schema<IForecastDocument>(
  {
    forecastId: { type: String, required: true },
    modelId: { type: Schema.Types.ObjectId, ref: 'MMMModel', required: true },
    period: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    predictions: { type: Map, of: Number, required: true },
    confidence: {
      lower: { type: Number, required: true },
      upper: { type: Number, required: true },
      interval: { type: Number, required: true }
    },
    seasonality: { type: Map, of: Number, required: true },
    trend: { type: Number, required: true },
    forecastData: [
      {
        period: String,
        date: Date,
        value: Number,
        confidenceInterval: {
          lower: Number,
          upper: Number
        }
      }
    ],
    generatedAt: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

ForecastSchema.index({ modelId: 1 });
ForecastSchema.index({ forecastId: 1 });
ForecastSchema.index({ period: 1 });

export const Forecast = mongoose.model<IForecastDocument>('Forecast', ForecastSchema);