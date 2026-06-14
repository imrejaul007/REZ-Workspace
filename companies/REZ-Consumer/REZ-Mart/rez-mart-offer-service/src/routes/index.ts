import { Request, Response, NextFunction } from 'express';
import { Offer, IOffer } from '../models/index.js';
import {
  CreateOfferSchema,
  UpdateOfferSchema,
  ValidateOfferSchema,
  UpdateStatusSchema,
  UseOfferSchema,
  OfferFiltersSchema,
} from '../schemas/index.js';
import { logger } from '../utils/logger.js';

// Custom error class
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Async handler wrapper
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Generate unique offer ID
const generateOfferId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `OFR-${timestamp}-${randomStr}`.toUpperCase();
};

// Create offer
export const createOffer = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = CreateOfferSchema.parse(req.body);

  // Check if code already exists
  const existingOffer = await Offer.findOne({ code: validatedData.code });
  if (existingOffer) {
    throw new AppError(409, 'Offer code already exists', 'OFFER_CODE_EXISTS');
  }

  // Validate date range
  if (validatedData.validFrom >= validatedData.validUntil) {
    throw new AppError(400, 'Valid from date must be before valid until date', 'INVALID_DATE_RANGE');
  }

  // Validate percentage value
  if (validatedData.type === 'percentage' && validatedData.value > 100) {
    throw new AppError(400, 'Percentage value cannot exceed 100', 'INVALID_PERCENTAGE');
  }

  const offer = new Offer({
    ...validatedData,
    offerId: generateOfferId(),
    usedCount: 0,
  });

  await offer.save();

  logger.info(`Offer created: ${offer.offerId}`);

  res.status(201).json({
    success: true,
    data: offer,
    message: 'Offer created successfully',
  });
});

// Get all offers with filtering and pagination
export const getAllOffers = asyncHandler(async (req: Request, res: Response) => {
  const filters = OfferFiltersSchema.parse(req.query);

  const query: Record<string, unknown> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.storeId) {
    query.storeId = filters.storeId;
  }

  if (filters.userId) {
    query.userId = filters.userId;
  }

  if (filters.valid) {
    const now = new Date();
    query.status = 'active';
    query.validFrom = { $lte: now };
    query.validUntil = { $gte: now };
  }

  const skip = (filters.page - 1) * filters.limit;

  const [offers, total] = await Promise.all([
    Offer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(filters.limit)
      .lean(),
    Offer.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: offers,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit),
    },
  });
});

// Get offer by ID
export const getOfferById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const offer = await Offer.findOne({ offerId: id }).lean();

  if (!offer) {
    throw new AppError(404, 'Offer not found', 'OFFER_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: offer,
  });
});

// Get offer by code
export const getOfferByCode = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;

  const offer = await Offer.findOne({ code: code.toUpperCase() }).lean();

  if (!offer) {
    throw new AppError(404, 'Offer not found', 'OFFER_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: offer,
  });
});

// Get all valid active offers
export const getValidOffers = asyncHandler(async (req: Request, res: Response) => {
  const { storeId, userId, orderValue } = req.query;

  const offers = await Offer.findValidOffers({
    storeId: storeId as string | undefined,
    userId: userId as string | undefined,
    orderValue: orderValue ? Number(orderValue) : undefined,
  });

  // Filter by minimum order value if specified
  let filteredOffers = offers;
  if (orderValue) {
    const orderVal = Number(orderValue);
    filteredOffers = offers.filter(
      (offer: IOffer) => orderVal >= offer.minOrderValue
    );
  }

  res.status(200).json({
    success: true,
    data: filteredOffers,
    count: filteredOffers.length,
  });
});

// Update offer
export const updateOffer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = UpdateOfferSchema.parse(req.body);

  const offer = await Offer.findOne({ offerId: id });

  if (!offer) {
    throw new AppError(404, 'Offer not found', 'OFFER_NOT_FOUND');
  }

  // Check for duplicate code if updating code
  if (validatedData.code && validatedData.code !== offer.code) {
    const existingOffer = await Offer.findOne({ code: validatedData.code });
    if (existingOffer) {
      throw new AppError(409, 'Offer code already exists', 'OFFER_CODE_EXISTS');
    }
  }

  // Validate date range if updating dates
  if (validatedData.validFrom && validatedData.validUntil) {
    if (validatedData.validFrom >= validatedData.validUntil) {
      throw new AppError(400, 'Valid from date must be before valid until date', 'INVALID_DATE_RANGE');
    }
  }

  // Validate percentage value if updating
  if (validatedData.type === 'percentage' && validatedData.value && validatedData.value > 100) {
    throw new AppError(400, 'Percentage value cannot exceed 100', 'INVALID_PERCENTAGE');
  }

  // Apply updates
  Object.assign(offer, validatedData);
  await offer.save();

  logger.info(`Offer updated: ${offer.offerId}`);

  res.status(200).json({
    success: true,
    data: offer,
    message: 'Offer updated successfully',
  });
});

// Increment usage
export const useOffer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  UseOfferSchema.parse(req.body);

  const offer = await Offer.findOne({ offerId: id });

  if (!offer) {
    throw new AppError(404, 'Offer not found', 'OFFER_NOT_FOUND');
  }

  if (offer.status !== 'active') {
    throw new AppError(400, 'Offer is not active', 'OFFER_NOT_ACTIVE');
  }

  const now = new Date();
  if (now < offer.validFrom || now > offer.validUntil) {
    throw new AppError(400, 'Offer has expired', 'OFFER_EXPIRED');
  }

  if (offer.maxUses && offer.usedCount >= offer.maxUses) {
    throw new AppError(400, 'Offer usage limit reached', 'OFFER_LIMIT_REACHED');
  }

  offer.usedCount += 1;
  await offer.save();

  logger.info(`Offer used: ${offer.offerId}, new count: ${offer.usedCount}`);

  res.status(200).json({
    success: true,
    data: {
      offerId: offer.offerId,
      code: offer.code,
      usedCount: offer.usedCount,
      maxUses: offer.maxUses,
    },
    message: 'Offer usage recorded',
  });
});

