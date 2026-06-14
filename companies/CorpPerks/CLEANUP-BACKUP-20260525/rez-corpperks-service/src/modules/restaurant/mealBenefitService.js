/**
 * CorpPerks Meal Benefit Service
 * Handles meal benefit validation, redemption, and balance management
 */

const restaurantModel = require('./restaurantModel');

// In-memory stores (replace with actual database in production)
const benefitAllocations = [];
const benefitRedemptions = [];

/**
 * Default GST configuration for restaurant dining
 */
const GST_CONFIG = {
  hsnCode: '9963',
  description: 'Restaurant services',
  gstRate: 18,
  itcClaimable: true,
};

/**
 * Get restaurant accepted benefits
 */
async function getRestaurantBenefits(restaurantId) {
  const config = await restaurantModel.getCorporateConfig(restaurantId);

  if (!config || !config.isCorporatePartner) {
    return {
      acceptsMealBenefits: false,
      benefitTypes: [],
      message: 'Restaurant is not a corporate partner',
    };
  }

  return {
    acceptsMealBenefits: config.corporateSettings.acceptsMealBenefits,
    benefitTypes: config.corporateSettings.mealBenefitTypes,
    maxBenefitPerTransaction: config.corporateSettings.maxBenefitPerTransaction,
    minOrderValue: config.corporateSettings.minOrderValue,
    gstInclusive: config.corporateSettings.gstInclusive,
  };
}

/**
 * Validate meal benefit eligibility
 */
async function validateMealBenefit({ employeeId, restaurantId, orderAmount }) {
  // Check if restaurant is a corporate partner
  const isPartner = await restaurantModel.acceptsMealBenefits(restaurantId);

  if (!isPartner) {
    return {
      eligible: false,
      reason: 'RESTAURANT_NOT_PARTNER',
      message: 'This restaurant does not accept corporate meal benefits',
    };
  }

  // Get restaurant config
  const config = await restaurantModel.getCorporateConfig(restaurantId);

  // Check minimum order value
  if (orderAmount < config.corporateSettings.minOrderValue) {
    return {
      eligible: false,
      reason: 'MIN_ORDER_NOT_MET',
      message: `Minimum order value is ${config.corporateSettings.minOrderValue}`,
    };
  }

  // Check maximum benefit per transaction
  const maxBenefit = Math.min(
    config.corporateSettings.maxBenefitPerTransaction,
    orderAmount
  );

  // Get employee benefit balance
  const balance = await getMealBenefitBalance(employeeId);

  if (!balance.hasAllocation) {
    return {
      eligible: false,
      reason: 'NO_ALLOCATION',
      message: 'No meal benefit allocated for this period',
    };
  }

  if (balance.remaining <= 0) {
    return {
      eligible: false,
      reason: 'BENEFIT_EXHAUSTED',
      message: 'Meal benefit balance is exhausted',
    };
  }

  // Check if benefit has expired
  if (balance.expiresAt && new Date(balance.expiresAt) < new Date()) {
    return {
      eligible: false,
      reason: 'BENEFIT_EXPIRED',
      message: 'Meal benefit has expired',
    };
  }

  // Calculate GST breakdown
  const gstBreakdown = calculateGST(orderAmount, config.corporateSettings.gstInclusive);

  // Determine eligible amount
  const eligibleAmount = Math.min(orderAmount, balance.remaining, maxBenefit);

  return {
    eligible: true,
    benefitType: 'meal_allowance',
    availableBalance: balance.remaining,
    maxDeduction: eligibleAmount,
    merchantPartner: true,
    gstInclusive: config.corporateSettings.gstInclusive,
    gstBreakdown,
    orderAmount,
    taxableAmount: gstBreakdown.taxableAmount,
    gstAmount: gstBreakdown.gstAmount,
    employeeContribution: orderAmount - eligibleAmount,
  };
}

/**
 * Get employee's meal benefit balance
 */
