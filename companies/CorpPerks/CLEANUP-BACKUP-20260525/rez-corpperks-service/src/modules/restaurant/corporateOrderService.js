/**
 * CorpPerks Corporate Order Service
 * Handles corporate dining orders, team lunch, and catering
 */

const restaurantModel = require('./restaurantModel');
const mealBenefitService = require('./mealBenefitService');

// In-memory stores (replace with actual database in production)
const corporateOrdersStore = [];
const cateringQuotesStore = [];

// Order types
const ORDER_TYPES = {
  DINING: 'dining',
  TEAM_LUNCH: 'team_lunch',
  CATERING: 'catering',
  DELIVERY: 'delivery',
};

// Order statuses
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Booking types
const BOOKING_TYPES = {
  TEAM_LUNCH: 'team_lunch',
  CLIENT_DINNER: 'client_dinner',
  OFFICE_PARTY: 'office_party',
  BUSINESS_MEETING: 'business_meeting',
  TRAINING: 'training',
};

/**
 * Generate unique order ID
 */
function generateOrderId(prefix = 'ORD') {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const sequence = String(corporateOrdersStore.length + 1).padStart(4, '0');
  return `${prefix}${dateStr}${sequence}`;
}

/**
 * Create corporate dining order
 */
async function createCorporateOrder({
  restaurantId,
  userId,
  companyId,
  type = ORDER_TYPES.DINING,
  guestCount,
  scheduledDateTime,
  dietaryRequirements,
  costCenter,
  gstIn,
  invoiceRequired = true,
  items,
}) {
  // Validate restaurant is a corporate partner
  const isPartner = await restaurantModel.acceptsMealBenefits(restaurantId);

  if (!isPartner) {
    const error = new Error('Restaurant is not a corporate partner');
    error.code = 'CP-R001';
    throw error;
  }

  // Get restaurant config
  const config = await restaurantModel.getCorporateConfig(restaurantId);

  // Generate order ID
  const orderId = generateOrderId('ORD');

  // Calculate order amount from items (mock calculation)
  const orderAmount = items ?
    items.reduce((sum, item) => sum + (item.unitPrice || 500) * item.quantity, 0) :
    (guestCount || 1) * 500;

  // Validate against max order value
  if (orderAmount > config.corporateSettings.maxOrderValue) {
    const error = new Error(`Order exceeds maximum value of ${config.corporateSettings.maxOrderValue}`);
    error.code = 'CP-R004';
    throw error;
  }

  // Determine if approval is required
  const autoApproveLimit = parseInt(process.env.AUTO_APPROVE_LIMIT || '5000', 10);
  const requiresApproval = orderAmount > autoApproveLimit;

  // Calculate GST
  const gstBreakdown = mealBenefitService.calculateGST(orderAmount, config.corporateSettings.gstInclusive);

  // Create order
  const order = {
    orderId,
    type,
    status: requiresApproval ? ORDER_STATUS.PENDING : ORDER_STATUS.CONFIRMED,

    // Restaurant details
    restaurantId,
    restaurantName: config.merchantName || 'Restaurant',

    // User/Company
    userId,
    companyId,
    costCenter,
    gstIn,

    // Booking details
    bookingType: type,
    guestCount: guestCount || 1,
    scheduledDateTime: scheduledDateTime ? new Date(scheduledDateTime) : null,
    dietaryRequirements: dietaryRequirements || [],

    // Items
    items: items || [],

    // Pricing
    pricing: {
      subtotal: gstBreakdown.taxableAmount,
      gstRate: gstBreakdown.gstRate,
      gstAmount: gstBreakdown.gstAmount,
      cgst: gstBreakdown.cgst,
      sgst: gstBreakdown.sgst,
      totalAmount: orderAmount,
      currency: 'INR',
    },

    // GST Invoice
    invoiceRequired,
    invoice: null,

    // Approval
    requiresApproval,
    approvalStatus: requiresApproval ? 'pending' : 'auto',
    approverId: null,
    approvedAt: null,
    approvalNotes: null,

    // Payment
    paymentSource: 'meal_benefit',
    benefitType: 'meal_allowance',

    // Status tracking
    statusHistory: [{
      status: requiresApproval ? ORDER_STATUS.PENDING : ORDER_STATUS.CONFIRMED,
      timestamp: new Date(),
      notes: requiresApproval ? 'Awaiting approval' : 'Auto-approved',
    }],

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  corporateOrdersStore.push(order);

  // Generate invoice if required
  if (invoiceRequired && order.pricing.gstAmount > 0) {
    order.invoice = {
      invoiceNumber: `CP/DIN/${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}/${orderId.slice(-5)}`,
      invoiceDate: new Date(),
      gstIn: gstIn,
      gstBreakdown,
      status: 'draft',
    };
  }

  return {
    orderId: order.orderId,
    status: order.status,
    type: order.type,
    restaurantId: order.restaurantId,
    restaurantName: order.restaurantName,
    guestCount: order.guestCount,
    scheduledDateTime: order.scheduledDateTime,
    pricing: order.pricing,
    requiresApproval: order.requiresApproval,
    invoice: order.invoice,
    message: order.requiresApproval ?
      'Order submitted for approval' :
      'Order confirmed successfully',
  };
}

/**
 * List corporate orders
 */
async function listCorporateOrders({
  companyId,
  status,
  startDate,
  endDate,
  costCenter,
  page = 1,
  limit = 20,
}) {
  let orders = [...corporateOrdersStore];

  // Filter by company
  if (companyId) {
    orders = orders.filter(o => o.companyId === companyId);
  }

  // Filter by status
  if (status) {
    orders = orders.filter(o => o.status === status);
  }

  // Filter by cost center
  if (costCenter) {
    orders = orders.filter(o => o.costCenter === costCenter);
  }

  // Filter by date range
  if (startDate) {
    const start = new Date(startDate);
    orders = orders.filter(o => new Date(o.createdAt) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    orders = orders.filter(o => new Date(o.createdAt) <= end);
  }

  // Sort by createdAt descending
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Paginate
  const start = (page - 1) * limit;
  const paginated = orders.slice(start, start + limit);

  return {
    orders: paginated.map(order => ({
      orderId: order.orderId,
      status: order.status,
      type: order.type,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurantName,
      guestCount: order.guestCount,
      scheduledDateTime: order.scheduledDateTime,
      costCenter: order.costCenter,
      totalAmount: order.pricing.totalAmount,
      gstAmount: order.pricing.gstAmount,
      createdAt: order.createdAt,
    })),
    pagination: {
      page,
      limit,
      total: orders.length,
      totalPages: Math.ceil(orders.length / limit),
    },
  };
}

/**
 * Get corporate order details
 */
async function getCorporateOrder(orderId) {
  const order = corporateOrdersStore.find(o => o.orderId === orderId);

  if (!order) {
    return null;
  }

  return {
    ...order,
    // Format for response
    orderId: order.orderId,
    status: order.status,
    type: order.type,
    bookingType: order.bookingType,
    restaurant: {
      id: order.restaurantId,
      name: order.restaurantName,
    },
    customer: {
      userId: order.userId,
      companyId: order.companyId,
      costCenter: order.costCenter,
    },
    guestCount: order.guestCount,
    scheduledDateTime: order.scheduledDateTime,
    dietaryRequirements: order.dietaryRequirements,
    items: order.items,
    pricing: order.pricing,
    payment: {
      source: order.paymentSource,
      benefitType: order.benefitType,
    },
    approval: {
      required: order.requiresApproval,
      status: order.approvalStatus,
      approverId: order.approverId,
      approvedAt: order.approvedAt,
      notes: order.approvalNotes,
    },
    invoice: order.invoice,
    statusHistory: order.statusHistory,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/**
 * Approve corporate order
 */
async function approveCorporateOrder(orderId, approverId, notes) {
  const order = corporateOrdersStore.find(o => o.orderId === orderId);

  if (!order) {
    const error = new Error('Order not found');
    error.code = 'CP-R005';
    throw error;
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    const error = new Error(`Cannot approve order with status: ${order.status}`);
    error.code = 'CP-R005';
    throw error;
  }

  order.status = ORDER_STATUS.CONFIRMED;
  order.approvalStatus = 'approved';
  order.approverId = approverId;
  order.approvedAt = new Date();
  order.approvalNotes = notes;
  order.updatedAt = new Date();

  order.statusHistory.push({
    status: ORDER_STATUS.CONFIRMED,
    timestamp: new Date(),
    notes: `Approved by ${approverId}`,
  });

  return {
    orderId: order.orderId,
    status: order.status,
    approvalStatus: order.approvalStatus,
    approverId: order.approverId,
    approvedAt: order.approvedAt,
    message: 'Order approved successfully',
  };
}

/**
 * Cancel corporate order
 */
async function cancelCorporateOrder(orderId, reason) {
  const order = corporateOrdersStore.find(o => o.orderId === orderId);

  if (!order) {
    const error = new Error('Order not found');
    throw error;
  }

  if (order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.CANCELLED) {
    const error = new Error(`Cannot cancel order with status: ${order.status}`);
    throw error;
  }

  order.status = ORDER_STATUS.CANCELLED;
  order.cancellationReason = reason;
  order.cancelledAt = new Date();
  order.updatedAt = new Date();

  order.statusHistory.push({
    status: ORDER_STATUS.CANCELLED,
    timestamp: new Date(),
    notes: reason || 'Cancelled by user',
  });

  return {
    orderId: order.orderId,
    status: order.status,
    cancellationReason: reason,
    cancelledAt: order.cancelledAt,
    message: 'Order cancelled successfully',
  };
}

/**
 * Create team lunch order
 */
async function createTeamLunchOrder({
  restaurantId,
  userId,
  companyId,
  guestCount,
  scheduledDateTime,
  dietaryRequirements,
  budgetPerPerson,
  costCenter,
  gstIn,
  purpose,
}) {
  // Validate restaurant
  const isPartner = await restaurantModel.acceptsMealBenefits(restaurantId, 'team_dining');

  if (!isPartner) {
    const error = new Error('Restaurant does not support team dining');
    error.code = 'CP-R001';
    throw error;
  }

  // Check availability
  const availability = await checkTeamLunchAvailability({
    restaurantId,
    date: scheduledDateTime,
    guestCount,
  });

  if (!availability.available) {
    const error = new Error(availability.reason || 'Time slot not available');
    error.code = 'CP-R006';
    throw error;
  }

  // Calculate total budget
  const totalBudget = (budgetPerPerson || 500) * guestCount;

  // Get restaurant config
  const config = await restaurantModel.getCorporateConfig(restaurantId);

  // Calculate GST
  const gstBreakdown = mealBenefitService.calculateGST(totalBudget, config.corporateSettings.gstInclusive);

  // Generate order
  const orderId = generateOrderId('TL');

  const order = {
    orderId,
    type: ORDER_TYPES.TEAM_LUNCH,
    status: ORDER_STATUS.PENDING, // Team lunch always requires approval
    restaurantId,
    restaurantName: config.merchantName || 'Restaurant',
    userId,
    companyId,
    costCenter,
    gstIn,
    bookingType: BOOKING_TYPES.TEAM_LUNCH,
    purpose,
    guestCount,
    scheduledDateTime: new Date(scheduledDateTime),
    dietaryRequirements: dietaryRequirements || [],
    budgetPerPerson,
    totalBudget,
    pricing: {
      subtotal: gstBreakdown.taxableAmount,
      gstRate: gstBreakdown.gstRate,
      gstAmount: gstBreakdown.gstAmount,
      totalAmount: totalBudget,
      currency: 'INR',
    },
    requiresApproval: true,
    approvalStatus: 'pending',
    invoice: null,
    statusHistory: [{
      status: ORDER_STATUS.PENDING,
      timestamp: new Date(),
      notes: 'Team lunch requires manager approval',
    }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  corporateOrdersStore.push(order);

  return {
    orderId: order.orderId,
    status: order.status,
    type: order.type,
    restaurantId: order.restaurantId,
    restaurantName: order.restaurantName,
    guestCount: order.guestCount,
    scheduledDateTime: order.scheduledDateTime,
    totalBudget: order.totalBudget,
    pricing: order.pricing,
    message: 'Team lunch booking submitted for approval',
  };
}

/**
 * Check team lunch availability
 */
async function checkTeamLunchAvailability({ restaurantId, date, guestCount }) {
  // Get restaurant config
  const config = await restaurantModel.getCorporateConfig(restaurantId);

  if (!config || !config.isCorporatePartner) {
    return {
      available: false,
      reason: 'Restaurant is not a corporate partner',
    };
  }

  // Check capacity
  const maxCapacity = config.corporateLocations.reduce((max, loc) => Math.max(max, loc.maxCapacity || 50), 50);

  if (guestCount > maxCapacity) {
    return {
      available: false,
      reason: `Guest count exceeds restaurant capacity of ${maxCapacity}`,
      maxCapacity,
    };
  }

  // Check catering availability
  if (!config.corporateSettings.cateringAvailable && guestCount > 20) {
    return {
      available: false,
      reason: 'Large party requires catering booking',
      suggestCatering: true,
    };
  }

  // Mock time slot availability (in production, query restaurant availability)
  const requestedDate = new Date(date);

  // Restaurant closed on Sundays
  if (requestedDate.getDay() === 0) {
    return {
      available: false,
      reason: 'Restaurant is closed on Sundays',
    };
  }

  // Time must be between 11 AM and 9 PM
  const hours = requestedDate.getHours();
  if (hours < 11 || hours > 21) {
    return {
      available: false,
      reason: 'Team lunch available only between 11 AM and 9 PM',
    };
  }

  return {
    available: true,
    restaurantId,
    date: requestedDate,
    guestCount,
    availableSlots: [
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '18:00', '18:30', '19:00', '19:30', '20:00',
    ],
    message: 'Time slot available',
  };
}

/**
 * Request catering quote
 */
async function requestCateringQuote({
  restaurantId,
  eventType,
  guestCount,
  eventDate,
  location,
  dietaryRequirements,
}) {
  // Validate restaurant
  const config = await restaurantModel.getCorporateConfig(restaurantId);

  if (!config || !config.corporateSettings.cateringAvailable) {
    const error = new Error('Restaurant does not offer catering');
    throw error;
  }

  // Generate quote ID
  const quoteId = generateOrderId('QT');

  // Mock pricing calculation
  const basePricePerPerson = 800;
  const eventMultiplier = {
    corporate_meeting: 1.0,
    conference: 1.5,
    celebration: 1.2,
    wedding: 2.0,
  };

  const multiplier = eventMultiplier[eventType] || 1.0;
  const pricePerPerson = basePricePerPerson * multiplier;
  const subtotal = pricePerPerson * guestCount;
  const gstBreakdown = mealBenefitService.calculateGST(subtotal, true);

  const quote = {
    quoteId,
    restaurantId,
    restaurantName: config.merchantName || 'Restaurant',
    eventType,
    guestCount,
    eventDate: new Date(eventDate),
    location,
    dietaryRequirements: dietaryRequirements || [],
    pricing: {
      pricePerPerson,
      subtotal: gstBreakdown.taxableAmount,
      gstAmount: gstBreakdown.gstAmount,
      totalAmount: subtotal,
      currency: 'INR',
    },
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    status: 'pending',
    createdAt: new Date(),
  };

  cateringQuotesStore.push(quote);

  return {
    quoteId: quote.quoteId,
    restaurantId: quote.restaurantId,
    restaurantName: quote.restaurantName,
    eventType: quote.eventType,
    guestCount: quote.guestCount,
    eventDate: quote.eventDate,
    pricing: quote.pricing,
    validUntil: quote.validUntil,
    message: 'Quote generated. Book within validity period.',
  };
}

/**
 * Book catering
 */
async function bookCatering({
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
  userId,
  companyId,
}) {
  // Validate quote
  const quote = cateringQuotesStore.find(q => q.quoteId === quoteId);

  if (!quote) {
    const error = new Error('Quote not found');
    throw error;
  }

  if (quote.status !== 'pending') {
    const error = new Error('Quote has already been used or expired');
    throw error;
  }

  if (new Date(quote.validUntil) < new Date()) {
    const error = new Error('Quote has expired');
    throw error;
  }

  // Mark quote as used
  quote.status = 'accepted';

  // Generate order
  const orderId = generateOrderId('CAT');

  const order = {
    orderId,
    type: ORDER_TYPES.CATERING,
    status: ORDER_STATUS.PENDING,
    restaurantId,
    restaurantName: quote.restaurantName,
    userId,
    companyId,
    costCenter,
    gstIn,
    bookingType: BOOKING_TYPES.OFFICE_PARTY,
    eventType,
    guestCount,
    eventDate: new Date(eventDate),
    location,
    dietaryRequirements: dietaryRequirements || [],
    specialInstructions,
    quoteId,
    pricing: quote.pricing,
    requiresApproval: true,
    approvalStatus: 'pending',
    invoice: null,
    statusHistory: [{
      status: ORDER_STATUS.PENDING,
      timestamp: new Date(),
      notes: 'Catering booking requires approval',
    }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  corporateOrdersStore.push(order);

  return {
    orderId: order.orderId,
    status: order.status,
    type: order.type,
    restaurantId: order.restaurantId,
    restaurantName: order.restaurantName,
    eventType: order.eventType,
    guestCount: order.guestCount,
    eventDate: order.eventDate,
    location: order.location,
    pricing: order.pricing,
    message: 'Catering booking submitted for approval',
  };
}

module.exports = {
  createCorporateOrder,
  listCorporateOrders,
  getCorporateOrder,
  approveCorporateOrder,
  cancelCorporateOrder,
  createTeamLunchOrder,
  checkTeamLunchAvailability,
  requestCateringQuote,
  bookCatering,
  ORDER_TYPES,
  ORDER_STATUS,
  BOOKING_TYPES,
};
