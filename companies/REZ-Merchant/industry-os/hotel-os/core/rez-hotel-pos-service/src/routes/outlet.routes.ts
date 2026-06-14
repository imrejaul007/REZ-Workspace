import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { RestaurantOutlet } from '../outlets/restaurant';
import { MinibarOutlet } from '../outlets/minibar';
import { SpaOutlet } from '../outlets/spa';
import { BanquetOutlet } from '../outlets/banquet';
import { splitBillService } from '../services/SplitBillService';
import { logger } from '../config/logger';

const router = Router();

/**
 * Restaurant Routes
 */
const CreateRestaurantOrderSchema = z.object({
  orderType: z.enum(['DINE_IN', 'TAKEOUT', 'DELIVERY']),
  tableNumber: z.string().optional(),
  guestId: z.string().optional(),
  guestName: z.string().optional(),
  roomNumber: z.string().optional(),
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      itemName: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
      modifiers: z.array(z.string()).optional(),
      specialInstructions: z.string().optional(),
    })
  ).min(1),
  guestCount: z.number().int().positive().default(1),
  folioId: z.string().optional(),
  specialInstructions: z.string().optional(),
  staffId: z.string().optional(),
  staffName: z.string().optional(),
});

/**
 * POST /api/outlet/restaurant/:outletId/:propertyId/order
 */
router.post('/restaurant/:outletId/:propertyId/order', async (req: Request, res: Response) => {
  const { outletId, propertyId } = req.params;
  const data = CreateRestaurantOrderSchema.parse(req.body);

  const outlet = new RestaurantOutlet(outletId, propertyId);
  const order = await outlet.createOrder({
    ...data,
    guestName: data.guestName || 'Guest',
  });

  logger.info('Restaurant order created via API', {
    orderId: order.orderId,
    outletId,
    totalAmount: order.totalAmount,
  });

  res.status(201).json({
    success: true,
    data: order,
  });
});

/**
 * GET /api/outlet/restaurant/:outletId/:propertyId/menu
 */
router.get('/restaurant/:outletId/:propertyId/menu', async (req: Request, res: Response) => {
  const { outletId, propertyId } = req.params;
  const { category } = req.query;

  const outlet = new RestaurantOutlet(outletId, propertyId);
  const menu = await outlet.getMenu(category as string | undefined);

  res.json({
    success: true,
    data: menu,
    count: menu.length,
  });
});

/**
 * POST /api/outlet/restaurant/:outletId/:propertyId/order/:orderId/complete
 */
router.post('/restaurant/:outletId/:propertyId/order/:orderId/complete', async (req: Request, res: Response) => {
  const { outletId, propertyId, orderId } = req.params;
  const { staffId } = req.body;

  const outlet = new RestaurantOutlet(outletId, propertyId);
  await outlet.completeOrder(orderId, staffId);

  res.json({
    success: true,
    message: 'Order completed',
  });
});

/**
 * POST /api/outlet/restaurant/:outletId/:propertyId/order/:orderId/discount
 */
router.post('/restaurant/:outletId/:propertyId/order/:orderId/discount', async (req: Request, res: Response) => {
  const { outletId, propertyId, orderId } = req.params;
  const { discountPercentage, discountReason } = req.body;

  const outlet = new RestaurantOutlet(outletId, propertyId);
  await outlet.applyDiscount(orderId, discountPercentage, discountReason);

  res.json({
    success: true,
    message: 'Discount applied',
  });
});

/**
 * POST /api/outlet/restaurant/:outletId/:propertyId/order/:orderId/invoice
 */
router.post('/restaurant/:outletId/:propertyId/order/:orderId/invoice', async (req: Request, res: Response) => {
  const { outletId, propertyId, orderId } = req.params;

  const outlet = new RestaurantOutlet(outletId, propertyId);
  const invoice = await outlet.generateGSTInvoice(orderId);

  res.json({
    success: true,
    data: invoice,
  });
});

/**
 * Minibar Routes
 */
const RecordMinibarConsumptionSchema = z.object({
  roomNumber: z.string().min(1),
  guestId: z.string().optional(),
  guestName: z.string().optional(),
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      itemName: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ).min(1),
  folioId: z.string().optional(),
  autoCharge: z.boolean().default(true),
  staffId: z.string().optional(),
});

/**
 * POST /api/outlet/minibar/:outletId/:propertyId/consumption
 */
router.post('/minibar/:outletId/:propertyId/consumption', async (req: Request, res: Response) => {
  const { outletId, propertyId } = req.params;
  const data = RecordMinibarConsumptionSchema.parse(req.body);

  const outlet = new MinibarOutlet(outletId, propertyId);
  const consumption = await outlet.recordConsumption(data);

  logger.info('Minibar consumption recorded via API', {
    consumptionId: consumption.consumptionId,
    roomNumber: data.roomNumber,
    totalAmount: consumption.totalAmount,
  });

  res.status(201).json({
    success: true,
    data: consumption,
  });
});

/**
 * GET /api/outlet/minibar/:outletId/:propertyId/inventory
 */
