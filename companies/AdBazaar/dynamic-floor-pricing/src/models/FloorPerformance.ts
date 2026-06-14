import mongoose, { Schema, Document } from 'mongoose';

export interface IFloorPerformance extends Document {
  floorId: string;
  inventoryId: string;
  date: Date;
  metrics: {
    impressions: number;
    revenue: number;
    ecpm: number;
    fillRate: number;
    winRate: number;
    bids: number;
    bidsWon: number;
    averageWinningBid: number;
    totalRequests: number;
  };
  comparison: {
    vsPreviousPeriod: {
      revenueChange: number;
      ecpmChange: number;
      impressionsChange: number;
    };
    vsFloor: {
      revenueAboveFloor: number;
      ecpmAboveFloor: number;
    };
  };
  efficiency: {
    priceEfficiency: number; // Revenue per unit of floor price
    demandCapture: number; // What % of demand we captured
    floorUtilization: number; // How often we beat our floor
  };
  createdAt: Date;
  updatedAt: Date;
}

const FloorPerformanceSchema = new Schema<IFloorPerformance>(
  {
    floorId: {
      type: String,
      required: true,
      index: true
    },
    inventoryId: {
      type: String,
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    metrics: {
      impressions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      ecpm: { type: Number, default: 0 },
      fillRate: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      bids: { type: Number, default: 0 },
      bidsWon: { type: Number, default: 0 },
      averageWinningBid: { type: Number, default: 0 },
      totalRequests: { type: Number, default: 0 }
    },
    comparison: {
      vsPreviousPeriod: {
        revenueChange: { type: Number, default: 0 },
        ecpmChange: { type: Number, default: 0 },
        impressionsChange: { type: Number, default: 0 }
      },
      vsFloor: {
        revenueAboveFloor: { type: Number, default: 0 },
        ecpmAboveFloor: { type: Number, default: 0 }
      }
    },
    efficiency: {
      priceEfficiency: { type: Number, default: 0 },
      demandCapture: { type: Number, default: 0 },
      floorUtilization: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
    collection: 'floor_performance'
  }
);

// Compound indexes
FloorPerformanceSchema.index({ floorId: 1, date: -1 });
FloorPerformanceSchema.index({ inventoryId: 1, date: -1 });
FloorPerformanceSchema.index({ date: -1 });

// Unique constraint for floor + date combination
FloorPerformanceSchema.index({ floorId: 1, date: 1 }, { unique: true });

export const FloorPerformance = mongoose.model<IFloorPerformance>('FloorPerformance', FloorPerformanceSchema);