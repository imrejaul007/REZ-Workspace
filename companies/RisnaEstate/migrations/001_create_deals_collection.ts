import { logger } from '../../shared/logger';
/**
 * Migration: 001_create_deals_collection
 * Creates the deals collection for tracking property deals through the sales pipeline
 *
 * Description: Creates the deals collection with schema validation, indexes, and
 *              pipeline stage tracking for the real estate sales process.
 */

import mongoose from 'mongoose';

const DealsSchema = new mongoose.Schema({
  // Deal identification
  dealId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // References to related documents
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    index: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  brokerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Broker',
    required: true,
    index: true
  },

  // Pipeline stage
  stage: {
    type: String,
    enum: [
      'inquiry',           // Initial inquiry received
      'site_visit',        // Site visit scheduled/completed
      'offer_made',        // Offer submitted by buyer
      'negotiation',       // Price/terms negotiation
      'agreement',         // Agreement to sell drafted
      'registry',          // Registry/booking process
      'closed_won',        // Deal successfully closed
      'closed_lost'        // Deal lost
    ],
    default: 'inquiry',
    index: true
  },

  // Financial details
  askingPrice: {
    type: Number,
    min: 0
  },
  offerPrice: {
    type: Number,
    min: 0
  },
  finalPrice: {
    type: Number,
    min: 0
  },
  brokerage: {
    type: Number,
    min: 0
  },

  // Deal probability (0-100)
  probability: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Deal status
  status: {
    type: String,
    enum: ['active', 'won', 'lost', 'on_hold'],
    default: 'active',
    index: true
  },

  // Lost deal reason
  lostReason: {
    type: String,
    enum: ['price', 'location', 'competition', 'financing', 'buyer_withdrew', 'other'],
  },

  // Timeline tracking
  expectedCloseDate: Date,
  actualCloseDate: Date,
  stageHistory: [{
    stage: String,
    enteredAt: Date,
    exitedAt: Date,
    notes: String
  }],

  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['agreement', 'receipt', 'noc', 'registry', 'other']
    },
    url: String,
    uploadedAt: Date
  }],

  // Notes and communication
  notes: [{
    text: String,
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker' },
    createdAt: { type: Date, default: Date.now }
  }],

  // WhatsApp integration
  whatsapp: {
    enabled: { type: Boolean, default: false },
    lastMessageAt: Date,
    messageCount: { type: Number, default: 0 }
  },

  // AI scoring
  aiScore: {
    overall: { type: Number, min: 0, max: 100 },
    priceScore: { type: Number, min: 0, max: 100 },
    timingScore: { type: Number, min: 0, max: 100 },
    brokerScore: { type: Number, min: 0, max: 100 }
  },

  // Source tracking
  source: {
    type: String,
    enum: ['website', 'referral', 'broker', 'advertisement', 'social_media', 'direct', 'other'],
    default: 'direct'
  },

  // Soft delete
  deletedAt: Date
}, {
  timestamps: true,
  collection: 'deals'
});

// Compound indexes for common queries
DealsSchema.index({ brokerId: 1, stage: 1 });
DealsSchema.index({ propertyId: 1, status: 1 });
DealsSchema.index({ leadId: 1, createdAt: -1 });
DealsSchema.index({ stage: 1, probability: -1 });
DealsSchema.index({ status: 1, stage: 1 });
DealsSchema.index({ 'aiScore.overall': -1 });
DealsSchema.index({ createdAt: -1 });
DealsSchema.index({ expectedCloseDate: 1, status: 1 });

// Text index for search
DealsSchema.index({ dealId: 'text', notes: 'text' });

export default {
  id: '001',
  name: '001_create_deals_collection',
  description: 'Creates the deals collection with pipeline stages and deal tracking',

  up: async () => {
    const db = mongoose.connection.db!;

    // Create collection if not exists
    const collections = await db.listCollections({ name: 'deals' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('deals');
      logger.info('  Created deals collection');
    }

    // Create indexes
    const deals = db.collection('deals');

    await deals.createIndex({ dealId: 1 }, { unique: true });
    await deals.createIndex({ leadId: 1 });
    await deals.createIndex({ propertyId: 1 });
    await deals.createIndex({ brokerId: 1 });
    await deals.createIndex({ stage: 1 });
    await deals.createIndex({ status: 1 });
    await deals.createIndex({ brokerId: 1, stage: 1 });
    await deals.createIndex({ propertyId: 1, status: 1 });
    await deals.createIndex({ stage: 1, probability: -1 });
    await deals.createIndex({ 'aiScore.overall': -1 });
    await deals.createIndex({ expectedCloseDate: 1, status: 1 });
    await deals.createIndex({ createdAt: -1 });

    logger.info('  Created indexes on deals collection');
  },

  down: async () => {
    const db = mongoose.connection.db!;
    await db.dropCollection('deals');
    logger.info('  Dropped deals collection');
  }
};