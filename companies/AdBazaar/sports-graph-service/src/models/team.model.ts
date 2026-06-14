import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam {
  eventId: mongoose.Types.ObjectId;
  name: string;
  logo?: string;
  fans: number;
  ranking?: number;
  homeCity?: string;
  stats?: {
    wins: number;
    losses: number;
    draws: number;
  };
  players?: mongoose.Types.ObjectId[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeamDocument extends ITeam, Document {
  _id: mongoose.Types.ObjectId;
}

const TeamSchema = new Schema<ITeamDocument>({
  eventId: { type: Schema.Types.ObjectId, ref: 'SportsEvent', required: true, index: true },
  name: { type: String, required: true, index: true },
  logo: { type: String },
  fans: { type: Number, default: 0 },
  ranking: { type: Number },
  homeCity: { type: String },
  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 }
  },
  players: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
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
TeamSchema.index({ eventId: 1, name: 1 });
TeamSchema.index({ fans: -1 });
TeamSchema.index({ ranking: 1 });

export const TeamModel = mongoose.model<ITeamDocument>('Team', TeamSchema);
