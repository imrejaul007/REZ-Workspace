import { logger } from '../../shared/logger';
/**
 * Migration: 003_create_handovers_collection
 * Creates the handovers collection for property possession and handover process
 *
 * Description: Creates the handovers collection for tracking property possession,
 *              handover checklists, key exchanges, and final documentation.
 */

import mongoose from 'mongoose';

const HandoversSchema = new mongoose.Schema({
  // Handover identification
  handoverId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Related documents
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    index: true
  },
  agreementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agreement',
    index: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    index: true
  },
  brokerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Broker',
    index: true
  },

  // Handover type
  type: {
    type: String,
    enum: [
      'initial_inspection',    // Pre-handover inspection
      'keys_handover',         // Key exchange
      'possession',            // Final possession
      'registration_complete', // Post-registration handover
      'rental_handover',       // Rental property handover
      'maintenance_handover'   // Periodic maintenance check
    ],
    required: true,
    index: true
  },

  // Status
  status: {
    type: String,
    enum: [
      'scheduled',       // Handover scheduled
      'in_progress',     // Handover in progress
      'pending_docs',    // Awaiting documents
      'completed',       // Handover completed
      'disputed',        // Disputes/issues raised
      'cancelled'        // Handover cancelled
    ],
    default: 'scheduled',
    index: true
  },

  // Scheduled date/time
  scheduledDate: {
    date: Date,
    timeSlot: String,
    confirmed: { type: Boolean, default: false }
  },

  // Actual handover date
  actualHandoverDate: Date,

  // Checklist items
  checklist: [{
    category: {
      type: String,
      enum: ['structural', 'electrical', 'plumbing', 'finishing', 'documents', 'keys', 'utilities']
    },
    item: String,
    description: String,
    status: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'not_applicable'],
      default: 'pending'
    },
    photos: [String],
    notes: String,
    resolvedAt: Date
  }],

  // Keys and access
  keysHandedOver: [{
    type: {
      type: String,
      enum: ['main_door', 'bedroom', 'bathroom', 'cupboard', 'garage', 'balcony', 'society', 'remote', 'parking', 'other']
    },
    quantity: Number,
    description: String,
    handedOver: { type: Boolean, default: false },
    returned: { type: Boolean, default: false }
  }],

  // Access credentials
  accessCredentials: [{
    type: {
      type: String,
      enum: ['access_card', 'pin_code', 'app_access', 'parking_fob', 'club_access', 'other']
    },
    details: String,
    handedOver: { type: Boolean, default: false },
    handedOverAt: Date
  }],

  // Meter readings at handover
  meterReadings: {
    electricity: {
      initialReading: Number,
      readingDate: Date,
      meterNumber: String,
      photo: String
    },
    gas: {
      initialReading: Number,
      readingDate: Date,
      meterNumber: String,
      photo: String
    },
    water: {
      initialReading: Number,
      readingDate: Date,
      meterNumber: String,
      photo: String
    }
  },

  // Amenities and inventory
  amenities: [{
    name: String,
    condition: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
    photo: String,
    notes: String
  }],

  // Furniture and fixtures
  furnitureFixtures: [{
    item: String,
    quantity: Number,
    condition: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
    included: { type: Boolean, default: true }
  }],

  // Documents provided
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['agreement', 'noc', 'receipt', 'insurance', 'warranty', 'manual', 'map', 'other']
    },
    url: String,
    provided: { type: Boolean, default: false },
    providedAt: Date
  }],

  // Buyer confirmation
  buyerConfirmation: {
    confirmed: { type: Boolean, default: false },
    confirmedAt: Date,
    signature: String,
    photosAccepted: { type: Boolean, default: false },
    notes: String
  },

  // Final remarks
  finalRemarks: {
    overallCondition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'not_satisfactory']
    },
    buyerSatisfaction: {
      type: Number,
      min: 1,
      max: 5
    },
    brokerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    summary: String
  },

  // Disputes
  disputes: [{
    issue: String,
    raisedBy: String,
    raisedAt: Date,
    status: { type: String, enum: ['open', 'in_review', 'resolved', 'escalated'] },
    resolution: String,
    resolvedAt: Date
  }],

  // WhatsApp integration
  whatsapp: {
    enabled: { type: Boolean, default: false },
    updateNotifications: { type: Boolean, default: true }
  },

  // Timeline
  timeline: [{
    event: String,
    description: String,
    occurredAt: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker' }
  }],

  // Soft delete
  deletedAt: Date
}, {
  timestamps: true,
  collection: 'handovers'
});

// Compound indexes
HandoversSchema.index({ propertyId: 1, type: 1 });
HandoversSchema.index({ dealId: 1 });
HandoversSchema.index({ agreementId: 1 });
HandoversSchema.index({ buyerId: 1 });
HandoversSchema.index({ status: 1, type: 1 });
HandoversSchema.index({ scheduledDate: 1, status: 1 });
HandoversSchema.index({ createdAt: -1 });

export default {
  id: '003',
  name: '003_create_handovers_collection',
  description: 'Creates the handovers collection for property possession tracking',

  up: async () => {
    const db = mongoose.connection.db!;

    // Create collection if not exists
    const collections = await db.listCollections({ name: 'handovers' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('handovers');
      logger.info('  Created handovers collection');
    }

    // Create indexes
    const handovers = db.collection('handovers');

    await handovers.createIndex({ handoverId: 1 }, { unique: true });
    await handovers.createIndex({ propertyId: 1 });
    await handovers.createIndex({ dealId: 1 });
    await handovers.createIndex({ agreementId: 1 });
    await handovers.createIndex({ buyerId: 1 });
    await handovers.createIndex({ type: 1 });
    await handovers.createIndex({ status: 1 });
    await handovers.createIndex({ propertyId: 1, type: 1 });
    await handovers.createIndex({ status: 1, type: 1 });
    await handovers.createIndex({ scheduledDate: 1, status: 1 });
    await handovers.createIndex({ createdAt: -1 });

    logger.info('  Created indexes on handovers collection');
  },

  down: async () => {
    const db = mongoose.connection.db!;
    await db.dropCollection('handovers');
    logger.info('  Dropped handovers collection');
  }
};