/**
 * CorpPerks Restaurant Controller
 * HTTP handlers for restaurant-specific endpoints
 */

const express = require('express');
const router = express.Router();
const mealBenefitService = require('./mealBenefitService');
const corporateOrderService = require('./corporateOrderService');
const restaurantModel = require('./restaurantModel');

// Auth middleware
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

// Corp admin auth (HR, Finance, Admin)
const requireCorpAdmin = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  // In production, verify user has corp_admin, corp_hr, or corp_finance role
  next();
};

// ============ PARTNER ENDPOINTS ============

/**
 * POST /api/corp/restaurants/partner-request
 * Register restaurant as corporate partner
 */
router.post('/partner-request', requireAuth, async (req, res) => {
  try {
    const {
      restaurantId,
      restaurantName,
      contactEmail,
      contactPhone,
      locations,
      acceptedBenefitTypes,
      gstIn,
    } = req.body;

    // Validate required fields
    if (!restaurantId || !restaurantName || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: restaurantId, restaurantName, contactEmail',
      });
    }

    const result = await restaurantModel.registerPartner({
      restaurantId,
      restaurantName,
      contactEmail,
      contactPhone,
      locations,
      acceptedBenefitTypes: acceptedBenefitTypes || ['meal_allowance'],
      gstIn,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Partner registration submitted for review',
    });
  } catch (error) {
    console.error('Partner request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/corp/restaurants/partner-requests
 * List all partner requests (admin)
 */
router.get('/partner-requests', requireCorpAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const requests = await restaurantModel.listPartnerRequests({
      status,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('List partner requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/corp/restaurants/partner-requests/:requestId/approve
 * Approve partner request
 */
router.put('/partner-requests/:requestId/approve', requireCorpAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { approvedBy, commissionTier = 'standard' } = req.body;

    const result = await restaurantModel.approvePartner(requestId, approvedBy, commissionTier);

    res.json({
      success: true,
      data: result,
      message: 'Partner approved successfully',
    });
  } catch (error) {
    console.error('Approve partner error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/corp/restaurants/:restaurantId
 * Get restaurant details with corporate config
 */
router.get('/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await restaurantModel.getRestaurant(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    res.json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/corp/restaurants/:restaurantId/benefits
 * Get accepted benefit types at restaurant
 */
router.get('/:restaurantId/benefits', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const benefits = await mealBenefitService.getRestaurantBenefits(restaurantId);

    res.json({ success: true, data: benefits });
  } catch (error) {
    console.error('Get restaurant benefits error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/corp/restaurants/:restaurantId/config
 * Update restaurant corporate config
 */
router.put('/:restaurantId/config', requireCorpAdmin, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const config = req.body;

    const result = await restaurantModel.updateConfig(restaurantId, config);

    res.json({
      success: true,
      data: result,
      message: 'Configuration updated',
    });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ MEAL BENEFIT ENDPOINTS ============

/**
 * POST /api/corp/benefits/meal/validate
 * Validate meal benefit eligibility
 */
router.post('/benefits/meal/validate', requireAuth, async (req, res) => {
  try {
    const { employeeId, restaurantId, orderAmount } = req.body;

    if (!employeeId || !restaurantId || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: employeeId, restaurantId, orderAmount',
      });
    }

    const validation = await mealBenefitService.validateMealBenefit({
      employeeId,
      restaurantId,
      orderAmount,
    });

    res.json({ success: true, data: validation });
  } catch (error) {
    console.error('Validate meal benefit error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/corp/benefits/meal/redeem
 * Redeem meal benefit
 */
router.post('/benefits/meal/redeem', requireAuth, async (req, res) => {
  try {
    const {
      employeeId,
      restaurantId,
      orderId,
      amount,
      orderDetails,
    } = req.body;

    if (!employeeId || !restaurantId || !orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: employeeId, restaurantId, orderId, amount',
      });
    }

    const redemption = await mealBenefitService.redeemMealBenefit({
      employeeId,
      restaurantId,
      orderId,
      amount,
      orderDetails,
    });

    res.json({ success: true, data: redemption });
  } catch (error) {
    console.error('Redeem meal benefit error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
});

/**
 * GET /api/corp/benefits/meal/balance/:employeeId
 * Get employee's meal benefit balance
 */
router.get('/benefits/meal/balance/:employeeId', requireAuth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const balance = await mealBenefitService.getMealBenefitBalance(employeeId);

    res.json({ success: true, data: balance });
  } catch (error) {
    console.error('Get meal benefit balance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ CORPORATE ORDER ENDPOINTS ============

/**
 * POST /api/corp/dining/orders
 * Create corporate dining order
 */
router.post('/dining/orders', requireAuth, async (req, res) => {
  try {
    const {
      restaurantId,
      type,
      guestCount,
      scheduledDateTime,
      dietaryRequirements,
      costCenter,
      gstIn,
      invoiceRequired,
      items,
    } = req.body;

    if (!restaurantId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: restaurantId, type',
      });
    }

    const order = await corporateOrderService.createCorporateOrder({
      restaurantId,
      userId: req.user?.id || req.body.userId,
      companyId: req.user?.companyId || req.body.companyId,
      type,
      guestCount,
      scheduledDateTime,
      dietaryRequirements,
      costCenter,
      gstIn,
      invoiceRequired,
      items,
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Create corporate order error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
});

/**
 * GET /api/corp/dining/orders
 * List corporate dining orders
 */
router.get('/dining/orders', requireAuth, async (req, res) => {
  try {
    const { status, startDate, endDate, costCenter, page = 1, limit = 20 } = req.query;
    const companyId = req.user?.companyId || req.query.companyId;

    const orders = await corporateOrderService.listCorporateOrders({
      companyId,
      status,
      startDate,
      endDate,
      costCenter,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('List corporate orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/corp/dining/orders/:orderId
 * Get corporate order details
 */
router.get('/dining/orders/:orderId', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await corporateOrderService.getCorporateOrder(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Get corporate order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/corp/dining/orders/:orderId/approve
 * Approve corporate order
 */
router.post('/dining/orders/:orderId/approve', requireCorpAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { approvedBy, notes } = req.body;

    const order = await corporateOrderService.approveCorporateOrder(orderId, approvedBy, notes);

    res.json({
      success: true,
      data: order,
      message: 'Order approved',
    });
  } catch (error) {
    console.error('Approve corporate order error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
});

/**
 * POST /api/corp/dining/orders/:orderId/cancel
 * Cancel corporate order
 */
router.post('/dining/orders/:orderId/cancel', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await corporateOrderService.cancelCorporateOrder(orderId, reason);

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled',
    });
  } catch (error) {
    console.error('Cancel corporate order error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
});

// ============ TEAM DINING ENDPOINTS ============

/**
 * POST /api/corp/dining/team-lunch
 * Book team lunch
 */
router.post('/dining/team-lunch', requireAuth, async (req, res) => {
  try {
    const {
      restaurantId,
      guestCount,
      scheduledDateTime,
      dietaryRequirements,
      budgetPerPerson,
      costCenter,
      gstIn,
      purpose,
    } = req.body;

    const order = await corporateOrderService.createTeamLunchOrder({
      restaurantId,
      userId: req.user?.id || req.body.userId,
      companyId: req.user?.companyId || req.body.companyId,
      guestCount,
      scheduledDateTime,
      dietaryRequirements,
      budgetPerPerson,
      costCenter,
      gstIn,
      purpose,
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Create team lunch error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
});

/**
 * GET /api/corp/dining/team-lunch/availability
 * Check team lunch availability
 */
router.get('/dining/team-lunch/availability', async (req, res) => {
  try {
    const { restaurantId, date, guestCount } = req.query;

    const availability = await corporateOrderService.checkTeamLunchAvailability({
      restaurantId,
      date,
      guestCount,
    });

    res.json({ success: true, data: availability });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ CATERING ENDPOINTS ============

/**
 * POST /api/corp/catering/quote
 * Request catering quote
 */
router.post('/catering/quote', requireAuth, async (req, res) => {
  try {
    const {
      restaurantId,
      eventType,
      guestCount,
      eventDate,
      location,
      dietaryRequirements,
    } = req.body;

    const quote = await corporateOrderService.requestCateringQuote({
      restaurantId,
      eventType,
      guestCount,
      eventDate,
      location,
      dietaryRequirements,
    });

    res.json({ success: true, data: quote });
  } catch (error) {
    console.error('Request catering quote error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/corp/catering/book
 * Book catering
 */
router.post('/catering/book', requireAuth, async (req, res) => {
  try {
    const {
      restaurantId,
      quoteId,
      eventType,
      guestCount,
      eventDate,
      location,
      dietaryRequirements,
      costCenter,
      gstIn,
      specialInstructions,
    } = req.body;

    const booking = await corporateOrderService.bookCatering({
      restaurantId,
      quoteId,
      eventType,
      guestCount,
      eventDate,
      location,
      dietaryRequirements,
      costCenter,
      gstIn,
      specialInstructions,
      userId: req.user?.id || req.body.userId,
      companyId: req.user?.companyId || req.body.companyId,
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error('Book catering error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
});

module.exports = router;