router.get('/minibar/:outletId/:propertyId/inventory', async (req: Request, res: Response) => {
  const { outletId, propertyId } = req.params;

  const outlet = new MinibarOutlet(outletId, propertyId);
  const inventory = await outlet.getInventory();

  res.json({
    success: true,
    data: inventory,
    count: inventory.length,
  });
});

/**
 * GET /api/outlet/minibar/:outletId/:propertyId/room/:roomNumber/consumption
 */
router.get('/minibar/:outletId/:propertyId/room/:roomNumber/consumption', async (req: Request, res: Response) => {
  const { outletId, propertyId, roomNumber } = req.params;
  const { startDate, endDate } = req.query;

  const outlet = new MinibarOutlet(outletId, propertyId);
  const consumption = await outlet.getRoomConsumption(
    roomNumber,
    startDate && endDate
      ? { start: new Date(startDate as string), end: new Date(endDate as string) }
      : undefined
  );

  res.json({
    success: true,
    data: consumption,
    count: consumption.length,
  });
});

/**
 * Spa Routes
 */
const BookSpaTreatmentSchema = z.object({
  guestId: z.string().optional(),
  guestName: z.string().min(1),
  guestPhone: z.string().optional(),
  roomNumber: z.string().optional(),
  treatments: z.array(
    z.object({
      treatmentId: z.string().min(1),
      treatmentName: z.string().min(1),
      duration: z.number().int().positive(),
    })
  ).min(1),
  bookingDate: z.string().datetime(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  therapistId: z.string().optional(),
  therapistName: z.string().optional(),
  folioId: z.string().optional(),
  notes: z.string().optional(),
  staffId: z.string().optional(),
});

/**
 * GET /api/outlet/spa/:outletId/:propertyId/treatments
 */
router.get('/spa/:outletId/:propertyId/treatments', async (req: Request, res: Response) => {
  const { outletId, propertyId } = req.params;
  const { category } = req.query;

  const outlet = new SpaOutlet(outletId, propertyId);
  const treatments = await outlet.getTreatments(category as string | undefined);

  res.json({
    success: true,
    data: treatments,
    count: treatments.length,
  });
});

/**
 * GET /api/outlet/spa/:outletId/:propertyId/availability
 */
router.get('/spa/:outletId/:propertyId/availability', async (req: Request, res: Response) => {
  const { outletId, propertyId } = req.params;
  const { date, duration, therapistId } = req.query;

  if (!date || !duration) {
    res.status(400).json({
      success: false,
      message: 'date and duration are required',
    });
    return;
  }

  const outlet = new SpaOutlet(outletId, propertyId);
  const slots = await outlet.getAvailableSlots(
    new Date(date as string),
    parseInt(duration as string),
    therapistId as string | undefined
  );

  res.json({
    success: true,
    data: slots,
  });
});

/**
 * POST /api/outlet/spa/:outletId/:propertyId/booking
 */
router.post('/spa/:outletId/:propertyId/booking', async (req: Request, res: Response) => {
  const { outletId, propertyId } = req.params;
  const data = BookSpaTreatmentSchema.parse(req.body);

  const outlet = new SpaOutlet(outletId, propertyId);
  const booking = await outlet.bookTreatment({
    ...data,
    bookingDate: new Date(data.bookingDate),
  });

  logger.info('Spa booking created via API', {
    bookingId: booking.bookingId,
    outletId,
    totalAmount: booking.totalAmount,
  });

  res.status(201).json({
    success: true,
    data: booking,
  });
});

/**
 * POST /api/outlet/spa/:outletId/:propertyId/booking/:bookingId/complete
 */
router.post('/spa/:outletId/:propertyId/booking/:bookingId/complete', async (req: Request, res: Response) => {
  const { outletId, propertyId, bookingId } = req.params;
  const { staffId } = req.body;

  const outlet = new SpaOutlet(outletId, propertyId);
  await outlet.completeTreatment(bookingId, staffId);

  res.json({
    success: true,
    message: 'Treatment completed',
  });
});

/**
 * Banquet Routes
 */
const GenerateBanquetQuoteSchema = z.object({
  eventType: z.enum(['WEDDING', 'CORPORATE', 'SOCIAL', 'MEETING', 'OTHER']),
  guestCount: z.number().int().positive(),
  menuItems: z.array(
    z.object({
      itemId: z.string().min(1),
      pricePerPerson: z.number().positive(),
    })
  ),
  services: z.array(
    z.object({
      serviceName: z.string().min(1),
      cost: z.number().positive(),
    })
  ).optional(),
  venueCharge: z.number().min(0).optional(),
});

const CreateBanquetBookingSchema = z.object({
  eventName: z.string().min(1),
  eventType: z.enum(['WEDDING', 'CORPORATE', 'SOCIAL', 'MEETING', 'OTHER']),
  guestCount: z.number().int().positive(),
  bookingDate: z.string().datetime(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  venue: z.string().min(1),
  guestId: z.string().optional(),
  guestName: z.string().min(1),
  guestPhone: z.string().min(1),
  guestEmail: z.string().email().optional(),
  companyName: z.string().optional(),
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      itemName: z.string().min(1),
      category: z.enum(['FOOD', 'BEVERAGE', 'EQUIPMENT', 'DECORATION']),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      perUnit: z.boolean(),
      taxRate: z.number().default(18),
    })
  ),
  services: z.array(
    z.object({
      serviceId: z.string().min(1),
      serviceName: z.string().min(1),
      provider: z.string().optional(),
      cost: z.number().positive(),
      taxRate: z.number().default(18),
    })
  ),
  advancePaid: z.number().min(0).optional(),
  folioId: z.string().optional(),
  notes: z.string().optional(),
  staffId: z.string().optional(),
});

