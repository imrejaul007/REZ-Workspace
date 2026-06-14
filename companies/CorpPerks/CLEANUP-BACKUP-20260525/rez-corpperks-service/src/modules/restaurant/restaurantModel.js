/**
 * CorpPerks Restaurant Model
 * Corporate-restaurant link schema and operations
 */

const mongoose = require('mongoose');

// MongoDB Collections (replacing in-memory stores)
const PartnerRequest = mongoose.model('PartnerRequest', new mongoose.Schema({
  requestId: { type: String, unique: true, index: true },
  restaurantId: String,
  restaurantName: String,
  contactEmail: String,
  contactPhone: String,
  locations: [{
    address: String,
    lat: Number,
    lng: Number,
    maxCapacity: Number,
  }],
  acceptedBenefitTypes: [String],
  gstIn: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending',
  },
  commissionTier: {
    type: String,
    enum: ['standard', 'premium'],
  },
  approvedBy: String,
  approvedAt: Date,
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true }), 'partner_requests');

// Reference schema for MerchantCorporateConfig (used inline)
const merchantCorporateConfigSchema = new mongoose.Schema({
  configId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, unique: true, index: true },
  merchantName: String,

  // Partnership status
  isCorporatePartner: { type: Boolean, default: false },
  partnerSince: Date,
  contractDetails: {
    contractStart: Date,
    contractEnd: Date,
    commissionTier: { type: String, enum: ['standard', 'premium'], default: 'standard' },
    paymentTerms: { type: Number, default: 30 },
  },

  // Corporate settings
  corporateSettings: {
    acceptsMealBenefits: { type: Boolean, default: false },
    mealBenefitTypes: [{
      type: String,
      enum: ['meal_allowance', 'dining_credit', 'team_dining'],
    }],
    discountPercent: { type: Number, default: 0, min: 0, max: 30 },
    gstInclusive: { type: Boolean, default: true },
    minOrderValue: { type: Number, default: 0 },
    maxOrderValue: { type: Number, default: 5000 },
    maxBenefitPerTransaction: { type: Number, default: 2000 },
    preparationTimeMinutes: { type: Number, default: 30 },
    deliveryAvailable: { type: Boolean, default: false },
    cateringAvailable: { type: Boolean, default: false },
  },

  // Restaurant categories
  corporateCategories: [String],

  // Locations
  corporateLocations: [{
    locationId: String,
    address: String,
    lat: Number,
    lng: Number,
    maxCapacity: Number,
    isActive: { type: Boolean, default: true },
  }],

  // Ratings
  corporateRating: {
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    corporateSpecificRating: { type: Number, default: 0 },
  },

  // Stats
  stats: {
    totalCorporateOrders: { type: Number, default: 0 },
    monthlyCorporateOrders: { type: Number, default: 0 },
    totalRevenueFromCorporate: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
  },

  // Contact
  contact: {
    email: String,
    phone: String,
    name: String,
  },

  // GST
  gstIn: String,

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
}, { timestamps: true });

const MerchantCorporateConfig = mongoose.model('MerchantCorporateConfig', merchantCorporateConfigSchema, 'merchant_corporate_configs');

// ============ MONGODB OPERATIONS ============

/**
 * Register a new partner request
 */
