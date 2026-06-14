import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer {
  eventId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  name: string;
  position?: string;
  jerseyNumber?: number;
  stats?: {
    matches: number;
    goals?: number;
    assists?: number;
    points?: number;
    rebounds?: number;
    wickets?: number;
    runs?: number;
  };
  nationality?: string;
  age?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlayerDocument extends IPlayer, Document {
  _id: mongoose.Types.ObjectId;
}

const PlayerSchema = new Schema<IPlayerDocument>({
  eventId: { type: Schema.Types.ObjectId, ref: 'SportsEvent', required: true, index: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  name: { type: String, required: true, index: true },
  position: { type: String },
  jerseyNumber: { type: Number },
  stats: {
    matches: { type: Number, default: 0 },
    goals: { type: Number },
    assists: { type: Number },
    points: { type: Number },
    rebounds: { type: Number },
    wickets: { type: Number },
    runs: { type: Number }
  },
  nationality: { type: String },
  age: { type: Number },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
PlayerSchema.index({ eventId: 1, teamId: 1 });
PlayerSchema.index({ name: 'text' });
PlayerSchema.index({ position: 1 });

export const PlayerModel = mongoose.model<IPlayerDocument>('Player', PlayerSchema);