async function getMealBenefitBalance(employeeId) {
  // Find active allocation for employee
  const now = new Date();
  const allocation = benefitAllocations.find(
    a => a.employeeId === employeeId &&
    a.benefitType === 'meal' &&
    a.isActive &&
    a.periodEnd > now
  );

  if (!allocation) {
    // Return mock data for demo
    return {
      employeeId,
      hasAllocation: true,
      allocated: 2000,
      used: 500,
      remaining: 1500,
      periodType: 'monthly',
      periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      expiresAt: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      benefitType: 'meal',
    };
  }

  // Calculate used amount
  const redemptions = benefitRedemptions.filter(r => r.allocationId === allocation.allocationId);
  const used = redemptions.reduce((sum, r) => sum + r.amount, 0);

  return {
    employeeId,
    allocationId: allocation.allocationId,
    hasAllocation: true,
    allocated: allocation.amount,
    used,
    remaining: allocation.amount - used,
    periodType: allocation.periodType,
    periodStart: allocation.periodStart,
    periodEnd: allocation.periodEnd,
    expiresAt: allocation.periodEnd,
    benefitType: allocation.benefitType,
  };
}

/**
 * Redeem meal benefit
 */
async function redeemMealBenefit({ employeeId, restaurantId, orderId, amount, orderDetails }) {
  // Validate eligibility
  const validation = await validateMealBenefit({ employeeId, restaurantId, orderAmount: amount });

  if (!validation.eligible) {
    const error = new Error(validation.message);
    error.code = `CP-R${validation.reason === 'RESTAURANT_NOT_PARTNER' ? '001' :
                  validation.reason === 'BENEFIT_EXHAUSTED' ? '002' :
                  validation.reason === 'BENEFIT_EXPIRED' ? '003' : '004'}`;
    throw error;
  }

  // Get restaurant config
  const config = await restaurantModel.getCorporateConfig(restaurantId);

  // Get current balance
  const balance = await getMealBenefitBalance(employeeId);

  // Calculate deduction
  const deductionAmount = Math.min(amount, validation.maxDeduction, balance.remaining);

  // Create redemption record
  const redemptionId = `RDM${Date.now()}${Math.random().toString(36).substr(2, 6)}`.toUpperCase();

  const redemption = {
    redemptionId,
    allocationId: balance.allocationId,
    employeeId,
    restaurantId,
    restaurantName: config?.merchantName || 'Restaurant',
    orderId,
    amount: deductionAmount,
    orderTotal: amount,
    benefitType: 'meal',
    paymentSource: 'meal_benefit',
    gstAmount: validation.gstAmount,
    taxableAmount: validation.taxableAmount,
    status: 'completed',
    createdAt: new Date(),
  };

  benefitRedemptions.push(redemption);

  // Update partner stats
  await restaurantModel.updatePartnerStats(restaurantId, amount);

  // In production, would also:
  // 1. Call wallet service to deduct from benefit balance
  // 2. Create GST invoice
  // 3. Send confirmation notifications
  // 4. Update analytics

  return {
    redemptionId,
    employeeId,
    restaurantId,
    orderId,
    amountRedeemed: deductionAmount,
    orderTotal: amount,
    newBalance: balance.remaining - deductionAmount,
    gstAmount: validation.gstAmount,
    taxableAmount: validation.taxableAmount,
    status: 'completed',
    message: 'Meal benefit redeemed successfully',
    receipt: {
      transactionId: redemptionId,
      timestamp: redemption.createdAt,
      restaurant: redemption.restaurantName,
      amount: deductionAmount,
      gstBreakdown: validation.gstBreakdown,
    },
  };
}

/**
 * Allocate meal benefit to employee
 */