async function registerPartner(data) {
  const requestId = `PR${Date.now()}${Math.random().toString(36).substr(2, 6)}`.toUpperCase();

  const request = new PartnerRequest({
    requestId,
    restaurantId: data.restaurantId,
    restaurantName: data.restaurantName,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    locations: data.locations || [],
    acceptedBenefitTypes: data.acceptedBenefitTypes || ['meal_allowance'],
    gstIn: data.gstIn,
    status: 'pending',
  });

  await request.save();

  // Auto-create corporate config (draft state)
  const configId = `CFG${Date.now()}${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
  const config = new MerchantCorporateConfig({
    configId,
    merchantId: data.restaurantId,
    merchantName: data.restaurantName,
    isCorporatePartner: false,
    corporateSettings: {
      acceptsMealBenefits: true,
      mealBenefitTypes: data.acceptedBenefitTypes || ['meal_allowance'],
    },
    contact: {
      email: data.contactEmail,
      phone: data.contactPhone,
    },
    gstIn: data.gstIn,
    corporateLocations: (data.locations || []).map((loc, idx) => ({
      locationId: `LOC${idx + 1}`,
      ...loc,
      isActive: true,
    })),
  });

  await config.save();

  return {
    requestId,
    configId,
    status: 'pending',
    message: 'Registration submitted. Our team will review within 2 business days.',
  };
}

/**
 * List partner requests
 */
async function listPartnerRequests({ status, page = 1, limit = 20 }) {
  const query = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    PartnerRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    PartnerRequest.countDocuments(query),
  ]);

  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get partner request by ID
 */
async function getPartnerRequest(requestId) {
  return PartnerRequest.findOne({ requestId });
}

/**
 * Approve partner request
 */
async function approvePartner(requestId, approvedBy, commissionTier = 'standard') {
  const request = await PartnerRequest.findOne({ requestId });

  if (!request) {
    throw new Error('Partner request not found');
  }

  if (request.status !== 'pending') {
    throw new Error(`Cannot approve request with status: ${request.status}`);
  }

  request.status = 'approved';
  request.approvedBy = approvedBy;
  request.approvedAt = new Date();
  request.commissionTier = commissionTier;

  await request.save();

  // Update corporate config to active
  const config = await MerchantCorporateConfig.findOne({ merchantId: request.restaurantId });
  if (config) {
    config.isCorporatePartner = true;
    config.partnerSince = new Date();
    config.contractDetails = {
      contractStart: new Date(),
      contractEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      commissionTier,
      paymentTerms: 30,
    };
    await config.save();
  }

  return {
    request,
    config,
    message: 'Partner approved and activated',
  };
}

/**
 * Reject partner request
 */
async function rejectPartner(requestId, rejectedBy, reason) {
  const request = await PartnerRequest.findOne({ requestId });

  if (!request) {
    throw new Error('Partner request not found');
  }

  request.status = 'rejected';
  request.rejectionReason = reason;
  request.approvedBy = rejectedBy;

  await request.save();

  return request;
}

/**
 * Get restaurant corporate config
 */
async function getRestaurant(restaurantId) {
  const config = await MerchantCorporateConfig.findOne({ merchantId: restaurantId });

  if (!config) {
    // Return mock data for demo
    return {
      merchantId: restaurantId,
      merchantName: 'Restaurant ' + restaurantId,
      isCorporatePartner: true,
      corporateSettings: {
        acceptsMealBenefits: true,
        mealBenefitTypes: ['meal_allowance', 'dining_credit', 'team_dining'],
        gstInclusive: true,
        minOrderValue: 100,
        maxOrderValue: 5000,
        maxBenefitPerTransaction: 2000,
        cateringAvailable: true,
      },
      corporateCategories: ['casual_dining', 'fine_dining'],
      corporateLocations: [{
        locationId: 'LOC1',
        address: '123 Main Street, Mumbai',
        maxCapacity: 50,
        isActive: true,
      }],
      corporateRating: {
        averageRating: 4.5,
        totalReviews: 120,
        corporateSpecificRating: 4.7,
      },
    };
  }

  return config;
}

/**
 * Update restaurant corporate config
 */
async function updateConfig(restaurantId, updates) {
  const config = await MerchantCorporateConfig.findOne({ merchantId: restaurantId });

  if (!config) {
    throw new Error('Restaurant config not found');
  }

  // Merge updates
  Object.keys(updates).forEach(key => {
    if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
      config[key] = { ...config[key], ...updates[key] };
    } else {
      config[key] = updates[key];
    }
  });

  await config.save();

  return config;
}

/**
 * Get corporate config for merchant
 */
async function getCorporateConfig(merchantId) {
  return MerchantCorporateConfig.findOne({ merchantId, isCorporatePartner: true });
}

/**
 * Check if restaurant accepts meal benefits
 */
async function acceptsMealBenefits(merchantId, benefitType = 'meal_allowance') {
  const config = await getCorporateConfig(merchantId);

  if (!config) {
    return false;
  }

  if (!config.corporateSettings.acceptsMealBenefits) {
    return false;
  }

  if (!config.corporateSettings.mealBenefitTypes.includes(benefitType)) {
    return false;
  }

  return true;
}

/**
 * List all corporate partners
 */
async function listCorporatePartners({ page = 1, limit = 20, category, location }) {
  const query = { isCorporatePartner: true };

  if (category) {
    query.corporateCategories = category;
  }

  if (location) {
    query['corporateLocations.address'] = { $regex: location, $options: 'i' };
    query['corporateLocations.isActive'] = true;
  }

  const skip = (page - 1) * limit;

  const [partners, total] = await Promise.all([
    MerchantCorporateConfig.find(query).sort({ 'corporateRating.corporateSpecificRating': -1 }).skip(skip).limit(limit),
    MerchantCorporateConfig.countDocuments(query),
  ]);

  return {
    partners,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update partner stats
 */
async function updatePartnerStats(merchantId, orderValue) {
  const config = await MerchantCorporateConfig.findOne({ merchantId });

  if (!config) return;

  const total = (config.stats.totalCorporateOrders || 0) + 1;
  const currentAvg = config.stats.averageOrderValue || 0;

  config.stats.totalCorporateOrders = total;
  config.stats.monthlyCorporateOrders = (config.stats.monthlyCorporateOrders || 0) + 1;
  config.stats.totalRevenueFromCorporate = (config.stats.totalRevenueFromCorporate || 0) + orderValue;
  config.stats.averageOrderValue = ((currentAvg * (total - 1)) + orderValue) / total;

  await config.save();
}

module.exports = {
  // Models
  PartnerRequest,
  MerchantCorporateConfig,
  // Operations
  registerPartner,
  listPartnerRequests,
  getPartnerRequest,
  approvePartner,
  rejectPartner,
  getRestaurant,
  updateConfig,
  getCorporateConfig,
  acceptsMealBenefits,
  listCorporatePartners,
  updatePartnerStats,
};
