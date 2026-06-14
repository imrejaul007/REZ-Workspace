import mongoose, { Schema, Document, Model } from 'mongoose';
import { karmaConfig, getKarmaLevel } from '../../config/karma';

// ==========================================
// KARMA STATE DOCUMENT INTERFACE
// ==========================================

export interface IKarmaState extends Document {
 userId: string;
 totalPoints: number;
 helpCount: number;
 categories: Record<string, number>;
 currentStreak: number;
 longestStreak: number;
 lastHelpDate?: Date;
 level: string;
 badge: string;
 achievements: Array<{
   id: string;
   name: string;
   description?: string;
   icon?: string;
   earnedAt: Date;
 }>;
 updatedAt: Date;
}

// ==========================================
// KARMA STATE SCHEMA
// ==========================================

const KarmaStateSchema = new Schema<IKarmaState>(
 {
   userId: {
     type: String,
     required: true,
     unique: true,
     index: true,
   },
   totalPoints: {
     type: Number,
     default: 0,
   },
   helpCount: {
     type: Number,
     default: 0,
   },
   categories: {
     type: Map,
     of: Number,
     default: {},
   },
   currentStreak: {
     type: Number,
     default: 0,
   },
   longestStreak: {
     type: Number,
     default: 0,
   },
   lastHelpDate: {
     type: Date,
   },
   level: {
     type: String,
     default: 'Newbie',
   },
   badge: {
     type: String,
     default: '🟢',
   },
   achievements: [
     {
       id: String,
       name: String,
       description: String,
       icon: String,
       earnedAt: { type: Date, default: Date.now },
     },
   ],
 },
 {
   timestamps: { createdAt: false, updatedAt: true },
   collection: 'karma_states',
 }
);

// ==========================================
// METHODS
// ==========================================

KarmaStateSchema.methods.addPoints = function (points: number, category?: string) {
 this.totalPoints += points;
 if (points > 0) {
   this.helpCount += 1;
   if (category) {
     const current = this.categories[category] || 0;
     this.categories[category] = current + 1;
   }
   this.updateStreak();
 }
 const { name, badge } = getKarmaLevel(this.totalPoints);
 this.level = name;
 this.badge = badge;
 return this.save();
};

KarmaStateSchema.methods.updateStreak = function () {
 const now = new Date();
 const lastHelp = this.lastHelpDate;
 if (!lastHelp) {
   this.currentStreak = 1;
 } else {
   const hoursSinceLastHelp = (now.getTime() - lastHelp.getTime()) / (1000 * 60 * 60);
   if (hoursSinceLastHelp < 24) {
     this.currentStreak += 1;
   } else if (hoursSinceLastHelp < 48) {
     // Keep streak if within 48 hours
   } else {
     this.currentStreak = 1;
   }
 }
 if (this.currentStreak > this.longestStreak) {
   this.longestStreak = this.currentStreak;
 }
 this.lastHelpDate = now;
 return this.save();
};

KarmaStateSchema.methods.addAchievement = function (achievement: {
 id: string;
 name: string;
 description?: string;
 icon?: string;
}) {
 const exists = this.achievements.some((a) => a.id === achievement.id);
 if (!exists) {
   this.achievements.push({
     ...achievement,
     earnedAt: new Date(),
   });
   return this.save();
 }
 return Promise.resolve(this);
};

// ==========================================
// STATICS
// ==========================================

KarmaStateSchema.statics.findByUser = function (userId: string) {
 return this.findOne({ userId });
};

KarmaStateSchema.statics.findOrCreate = async function (userId: string) {
 let state = await this.findOne({ userId });
 if (!state) {
   state = new this({ userId });
   await state.save();
 }
 return state;
};

KarmaStateSchema.statics.getLeaderboard = function (limit = 10) {
 return this.find()
   .sort({ totalPoints: -1 })
   .limit(limit)
   .select('userId totalPoints level badge helpCount');
};

KarmaStateSchema.statics.getTopByCategory = function (category: string, limit = 10) {
 return this.find({ [`categories.${category}`]: { $exists: true, $gt: 0 } })
   .sort({ [`categories.${category}`]: -1 })
   .limit(limit)
   .select('userId totalPoints level badge');
};

// ==========================================
// EXPORT
// ==========================================

export const KarmaState: Model<IKarmaState> = mongoose.model<IKarmaState>('KarmaState', KarmaStateSchema);