async function allocateMealBenefit({ companyId, employeeId, amount, periodType = 'monthly' }) {
  const now = new Date();
  let periodEnd;

  switch (periodType) {
    case 'monthly':
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'quarterly':
      const nextQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
      periodEnd = nextQuarter;
      break;
    case 'yearly':
      periodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      break;
    default:
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  const allocationId = `ALLOC${Date.now()}${Math.random().toString(36).substr(2, 6)}`.toUpperCase();

  const allocation = {
    allocationId,
    companyId,
    employeeId,
    benefitType: 'meal',
    coinType: 'meal_benefit',
    amount,
    periodType,
    periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
    periodEnd,
    isActive: true,
    rolloverEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  benefitAllocations.push(allocation);

  return {
    allocationId,
    employeeId,
    benefitType: 'meal',
    amount,
    periodType,
    periodStart: allocation.periodStart,
    periodEnd: allocation.periodEnd,
    message: `Allocated ${amount} meal benefit for ${periodType}`,
  };
}

/**
 * Bulk allocate meal benefits
 */
async function bulkAllocateMealBenefits({ companyId, allocations }) {
  const results = [];

  for (const alloc of allocations) {
    try {
      const result = await allocateMealBenefit({
        companyId,
        employeeId: alloc.employeeId,
        amount: alloc.amount,
        periodType: alloc.periodType || 'monthly',
      });
      results.push({
        employeeId: alloc.employeeId,
        status: 'success',
        allocationId: result.allocationId,
      });
    } catch (error) {
      results.push({
        employeeId: alloc.employeeId,
        status: 'failed',
        error: error.message,
      });
    }
  }

  return {
    total: allocations.length,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failed').length,
    results,
  };
}

/**
 * Calculate GST breakdown for restaurant order
 */
function calculateGST(amount, gstInclusive = true) {
  if (gstInclusive) {
    // Amount includes GST
    const taxableAmount = amount / (1 + GST_CONFIG.gstRate / 100);
    const gstAmount = amount - taxableAmount;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    return {
      hsnCode: GST_CONFIG.hsnCode,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      gstRate: GST_CONFIG.gstRate,
      gstAmount: Math.round(gstAmount * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      totalAmount: amount,
      itcEligible: GST_CONFIG.itcClaimable,
    };
  } else {
    // Amount is exclusive of GST
    const taxableAmount = amount;
    const gstAmount = amount * GST_CONFIG.gstRate / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    const totalAmount = amount + gstAmount;

    return {
      hsnCode: GST_CONFIG.hsnCode,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      gstRate: GST_CONFIG.gstRate,
      gstAmount: Math.round(gstAmount * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      itcEligible: GST_CONFIG.itcClaimable,
    };
  }
}

/**
 * Get benefit usage report for company
 */
async function getBenefitUsageReport({ companyId, startDate, endDate }) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const redemptions = benefitRedemptions.filter(r => {
    const date = new Date(r.createdAt);
    return date >= start && date <= end;
  });

  const totalAmount = redemptions.reduce((sum, r) => sum + r.amount, 0);
  const totalGst = redemptions.reduce((sum, r) => sum + (r.gstAmount || 0), 0);
  const byRestaurant = {};

  redemptions.forEach(r => {
    if (!byRestaurant[r.restaurantId]) {
      byRestaurant[r.restaurantId] = {
        restaurantId: r.restaurantId,
        restaurantName: r.restaurantName,
        orderCount: 0,
        totalAmount: 0,
        totalGst: 0,
      };
    }
    byRestaurant[r.restaurantId].orderCount += 1;
    byRestaurant[r.restaurantId].totalAmount += r.amount;
    byRestaurant[r.restaurantId].totalGst += r.gstAmount || 0;
  });

  return {
    companyId,
    period: { startDate: start, endDate: end },
    summary: {
      totalRedemptions: redemptions.length,
      totalAmount,
      totalGst,
      averageOrderValue: redemptions.length > 0 ? totalAmount / redemptions.length : 0,
    },
    byRestaurant: Object.values(byRestaurant),
  };
}

module.exports = {
  getRestaurantBenefits,
  validateMealBenefit,
  getMealBenefitBalance,
  redeemMealBenefit,
  allocateMealBenefit,
  bulkAllocateMealBenefits,
  calculateGST,
  getBenefitUsageReport,
  GST_CONFIG,
};
