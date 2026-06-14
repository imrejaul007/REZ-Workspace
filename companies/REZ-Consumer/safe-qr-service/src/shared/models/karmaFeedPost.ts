import mongoose, { Schema, Document, Model } from 'mongoose';

// ==========================================
// KARMA FEED POST DOCUMENT INTERFACE
// ==========================================

export interface IkarmaFeedPost extends Document {
 postId: string;
 safeQRId: string;
 shortcode: string;
 mode: string;
 type: 'lost_item' | 'found_item' | 'sighting';
 title: string;
 description: string;
 location?: {
   type: string;
   coordinates: [number, number];
   address?: string;
   lastSeenAt?: Date;
 };
 photos: string[];
 reward?: {
   amount: number;
   currency: string;
   message?: string;
 };
 owner: {
   id: string;
   name: string;
   karmaLevel?: string;
   phone?: string;
   avatar?: string;
 };
 helpers: Array<{
   userId: string;
   name: string;
   avatar?: string;
   karmaLevel?: string;
   joinedAt: Date;
   lastSeenLocation?: {
     lat: number;
     lng: number;
     address?: string;
   };
   contributed: boolean;
   contributedAt?: Date;
 }>;
 status: 'active' | 'resolved' | 'expired' | 'cancelled';
 resolvedAt?: Date;
 resolvedBy?: string;
 totalKarmaDistributed: number;
 expiresAt: Date;
 createdAt: Date;
 updatedAt: Date;
}

// ==========================================
// KARMA FEED POST SCHEMA
// ==========================================

const KarmaFeedPostSchema = new Schema<IKarmaFeedPost>(
 {
   postId: {
     type: String,
     required: true,
     unique: true,
     index: true,
   },
   safeQRId: {
     type: String,
     required: true,
     index: true,
   },
   shortcode: {
     type: String,
     required: true,
     index: true,
   },
   mode: {
     type: String,
     required: true,
     index: true,
   },
   type: {
     type: String,
     enum: ['lost_item', 'found_item', 'sighting'],
     default: 'lost_item',
   },
   title: {
     type: String,
     required: true,
   },
   description: {
     type: String,
     required: true,
   },
   location: {
     type: {
       type: String,
       enum: ['Point'],
       default: 'Point',
     },
     coordinates: {
       type: [Number],
       default: [0, 0],
     },
     address: String,
     lastSeenAt: Date,
   },
   photos: [String],
   reward: {
     amount: Number,
     currency: { type: String, default: 'INR' },
     message: String,
   },
   owner: {
     id: { type: String, required: true },
     name: { type: String, required: true },
     karmaLevel: String,
     phone: String,
     avatar: String,
   },
   helpers: [
     {
       userId: String,
       name: String,
       avatar: String,
       karmaLevel: String,
       joinedAt: { type: Date, default: Date.now },
       lastSeenLocation: {
         lat: Number,
         lng: Number,
         address: String,
       },
       contributed: { type: Boolean, default: false },
       contributedAt: Date,
     },
   ],
   status: {
     type: String,
     enum: ['active', 'resolved', 'expired', 'cancelled'],
     default: 'active',
     index: true,
   },
   resolvedAt: Date,
   resolvedBy: String,
   totalKarmaDistributed: {
     type: Number,
     default: 0,
   },
   expiresAt: {
     type: Date,
     required: true,
   },
 },
 {
   timestamps: true,
   collection: 'karma_feed_posts',
 }
);

// ==========================================
// INDEXES
// ==========================================

KarmaFeedPostSchema.index({ status: 1, expiresAt: 1 });
KarmaFeedPostSchema.index({ mode: 1, status: 1 });
KarmaFeedPostSchema.index({ owner: { id: 1 }, status: 1 });
KarmaFeedPostSchema.index({ location: '2dsphere' });
KarmaFeedPostSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL

// ==========================================
// METHODS
// ==========================================

KarmaFeedPostSchema.methods.addHelper = function (helper: {
 userId: string;
 name: string;
 avatar?: string;
 karmaLevel?: string;
}) {
 const exists = this.helpers.some((h) => h.userId === helper.userId);
 if (!exists) {
   this.helpers.push({
     ...helper,
     joinedAt: new Date(),
     contributed: false,
   });
   return this.save();
 }
 return Promise.resolve(this);
};

KarmaFeedPostSchema.methods.markHelperContributed = function (userId: string) {
 const helper = this.helpers.find((h) => h.userId === userId);
 if (helper) {
   helper.contributed = true;
   helper.contributedAt = new Date();
   return this.save();
 }
 return Promise.resolve(this);
};

KarmaFeedPostSchema.methods.resolve = function (resolvedBy: string) {
 this.status = 'resolved';
 this.resolvedAt = new Date();
 this.resolvedBy = resolvedBy;
 return this.save();
};

KarmaFeedPostSchema.methods.expire = function () {
 this.status = 'expired';
 return this.save();
};

// ==========================================
// STATICS
// ==========================================

KarmaFeedPostSchema.statics.findByPostId = function (postId: string) {
 return this.findOne({ postId });
};

KarmaFeedPostSchema.statics.findByOwner = function (ownerId: string) {
 return this.find({ 'owner.id': ownerId }).sort({ createdAt: -1 });
};

KarmaFeedPostSchema.statics.findActive = function (limit = 50) {
 return this.find({ status: 'active' })
   .sort({ createdAt: -1 })
   .limit(limit);
};

KarmaFeedPostSchema.statics.findNearby = function (
 coordinates: [number, number],
 radiusMeters = 5000,
 mode?: string
) {
 const query: Record<string, unknown> = {
   status: 'active',
   location: {
     $nearSphere: {
       $geometry: {
         type: 'Point',
         coordinates,
       },
       $maxDistance: radiusMeters,
     },
   },
 };
 if (mode) query.mode = mode;
 return this.find(query);
};

KarmaFeedPostSchema.statics.findByMode = function (mode: string, limit = 50) {
 return this.find({ mode, status: 'active' })
   .sort({ createdAt: -1 })
   .limit(limit);
};

KarmaFeedPostSchema.statics.expireOldPosts = function () {
 return this.updateMany(
   {
     status: 'active',
     expiresAt: { $lt: new Date() },
   },
   {
     $set: { status: 'expired' },
   }
 );
};

// ==========================================
// EXPORT
// ==========================================

export const KarmaFeedPost: Model<IKarmaFeedPost> = mongoose.model<IKarmaFeedPost>(
 'KarmaFeedPost',
 KarmaFeedPostSchema
);