/**
 * POST /api/outlet/banquet/:outletId/:propertyId/quote
 */
router.post('/banquet/:outletId/:propertyId/quote', async (req: Request, res: Response) => {
  const { outletId, propertyId } = req.params;
  const data = GenerateBanquetQuoteSchema.parse(req.body);

  const outlet = new BanquetOutlet(outletId, propertyId);
  const quote = await outlet.generateQuote(data);

  res.json({
    success: true,
    data: quote,
  });
});

/**
 * POST /api/outlet/banquet/:outletId/:propertyId/booking
 */
router.post('/banquet/:outletId/:propertyId/booking', async (req: Request, res: Response) => {
  const { outletId, propertyId } = req.params;
  const data = CreateBanquetBookingSchema.parse(req.body);

  const outlet = new BanquetOutlet(outletId, propertyId);
  const booking = await outlet.createBooking({
    ...data,
    bookingDate: new Date(data.bookingDate),
  } as unknown);

  logger.info('Banquet booking created via API', {
    eventId: booking.eventId,
    outletId,
    totalAmount: booking.totalAmount,
  });

  res.status(201).json({
    success: true,
    data: booking,
  });
});

/**
 * GET /api/outlet/banquet/:outletId/:propertyId/events
 */
router.get('/banquet/:outletId/:propertyId/events', async (req: Request, res: Response) => {
  const { outletId, propertyId } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    res.status(400).json({
      success: false,
      message: 'startDate and endDate are required',
    });
    return;
  }

  const outlet = new BanquetOutlet(outletId, propertyId);
  const events = await outlet.getEventsByDateRange(
    new Date(startDate as string),
    new Date(endDate as string)
  );

  res.json({
    success: true,
    data: events,
    count: events.length,
  });
});

/**
 * GET /api/outlet/banquet/:outletId/:propertyId/venue/:venue/availability
 */
router.get('/banquet/:outletId/:propertyId/venue/:venue/availability', async (req: Request, res: Response) => {
  const { outletId, propertyId, venue } = req.params;
  const { date } = req.query;

  if (!date) {
    res.status(400).json({
      success: false,
      message: 'date is required',
    });
    return;
  }

  const outlet = new BanquetOutlet(outletId, propertyId);
  const availability = await outlet.getVenueAvailability(venue, new Date(date as string));

  res.json({
    success: true,
    data: availability,
  });
});

/**
 * Split Bill Routes
 */
const InitializeSplitSchema = z.object({
  folioId: z.string().min(1),
  members: z.array(
    z.object({
      guestId: z.string().min(1),
      guestName: z.string().min(1),
      sharePercentage: z.number().min(0).max(100),
    })
  ),
});

const SettleSplitMemberSchema = z.object({
  folioId: z.string().min(1),
  guestId: z.string().min(1),
  paymentMethod: z.string().min(1),
  amount: z.number().positive(),
  reference: z.string().optional(),
});

/**
 * POST /api/outlet/split/initialize
 */
router.post('/split/initialize', async (req: Request, res: Response) => {
  const data = InitializeSplitSchema.parse(req.body);
  const result = await splitBillService.initializeSplit(data.folioId, data.members);

  res.json({
    success: result.success,
    data: result,
    error: result.error,
  });
});

/**
 * POST /api/outlet/split/settle
 */
router.post('/split/settle', async (req: Request, res: Response) => {
  const data = SettleSplitMemberSchema.parse(req.body);
  const result = await splitBillService.settleMember(data.folioId, data.guestId, {
    paymentMethod: data.paymentMethod,
    amount: data.amount,
    reference: data.reference,
  });

  res.json({
    success: result.success,
    data: result,
    error: result.error,
  });
});

/**
 * GET /api/outlet/split/:folioId/status
 */
router.get('/split/:folioId/status', async (req: Request, res: Response) => {
  const { folioId } = req.params;
  const status = await splitBillService.getSplitStatus(folioId);

  if (!status) {
    res.status(404).json({
      success: false,
      message: 'Folio not found',
    });
    return;
  }

  res.json({
    success: true,
    data: status,
  });
});

/**
 * POST /api/outlet/split/:folioId/cancel
 */
router.post('/split/:folioId/cancel', async (req: Request, res: Response) => {
  const { folioId } = req.params;
  const result = await splitBillService.cancelSplit(folioId);

  res.json({
    success: result.success,
    error: result.error,
  });
});

export default router;
