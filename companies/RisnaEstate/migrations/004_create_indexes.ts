import { logger } from '../../shared/logger';
/**
 * Migration: 004_create_indexes
 * Creates additional performance indexes for existing collections
 *
 * Description: Creates optimized indexes for common query patterns across
 *              properties, leads, brokers, and other collections.
 */

import mongoose from 'mongoose';

export default {
  id: '004',
  name: '004_create_indexes',
  description: 'Creates additional performance indexes for optimized queries',

  up: async () => {
    const db = mongoose.connection.db!;

    logger.info('  Creating additional indexes...\n');

    // ============================================
    // PROPERTIES COLLECTION INDEXES
    // ============================================
    const properties = db.collection('properties');

    await properties.createIndex(
      { status: 1, country: 1 },
      { name: 'idx_properties_status_country' }
    );
    logger.info('  Created index: properties.status_country');

    await properties.createIndex(
      { 'price.amount': 1 },
      { name: 'idx_properties_price' }
    );
    logger.info('  Created index: properties.price');

    await properties.createIndex(
      { propertyType: 1, listingType: 1 },
      { name: 'idx_properties_type_listing' }
    );
    logger.info('  Created index: properties.type_listing');

    await properties.createIndex(
      { city: 1, locality: 1 },
      { name: 'idx_properties_location' }
    );
    logger.info('  Created index: properties.location');

    await properties.createIndex(
      { brokerId: 1, status: 1 },
      { name: 'idx_properties_broker_status' }
    );
    logger.info('  Created index: properties.broker_status');

    await properties.createIndex(
      { tags: 1 },
      { name: 'idx_properties_tags' }
    );
    logger.info('  Created index: properties.tags');

    await properties.createIndex(
      { createdAt: -1 },
      { name: 'idx_properties_created' }
    );
    logger.info('  Created index: properties.created');

    await properties.createIndex(
      { featured: 1, status: 1 },
      { name: 'idx_properties_featured' }
    );
    logger.info('  Created index: properties.featured');

    await properties.createIndex(
      { 'location.coordinates': '2dsphere' },
      { name: 'idx_properties_geo' }
    );
    logger.info('  Created index: properties.geo');

    await properties.createIndex(
      { 'price.amount': 1, 'price.currency': 1 },
      { name: 'idx_properties_price_currency' }
    );
    logger.info('  Created index: properties.price_currency');

    await properties.createIndex(
      { bedrooms: 1, status: 1 },
      { name: 'idx_properties_bedrooms_status' }
    );
    logger.info('  Created index: properties.bedrooms_status');

    await properties.createIndex(
      { 'area.sqft': 1, status: 1 },
      { name: 'idx_properties_area_status' }
    );
    logger.info('  Created index: properties.area_status');

    // ============================================
    // LEADS COLLECTION INDEXES
    // ============================================
    const leads = db.collection('leads');

    await leads.createIndex(
      { phone: 1 },
      { name: 'idx_leads_phone', unique: true, sparse: true }
    );
    logger.info('  Created index: leads.phone');

    await leads.createIndex(
      { email: 1 },
      { name: 'idx_leads_email', sparse: true }
    );
    logger.info('  Created index: leads.email');

    await leads.createIndex(
      { brokerId: 1, status: 1 },
      { name: 'idx_leads_broker_status' }
    );
    logger.info('  Created index: leads.broker_status');

    await leads.createIndex(
      { segment: 1 },
      { name: 'idx_leads_segment' }
    );
    logger.info('  Created index: leads.segment');

    await leads.createIndex(
      { 'aiScore.overall': -1 },
      { name: 'idx_leads_aiscore' }
    );
    logger.info('  Created index: leads.aiscore');

    await leads.createIndex(
      { createdAt: -1 },
      { name: 'idx_leads_created' }
    );
    logger.info('  Created index: leads.created');

    await leads.createIndex(
      { source: 1 },
      { name: 'idx_leads_source' }
    );
    logger.info('  Created index: leads.source');

    await leads.createIndex(
      { status: 1, 'aiScore.overall': -1 },
      { name: 'idx_leads_status_aiscore' }
    );
    logger.info('  Created index: leads.status_aiscore');

    await leads.createIndex(
      { 'preferences.budget.min': 1, 'preferences.budget.max': 1 },
      { name: 'idx_leads_budget' }
    );
    logger.info('  Created index: leads.budget');

    await leads.createIndex(
      { 'preferences.location.city': 1, 'preferences.location.locality': 1 },
      { name: 'idx_leads_preferred_location' }
    );
    logger.info('  Created index: leads.preferred_location');

    // ============================================
    // BROKERS COLLECTION INDEXES
    // ============================================
    const brokers = db.collection('brokers');

    await brokers.createIndex(
      { phone: 1 },
      { name: 'idx_brokers_phone', unique: true, sparse: true }
    );
    logger.info('  Created index: brokers.phone');

    await brokers.createIndex(
      { email: 1 },
      { name: 'idx_brokers_email', unique: true, sparse: true }
    );
    logger.info('  Created index: brokers.email');

    await brokers.createIndex(
      { status: 1, 'performance.totalDeals': -1 },
      { name: 'idx_brokers_status_performance' }
    );
    logger.info('  Created index: brokers.status_performance');

    await brokers.createIndex(
      { 'areas.serving': 1 },
      { name: 'idx_brokers_areas' }
    );
    logger.info('  Created index: brokers.areas');

    await brokers.createIndex(
      { 'specializations.propertyType': 1 },
      { name: 'idx_brokers_specializations' }
    );
    logger.info('  Created index: brokers.specializations');

    // ============================================
    // FOLLOWUPS COLLECTION INDEXES
    // ============================================
    const followups = db.collection('followups');

    await followups.createIndex(
      { leadId: 1, scheduledAt: 1 },
      { name: 'idx_followups_lead_scheduled' }
    );
    logger.info('  Created index: followups.lead_scheduled');

    await followups.createIndex(
      { brokerId: 1, status: 1, scheduledAt: 1 },
      { name: 'idx_followups_broker_status' }
    );
    logger.info('  Created index: followups.broker_status');

    await followups.createIndex(
      { status: 1, scheduledAt: 1 },
      { name: 'idx_followups_status_scheduled' }
    );
    logger.info('  Created index: followups.status_scheduled');

    await followups.createIndex(
      { dueDate: 1, status: 1 },
      { name: 'idx_followups_due' }
    );
    logger.info('  Created index: followups.due');

    // ============================================
    // SITEVISITS COLLECTION INDEXES
    // ============================================
    const sitevisits = db.collection('sitevisits');

    await sitevisits.createIndex(
      { leadId: 1, scheduledAt: 1 },
      { name: 'idx_sitevisits_lead_scheduled' }
    );
    logger.info('  Created index: sitevisits.lead_scheduled');

    await sitevisits.createIndex(
      { propertyId: 1, scheduledAt: 1 },
      { name: 'idx_sitevisits_property_scheduled' }
    );
    logger.info('  Created index: sitevisits.property_scheduled');

    await sitevisits.createIndex(
      { brokerId: 1, status: 1 },
      { name: 'idx_sitevisits_broker_status' }
    );
    logger.info('  Created index: sitevisits.broker_status');

    await sitevisits.createIndex(
      { status: 1, scheduledAt: 1 },
      { name: 'idx_sitevisits_status_scheduled' }
    );
    logger.info('  Created index: sitevisits.status_scheduled');

    // ============================================
    // REFERRALS COLLECTION INDEXES
    // ============================================
    const referrals = db.collection('referrals');

    await referrals.createIndex(
      { referrerId: 1, status: 1 },
      { name: 'idx_referrals_referrer_status' }
    );
    logger.info('  Created index: referrals.referrer_status');

    await referrals.createIndex(
      { referredLeadId: 1 },
      { name: 'idx_referrals_referred' }
    );
    logger.info('  Created index: referrals.referred');

    await referrals.createIndex(
      { status: 1, 'reward.status': 1 },
      { name: 'idx_referrals_reward_status' }
    );
    logger.info('  Created index: referrals.reward_status');

    // ============================================
    // VISAS COLLECTION INDEXES
    // ============================================
    const visas = db.collection('visas');

    await visas.createIndex(
      { leadId: 1, type: 1 },
      { name: 'idx_visas_lead_type' }
    );
    logger.info('  Created index: visas.lead_type');

    await visas.createIndex(
      { status: 1, 'timeline.deadline': 1 },
      { name: 'idx_visas_status_deadline' }
    );
    logger.info('  Created index: visas.status_deadline');

    await visas.createIndex(
      { 'progress.currentStep': 1 },
      { name: 'idx_visas_progress' }
    );
    logger.info('  Created index: visas.progress');

    logger.info('\n  All indexes created successfully!');
  },

  down: async () => {
    const db = mongoose.connection.db!;

    logger.info('  Dropping custom indexes...\n');

    // Properties indexes
    const properties = db.collection('properties');
    const propertyIndexes = [
      'idx_properties_status_country',
      'idx_properties_price',
      'idx_properties_type_listing',
      'idx_properties_location',
      'idx_properties_broker_status',
      'idx_properties_tags',
      'idx_properties_created',
      'idx_properties_featured',
      'idx_properties_geo',
      'idx_properties_price_currency',
      'idx_properties_bedrooms_status',
      'idx_properties_area_status'
    ];

    for (const idx of propertyIndexes) {
      try {
        await properties.dropIndex(idx);
        logger.info(`  Dropped: properties.${idx}`);
      } catch (err: any) {
        if (!err.message.includes('index not found')) {
          logger.info(`  Skipped: properties.${idx}`);
        }
      }
    }

    // Leads indexes
    const leads = db.collection('leads');
    const leadIndexes = [
      'idx_leads_phone',
      'idx_leads_email',
      'idx_leads_broker_status',
      'idx_leads_segment',
      'idx_leads_aiscore',
      'idx_leads_created',
      'idx_leads_source',
      'idx_leads_status_aiscore',
      'idx_leads_budget',
      'idx_leads_preferred_location'
    ];

    for (const idx of leadIndexes) {
      try {
        await leads.dropIndex(idx);
        logger.info(`  Dropped: leads.${idx}`);
      } catch (err: any) {
        if (!err.message.includes('index not found')) {
          logger.info(`  Skipped: leads.${idx}`);
        }
      }
    }

    // Brokers indexes
    const brokers = db.collection('brokers');
    const brokerIndexes = [
      'idx_brokers_phone',
      'idx_brokers_email',
      'idx_brokers_status_performance',
      'idx_brokers_areas',
      'idx_brokers_specializations'
    ];

    for (const idx of brokerIndexes) {
      try {
        await brokers.dropIndex(idx);
        logger.info(`  Dropped: brokers.${idx}`);
      } catch (err: any) {
        if (!err.message.includes('index not found')) {
          logger.info(`  Skipped: brokers.${idx}`);
        }
      }
    }

    // Followups indexes
    const followups = db.collection('followups');
    const followupIndexes = [
      'idx_followups_lead_scheduled',
      'idx_followups_broker_status',
      'idx_followups_status_scheduled',
      'idx_followups_due'
    ];

    for (const idx of followupIndexes) {
      try {
        await followups.dropIndex(idx);
        logger.info(`  Dropped: followups.${idx}`);
      } catch (err: any) {
        if (!err.message.includes('index not found')) {
          logger.info(`  Skipped: followups.${idx}`);
        }
      }
    }

    // Sitevisits indexes
    const sitevisits = db.collection('sitevisits');
    const sitevisitIndexes = [
      'idx_sitevisits_lead_scheduled',
      'idx_sitevisits_property_scheduled',
      'idx_sitevisits_broker_status',
      'idx_sitevisits_status_scheduled'
    ];

    for (const idx of sitevisitIndexes) {
      try {
        await sitevisits.dropIndex(idx);
        logger.info(`  Dropped: sitevisits.${idx}`);
      } catch (err: any) {
        if (!err.message.includes('index not found')) {
          logger.info(`  Skipped: sitevisits.${idx}`);
        }
      }
    }

    // Referrals indexes
    const referrals = db.collection('referrals');
    const referralIndexes = [
      'idx_referrals_referrer_status',
      'idx_referrals_referred',
      'idx_referrals_reward_status'
    ];

    for (const idx of referralIndexes) {
      try {
        await referrals.dropIndex(idx);
        logger.info(`  Dropped: referrals.${idx}`);
      } catch (err: any) {
        if (!err.message.includes('index not found')) {
          logger.info(`  Skipped: referrals.${idx}`);
        }
      }
    }

    // Visas indexes
    const visas = db.collection('visas');
    const visaIndexes = [
      'idx_visas_lead_type',
      'idx_visas_status_deadline',
      'idx_visas_progress'
    ];

    for (const idx of visaIndexes) {
      try {
        await visas.dropIndex(idx);
        logger.info(`  Dropped: visas.${idx}`);
      } catch (err: any) {
        if (!err.message.includes('index not found')) {
          logger.info(`  Skipped: visas.${idx}`);
        }
      }
    }

    logger.info('\n  Index rollback complete!');
  }
};