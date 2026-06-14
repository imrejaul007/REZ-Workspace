import { logger } from '../../shared/logger';
/**
 * Migration: 002_create_agreements_collection
 * Creates the agreements collection for legal agreements and contracts
 *
 * Description: Creates the agreements collection for storing property agreements,
 *              sale deeds, lease agreements, and other legal documents.
 */

import mongoose from 'mongoose';

const AgreementsSchema = new mongoose.Schema({
  // Agreement identification
  agreementId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Agreement type
  type: {
    type: String,
    enum: [
      'sale_agreement',      // Agreement to sell
      'registry',            // Final sale deed registration
      'lease_agreement',     // Rental/lease contract
      'moa',                 // Memorandum of Agreement
      'noc',                 // No Objection Certificate
      'loan_agreement',      // Home loan documents
      'builder_agreement',  // Builder-buyer agreement
      'other'                // Other agreements
    ],
    required: true,
    index: true
  },

  // Property reference
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

  // Parties involved
  parties: [{
    role: {
      type: String,
      enum: ['buyer', 'seller', 'landlord', 'tenant', 'guarantor', 'witness']
    },
    name: String,
    phone: String,
    email: String,
    address: String,
    aadharNumber: String,
    panNumber: String
  }],

  // Financial terms
  financial: {
    totalAmount: Number,
    paidAmount: Number,
    pendingAmount: Number,
    paymentMode: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque', 'rtgs', 'neft', 'mixed']
    },
    paymentSchedule: [{
      installment: Number,
      amount: Number,
      dueDate: Date,
      paidDate: Date,
      status: { type: String, enum: ['pending', 'paid', 'overdue'] }
    }]
  },

  // Dates
  agreementDate: Date,
  startDate: Date,
  endDate: Date,
  registrationDate: Date,

  // Document details
  document: {
    registrationNumber: String,
    documentPath: String,
    registeredAt: String,  // Sub-registrar office
    witnessCount: Number
  },

  // Status tracking
  status: {
    type: String,
    enum: ['draft', 'pending_signature', 'pending_registration', 'registered', 'expired', 'terminated', 'cancelled'],
    default: 'draft',
    index: true
  },

  // Stage in workflow
  stage: {
    type: String,
    enum: ['created', 'review', 'buyer_signed', 'seller_signed', 'pending_registry', 'registered', 'completed'],
    default: 'created',
    index: true
  },

  // Digital signatures
  digitalSignature: {
    buyerSigned: { type: Boolean, default: false },
    buyerSignedAt: Date,
    sellerSigned: { type: Boolean, default: false },
    sellerSignedAt: Date,
    buyerSignaturePath: String,
    sellerSignaturePath: String
  },

  // Templates
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgreementTemplate'
  },
  customTerms: String,

  // Compliance
  compliance: {
    reraRegistered: { type: Boolean, default: false },
    reraNumber: String,
    stampDutyPaid: { type: Boolean, default: false },
    stampDutyAmount: Number,
    gstApplicable: { type: Boolean, default: false },
    gstAmount: Number
  },

  // Broker reference
  brokerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Broker'
  },

  // Verification
  verification: {
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker' },
    verifiedAt: Date,
    verificationNotes: String
  },

  // Document uploads
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker' }
  }],

  // Communication log
  communications: [{
    type: { type: String, enum: ['call', 'whatsapp', 'email', 'meeting'] },
    direction: { type: String, enum: ['inbound', 'outbound'] },
    summary: String,
    occurredAt: { type: Date, default: Date.now }
  }],

  // Notes
  notes: [{
    text: String,
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker' },
    createdAt: { type: Date, default: Date.now }
  }],

  // Workflow
  workflow: {
    currentStep: Number,
    steps: [{
      name: String,
      status: { type: String, enum: ['pending', 'in_progress', 'completed', 'skipped'] },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker' },
      completedAt: Date,
      notes: String
    }]
  },

  // Soft delete
  deletedAt: Date
}, {
  timestamps: true,
  collection: 'agreements'
});

// Compound indexes
AgreementsSchema.index({ propertyId: 1, type: 1 });
AgreementsSchema.index({ dealId: 1 });
AgreementsSchema.index({ status: 1, stage: 1 });
AgreementsSchema.index({ 'financial.paidAmount': 1 });
AgreementsSchema.index({ endDate: 1, status: 1 });
AgreementsSchema.index({ createdAt: -1 });

export default {
  id: '002',
  name: '002_create_agreements_collection',
  description: 'Creates the agreements collection for legal contracts and documents',

  up: async () => {
    const db = mongoose.connection.db!;

    // Create collection if not exists
    const collections = await db.listCollections({ name: 'agreements' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('agreements');
      logger.info('  Created agreements collection');
    }

    // Create indexes
    const agreements = db.collection('agreements');

    await agreements.createIndex({ agreementId: 1 }, { unique: true });
    await agreements.createIndex({ propertyId: 1 });
    await agreements.createIndex({ dealId: 1 });
    await agreements.createIndex({ type: 1 });
    await agreements.createIndex({ status: 1 });
    await agreements.createIndex({ stage: 1 });
    await agreements.createIndex({ propertyId: 1, type: 1 });
    await agreements.createIndex({ status: 1, stage: 1 });
    await agreements.createIndex({ endDate: 1, status: 1 });
    await agreements.createIndex({ createdAt: -1 });

    logger.info('  Created indexes on agreements collection');
  },

  down: async () => {
    const db = mongoose.connection.db!;
    await db.dropCollection('agreements');
    logger.info('  Dropped agreements collection');
  }
};