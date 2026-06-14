/**
 * REZ Verify QR - OEM Dashboard Service
 * Enterprise analytics, counterfeit detection, regional insights, and fraud mapping
 */

import express, { Request, Response } from 'express';
import logger from './utils/logger';
import mongoose from 'mongoose';
import axios from 'axios';
import { randomBytes } from 'crypto';

const router = express.Router();

// External APIs
const INTELLIGENCE_API = process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com';
const MIND_API = process.env.MIND_API || 'https://REZ-mind.onrender.com';

// ============================================
// OEM DASHBOARD MODELS
// ============================================

// OEM Brand Configuration
const OEMBrand = mongoose.model('OEMBrand', new mongoose.Schema({
  brand_id: { type: String, required: true, unique: true },
  brand_name: String,
  logo_url: String,
  website: String,
  contact_email: String,
  api_key: String,  // For API access

  // Subscription
  plan: { type: String, enum: ['starter', 'professional', 'enterprise'], default: 'starter' },
  max_serials: Number,
  features_enabled: [String],

  // Settings
  default_warranty_months: { type: Number, default: 12 },
  enable_dynamic_qr: { type: Boolean, default: true },
  enable_recall: { type: Boolean, default: true },
  enable_resale_verification: { type: Boolean, default: true },

  // Analytics preferences
  dashboard_config: {
    show_competitor_data: { type: Boolean, default: false },
    show_regional_breakdown: { type: Boolean, default: true },
    alert_thresholds: {
      fraud_rate: { type: Number, default: 5 },  // %
      counterfeit_rate: { type: Number, default: 3 },  // %
      activation_rate_min: { type: Number, default: 50 }  // %
    }
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));

// Product Configuration
const OEMProduct = mongoose.model('OEMProduct', new mongoose.Schema({
  product_id: { type: String, required: true, unique: true },
  brand_id: String,

  // Product details
  name: String,
  sku: String,
  category: String,
  subcategory: String,
  model_number: String,
  color: String,
  storage_variants: [String],

  // Pricing
  mrp: Number,
  launch_date: Date,
  eol_date: Date,  // End of life

  // QR Settings
  qr_prefix: String,
  serial_format: String,
  batch_size: { type: Number, default: 1000 },

  // Warranty
  default_warranty_months: { type: Number, default: 12 },
  extended_warranty_available: { type: Boolean, default: true },
  warranty_transferable: { type: Boolean, default: true },

  // Status
  status: { type: String, enum: ['active', 'discontinued', 'recalled'], default: 'active' },

  created_at: { type: Date, default: Date.now }
}));

// Counterfeit Report
const CounterfeitReport = mongoose.model('CounterfeitReport', new mongoose.Schema({
  report_id: { type: String, required: true, unique: true },
  brand_id: String,
  product_id: String,

  // Location
  location: {
    country: String,
    state: String,
    city: String,
    lat: Number,
    lng: Number,
    source: String  // marketplace, store, online, etc.
  },

  // Product info
  reported_serial: String,
  product_name: String,
  product_model: String,

  // Counterfeit details
  counterfeit_type: {
    type: String,
    enum: ['fake_serial', 'replica', 'cloned', 'tampered', 'gray_market']
  },
  confidence_score: Number,  // 0-100
  evidence: {
    photos: [String],
    description: String,
    seller_info: String,
    listing_url: String
  },

  // Status
  status: {
    type: String,
    enum: ['reported', 'verified', 'confirmed', 'action_taken', 'dismissed'],
    default: 'reported'
  },

  // Actions taken
  actions: [{
    type: String,
    description: String,
    taken_at: Date,
    taken_by: String
  }],

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));

// Regional Analytics Summary (pre-aggregated for fast dashboard)
const RegionalAnalytics = mongoose.model('RegionalAnalytics', new mongoose.Schema({
  brand_id: String,
  product_id: String,

  // Time period
  period: { type: String, enum: ['daily', 'weekly', 'monthly'] },
  date: Date,

  // Location
  region: String,
  state: String,
  city: String,

  // Metrics
  metrics: {
    serials_generated: Number,
    serials_activated: Number,
    activation_rate: Number,  // percentage
    verifications: Number,
    claims: Number,
    claim_rate: Number,
    fraud_attempts: Number,
    fraud_rate: Number,
    counterfeit_reports: Number,
    transfers: Number,
    resale_volume: Number  // estimated
  },

  // Demographics
  demographics: {
    age_distribution: { type: Map, of: Number },
    gender_distribution: { type: Map, of: Number }
  },

  created_at: { type: Date, default: Date.now }
}));

// Fraud Pattern
const FraudPattern = mongoose.model('FraudPattern', new mongoose.Schema({
  pattern_id: { type: String, required: true, unique: true },
  brand_id: String,

  // Pattern type
  type: {
    type: String,
    enum: ['serial_hijacking', 'fake_activation', 'ghost_product', 'resale_fraud', 'return_fraud']
  },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },

  // Detection details
  detection: {
    method: String,  // automated, manual, ml
    confidence: Number,
    first_detected: Date,
    last_seen: Date,
    occurrence_count: Number
  },

  // Location data
  locations: [{
    lat: Number,
    lng: Number,
    city: String,
    state: String,
    count: Number
  }],

  // Device patterns
  device_patterns: [{
    device_id_pattern: String,
    count: Number
  }],

  // Serial patterns
  serial_patterns: [{
    pattern: String,  // regex or prefix
    affected_serials: Number,
    fraud_percentage: Number
  }],

  // Status
  status: {
    type: String,
    enum: ['active', 'monitoring', 'blocked', 'resolved'],
    default: 'active'
  },

  // Recommendations
  mitigation_steps: [String],
  blocked_count: Number,

  created_at: { type: Date, default: Date.now }
}));

// Recall Campaign
const RecallCampaign = mongoose.model('RecallCampaign', new mongoose.Schema({
  campaign_id: { type: String, required: true, unique: true },
  brand_id: String,
  product_id: String,

  // Recall details
  title: String,
  description: String,
  severity: { type: String, enum: ['informational', 'advisory', 'urgent', 'critical'] },
  reason: String,

  // Scope
  affected_serials: [String],  // specific serials or
  affected_batch_start: String,
  affected_batch_end: String,
  affected_date_range: {
    from: Date,
    to: Date
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },

  // Impact
  impact: {
    products_affected: Number,
    users_notified: Number,
    responses_received: Number,
    replacements_issued: Number,
    refunds_issued: Number
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));

// ============================================
// OEM DASHBOARD APIs
// ============================================

/**
 * GET /api/oem/:brand_id/dashboard
 * Main OEM dashboard with key metrics
 */
router.get('/:brand_id/dashboard', async (req: Request, res: Response) => {
  const { brand_id } = req.params;
  const { period = '30days' } = req.query;

  // Verify brand exists
  const brand = await OEMBrand.findOne({ brand_id });
  if (!brand) {
    return res.status(404).json({ error: 'Brand not found' });
  }

  // Calculate date range
  let fromDate = new Date();
  if (period === '7days') fromDate.setDate(fromDate.getDate() - 7);
  else if (period === '30days') fromDate.setDate(fromDate.getDate() - 30);
  else if (period === '90days') fromDate.setDate(fromDate.getDate() - 90);
  else fromDate.setDate(fromDate.getDate() - 30);

  // Get Serial Registry data
  const SerialRegistry = mongoose.model('SerialRegistry');
  const Warranty = mongoose.model('Warranty');
  const Claim = mongoose.model('Claim');
  const ScanLog = mongoose.model('ScanLog');

  // Get base counts
  const [totalSerials, activeSerials, totalActivations, pendingClaims, fraudAttempts] = await Promise.all([
    SerialRegistry.countDocuments({ merchant_id: brand_id }),
    SerialRegistry.countDocuments({ merchant_id: brand_id, ownership_status: 'owned' }),
    Warranty.countDocuments({ merchant_id: brand_id, warranty_status: 'active' }),
    Claim.countDocuments({ merchant_id: brand_id, status: { $nin: ['closed', 'rejected'] } }),
    mongoose.model('VerifyQueue').countDocuments({ status: 'pending' })
  ]);

  // Activation rate
  const activationRate = totalSerials > 0 ? (totalActivations / totalSerials * 100).toFixed(1) : 0;

  // Claims metrics
  const [totalClaims, resolvedClaims] = await Promise.all([
    Claim.countDocuments({ merchant_id: brand_id }),
    Claim.countDocuments({ merchant_id: brand_id, status: 'closed' })
  ]);

  // Daily trend
  const dailyTrend = await ScanLog.aggregate([
    {
      $match: {
        created_at: { $gte: fromDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
        verifications: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Top products
  const topProducts = await SerialRegistry.aggregate([
    { $match: { merchant_id: brand_id } },
    { $group: { _id: '$model', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  // Activation funnel
  const activationFunnel = {
    serials_generated: totalSerials,
    serials_verified: await ScanLog.distinct('serial_number', { created_at: { $gte: fromDate } }).then(s => s.length),
    serials_activated: totalActivations,
    activation_rate: parseFloat(activationRate as string)
  };

  // Alert status
  const alertThresholds = brand.dashboard_config?.alert_thresholds || {};
  const alerts = [];

  if (fraudAttempts > 0) {
    const fraudRate = (fraudAttempts / totalSerials * 100);
    if (fraudRate > alertThresholds.fraud_rate) {
      alerts.push({
        type: 'fraud',
        severity: 'high',
        message: `Fraud rate (${fraudRate.toFixed(1)}%) exceeds threshold (${alertThresholds.fraud_rate}%)`,
        count: fraudAttempts
      });
    }
  }

  if (parseFloat(activationRate as string) < alertThresholds.activation_rate_min) {
    alerts.push({
      type: 'activation',
      severity: 'medium',
      message: `Activation rate (${activationRate}%) below target (${alertThresholds.activation_rate_min}%)`
    });
  }

  res.json({
    brand: {
      id: brand_id,
      name: brand.brand_name,
      plan: brand.plan
    },
    period,
    summary: {
      total_serials: totalSerials,
      active_products: activeSerials,
      total_activations: totalActivations,
      activation_rate: parseFloat(activationRate as string),
      pending_claims: pendingClaims,
      total_claims: totalClaims,
      claim_resolution_rate: totalClaims > 0 ? (resolvedClaims / totalClaims * 100).toFixed(1) : 0,
      fraud_attempts: fraudAttempts
    },
    activation_funnel: activationFunnel,
    daily_trend: dailyTrend,
    top_products: topProducts,
    alerts: alerts.length > 0 ? alerts : null
  });
});

/**
 * GET /api/oem/:brand_id/counterfeit-analytics
 * Counterfeit detection and analysis
 */
router.get('/:brand_id/counterfeit-analytics', async (req: Request, res: Response) => {
  const { brand_id } = req.params;
  const { period = '90days' } = req.query;

  let fromDate = new Date();
  if (period === '30days') fromDate.setDate(fromDate.getDate() - 30);
  else if (period === '90days') fromDate.setDate(fromDate.getDate() - 90);
  else fromDate.setDate(fromDate.getDate() - 180);

  // Get counterfeit reports
  const reports = await CounterfeitReport.find({
    brand_id,
    created_at: { $gte: fromDate }
  }).sort({ created_at: -1 });

  // Aggregate by type
  const byType = await CounterfeitReport.aggregate([
    { $match: { brand_id, created_at: { $gte: fromDate } } },
    { $group: { _id: '$counterfeit_type', count: { $sum: 1 }, avg_confidence: { $avg: '$confidence_score' } } }
  ]);

  // Aggregate by location (country)
  const byCountry = await CounterfeitReport.aggregate([
    { $match: { brand_id, created_at: { $gte: fromDate } } },
    { $group: { _id: '$location.country', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Aggregate by source
  const bySource = await CounterfeitReport.aggregate([
    { $match: { brand_id, created_at: { $gte: fromDate } } },
    { $group: { _id: '$location.source', count: { $sum: 1 } } }
  ]);

  // Monthly trend
  const monthlyTrend = await CounterfeitReport.aggregate([
    { $match: { brand_id, created_at: { $gte: fromDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // High confidence reports (likely counterfeit)
  const highConfidence = reports.filter(r => r.confidence_score >= 80);

  // Risk score for brand
  const totalReports = reports.length;
  const avgConfidence = reports.length > 0
    ? reports.reduce((sum, r) => sum + r.confidence_score, 0) / reports.length
    : 0;
  const riskScore = Math.min(Math.round((totalReports * 2) + (avgConfidence * 0.5)), 100);

  res.json({
    period,
    summary: {
      total_reports: totalReports,
      high_confidence: highConfidence.length,
      average_confidence: avgConfidence.toFixed(1),
      risk_score: riskScore,
      risk_level: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high'
    },
    by_type: byType.map(t => ({
      type: t._id,
      count: t.count,
      avg_confidence: t.avg_confidence?.toFixed(1) || 0
    })),
    by_country: byCountry.map(c => ({ country: c._id || 'Unknown', count: c.count })),
    by_source: bySource.map(s => ({ source: s._id || 'Unknown', count: s.count })),
    monthly_trend: monthlyTrend.map(t => ({ month: t._id, count: t.count })),
    recent_reports: reports.slice(0, 10).map(r => ({
      id: r.report_id,
      type: r.counterfeit_type,
      location: r.location,
      confidence: r.confidence_score,
      status: r.status,
      created: r.created_at
    }))
  });
});

/**
 * GET /api/oem/:brand_id/regional-analytics
 * Regional breakdown with heatmap data
 */
router.get('/:brand_id/regional-analytics', async (req: Request, res: Response) => {
  const { brand_id } = req.params;
  const { level = 'city' } = req.query;

  // Get scan data aggregated by location
  const ScanLog = mongoose.model('ScanLog');

  let groupBy;
  if (level === 'country') {
    groupBy = { country: { $ifNull: ['$location.country', 'Unknown'] } };
  } else if (level === 'state') {
    groupBy = {
      country: { $ifNull: ['$location.country', 'Unknown'] },
      state: { $ifNull: ['$location.state', 'Unknown'] }
    };
  } else {
    groupBy = {
      country: { $ifNull: ['$location.country', 'Unknown'] },
      state: { $ifNull: ['$location.state', 'Unknown'] },
      city: { $ifNull: ['$location.city', 'Unknown'] }
    };
  }

  const regionalData = await ScanLog.aggregate([
    { $match: { location: { $exists: true } } },
    {
      $group: {
        _id: groupBy,
        verifications: { $sum: 1 },
        unique_serials: { $addToSet: '$serial_number' },
        avg_lat: { $avg: '$location.lat' },
        avg_lng: { $avg: '$location.lng' }
      }
    },
    {
      $project: {
        location: '$_id',
        verifications: 1,
        unique_products: { $size: '$unique_serials' },
        heat_value: { $size: '$unique_serials' },
        center: { lat: '$avg_lat', lng: '$avg_lng' }
      }
    },
    { $sort: { verifications: -1 } },
    { $limit: 100 }
  ]);

  // Format for heatmap
  const heatmapData = regionalData.map(r => ({
    lat: r.center.lat || 0,
    lng: r.center.lng || 0,
    intensity: r.verifications,
    value: r.heat_value,
    location: r.location
  }));

  // Top cities by activation
  const topCities = regionalData.slice(0, 10).map(r => ({
    name: r.location.city || r.location.state || r.location.country,
    verifications: r.verifications,
    unique_products: r.unique_products
  }));

  // Activation rate by region
  const SerialRegistry = mongoose.model('SerialRegistry');
  const Warranty = mongoose.model('Warranty');

  const activationByCity = await Promise.all(
    regionalData.slice(0, 20).map(async (r) => {
      const city = r.location.city;
      const state = r.location.state;

      // Get serials and activations for this region (approximate via scan data)
      const serialsInCity = await ScanLog.distinct('serial_number', {
        'location.city': city,
        'location.state': state
      });

      const activationsInCity = await Warranty.countDocuments({
        serial_number: { $in: serialsInCity },
        warranty_status: 'active'
      });

      return {
        city,
        state,
        serials: serialsInCity.length,
        activations: activationsInCity,
        activation_rate: serialsInCity.length > 0
          ? (activationsInCity / serialsInCity.length * 100).toFixed(1)
          : 0
      };
    })
  );

  res.json({
    heatmap: {
      points: heatmapData,
      max_intensity: Math.max(...heatmapData.map(h => h.intensity), 1)
    },
    top_cities: topCities,
    activation_by_region: activationByCity,
    total_regions: regionalData.length
  });
});

/**
 * GET /api/oem/:brand_id/fraud-maps
 * Fraud pattern detection and mapping
 */
router.get('/:brand_id/fraud-maps', async (req: Request, res: Response) => {
  const { brand_id } = req.params;

  // Get active fraud patterns
  const patterns = await FraudPattern.find({ brand_id, status: 'active' });

  // Aggregate fraud locations
  const fraudLocations = patterns.flatMap(p =>
    p.locations.map(l => ({
      lat: l.lat,
      lng: l.lng,
      city: l.city,
      state: l.state,
      severity: p.severity,
      type: p.type,
      count: l.count
    }))
  );

  // Group by severity
  const bySeverity = {
    critical: patterns.filter(p => p.severity === 'critical').length,
    high: patterns.filter(p => p.severity === 'high').length,
    medium: patterns.filter(p => p.severity === 'medium').length,
    low: patterns.filter(p => p.severity === 'low').length
  };

  // Group by type
  const byType = patterns.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {});

  // Serial patterns
  const serialPatterns = patterns
    .filter(p => p.serial_patterns && p.serial_patterns.length > 0)
    .flatMap(p => p.serial_patterns.map(sp => ({
      pattern: sp.pattern,
      type: p.type,
      affected: sp.affected_serials,
      fraud_rate: sp.fraud_percentage
    })));

  // Recent fraud attempts
  const VerifyQueue = mongoose.model('VerifyQueue');
  const recentFraud = await VerifyQueue.find({ status: 'pending' })
    .sort({ _id: -1 })
    .limit(20);

  // Fraud trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ScanLog = mongoose.model('ScanLog');
  const fraudTrend = await ScanLog.aggregate([
    {
      $match: {
        created_at: { $gte: thirtyDaysAgo },
        result: 'suspicious'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Risk score
  const totalPatterns = patterns.length;
  const criticalPatterns = patterns.filter(p => p.severity === 'critical').length;
  const recentFraudCount = recentFraud.length;
  const riskScore = Math.min(
    (criticalPatterns * 20) + (totalPatterns * 2) + (recentFraudCount * 5),
    100
  );

  res.json({
    summary: {
      active_patterns: totalPatterns,
      critical_patterns: criticalPatterns,
      blocked_attempts: patterns.reduce((sum, p) => sum + (p.blocked_count || 0), 0),
      risk_score: riskScore,
      risk_level: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high'
    },
    fraud_map: {
      points: fraudLocations,
      max_count: Math.max(...fraudLocations.map(f => f.count), 1)
    },
    by_severity: bySeverity,
    by_type: byType,
    serial_patterns: serialPatterns.slice(0, 20),
    recent_attempts: recentFraud.map(f => ({
      serial: f.serial_number,
      reasons: f.reason,
      time: f._id.getTimestamp()
    })),
    trend: fraudTrend.map(t => ({ date: t._id, count: t.count }))
  });
});

/**
 * GET /api/oem/:brand_id/predictive-analytics
 * Predictive analytics and forecasting
 */
router.get('/:brand_id/predictive-analytics', async (req: Request, res: Response) => {
  const { brand_id } = req.params;

  // Get historical data for predictions
  const SerialRegistry = mongoose.model('SerialRegistry');
  const Warranty = mongoose.model('Warranty');
  const Claim = mongoose.model('Claim');
  const ScanLog = mongoose.model('ScanLog');

  // Get 90 days of data
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Historical activation rates
  const [recentScans, olderScans] = await Promise.all([
    ScanLog.countDocuments({ created_at: { $gte: thirtyDaysAgo } }),
    ScanLog.countDocuments({ created_at: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
  ]);

  // Activation trend
  const activationTrend = await ScanLog.aggregate([
    { $match: { created_at: { $gte: ninetyDaysAgo } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
        },
        verifications: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Claims trend
  const claimsTrend = await Claim.aggregate([
    { $match: { created_at: { $gte: ninetyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
        claims: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Predictions (simple linear extrapolation)
  const avgDailyVerifications = activationTrend.length > 0
    ? activationTrend.reduce((sum, t) => sum + t.verifications, 0) / activationTrend.length
    : 0;

  const avgDailyClaims = claimsTrend.length > 0
    ? claimsTrend.reduce((sum, t) => sum + t.claims, 0) / claimsTrend.length
    : 0;

  // Project 30 days ahead
  const next30Days = [];
  for (let i = 1; i <= 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    // Simple growth rate (2% per week)
    const growthFactor = 1 + (i * 0.003);
    const projectedVerifications = Math.round(avgDailyVerifications * growthFactor);
    const projectedClaims = Math.round(avgDailyClaims * growthFactor * 0.1);

    next30Days.push({
      date: date.toISOString().split('T')[0],
      projected_verifications: projectedVerifications,
      projected_claims: projectedClaims
    });
  }

  // Peak prediction times
  const peakHours = await ScanLog.aggregate([
    { $match: { created_at: { $gte: ninetyDaysAgo } } },
    {
      $group: {
        _id: { $hour: '$created_at' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  // Failure prediction (based on claims)
  const warrantyProducts = await Warranty.find({
    merchant_id: brand_id,
    warranty_status: 'active'
  });

  const expiringIn30Days = warrantyProducts.filter(w =>
    w.warranty_expiry_date &&
    new Date(w.warranty_expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  const expiringIn90Days = warrantyProducts.filter(w =>
    w.warranty_expiry_date &&
    new Date(w.warranty_expiry_date) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  );

  // Upsell opportunities
  const upsellOpportunities = expiringIn30Days.length;

  res.json({
    predictions: {
      next_30_days: next30Days,
      summary: {
        projected_verifications: next30Days.reduce((sum, d) => sum + d.projected_verifications, 0),
        projected_claims: next30Days.reduce((sum, d) => sum + d.projected_claims, 0),
        avg_daily_verifications: Math.round(avgDailyVerifications),
        avg_daily_claims: Math.round(avgDailyClaims)
      }
    },
    trends: {
      verifications: activationTrend,
      claims: claimsTrend
    },
    peak_times: peakHours.map(p => ({ hour: p._id, count: p.count })),
    warranty_outlook: {
      expiring_30_days: expiringIn30Days.length,
      expiring_90_days: expiringIn90Days.length,
      upsell_opportunities: upsellOpportunities
    },
    recommendations: [
      expiringIn30Days.length > 0
        ? `Contact ${expiringIn30Days.length} customers with expiring warranties for renewal`
        : 'No urgent warranty expirations',
      avgDailyClaims > 10
        ? 'High claim rate detected - consider quality review'
        : 'Claim rate is normal',
      upsellOpportunities > 100
        ? `${upsellOpportunities} upsell opportunities available`
        : 'Monitor warranty expirations for upsell'
    ]
  });
});

/**
 * GET /api/oem/:brand_id/activation-rates
 * Detailed activation analytics
 */
router.get('/:brand_id/activation-rates', async (req: Request, res: Response) => {
  const { brand_id } = req.params;
  const { by = 'product' } = req.query;

  const SerialRegistry = mongoose.model('SerialRegistry');
  const Warranty = mongoose.model('Warranty');

  if (by === 'product') {
    // By product model
    const byProduct = await SerialRegistry.aggregate([
      { $match: { merchant_id: brand_id } },
      { $group: { _id: '$model', total: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    const productActivations = await Promise.all(
      byProduct.map(async (p) => {
        const activated = await Warranty.countDocuments({
          merchant_id: brand_id,
          warranty_status: 'active'
        });

        // Get activations for this model
        const serials = await SerialRegistry.distinct('_id', { merchant_id: brand_id, model: p._id });
        const modelActivations = await Warranty.countDocuments({
          merchant_id: brand_id,
          warranty_status: 'active',
          serial_number: { $in: serials }
        });

        return {
          model: p._id,
          total_serials: p.total,
          activations: modelActivations,
          activation_rate: p.total > 0 ? (modelActivations / p.total * 100).toFixed(1) : 0
        };
      })
    );

    res.json({
      by: 'product',
      products: productActivations
    });

  } else if (by === 'time') {
    // By time period (daily/weekly/monthly)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRates = await Warranty.aggregate([
      { $match: { merchant_id: brand_id, activated_at: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$activated_at' } },
          activations: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      by: 'time',
      daily: dailyRates
    });

  } else {
    // Overall
    const totalSerials = await SerialRegistry.countDocuments({ merchant_id: brand_id });
    const totalActivations = await Warranty.countDocuments({
      merchant_id: brand_id,
      warranty_status: 'active'
    });

    res.json({
      by: 'overall',
      total_serials: totalSerials,
      total_activations: totalActivations,
      activation_rate: totalSerials > 0
        ? (totalActivations / totalSerials * 100).toFixed(2)
        : 0
    });
  }
});

/**
 * POST /api/oem/:brand_id/recall
 * Create a product recall campaign
 */
router.post('/:brand_id/recall', async (req: Request, res: Response) => {
  const { brand_id } = req.params;
  const {
    product_id,
    title,
    description,
    severity,
    reason,
    affected_serials,
    affected_date_range
  } = req.body;

  const campaign_id = `RECALL-${Date.now()}`;

  const campaign = new RecallCampaign({
    campaign_id,
    brand_id,
    product_id,
    title,
    description,
    severity,
    reason,
    affected_serials: affected_serials || [],
    affected_date_range,
    status: 'active',
    impact: {
      products_affected: affected_serials?.length || 0,
      users_notified: 0,
      responses_received: 0,
      replacements_issued: 0,
      refunds_issued: 0
    }
  });

  await campaign.save();

  // Update affected serials status
  if (affected_serials && affected_serials.length > 0) {
    const SerialRegistry = mongoose.model('SerialRegistry');
    await SerialRegistry.updateMany(
      { serial_number: { $in: affected_serials } },
      { $set: { status: 'recalled' } }
    );
  }

  // Notify affected users (via WhatsApp)
  if (affected_serials && affected_serials.length > 0) {
    const Warranty = mongoose.model('Warranty');
    const affectedWarranties = await Warranty.find({
      serial_number: { $in: affected_serials },
      warranty_status: 'active'
    });

    for (const warranty of affectedWarranties) {
      try {
        await axios.post(`${process.env.AGENT_API || 'https://REZ-agent.onrender.com'}/api/agent/whatsapp/send`, {
          phone: warranty.customer_phone,
          template: 'product_recall',
          params: {
            product: title,
            reason,
            severity,
            campaign_id,
            action_url: `https://rez.app/recall/${campaign_id}`
          },
          user_id: warranty.user_id
        });
      } catch (e) {
    logger.warn('OEM dashboard service call failed', { error: e instanceof Error ? e.message : String(e) });
  }
    }

    campaign.impact.users_notified = affectedWarranties.length;
    await campaign.save();
  }

  res.json({
    success: true,
    campaign_id,
    affected_products: affected_serials?.length || 0,
    users_to_notify: campaign.impact.users_notified
  });
});

/**
 * GET /api/oem/:brand_id/recalls
 * List recall campaigns
 */
router.get('/:brand_id/recalls', async (req: Request, res: Response) => {
  const { brand_id } = req.params;
  const { status } = req.query;

  const query: unknown = { brand_id };
  if (status) query.status = status;

  const campaigns = await RecallCampaign.find(query).sort({ created_at: -1 });

  res.json({
    count: campaigns.length,
    campaigns
  });
});

/**
 * POST /api/oem/:brand_id/counterfeit-report
 * Submit a counterfeit report
 */
router.post('/:brand_id/counterfeit-report', async (req: Request, res: Response) => {
  const { brand_id } = req.params;
  const {
    serial_number,
    product_name,
    location,
    counterfeit_type,
    evidence
  } = req.body;

  const report_id = `CF-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;

  const report = new CounterfeitReport({
    report_id,
    brand_id,
    serial_number,
    product_name,
    location,
    counterfeit_type,
    confidence_score: 50,  // Default - to be verified
    evidence,
    status: 'reported'
  });

  await report.save();

  // Alert brand (optional: email, Slack, etc.)
  const brand = await OEMBrand.findOne({ brand_id });
  if (brand?.contact_email) {
    // Send notification
    logger.info(`Counterfeit report ${report_id} submitted for brand ${brand.brand_name}`);
  }

  res.json({
    success: true,
    report_id,
    message: 'Report submitted for review'
  });
});

export default router;