// Update status
export const updateOfferStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = UpdateStatusSchema.parse(req.body);

  const offer = await Offer.findOne({ offerId: id });

  if (!offer) {
    throw new AppError(404, 'Offer not found', 'OFFER_NOT_FOUND');
  }

  offer.status = status;
  await offer.save();

  logger.info(`Offer status updated: ${offer.offerId} -> ${status}`);

  res.status(200).json({
    success: true,
    data: offer,
    message: `Offer status updated to ${status}`,
  });
});

// Delete offer
export const deleteOffer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const offer = await Offer.findOneAndDelete({ offerId: id });

  if (!offer) {
    throw new AppError(404, 'Offer not found', 'OFFER_NOT_FOUND');
  }

  logger.info(`Offer deleted: ${offer.offerId}`);

  res.status(200).json({
    success: true,
    data: null,
    message: 'Offer deleted successfully',
  });
});

// Validate offer for order
export const validateOffer = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = ValidateOfferSchema.parse(req.body);

  const offer = await Offer.findOne({ code: validatedData.code.toUpperCase() }).lean();

  if (!offer) {
    throw new AppError(404, 'Invalid offer code', 'OFFER_NOT_FOUND');
  }

  // Check if offer is active
  if (offer.status !== 'active') {
    throw new AppError(400, `Offer is ${offer.status}`, 'OFFER_NOT_ACTIVE');
  }

  const now = new Date();

  // Check validity period
  if (now < offer.validFrom) {
    throw new AppError(400, 'Offer is not yet valid', 'OFFER_NOT_STARTED');
  }

  if (now > offer.validUntil) {
    throw new AppError(400, 'Offer has expired', 'OFFER_EXPIRED');
  }

  // Check usage limit
  if (offer.maxUses && offer.usedCount >= offer.maxUses) {
    throw new AppError(400, 'Offer usage limit reached', 'OFFER_LIMIT_REACHED');
  }

  // Check minimum order value
  if (validatedData.orderValue < offer.minOrderValue) {
    throw new AppError(
      400,
      `Minimum order value of ₹${offer.minOrderValue} required`,
      'MIN_ORDER_NOT_MET'
    );
  }

  // Check store restriction
  if (validatedData.storeId && offer.storeId && offer.storeId !== validatedData.storeId) {
    throw new AppError(400, 'Offer not valid for this store', 'OFFER_STORE_MISMATCH');
  }

  // Check user restriction
  if (offer.userId && validatedData.userId && offer.userId !== validatedData.userId) {
    throw new AppError(400, 'This offer is not for you', 'OFFER_USER_MISMATCH');
  }

  // Calculate discount
  let discount = 0;
  let isFreeDelivery = false;

  switch (offer.type) {
    case 'percentage':
      discount = (validatedData.orderValue * offer.value) / 100;
      if (offer.maxDiscount && discount > offer.maxDiscount) {
        discount = offer.maxDiscount;
      }
      break;
    case 'flat':
      discount = Math.min(offer.value, validatedData.orderValue);
      break;
    case 'free_delivery':
      isFreeDelivery = true;
      break;
    case 'buy_x_get_y':
      // Buy X Get Y requires additional business logic
      discount = 0;
      break;
  }

  const finalAmount = validatedData.orderValue - discount;

  res.status(200).json({
    success: true,
    data: {
      valid: true,
      offerId: offer.offerId,
      code: offer.code,
      type: offer.type,
      originalAmount: validatedData.orderValue,
      discount: discount,
      finalAmount: Math.max(0, finalAmount),
      isFreeDelivery,
      minOrderValue: offer.minOrderValue,
      maxDiscount: offer.maxDiscount,
      terms: offer.terms,
    },
    message: 'Offer is valid',
  });
});

// Get offer statistics
export const getOfferStats = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.query;

  const matchStage: Record<string, unknown> = {};
  if (storeId) {
    matchStage.storeId = storeId;
  }

  const stats = await Offer.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOffers: { $sum: 1 },
        activeOffers: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        totalUsage: { $sum: '$usedCount' },
        avgDiscount: { $avg: '$value' },
        percentageOffers: {
          $sum: { $cond: [{ $eq: ['$type', 'percentage'] }, 1, 0] },
        },
        flatOffers: {
          $sum: { $cond: [{ $eq: ['$type', 'flat'] }, 1, 0] },
        },
        freeDeliveryOffers: {
          $sum: { $cond: [{ $eq: ['$type', 'free_delivery'] }, 1, 0] },
        },
      },
    },
  ]);

  const result = stats[0] || {
    totalOffers: 0,
    activeOffers: 0,
    totalUsage: 0,
    avgDiscount: 0,
    percentageOffers: 0,
    flatOffers: 0,
    freeDeliveryOffers: 0,
  };

  res.status(200).json({
    success: true,
    data: result,
  });
});

// Create router with all routes
import { Router } from 'express';

const router = Router();

// Offer routes
router.post('/', createOffer);
router.get('/', getAllOffers);
router.get('/valid', getValidOffers);
router.get('/stats', getOfferStats);
router.get('/:id', getOfferById);
router.get('/code/:code', getOfferByCode);
router.patch('/:id', updateOffer);
router.patch('/:id/use', useOffer);
router.patch('/:id/status', updateOfferStatus);
router.delete('/:id', deleteOffer);
router.post('/validate', validateOffer);

export default router;